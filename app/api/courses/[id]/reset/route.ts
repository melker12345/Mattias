import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

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

    console.log(`Resetting course ${courseId} for user ${user.email}`);

    // Get lesson + question IDs for this course
    const { data: lessons } = await admin.from('lessons').select('id').eq('course_id', courseId);
    const lessonIds = (lessons ?? []).map(l => l.id);
    const { data: questions } = lessonIds.length
      ? await admin.from('questions').select('id').in('lesson_id', lessonIds)
      : { data: [] };
    const questionIds = (questions ?? []).map(q => q.id);

    // Delete answers, progress, then reset enrollment
    if (questionIds.length) {
      await admin.from('answers').delete().eq('user_id', user.id).in('question_id', questionIds);
    }
    if (lessonIds.length) {
      await admin.from('progress').delete().eq('user_id', user.id).in('lesson_id', lessonIds);
    }
    await admin.from('enrollments')
      .update({ completed_at: null, passed: false, final_score: null, total_questions: 0, correct_answers: 0 })
      .eq('user_id', user.id).eq('course_id', courseId);

    console.log(`Course reset completed for user ${user.email}`);

    return NextResponse.json({
      message: 'Kursen har återställts framgångsrikt'
    });

  } catch (error) {
    console.error('Error resetting course:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid återställning av kursen' },
      { status: 500 }
    );
  }
}
