import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Detailed review of a single enrollment: how the user answered every question
// plus their lesson-by-lesson progression. `id` is the enrollment id.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminResult = await requireAdmin();
    if (isNextResponse(adminResult)) return adminResult;

    const admin = createAdminClient();

    const { data: enrollment } = await admin.from('enrollments')
      .select(`
        id, enrolled_at, completed_at, passed, final_score, total_questions, correct_answers,
        user:users(id, name, email, company:companies(name)),
        course:courses(id, title, category, passing_score)
      `)
      .eq('id', params.id)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ message: 'Anmälan hittades inte' }, { status: 404 });
    }

    const user = enrollment.user as unknown as { id: string; name: string | null; email: string; company: { name: string } | null } | null;
    const course = enrollment.course as unknown as { id: string; title: string; category: string; passing_score: number } | null;
    const userId = user?.id;
    const courseId = course?.id;

    const { data: lessons } = courseId
      ? await admin.from('lessons').select('id, title, "order"').eq('course_id', courseId).order('order')
      : { data: [] as { id: string; title: string; order: number }[] };
    const lessonIds = (lessons ?? []).map((l) => l.id);

    const [{ data: questions }, { data: progress }] = await Promise.all([
      lessonIds.length
        ? admin.from('questions').select('id, question, options, correct_answer, lesson_id, "order"').in('lesson_id', lessonIds)
        : Promise.resolve({ data: [] as any[] }),
      lessonIds.length && userId
        ? admin.from('progress').select('lesson_id, completed, completed_at, score').eq('user_id', userId).in('lesson_id', lessonIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const qIds = (questions ?? []).map((q) => q.id);
    const { data: userAnswers } = qIds.length && userId
      ? await admin.from('answers').select('question_id, answer, is_correct').eq('user_id', userId).in('question_id', qIds)
      : { data: [] as { question_id: string; answer: string; is_correct: boolean }[] };

    const answersData = (questions ?? []).map((q) => {
      const ua = (userAnswers ?? []).find((a) => a.question_id === q.id);
      let options: string[] = [];
      try { options = JSON.parse(q.options); } catch { options = []; }
      const selectedIndex = ua ? parseInt(ua.answer) : -1;
      const correctIndex = parseInt(q.correct_answer);
      return {
        questionId: q.id,
        question: q.question,
        options,
        correctAnswer: q.correct_answer,
        correctAnswerText: options[correctIndex] ?? '',
        userAnswer: ua?.answer ?? 'Ej besvarad',
        userAnswerText: ua ? (options[selectedIndex] ?? 'Ej besvarad') : 'Ej besvarad',
        selectedIndex,
        isCorrect: ua?.is_correct ?? false,
        answered: !!ua,
      };
    });

    const lessonProgress = (lessons ?? []).map((l) => {
      const p = (progress ?? []).find((r) => r.lesson_id === l.id);
      return {
        id: l.id,
        title: l.title,
        order: l.order,
        completed: p?.completed ?? false,
        completedAt: p?.completed_at ?? null,
      };
    });
    const completedLessons = lessonProgress.filter((l) => l.completed).length;

    return NextResponse.json({
      enrollmentId: enrollment.id,
      user: {
        id: user?.id ?? '',
        name: user?.name ?? null,
        email: user?.email ?? '',
        company: user?.company?.name ?? null,
      },
      course: {
        id: course?.id ?? '',
        title: course?.title ?? '',
        category: course?.category ?? '',
        passingScore: course?.passing_score ?? 0,
      },
      status: enrollment.completed_at ? (enrollment.passed ? 'passed' : 'failed') : 'in_progress',
      finalScore: enrollment.final_score,
      correctAnswers: enrollment.correct_answers,
      totalQuestions: enrollment.total_questions,
      enrolledAt: enrollment.enrolled_at,
      completedAt: enrollment.completed_at,
      totalLessons: lessonProgress.length,
      completedLessons,
      progressPercentage: lessonProgress.length > 0 ? Math.round((completedLessons / lessonProgress.length) * 100) : 0,
      lessons: lessonProgress,
      answers: answersData,
    });
  } catch (error) {
    console.error('Error fetching course result detail:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kursresultat' },
      { status: 500 }
    );
  }
}
