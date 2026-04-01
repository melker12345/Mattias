import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const admin = createAdminClient();
    const [{ data: user }, { data: enrollments }, { data: certificates }] = await Promise.all([
      admin.from('users').select('id, name, email, role, created_at, company:companies(id, name)').eq('id', authResult.id).single(),
      admin.from('enrollments').select('id, enrolled_at, completed_at, passed, final_score, is_gift, gifted_by, gifted_at, gift_reason, course:courses(id, title, description)').eq('user_id', authResult.id).order('enrolled_at', { ascending: false }),
      admin.from('certificates').select('id, issued_at, course:courses(title)').eq('user_id', authResult.id).order('issued_at', { ascending: false }),
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const company = user.company as unknown as { id: string; name: string } | null;
    const profile = {
      id: user.id, name: user.name ?? 'Unknown', email: user.email, role: user.role,
      createdAt: user.created_at,
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
