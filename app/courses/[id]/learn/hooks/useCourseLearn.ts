'use client';

import { useState, useEffect, useCallback } from 'react';
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

export function useCourseLearn(courseId: string, user: User | null) {
  const router = useRouter();
  const [course, setCourse] = useState<LearnCourse | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchCourseData = useCallback(async () => {
    try {
      setLoading(true);

      const [courseResponse, progressResponse] = await Promise.all([
        fetch(`/api/courses/${courseId}`),
        fetch(`/api/courses/${courseId}/progress`),
      ]);
      if (!courseResponse.ok) throw new Error('Course not found');
      const courseData = await courseResponse.json();
      setCourse(courseData);

      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setProgress(progressData.progress);
        setUserAnswers(progressData.answers);
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [courseId, router]);

  // Depend on the user id, not the user object: Supabase emits a fresh user
  // object on tab-focus token refresh, which would otherwise re-run this and
  // reload the whole course.
  const userId = user?.id;
  useEffect(() => {
    if (userId) fetchCourseData();
  }, [userId, fetchCourseData]);

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

      const correctAnswer = parseCorrectAnswerIndex(rawCorrectAnswer(currentQuestion));
      const isCorrect = Number(selectedOption) === correctAnswer;

      const response = await fetch(`/api/courses/${courseId}/questions/${questionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: selectedOption.toString(),
          isCorrect,
        }),
      });

      if (response.ok) {
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

  const getProgressPercentage = useCallback(() => {
    if (!course) return 0;
    const completedLessons = progress.filter((p) => p.completed).length;
    return Math.round((completedLessons / course.lessons.length) * 100);
  }, [course, progress]);

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
    if (isResetting || showCourseSummary || !course || progress.length === 0) return;

    const completedLessons = progress.filter((p) => p.completed).length;
    if (completedLessons === course.lessons.length) {
      const timer = setTimeout(() => {
        if (!isResetting && !showCourseSummary) checkCourseCompletion();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [progress, course, checkCourseCompletion, isResetting, showCourseSummary]);

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

  return {
    course,
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
    parseQuestionOptions,
    rawQuestionOptions,
    rawCorrectAnswer,
    parseCorrectAnswerIndex,
  };
}