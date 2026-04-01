import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const { data: lessonRows } = await admin.from('lessons').select('id').eq('course_id', courseId);
    const lessonIds = (lessonRows ?? []).map(l => l.id);
    const { data: allQuestions } = await admin.from('questions').select('id, question, options, correct_answer').in('lesson_id', lessonIds);
    const questionIds = (allQuestions ?? []).map(q => q.id);
    const { data: userAnswers } = questionIds.length
      ? await admin.from('answers').select('question_id, answer, is_correct').eq('user_id', user.id).in('question_id', questionIds)
      : { data: [] };

    const totalQuestions = (allQuestions ?? []).length;
    const answeredQuestions = (userAnswers ?? []).length;
    const correctAnswers = (userAnswers ?? []).filter(a => a.is_correct).length;
    const finalScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const passed = finalScore >= course.passing_score;

    console.log(`Course completion check for ${user.email}:`, { totalQuestions, answeredQuestions, correctAnswers, finalScore, passingScore: course.passing_score, passed, allQuestionsAnswered: answeredQuestions === totalQuestions });

    // Check if all questions are answered (course is completed)
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
      await admin.from('enrollments')
        .update({ total_questions: totalQuestions, correct_answers: correctAnswers, final_score: finalScore, passed, completed_at: passed ? new Date().toISOString() : null })
        .eq('user_id', user.id).eq('course_id', courseId);
    }

    const answersData = (allQuestions ?? []).map(question => {
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
    });

  } catch (error) {
    console.error('Error fetching course completion data:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid hämtning av kursdata' },
      { status: 500 }
    );
  }
}
