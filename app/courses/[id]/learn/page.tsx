'use client';

import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/app/providers';
import CourseSummary from '@/components/CourseSummary';
import { useCourseLearn } from './hooks/useCourseLearn';
import { LearnHeader } from './components/LearnHeader';
import { LessonSidebar } from './components/LessonSidebar';
import { LessonContent } from './components/LessonContent';
import { LessonNavigation } from './components/LessonNavigation';
import { TestIntro } from './components/TestIntro';
import { TestRunner } from './components/TestRunner';

export default function CourseLearningPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useSupabaseAuth();
  const router = useRouter();
  const learn = useCourseLearn(params.id, user, authLoading);

  // Still resolving auth or fetching the course.
  if (authLoading || learn.access === 'loading' || (learn.access === 'ok' && learn.loading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Not signed in — send them to sign in and back here afterwards.
  if (learn.access === 'unauthenticated') {
    const callbackUrl = encodeURIComponent(`/courses/${params.id}/learn`);
    return (
      <LearnAccessNotice
        title="Logga in för att fortsätta"
        message="Du behöver vara inloggad för att gå kursen. Logga in så tar vi dig tillbaka hit."
        primaryLabel="Logga in"
        onPrimary={() => router.push(`/auth/signin?callbackUrl=${callbackUrl}`)}
      />
    );
  }

  // Signed in but not enrolled — professional paywall, not a dead spinner.
  if (learn.access === 'forbidden') {
    return (
      <LearnAccessNotice
        title="Du har inte tillgång till den här kursen"
        message="Den här kursen ligger bakom en betalvägg. Registrera dig för kursen för att få tillgång till allt innehåll."
        primaryLabel="Till kurssidan"
        onPrimary={() => router.push(`/courses/${params.id}`)}
        secondaryLabel="Mina kurser"
        onSecondary={() => router.push('/dashboard')}
      />
    );
  }

  // Enrolled but hasn't filled in the identity required before a course starts.
  if (learn.access === 'needs_identity') {
    return (
      <LearnAccessNotice
        title="Komplettera dina uppgifter först"
        message="Innan du börjar kursen behöver du fylla i ditt namn och personnummer på din profil. Certifikatet kopplas till dessa uppgifter."
        primaryLabel="Till min profil"
        onPrimary={() => router.push('/profile')}
        secondaryLabel="Tillbaka"
        onSecondary={() => router.push('/dashboard')}
      />
    );
  }

  if (learn.access === 'notfound' || !learn.course) {
    return (
      <LearnAccessNotice
        title="Kurs hittades inte"
        message="Kursen du letar efter finns inte eller har tagits bort."
        primaryLabel="Tillbaka till dashboard"
        onPrimary={() => router.push('/dashboard')}
      />
    );
  }

  if (learn.access === 'error') {
    return (
      <LearnAccessNotice
        title="Något gick fel"
        message="Vi kunde inte ladda kursen just nu. Försök igen om en liten stund."
        primaryLabel="Försök igen"
        onPrimary={() => window.location.reload()}
        secondaryLabel="Till dashboard"
        onSecondary={() => router.push('/dashboard')}
      />
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
        hasTest={learn.completionData.hasTest ?? learn.hasTest}
        learningScore={learn.completionData.learningScore}
        onSubmitForReview={learn.handleSubmitForReview}
        onRetakeCourse={learn.hasTest ? learn.handleRetakeTest : learn.handleRetakeCourse}
        isSubmitting={learn.isSubmitting}
        hasAlreadySubmitted={learn.hasAlreadySubmitted}
        isRetaking={learn.isResetting}
      />
    );
  }

  // Full-screen graded test.
  if (learn.testMode && learn.course) {
    return (
      <TestRunner
        courseTitle={learn.course.title}
        questions={learn.testLessons}
        passingScore={learn.course.passingScore}
        parseQuestionOptions={learn.parseQuestionOptions}
        rawQuestionOptions={learn.rawQuestionOptions}
        isSubmitting={learn.testSubmitting}
        onSubmit={learn.submitTest}
        onCancel={learn.exitTest}
      />
    );
  }

  const currentLesson = learn.currentLesson;
  const isTestIntro = currentLesson?.type === 'test_intro';
  // "Course completed" banner only applies to plain (no-test) courses; for test
  // courses the result screen is reached via the test. The divider itself never
  // counts as a completable lesson.
  const contentLessons = learn.course.lessons.filter((l) => l.type !== 'test_intro');
  const allLessonsCompleted =
    !learn.hasTest &&
    contentLessons.length > 0 &&
    contentLessons.every((l) => learn.isLessonCompleted(l.id));
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

              {currentLesson && isTestIntro && (
                <TestIntro
                  title={currentLesson.title}
                  instructions={currentLesson.content}
                  questionCount={learn.testLessons.length}
                  passingScore={learn.course.passingScore}
                  contentComplete={learn.contentComplete}
                  testCompleted={learn.testCompleted}
                  isBusy={learn.testSubmitting || learn.isResetting}
                  onStart={learn.startTest}
                  onViewResults={learn.checkCourseCompletion}
                  onRetake={learn.handleRetakeTest}
                />
              )}

              {currentLesson && !isTestIntro && (
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

function LearnAccessNotice({
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onPrimary}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary && (
            <button
              onClick={onSecondary}
              className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}