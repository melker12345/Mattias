import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const usersWithStats = (users ?? []).map((user) => {
      const company = user.company as unknown as { name: string } | null;
      return {
        id: user.id, name: user.name, email: user.email, role: user.role,
        company: company?.name ?? null,
        identityVerified: user.identity_verified,
        id06Eligible: user.id06_eligible,
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
