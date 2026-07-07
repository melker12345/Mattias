'use client';

import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/app/providers';
import CourseSummary from '@/components/CourseSummary';
import { useCourseLearn } from './hooks/useCourseLearn';
import { LearnHeader } from './components/LearnHeader';
import { LessonSidebar } from './components/LessonSidebar';
import { LessonContent } from './components/LessonContent';
import { LessonNavigation } from './components/LessonNavigation';

export default function CourseLearningPage({ params }: { params: { id: string } }) {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const learn = useCourseLearn(params.id, user);

  if (learn.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!learn.course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Kurs hittades inte</h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Tillbaka till dashboard
          </button>
        </div>
      </div>
    );
  }

  if (learn.showCourseSummary && learn.completionData) {
    return (
      <CourseSummary
        courseId={learn.completionData.courseId}
        courseTitle={learn.completionData.courseTitle}
        finalScore={learn.completionData.finalScore}
        passingScore={learn.completionData.passingScore}
        totalQuestions={learn.completionData.totalQuestions}
        correctAnswers={learn.completionData.correctAnswers}
        passed={learn.completionData.passed}
        timeTaken={learn.completionData.timeTaken}
        answers={learn.completionData.answers}
        userEmail={learn.completionData.userEmail}
        onSubmitForReview={learn.handleSubmitForReview}
        onRetakeCourse={learn.handleRetakeCourse}
        isSubmitting={learn.isSubmitting}
        hasAlreadySubmitted={learn.hasAlreadySubmitted}
        isRetaking={learn.isResetting}
      />
    );
  }

  const currentLesson = learn.currentLesson;
  const allLessonsCompleted =
    learn.course.lessons.length > 0 &&
    learn.course.lessons.every((l) => learn.isLessonCompleted(l.id));
  const currentQuestion = currentLesson?.questions?.[0];
  const currentUserAnswer = currentQuestion
    ? learn.userAnswers.find((a) => a.questionId === currentQuestion.id) ?? null
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <LearnHeader
        courseTitle={learn.course.title}
        currentLessonIndex={learn.currentLessonIndex}
        totalLessons={learn.course.lessons.length}
        progressPercentage={learn.getProgressPercentage()}
        showLessonList={learn.showLessonList}
        onBack={() => router.push('/dashboard')}
        onToggleLessonList={() => learn.setShowLessonList(!learn.showLessonList)}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          <LessonSidebar
            lessons={learn.course.lessons}
            currentLessonIndex={learn.currentLessonIndex}
            showLessonList={learn.showLessonList}
            isLessonCompleted={learn.isLessonCompleted}
            onSelectLesson={learn.goToLesson}
          />

          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
              {allLessonsCompleted && (
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-green-800">
                    Du har klarat denna kurs. Du kan gå igenom innehållet igen när du vill.
                  </p>
                  <button
                    onClick={learn.checkCourseCompletion}
                    className="shrink-0 text-sm font-medium text-green-700 hover:text-green-900 underline"
                  >
                    Visa resultat
                  </button>
                </div>
              )}

              {currentLesson && (
                <>
                  <LessonContent
                    lesson={currentLesson}
                    isCompleted={learn.isLessonCompleted(currentLesson.id)}
                    videoError={learn.videoError}
                    selectedAnswer={learn.selectedAnswer}
                    answerSubmitted={learn.answerSubmitted}
                    userAnswer={currentUserAnswer}
                    parseQuestionOptions={learn.parseQuestionOptions}
                    rawQuestionOptions={learn.rawQuestionOptions}
                    rawCorrectAnswer={learn.rawCorrectAnswer}
                    parseCorrectAnswerIndex={learn.parseCorrectAnswerIndex}
                    onVideoError={learn.setVideoError}
                    onClearVideoError={() => learn.setVideoError(null)}
                    onSelectAnswer={learn.setSelectedAnswer}
                    onSubmitAnswer={() => {
                      if (currentQuestion && learn.selectedAnswer !== null) {
                        learn.submitAnswer(currentQuestion.id, learn.selectedAnswer, currentLesson);
                      }
                    }}
                    onRetryQuestion={() => {
                      if (currentQuestion) learn.retryQuestion(currentQuestion.id);
                    }}
                  />

                  <LessonNavigation
                    currentLessonIndex={learn.currentLessonIndex}
                    totalLessons={learn.course.lessons.length}
                    isCurrentLessonCompleted={learn.isLessonCompleted(currentLesson.id)}
                    allLessonsCompleted={allLessonsCompleted}
                    savingProgress={learn.savingProgress}
                    onPrevious={learn.goToPreviousLesson}
                    onNext={learn.goToNextLesson}
                    onMarkComplete={() => learn.markLessonComplete(currentLesson.id)}
                    onFinishCourse={learn.checkCourseCompletion}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}