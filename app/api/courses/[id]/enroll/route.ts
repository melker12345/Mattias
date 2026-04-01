import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSecureEnrollment } from '@/lib/enrollment-validation';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const courseId = params.id;
    const user = authResult;

    const admin = createAdminClient();
    const { data: enrollment } = await admin
      .from('enrollments')
      .select('id, is_gift, gifted_by, gifted_at, gift_reason, completed_at, passed, final_score, gifter:users!gifted_by(name, email)')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (enrollment) {
      return NextResponse.json({
        enrolled: true,
        enrollment: {
          id: enrollment.id,
          isGift: enrollment.is_gift,
          giftedBy: enrollment.gifter,
          giftedAt: enrollment.gifted_at,
          giftReason: enrollment.gift_reason,
          completedAt: enrollment.completed_at,
          passed: enrollment.passed,
          finalScore: enrollment.final_score,
        },
      });
    }
    return NextResponse.json({ enrolled: false });

  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid kontroll av registreringsstatus' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const courseId = params.id;
    const user = authResult;

    // Use secure enrollment creation
    const result = await createSecureEnrollment(user.id, courseId);

    if (!result.success) {
      // Determine appropriate status code based on error
      let statusCode = 400;
      if (result.message.includes('köpa kursen')) {
        statusCode = 402; // Payment required
      } else if (result.message.includes('hittades inte')) {
        statusCode = 404;
      }

      return NextResponse.json(
        { message: result.message },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      message: result.message,
      enrollment: result.enrollment
    });

  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid registrering för kurs' },
      { status: 500 }
    );
  }
}
