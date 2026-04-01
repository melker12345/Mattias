import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSecureEnrollment } from '@/lib/enrollment-validation';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;
    const admin = adminResult;

    const { userEmail, courseId, reason } = await request.json();

    if (!userEmail || !courseId) {
      return NextResponse.json(
        { message: 'Användarens e-post och kurs-ID krävs' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    const { data: targetUser } = await supabaseAdmin.from('users').select('id, email, name').eq('email', userEmail).maybeSingle();
    if (!targetUser) return NextResponse.json({ message: 'Användare med den e-postadressen hittades inte' }, { status: 404 });

    const { data: course } = await supabaseAdmin.from('courses').select('id, title').eq('id', courseId).maybeSingle();
    if (!course) return NextResponse.json({ message: 'Kurs hittades inte' }, { status: 404 });

    // Create secure enrollment as gift
    const result = await createSecureEnrollment(targetUser.id, courseId, {
      isGift: true,
      giftedBy: admin.id,
      giftReason: reason || `Administratörsgåva från ${admin.name || admin.email}`
    });

    if (!result.success) {
      return NextResponse.json(
        { message: result.message },
        { status: 400 }
      );
    }

    console.log(`ADMIN GIFT: ${admin.email} gifted course "${course.title}" to ${targetUser.email}. Reason: ${reason || 'No reason provided'}`);

    return NextResponse.json({
      message: `Kursen "${course.title}" har getts som gåva till ${targetUser.email}`,
      enrollment: result.enrollment,
    });

  } catch (error) {
    console.error('Error gifting course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid gåvogivning av kurs' },
      { status: 500 }
    );
  }
}

// Get all gifted courses for admin overview
export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const supabaseAdmin = createAdminClient();
    const { data: giftedEnrollments } = await supabaseAdmin
      .from('enrollments')
      .select('id, gifted_at, gift_reason, completed_at, passed, user:users!user_id(id, email, name), course:courses!course_id(id, title, price), gifter:users!gifted_by(id, email, name)')
      .eq('is_gift', true)
      .order('gifted_at', { ascending: false });

    return NextResponse.json({
      gifts: (giftedEnrollments ?? []).map(e => ({
        id: e.id,
        user: e.user,
        course: e.course,
        giftedBy: e.gifter,
        giftedAt: e.gifted_at,
        giftReason: e.gift_reason,
        completed: !!e.completed_at,
        passed: e.passed,
      })),
    });

  } catch (error) {
    console.error('Error fetching gifted courses:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av gåvoöversikt' },
      { status: 500 }
    );
  }
}
