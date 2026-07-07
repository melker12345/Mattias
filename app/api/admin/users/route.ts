import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { paywallExemptEmails } from '@/lib/test-accounts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const admin = createAdminClient();
    const { data: users } = await admin.from('users')
      .select('id, name, email, role, identity_verified, id06_eligible, created_at, updated_at, company:companies(name)')
      .order('created_at', { ascending: false });

    const userIds = (users ?? []).map((u) => u.id);

    // Aggregate stats in memory from a fixed number of queries instead of
    // firing 3 queries per user (previously an N+1 bottleneck).
    const [{ data: enrollments }, { data: certificates }] = await Promise.all([
      userIds.length
        ? admin.from('enrollments').select('user_id, completed_at').in('user_id', userIds)
        : Promise.resolve({ data: [] as { user_id: string; completed_at: string | null }[] }),
      userIds.length
        ? admin.from('certificates').select('user_id').in('user_id', userIds)
        : Promise.resolve({ data: [] as { user_id: string }[] }),
    ]);

    const enrolledByUser = new Map<string, number>();
    const completedByUser = new Map<string, number>();
    for (const e of enrollments ?? []) {
      enrolledByUser.set(e.user_id, (enrolledByUser.get(e.user_id) ?? 0) + 1);
      if (e.completed_at) completedByUser.set(e.user_id, (completedByUser.get(e.user_id) ?? 0) + 1);
    }
    const certsByUser = new Map<string, number>();
    for (const c of certificates ?? []) {
      certsByUser.set(c.user_id, (certsByUser.get(c.user_id) ?? 0) + 1);
    }

    // Flag the configured paywall-exempt test accounts and their toggle state.
    // The bypass-active flag is read from a guarded query so a missing column
    // (migration not yet run) fails open to "active" instead of erroring.
    const exemptSet = new Set(paywallExemptEmails());
    const testUserIds = (users ?? [])
      .filter((u) => u.email && exemptSet.has(u.email.toLowerCase()))
      .map((u) => u.id);
    const bypassActiveById = new Map<string, boolean>();
    if (testUserIds.length) {
      try {
        const { data: flags, error } = await admin
          .from('users')
          .select('id, paywall_bypass_active')
          .in('id', testUserIds);
        if (!error) {
          for (const f of flags ?? []) bypassActiveById.set(f.id, (f as any).paywall_bypass_active !== false);
        }
      } catch {
        // column absent → leave map empty → default active below
      }
    }

    const usersWithStats = (users ?? []).map((user) => {
      const company = user.company as unknown as { name: string } | null;
      const isTestAccount = !!user.email && exemptSet.has(user.email.toLowerCase());
      return {
        id: user.id, name: user.name, email: user.email, role: user.role,
        company: company?.name ?? null,
        identityVerified: user.identity_verified,
        id06Eligible: user.id06_eligible,
        isTestAccount,
        paywallBypassActive: isTestAccount ? (bypassActiveById.get(user.id) ?? true) : false,
        enrolledCourses: enrolledByUser.get(user.id) ?? 0,
        completedCourses: completedByUser.get(user.id) ?? 0,
        certificates: certsByUser.get(user.id) ?? 0,
        lastActive: user.updated_at, createdAt: user.created_at,
      };
    });

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av användare' },
      { status: 500 }
    );
  }
}
