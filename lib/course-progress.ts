import { createAdminClient } from './supabase/admin';

/**
 * Result of (re)calculating a user's score for a course.
 */
export interface CourseScoreResult {
  totalQuestions: number;
  correctAnswers: number;
  finalScore: number;
  passed: boolean;
}

/**
 * Pure calculation given raw counts. Useful for testing and when you already have the numbers.
 */
export function computeFinalScore(
  totalQuestions: number,
  correctAnswers: number,
  passingScore: number = 80
): { finalScore: number; passed: boolean } {
  const finalScore = totalQuestions > 0 
    ? Math.round((correctAnswers / totalQuestions) * 100) 
    : 0;
  const passed = finalScore >= passingScore;
  return { finalScore, passed };
}

/**
 * Recalculates the user's progress/score for an entire course based on their answers
 * and updates the enrollments row.
 * 
 * This is the single place that owns the "what is the current score" logic.
 * 
 * Returns the computed result (or null on failure).
 */
export async function recalculateAndPersistCourseScore(
  userId: string, 
  courseId: string
): Promise<CourseScoreResult | null> {
  try {
    const admin = createAdminClient();

    // Get all lesson IDs for the course
    const { data: lessons } = await admin
      .from('lessons')
      .select('id')
      .eq('course_id', courseId);

    const lessonIds = (lessons ?? []).map(l => l.id);

    if (lessonIds.length === 0) {
      return {
        totalQuestions: 0,
        correctAnswers: 0,
        finalScore: 0,
        passed: false,
      };
    }

    // Fetch the question ids for the course once, then reuse them.
    const { data: questions } = await admin.from('questions').select('id').in('lesson_id', lessonIds);
    const questionIds = (questions ?? []).map(q => q.id);

    // Fetch the user's answers + course passing score in parallel
    const [{ data: userAnswers }, { data: course }] = await Promise.all([
      admin.from('answers')
        .select('is_correct')
        .eq('user_id', userId)
        .in('question_id', questionIds),
      admin.from('courses').select('passing_score').eq('id', courseId).single(),
    ]);

    const totalQuestions = questionIds.length;
    const correctAnswers = (userAnswers ?? []).filter(a => a.is_correct).length;
    const passingScore = (course?.passing_score as number) || 80;

    const { finalScore, passed } = computeFinalScore(totalQuestions, correctAnswers, passingScore);

    // Persist to enrollment
    await admin.from('enrollments')
      .update({
        total_questions: totalQuestions,
        correct_answers: correctAnswers,
        final_score: finalScore,
        passed,
        completed_at: passed ? new Date().toISOString() : null,
      })
      .eq('user_id', userId)
      .eq('course_id', courseId);

    return {
      totalQuestions,
      correctAnswers,
      finalScore,
      passed,
    };
  } catch (error) {
    console.error('Error recalculating course score:', error);
    return null;
  }
}
