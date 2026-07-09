import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const courseId = params.id;

    const admin = createAdminClient();
    const userId = authResult.id;

    // NOTE: enrolled_at lives on enrollments, not courses — selecting it inside
    // the nested courses(...) made PostgREST error out and return null, which
    // this route then reported as "not enrolled" (403) for everyone.
    const { data: enrollment } = await admin
      .from('enrollments').select('*, course:courses(id, title, passing_score)')
      .eq('user_id', userId).eq('course_id', courseId).maybeSingle();

    if (!enrollment) return NextResponse.json({ message: 'Du är inte registrerad för denna kurs' }, { status: 403 });
    if (!enrollment.passed) return NextResponse.json({ message: 'Du måste klara kursen innan du kan skicka in den för granskning' }, { status: 400 });

    // A previously-reviewed submission that has already been registered with
    // ID06 is final and must not be silently overwritten.
    const { data: existingSubmission } = await admin.from('apv_submissions').select('id, status').eq('user_id', userId).eq('course_id', courseId).maybeSingle();
    if (existingSubmission?.status === 'ID06_REGISTERED') {
      return NextResponse.json({ message: 'Denna kurs är redan registrerad hos ID06 och kan inte skickas in igen' }, { status: 400 });
    }

    const { data: lessons } = await admin.from('lessons').select('id, order').eq('course_id', courseId).order('order');
    const lessonIds = (lessons ?? []).map(l => l.id);
    const { data: questions } = lessonIds.length
      ? await admin.from('questions').select('*, lesson:lessons(order)').in('lesson_id', lessonIds)
      : { data: [] };

    const qIds = (questions ?? []).map(q => q.id);
    const { data: userAnswers } = qIds.length
      ? await admin.from('answers').select('question_id, answer, is_correct').eq('user_id', userId).in('question_id', qIds)
      : { data: [] };

    const courseData = enrollment.course as { id: string; title: string; passing_score: number };
    const answersData = (questions ?? []).map(q => {
      const ua = (userAnswers ?? []).find(a => a.question_id === q.id);
      const options = JSON.parse(q.options);
      const cidx = parseInt(q.correct_answer);
      return {
        questionId: q.id, question: q.question,
        userAnswer: ua?.answer ?? 'Ej besvarad', correctAnswer: q.correct_answer,
        isCorrect: ua?.is_correct ?? false, options,
        selectedIndex: ua ? parseInt(ua.answer) : -1,
        correctAnswerText: options[cidx],
        userAnswerText: ua ? options[parseInt(ua.answer)] : 'Ej besvarad',
      };
    });

    const timeTaken = enrollment.completed_at && enrollment.enrolled_at
      ? Math.round((new Date(enrollment.completed_at).getTime() - new Date(enrollment.enrolled_at).getTime()) / 60000)
      : null;

    // Upsert on (user_id, course_id): re-submitting after a retake replaces the
    // previous attempt with the newer result and puts it back in the review
    // queue (status PENDING) so an admin sees the improved score.
    const { data: submission } = await admin.from('apv_submissions').upsert({
      user_id: userId, course_id: courseId,
      full_name: authResult.name ?? authResult.email,
      course_title: courseData.title,
      completion_date: enrollment.completed_at ?? new Date().toISOString(),
      final_score: enrollment.final_score ?? 0,
      passing_score: courseData.passing_score,
      total_questions: enrollment.total_questions,
      correct_answers: enrollment.correct_answers,
      time_taken: timeTaken,
      answers_data: JSON.stringify(answersData),
      status: 'PENDING',
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      review_notes: null,
    }, { onConflict: 'user_id,course_id' }).select('id').single();

    const resubmitted = !!existingSubmission;
    return NextResponse.json({
      message: resubmitted ? 'Ditt uppdaterade resultat har skickats in för granskning' : 'Kursen har skickats in för granskning',
      submissionId: submission?.id,
      resubmitted,
    });

  } catch (error) {
    console.error('Error submitting course for review:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid inskickning för granskning' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if user has already submitted
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
    const { data: existingSubmission } = await admin
      .from('apv_submissions').select('*').eq('user_id', authResult.id).eq('course_id', courseId).maybeSingle();
    return NextResponse.json({ hasSubmitted: !!existingSubmission, submission: existingSubmission });

  } catch (error) {
    console.error('Error checking submission status:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid kontroll av inlämningsstatus' },
      { status: 500 }
    );
  }
}
