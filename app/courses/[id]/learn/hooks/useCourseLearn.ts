'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import {
  parseQuestionOptions,
  parseCorrectAnswerIndex,
  rawQuestionOptions,
  rawCorrectAnswer,
} from '@/lib/questions';
import type {
  LearnCourse,
  LessonProgress,
  UserAnswer,
  CompletionData,
  LearnLesson,
} from '@/lib/types/course-learn';

const TEST_INTRO_TYPE = 'test_intro';

// Access state for the course player. Drives which screen the page renders
// instead of an infinite spinner:
//  - 'loading'         auth or data still resolving
//  - 'ok'              enrolled (or admin preview) — show the course
//  - 'unauthenticated' no session — prompt sign in
//  - 'forbidden'       signed in but not enrolled — show the paywall
//  - 'notfound'        course does not exist
//  - 'error'           unexpected failure
export type LearnAccess = 'loading' | 'ok' | 'unauthenticated' | 'forbidden' | 'notfound' | 'error';

export function useCourseLearn(courseId: string, user: User | null, authLoading: boolean) {
  const router = useRouter();
  const [course, setCourse] = useState<LearnCourse | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<LearnAccess>('loading');
  const [savingProgress, setSavingProgress] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [showLessonList, setShowLessonList] = useState(false);
  const [showCourseSummary, setShowCourseSummary] = useState(false);
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  // Lessons that make up the graded test (question lessons after the
  // 'test_intro' divider). Kept separate from course.lessons, which holds only
  // the content + the divider so the existing lesson stepper is untouched.
  const [testLessons, setTestLessons] = useState<LearnLesson[]>([]);
  const [hasTest, setHasTest] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testSubmitting, setTestSubmitting] = useState(false);
  // Completed-lesson count observed on (re)load — used to only auto-show the
  // summary when the learner reaches 100% during this visit, not on arrival.
  const completedAtLoadRef = useRef<number | null>(null);

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);
      completedAtLoadRef.current = null;

      // Single gated round-trip: course content + progress + answers.
      const response = await fetch(`/api/courses/${courseId}/learn`);

      if (response.status === 401) { setAccess('unauthenticated'); return; }
      if (response.status === 403) { setAccess('forbidden'); return; }
      if (response.status === 404) { setAccess('notfound'); return; }
      if (!response.ok) throw new Error('Failed to load course');

      const data = await response.json();

      // Split the lessons into content (+ divider) and the graded test. The
      // test = question lessons ordered after the 'test_intro' divider.
      const allLessons: LearnLesson[] = data.course.lessons ?? [];
      const introIdx = allLessons.findIndex((l) => l.type === TEST_INTRO_TYPE);
      const courseHasTest = introIdx >= 0;
      const testOnly = courseHasTest
        ? allLessons.filter((l, i) => i > introIdx && l.type === 'question')
        : [];
      const contentOnly = courseHasTest
        ? allLessons.filter((l, i) => !(i > introIdx && l.type === 'question'))
        : allLessons;

      setCourse({ ...data.course, lessons: contentOnly });
      setTestLessons(testOnly);
      setHasTest(courseHasTest);
      setProgress(data.progress ?? []);
      setUserAnswers(data.answers ?? []);
      setAccess('ok');
    } catch (error) {
      console.error('Error fetching course data:', error);
      setAccess('error');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Depend on the user id, not the user object: Supabase emits a fresh user
  // object on tab-focus token refresh, which would otherwise re-run this and
  // reload the whole course.
  const userId = user?.id;
  useEffect(() => {
    // Wait for auth to resolve before deciding anything — otherwise a
    // logged-out (or still-resolving) visitor would spin forever.
    if (authLoading) return;
    if (!userId) {
      setAccess('unauthenticated');
      setLoading(false);
      return;
    }
    fetchCourseData();
  }, [authLoading, userId, fetchCourseData]);

  const currentLesson = course?.lessons[currentLessonIndex] ?? null;

  const resetQuestionState = useCallback(() => {
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setVideoError(null);
  }, []);

  const markLessonComplete = useCallback(async (lessonId: string, score?: number) => {
    try {
      setSavingProgress(true);

      const response = await fetch(`/api/courses/${courseId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, completed: true, score }),
      });

      if (response.ok) {
        setProgress((prev) => {
          const existing = prev.find((p) => p.lessonId === lessonId);
          if (existing) {
            return prev.map((p) =>
              p.lessonId === lessonId
                ? { ...p, completed: true, completedAt: new Date().toISOString() }
                : p
            );
          }
          return [...prev, { lessonId, completed: true, completedAt: new Date().toISOString() }];
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSavingProgress(false);
    }
  }, [courseId]);

  const submitAnswer = useCallback(async (questionId: string, selectedOption: number, lesson: LearnLesson) => {
    try {
      const currentQuestion = lesson.questions?.[0];
      if (!currentQuestion) return;

      const response = await fetch(`/api/courses/${courseId}/questions/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: selectedOption.toString() }),
      });

      if (response.ok) {
        // Trust the server's grading, not a locally computed value.
        const data = await response.json();
        const isCorrect = !!data.isCorrect;
        setUserAnswers((prev) => [
          ...prev,
          {
            questionId,
            answer: selectedOption.toString(),
            selectedIndex: selectedOption,
            isCorrect,
          },
        ]);
        setAnswerSubmitted(true);
        await markLessonComplete(lesson.id, isCorrect ? 100 : 0);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  }, [courseId, markLessonComplete]);

  const goToNextLesson = useCallback(() => {
    if (course && currentLessonIndex < course.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      resetQuestionState();
    }
  }, [course, currentLessonIndex, resetQuestionState]);

  const goToPreviousLesson = useCallback(() => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      resetQuestionState();
    }
  }, [currentLessonIndex, resetQuestionState]);

  const goToLesson = useCallback((index: number) => {
    setCurrentLessonIndex(index);
    setShowLessonList(false);
    resetQuestionState();
  }, [resetQuestionState]);

  const isLessonCompleted = useCallback(
    (lessonId: string) => progress.some((p) => p.lessonId === lessonId && p.completed),
    [progress]
  );

  // The 'test_intro' divider is a gateway screen, not a completable lesson, so
  // it never counts toward content progress.
  const contentLessons = (course?.lessons ?? []).filter((l) => l.type !== TEST_INTRO_TYPE);

  const getProgressPercentage = useCallback(() => {
    if (!course) return 0;
    const denom = course.lessons.filter((l) => l.type !== TEST_INTRO_TYPE).length;
    if (denom === 0) return 0;
    const completedLessons = course.lessons
      .filter((l) => l.type !== TEST_INTRO_TYPE)
      .filter((l) => progress.some((p) => p.lessonId === l.id && p.completed)).length;
    return Math.round((completedLessons / denom) * 100);
  }, [course, progress]);

  // Whether all learning content (everything except the test) is done — used to
  // gate starting the test.
  const contentComplete =
    contentLessons.length > 0 && contentLessons.every((l) => progress.some((p) => p.lessonId === l.id && p.completed));

  // Whether the learner has already submitted the test (every test lesson done).
  const testCompleted =
    testLessons.length > 0 && testLessons.every((l) => progress.some((p) => p.lessonId === l.id && p.completed));

  const checkCourseCompletion = useCallback(async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}/completion`);
      if (response.ok) {
        const data = await response.json();
        if (data.completed) {
          setCompletionData(data);
          setShowCourseSummary(true);

          const submissionResponse = await fetch(`/api/courses/${courseId}/submit`);
          if (submissionResponse.ok) {
            const submissionData = await submissionResponse.json();
            setHasAlreadySubmitted(submissionData.hasSubmitted);
          }
        }
      }
    } catch (error) {
      console.error('Error checking course completion:', error);
    }
  }, [courseId]);

  const handleSubmitForReview = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/courses/${courseId}/submit`, { method: 'POST' });

      if (response.ok) {
        setHasAlreadySubmitted(true);
        alert('Kursen har skickats in för granskning!');
      } else {
        const error = await response.json();
        alert(error.message || 'Ett fel uppstod vid inskickning');
      }
    } catch (error) {
      console.error('Error submitting for review:', error);
      alert('Ett fel uppstod vid inskickning');
    } finally {
      setIsSubmitting(false);
    }
  }, [courseId]);

  const handleRetakeCourse = useCallback(async () => {
    try {
      setIsResetting(true);
      setShowCourseSummary(false);
      setCompletionData(null);
      setCurrentLessonIndex(0);
      setProgress([]);
      setUserAnswers([]);

      await fetch(`/api/courses/${courseId}/reset`, { method: 'POST' });
      await fetchCourseData();
    } catch (error) {
      console.error('Error resetting course:', error);
      setShowCourseSummary(false);
      setCompletionData(null);
      setCurrentLessonIndex(0);
      setProgress([]);
      setUserAnswers([]);
      fetchCourseData();
    } finally {
      setIsResetting(false);
    }
  }, [courseId, fetchCourseData]);

  useEffect(() => {
    // For test courses the result screen is reached by submitting the test,
    // never automatically from finishing the content.
    if (hasTest) return;
    if (isResetting || showCourseSummary || !course || progress.length === 0) return;

    const completedLessons = progress.filter((p) => p.completed).length;

    // First evaluation after a (re)load: record the baseline and don't show the
    // summary. This lets a learner revisit an already-completed course and go
    // through the content again without being sent straight to the result screen.
    if (completedAtLoadRef.current === null) {
      completedAtLoadRef.current = completedLessons;
      return;
    }

    // Only auto-show the summary if the course was not yet complete on arrival
    // and the learner has now finished every lesson in this session.
    const wasIncompleteOnLoad = completedAtLoadRef.current < course.lessons.length;
    if (wasIncompleteOnLoad && completedLessons === course.lessons.length) {
      const timer = setTimeout(() => {
        if (!isResetting && !showCourseSummary) checkCourseCompletion();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [progress, course, checkCourseCompletion, isResetting, showCourseSummary, hasTest]);

  const getCurrentQuestionAnswer = useCallback(() => {
    const currentQuestion = currentLesson?.questions?.[0];
    if (!currentQuestion) return null;
    return userAnswers.find((a) => a.questionId === currentQuestion.id) ?? null;
  }, [currentLesson, userAnswers]);

  const retryQuestion = useCallback((questionId: string) => {
    setUserAnswers((prev) => prev.filter((a) => a.questionId !== questionId));
    setAnswerSubmitted(false);
    setSelectedAnswer(null);
  }, []);

  const startTest = useCallback(() => setTestMode(true), []);
  const exitTest = useCallback(() => setTestMode(false), []);

  // Submit the whole test at once. `answers` maps each test question id to the
  // selected option index. Grading happens server-side.
  const submitTest = useCallback(
    async (answers: { questionId: string; answer: number }[]) => {
      try {
        setTestSubmitting(true);
        const response = await fetch(`/api/courses/${courseId}/test/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          alert(err.message || 'Ett fel uppstod vid inlämning av provet');
          return;
        }
        setTestMode(false);
        // Refresh progress/answers so the sidebar + state reflect the test, then
        // show the result screen.
        await fetchCourseData();
        await checkCourseCompletion();
      } catch (error) {
        console.error('Error submitting test:', error);
        alert('Ett fel uppstod vid inlämning av provet');
      } finally {
        setTestSubmitting(false);
      }
    },
    [courseId, fetchCourseData, checkCourseCompletion]
  );

  // Retake the test only: clears test answers/progress, keeps content progress.
  const handleRetakeTest = useCallback(async () => {
    try {
      setIsResetting(true);
      setShowCourseSummary(false);
      setCompletionData(null);
      setTestMode(false);
      await fetch(`/api/courses/${courseId}/test/reset`, { method: 'POST' });
      await fetchCourseData();
    } catch (error) {
      console.error('Error resetting test:', error);
    } finally {
      setIsResetting(false);
    }
  }, [courseId, fetchCourseData]);

  return {
    course,
    access,
    currentLesson,
    currentLessonIndex,
    progress,
    userAnswers,
    loading,
    savingProgress,
    selectedAnswer,
    setSelectedAnswer,
    answerSubmitted,
    videoError,
    setVideoError,
    showLessonList,
    setShowLessonList,
    showCourseSummary,
    completionData,
    isSubmitting,
    hasAlreadySubmitted,
    isResetting,
    submitAnswer,
    markLessonComplete,
    goToNextLesson,
    goToPreviousLesson,
    goToLesson,
    isLessonCompleted,
    getProgressPercentage,
    checkCourseCompletion,
    handleSubmitForReview,
    handleRetakeCourse,
    getCurrentQuestionAnswer,
    retryQuestion,
    // Test feature
    hasTest,
    testLessons,
    testMode,
    testSubmitting,
    contentComplete,
    testCompleted,
    startTest,
    exitTest,
    submitTest,
    handleRetakeTest,
    parseQuestionOptions,
    rawQuestionOptions,
    rawCorrectAnswer,
    parseCorrectAnswerIndex,
  };
}