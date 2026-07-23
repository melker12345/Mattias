import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCoursePartition, recalculateAndPersistCourseScore } from '@/lib/course-progress';

export const dynamic = 'force-dynamic';

// Submit the graded test in one atomic call. The client sends the selected
// option index per test question; grading happens here from the stored
// correct_answer (never trusting the client). Answers + per-lesson progress are
// persisted and the enrollment score is recalculated.
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const courseId = params.id;
    const user = authResult;
    const body = await request.json();
    const submitted: { questionId: string; answer: string | number }[] = body.answers ?? [];

    const admin = createAdminClient();

    const { data: enrollment } = await admin.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
    if (!enrollment) return NextResponse.json({ message: 'Du är inte registrerad för denna kurs' }, { status: 403 });

    const partition = await getCoursePartition(courseId, admin);
    if (!partition.hasTest || partition.testQuestionIds.length === 0) {
      return NextResponse.json({ message: 'Den här kursen har inget prov' }, { status: 400 });
    }

    const testQuestionIdSet = new Set(partition.testQuestionIds);

    // Load the correct answers for the test questions and the lesson each
    // belongs to (so we can mark the right progress rows complete).
    const { data: questions } = await admin
      .from('questions')
      .select('id, lesson_id, correct_answer')
      .in('id', partition.testQuestionIds);
    const questionRows = (questions ?? []) as { id: string; lesson_id: string; correct_answer: string }[];
    const correctById = new Map(questionRows.map(q => [q.id, q.correct_answer]));

    // Grade + build answer rows for every submitted test question.
    const answerRows = submitted
      .filter(a => testQuestionIdSet.has(a.questionId))
      .map(a => {
        const correctRaw = correctById.get(a.questionId);
        const correctIndex = parseInt(String(correctRaw).replace(/[^0-9-]/g, ''), 10);
        const isCorrect = Number(a.answer) === correctIndex;
        return {
          user_id: user.id,
          question_id: a.questionId,
          answer: String(a.answer),
          is_correct: isCorrect,
        };
      });

    if (answerRows.length) {
      await admin.from('answers').upsert(answerRows, { onConflict: 'user_id,question_id' });
    }

    // Mark every test lesson complete so progress % and completion reflect it.
    if (partition.testLessonIds.length) {
      const nowIso = new Date().toISOString();
      const progressRows = partition.testLessonIds.map(lessonId => ({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: nowIso,
      }));
      await admin.from('progress').upsert(progressRows, { onConflict: 'user_id,lesson_id' });
    }

    const result = await recalculateAndPersistCourseScore(user.id, courseId);

    return NextResponse.json({
      ok: true,
      finalScore: result?.finalScore ?? 0,
      passed: result?.passed ?? false,
      totalQuestions: result?.totalQuestions ?? 0,
      correctAnswers: result?.correctAnswers ?? 0,
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid inlämning av provet' },
      { status: 500 }
    );
  }
}
