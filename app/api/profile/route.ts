import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptPersonnummer, normalisePersonnummer, isValidPersonnummer, maskPersonnummer, decryptPersonnummer } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const admin = createAdminClient();
    const [{ data: user }, { data: enrollments }, { data: certificates }] = await Promise.all([
      admin.from('users').select('id, name, email, role, phone, personnummer_encrypted, identity_verified, created_at, company:companies(id, name)').eq('id', authResult.id).single(),
      admin.from('enrollments').select('id, enrolled_at, completed_at, passed, final_score, is_gift, gifted_by, gifted_at, gift_reason, course:courses(id, title, description)').eq('user_id', authResult.id).order('enrolled_at', { ascending: false }),
      admin.from('certificates').select('id, issued_at, course:courses(title)').eq('user_id', authResult.id).order('issued_at', { ascending: false }),
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const company = user.company as unknown as { id: string; name: string } | null;

    // Identity block. personnummer + name are immutable once set (only an admin
    // or the user's company can change them); phone/email stay editable.
    const hasName = !!(user.name && user.name.trim());
    let personnummerMasked: string | null = null;
    if (user.personnummer_encrypted) {
      try { personnummerMasked = maskPersonnummer(decryptPersonnummer(user.personnummer_encrypted)); }
      catch { personnummerMasked = '••••••••-••••'; }
    }

    const profile = {
      id: user.id, name: user.name ?? 'Unknown', email: user.email, role: authResult.role,
      createdAt: user.created_at,
      phone: user.phone ?? null,
      identity: {
        name: user.name ?? null,
        nameLocked: hasName,
        hasPersonnummer: !!user.personnummer_encrypted,
        personnummerMasked,
        personnummerLocked: !!user.personnummer_encrypted,
        identityVerified: !!user.identity_verified,
        // Complete enough to start a course / earn a certificate.
        complete: hasName && !!user.personnummer_encrypted,
      },
      company: company ? { id: company.id, name: company.name, role: 'Employee' } : undefined,
      enrollments: (enrollments ?? []).map((e: any) => ({
        id: e.id,
        course: { id: e.course?.id, name: e.course?.title, description: e.course?.description },
        enrolledAt: e.enrolled_at, completedAt: e.completed_at, passed: e.passed,
        finalScore: e.final_score, isGift: e.is_gift, giftedBy: e.gifted_by,
        giftedAt: e.gifted_at, giftReason: e.gift_reason,
      })),
      certificates: (certificates ?? []).map((c: any) => ({
        id: c.id, course: { name: c.course?.title }, issuedAt: c.issued_at,
      })),
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update the user's own identity/contact details.
// - phone: always editable.
// - name / personnummer: settable once, then locked (immutable for the user;
//   only a company admin or platform admin can change them afterwards). This is
//   what binds a course/certificate to a fixed identity and blocks the
//   "swap to a friend's details and re-earn" trick.
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const body = await request.json();
    const { name, personnummer, phone } = body as { name?: string; personnummer?: string; phone?: string };

    const admin = createAdminClient();
    const { data: current } = await admin
      .from('users').select('name, personnummer_encrypted').eq('id', authResult.id).single();
    if (!current) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const update: Record<string, unknown> = {};

    // Phone — freely editable.
    if (phone !== undefined) update.phone = phone?.trim() || null;

    // Name — only settable if not already set.
    if (name !== undefined && name.trim()) {
      const alreadyHasName = !!(current.name && current.name.trim());
      if (alreadyHasName && current.name.trim() !== name.trim()) {
        return NextResponse.json(
          { message: 'Namnet är låst. Kontakta support för att ändra ditt namn.' },
          { status: 400 }
        );
      }
      update.name = name.trim();
    }

    // Personnummer — only settable if not already set; validated + encrypted.
    if (personnummer !== undefined && personnummer.trim()) {
      if (current.personnummer_encrypted) {
        return NextResponse.json(
          { message: 'Personnumret är låst. Kontakta support för att ändra det.' },
          { status: 400 }
        );
      }
      if (!isValidPersonnummer(personnummer)) {
        return NextResponse.json({ message: 'Ogiltigt personnummer' }, { status: 400 });
      }
      update.personnummer_encrypted = encryptPersonnummer(normalisePersonnummer(personnummer));
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ message: 'Inga ändringar' }, { status: 400 });
    }

    const { error } = await admin.from('users').update(update).eq('id', authResult.id);
    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json({ message: 'Kunde inte spara uppgifterna' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Uppgifterna sparades' });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const admin = createAdminClient();
    const { data: user } = await admin.from('users').select('id').eq('id', authResult.id).single();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Delete related data in dependency order
    await admin.from('apv_submissions').delete().eq('user_id', user.id);
    await admin.from('answers').delete().eq('user_id', user.id);
    await admin.from('progress').delete().eq('user_id', user.id);
    await admin.from('certificates').delete().eq('user_id', user.id);
    await admin.from('enrollments').delete().eq('user_id', user.id);
    await admin.from('users').delete().eq('id', user.id);
    // Also delete from Supabase Auth
    await admin.auth.admin.deleteUser(user.id);

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
