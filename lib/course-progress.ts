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

export const TEST_INTRO_TYPE = 'test_intro';

/**
 * How a course's questions split into the graded test vs. ungraded practice.
 *
 * A course may contain a single 'test_intro' divider lesson. Question lessons
 * ordered AFTER the divider make up the graded test; question lessons BEFORE it
 * are practice ("learning") questions. A course with no divider has no separate
 * test — every question counts as the test (legacy behaviour).
 */
export interface CoursePartition {
  hasTest: boolean;
  testQuestionIds: string[];
  learningQuestionIds: string[];
  /** Ordered ids of the lessons that make up the test (question lessons after the divider). */
  testLessonIds: string[];
}

type Admin = ReturnType<typeof createAdminClient>;

/**
 * Compute the test/learning partition for a course. Shared by scoring,
 * completion, the test-submit endpoint and reporting so the definition of
 * "what is the test" lives in exactly one place.
 */
export async function getCoursePartition(courseId: string, admin: Admin): Promise<CoursePartition> {
  const { data: lessons } = await admin
    .from('lessons')
    .select('id, type, "order"')
    .eq('course_id', courseId)
    .order('order');

  const lessonRows = (lessons ?? []) as { id: string; type: string; order: number }[];
  const lessonIds = lessonRows.map(l => l.id);

  const { data: questions } = lessonIds.length
    ? await admin.from('questions').select('id, lesson_id').in('lesson_id', lessonIds)
    : { data: [] as { id: string; lesson_id: string }[] };
  const questionRows = (questions ?? []) as { id: string; lesson_id: string }[];

  const orderByLesson = new Map(lessonRows.map(l => [l.id, l.order]));
  const divider = lessonRows.find(l => l.type === TEST_INTRO_TYPE);

  if (!divider) {
    // No divider: the whole course is the "test" (legacy behaviour).
    return {
      hasTest: false,
      testQuestionIds: questionRows.map(q => q.id),
      learningQuestionIds: [],
      testLessonIds: lessonRows.filter(l => l.type === 'question').map(l => l.id),
    };
  }

  const dividerOrder = divider.order;
  const testQuestionIds: string[] = [];
  const learningQuestionIds: string[] = [];
  for (const q of questionRows) {
    const order = orderByLesson.get(q.lesson_id) ?? 0;
    if (order > dividerOrder) testQuestionIds.push(q.id);
    else learningQuestionIds.push(q.id);
  }

  const testLessonIds = lessonRows
    .filter(l => l.type === 'question' && l.order > dividerOrder)
    .map(l => l.id);

  return { hasTest: true, testQuestionIds, learningQuestionIds, testLessonIds };
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
 * Score summary for a set of questions (test or learning).
 */
export interface QuestionSetScore {
  total: number;
  answered: number;
  correct: number;
  score: number; // percentage of total (0 when total is 0)
}

/**
 * Compute a user's practice ("learning") score for a course from their stored
 * answers. Derived at read-time (not persisted) for the completion summary and
 * the admin/company reporting views.
 */
export async function getLearningScore(
  userId: string,
  courseId: string,
  admin: Admin,
  partition?: CoursePartition
): Promise<QuestionSetScore> {
  const part = partition ?? (await getCoursePartition(courseId, admin));
  const ids = part.learningQuestionIds;
  if (!ids.length) return { total: 0, answered: 0, correct: 0, score: 0 };

  const { data: answers } = await admin
    .from('answers')
    .select('is_correct')
    .eq('user_id', userId)
    .in('question_id', ids);

  const rows = (answers ?? []) as { is_correct: boolean }[];
  const correct = rows.filter(a => a.is_correct).length;
  return {
    total: ids.length,
    answered: rows.length,
    correct,
    score: Math.round((correct / ids.length) * 100),
  };
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

    // The graded score is driven by the TEST questions only (which equals all
    // questions for a course with no test divider — see getCoursePartition).
    const { testQuestionIds } = await getCoursePartition(courseId, admin);

    // Fetch the user's answers to the test questions + course passing score.
    const [{ data: userAnswers }, { data: course }] = await Promise.all([
      testQuestionIds.length
        ? admin.from('answers').select('is_correct').eq('user_id', userId).in('question_id', testQuestionIds)
        : Promise.resolve({ data: [] as { is_correct: boolean }[] }),
      admin.from('courses').select('passing_score').eq('id', courseId).single(),
    ]);

    const totalQuestions = testQuestionIds.length;
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
