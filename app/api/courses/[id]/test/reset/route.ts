import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCoursePartition, recalculateAndPersistCourseScore } from '@/lib/course-progress';

export const dynamic = 'force-dynamic';

// Retake the test only: clear the learner's TEST answers and reset the TEST
// lesson progress, while keeping all content/practice progress intact. Then
// recalculate the (now failing) enrollment score.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const courseId = params.id;
    const user = authResult;
    const admin = createAdminClient();

    const { data: enrollment } = await admin.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
    if (!enrollment) return NextResponse.json({ message: 'Du är inte registrerad för denna kurs' }, { status: 403 });

    const partition = await getCoursePartition(courseId, admin);
    if (!partition.hasTest) {
      return NextResponse.json({ message: 'Den här kursen har inget prov' }, { status: 400 });
    }

    if (partition.testQuestionIds.length) {
      await admin.from('answers').delete().eq('user_id', user.id).in('question_id', partition.testQuestionIds);
    }
    if (partition.testLessonIds.length) {
      await admin.from('progress').delete().eq('user_id', user.id).in('lesson_id', partition.testLessonIds);
    }

    await recalculateAndPersistCourseScore(user.id, courseId);

    return NextResponse.json({ message: 'Provet har återställts' });
  } catch (error) {
    console.error('Error resetting test:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid återställning av provet' },
      { status: 500 }
    );
  }
}
