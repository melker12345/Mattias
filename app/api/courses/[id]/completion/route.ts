import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { recalculateAndPersistCourseScore, computeFinalScore, getCoursePartition, getLearningScore } from '@/lib/course-progress';

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
      .select('*, course:courses(id, title, passing_score)')
      .eq('user_id', user.id).eq('course_id', courseId).maybeSingle();

    if (!enrollment) return NextResponse.json({ message: 'Du är inte registrerad för denna kurs' }, { status: 403 });

    const course = enrollment.course as { id: string; title: string; passing_score: number };

    // The graded assessment is the TEST partition (all questions for a course
    // with no test divider). Completion + the result screen are driven by it.
    const partition = await getCoursePartition(courseId, admin);
    const testQuestionIds = partition.testQuestionIds;

    const { data: testQuestions } = testQuestionIds.length
      ? await admin.from('questions').select('id, question, options, correct_answer').in('id', testQuestionIds)
      : { data: [] as { id: string; question: string; options: string; correct_answer: string }[] };

    const { data: userAnswers } = testQuestionIds.length
      ? await admin.from('answers').select('question_id, answer, is_correct').eq('user_id', user.id).in('question_id', testQuestionIds)
      : { data: [] };

    const totalQuestions = (testQuestions ?? []).length;
    const answeredQuestions = (userAnswers ?? []).length;
    const correctAnswers = (userAnswers ?? []).filter(a => a.is_correct).length;
    const passingScore = course.passing_score;

    const learningScore = await getLearningScore(user.id, courseId, admin, partition);

    const { finalScore, passed } = computeFinalScore(totalQuestions, correctAnswers, passingScore);

    // Completed once every TEST question has been answered.
    const isCompleted = totalQuestions > 0 && answeredQuestions === totalQuestions;

    if (!isCompleted) {
      return NextResponse.json({
        completed: false,
        enrolled: true,
        debug: {
          totalQuestions,
          answeredQuestions,
          message: 'Not all questions answered'
        }
      });
    }

    if (!enrollment.completed_at || enrollment.final_score !== finalScore) {
      await recalculateAndPersistCourseScore(user.id, courseId);
    }

    const answersData = (testQuestions ?? []).map(question => {
      const userAnswer = (userAnswers ?? []).find(a => a.question_id === question.id);
      const options = JSON.parse(question.options);
      return {
        questionId: question.id,
        question: question.question,
        userAnswer: userAnswer?.answer ?? 'Ej besvarad',
        correctAnswer: question.correct_answer,
        isCorrect: userAnswer?.is_correct ?? false,
        options,
        selectedIndex: userAnswer ? parseInt(userAnswer.answer) : -1,
      };
    });

    const timeTaken = enrollment.completed_at && enrollment.enrolled_at
      ? Math.round((new Date(enrollment.completed_at).getTime() - new Date(enrollment.enrolled_at).getTime()) / 60000)
      : null;

    return NextResponse.json({
      completed: true,
      enrolled: true,
      courseId: course.id,
      courseTitle: course.title,
      finalScore: enrollment.final_score ?? 0,
      passingScore: course.passing_score,
      totalQuestions: enrollment.total_questions,
      correctAnswers: enrollment.correct_answers,
      passed: enrollment.passed,
      timeTaken,
      answers: answersData,
      userEmail: user.email,
      hasTest: partition.hasTest,
      learningScore: {
        total: learningScore.total,
        correct: learningScore.correct,
        answered: learningScore.answered,
        score: learningScore.score,
      },
    });

  } catch (error) {
    console.error('Error fetching course completion data:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kursdata' },
      { status: 500 }
    );
  }
}
