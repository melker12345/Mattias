import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const { data: users } = await admin.from('users')
      .select('id, name, email, role, identity_verified, created_at, updated_at, company:companies(name)')
      .order('created_at', { ascending: false });

    const usersWithStats = await Promise.all((users ?? []).map(async (user) => {
      const [{ count: enrolledCourses }, { data: completedEnrollments }, { count: certificates }] = await Promise.all([
        admin.from('enrollments').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        admin.from('enrollments').select('id').eq('user_id', user.id).not('completed_at', 'is', null),
        admin.from('certificates').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);
      const company = user.company as unknown as { name: string } | null;
      return {
        id: user.id, name: user.name, email: user.email, role: user.role,
        company: company?.name ?? null,
        identityVerified: user.identity_verified,
        enrolledCourses: enrolledCourses ?? 0,
        completedCourses: completedEnrollments?.length ?? 0,
        certificates: certificates ?? 0,
        lastActive: user.updated_at, createdAt: user.created_at,
      };
    }));

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av användare' },
      { status: 500 }
    );
  }
}
