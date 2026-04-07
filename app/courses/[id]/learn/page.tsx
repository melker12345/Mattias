'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ReactPlayer from 'react-player';
import { 
  BookOpenIcon, 
  PlayIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import CourseSummary from '@/components/CourseSummary';

interface Question {
  id: string;
  question: string;
  type: string;
  /** JSON string or parsed array from API */
  options: string | unknown;
  correctAnswer?: string;
  correct_answer?: string;
  order: number;
}

interface Lesson {
  id: string;
  title: string;
  content?: string;
  videoUrl?: string;
  imageUrl?: string;
  type: string;
  order: number;
  questions?: Question[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

interface Progress {
  lessonId: string;
  completed: boolean;
  completedAt?: string;
}

interface UserAnswer {
  questionId: string;
  answer: string;
  selectedIndex?: number;
  isCorrect: boolean;
}

/** DB JSON/JSONB may be a string or already parsed (Supabase client) */
function parseQuestionOptions(raw: unknown): string[] {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === 'string') {
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseCorrectAnswerIndex(raw: unknown): number {
  if (raw == null || raw === '') return 0;
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  if (typeof raw === 'string') {
    try {
      return Number(JSON.parse(raw));
    } catch {
      const n = Number(raw);
      return Number.isNaN(n) ? 0 : n;
    }
  }
  const n = Number(raw);
  return Number.isNaN(n) ? 0 : n;
}

function rawQuestionOptions(q: Question | undefined): unknown {
  return q?.options;
}

/** Supabase uses correct_answer; older code expected correctAnswer */
function rawCorrectAnswer(q: Question | undefined): unknown {
  if (!q) return undefined;
  return q.correctAnswer ?? q.correct_answer;
}

export default function CourseLearningPage({ params }: { params: { id: string } }) {
  const { user } = useSupabaseAuth();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [showLessonList, setShowLessonList] = useState(false);
  const [showCourseSummary, setShowCourseSummary] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAlreadySubmitted, setHasAlreadySubmitted] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCourseData();
    }
  }, [user, params.id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Fetch course details
      const courseResponse = await fetch(`/api/courses/${params.id}`);
      if (!courseResponse.ok) {
        throw new Error('Course not found');
      }
      const courseData = await courseResponse.json();
      setCourse(courseData);

      // Fetch user progress
      const progressResponse = await fetch(`/api/courses/${params.id}/progress`);
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
  };

  const submitAnswer = async (questionId: string, selectedOption: number) => {
    try {
      const currentQuestion = currentLesson?.questions?.[0];
      if (!currentQuestion) return;

      const options = parseQuestionOptions(rawQuestionOptions(currentQuestion));
      const correctAnswer = parseCorrectAnswerIndex(rawCorrectAnswer(currentQuestion));
      const isCorrect = Number(selectedOption) === correctAnswer;

      console.log('Debug question answer:');
      console.log('Selected option:', selectedOption, 'type:', typeof selectedOption);
      console.log('Correct answer:', correctAnswer, 'type:', typeof correctAnswer);
      console.log('Is correct:', isCorrect);
      console.log('Options:', options);
      console.log('Selected option text:', options[selectedOption]);
      console.log('Correct answer text:', options[correctAnswer]);

      // Save answer to database
      const response = await fetch(`/api/courses/${params.id}/questions/${questionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer: selectedOption.toString(), // Store the index as string
          isCorrect
        }),
      });

      if (response.ok) {
        setUserAnswers(prev => [...prev, { 
          questionId, 
          answer: selectedOption.toString(), 
          selectedIndex: selectedOption,
          isCorrect 
        }]);
        setAnswerSubmitted(true);
        
        // Mark lesson as complete after answering with score
        const score = isCorrect ? 100 : 0;
        await markLessonComplete(currentLesson.id, score);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const markLessonComplete = async (lessonId: string, score?: number) => {
    try {
      setSavingProgress(true);
      
      const response = await fetch(`/api/courses/${params.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          completed: true,
          score: score
        }),
      });

      if (response.ok) {
        // Update local progress state
        setProgress(prev => {
          const existing = prev.find(p => p.lessonId === lessonId);
          if (existing) {
            return prev.map(p => 
              p.lessonId === lessonId 
                ? { ...p, completed: true, completedAt: new Date().toISOString() }
                : p
            );
          } else {
            return [...prev, { lessonId, completed: true, completedAt: new Date().toISOString() }];
          }
        });
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setSavingProgress(false);
    }
  };

  const goToNextLesson = () => {
    if (course && currentLessonIndex < course.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      resetQuestionState();
    }
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      resetQuestionState();
    }
  };

  const resetQuestionState = () => {
    setSelectedAnswer(null);
    setAnswerSubmitted(false);
    setVideoError(null);
  };

  const getCurrentQuestionAnswer = () => {
    const currentQuestion = currentLesson?.questions?.[0];
    if (!currentQuestion) return null;
    
    return userAnswers.find(a => a.questionId === currentQuestion.id);
  };

  const canRetakeQuestion = () => {
    const currentAnswer = getCurrentQuestionAnswer();
    return currentAnswer && !currentAnswer.isCorrect;
  };

  const isLessonCompleted = (lessonId: string) => {
    return progress.some(p => p.lessonId === lessonId && p.completed);
  };

  const getProgressPercentage = () => {
    if (!course) return 0;
    const completedLessons = progress.filter(p => p.completed).length;
    return Math.round((completedLessons / course.lessons.length) * 100);
  };

  const checkCourseCompletion = useCallback(async () => {
    try {
      console.log('Checking course completion...');
      const response = await fetch(`/api/courses/${params.id}/completion`);
      console.log('Completion API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Completion data:', data);
        
        if (data.completed) {
          console.log('Course is completed, showing summary');
          setCompletionData(data);
          setShowCourseSummary(true);
          
          // Check if already submitted
          const submissionResponse = await fetch(`/api/courses/${params.id}/submit`);
          if (submissionResponse.ok) {
            const submissionData = await submissionResponse.json();
            setHasAlreadySubmitted(submissionData.hasSubmitted);
          }
        } else {
          console.log('Course not yet completed:', data);
        }
      } else {
        console.log('Completion API error:', response.status);
        const errorData = await response.json();
        console.log('Error details:', errorData);
      }
    } catch (error) {
      console.error('Error checking course completion:', error);
    }
  }, [params.id]);

  const handleSubmitForReview = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/courses/${params.id}/submit`, {
        method: 'POST',
      });

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
  };

  const handleRetakeCourse = async () => {
    try {
      setIsResetting(true);
      
      // Clear the completion state first
      setShowCourseSummary(false);
      setCompletionData(null);
      setCurrentLessonIndex(0);
      setProgress([]);
      setUserAnswers([]);
      
      // Reset enrollment in database to allow retaking
      const response = await fetch(`/api/courses/${params.id}/reset`, {
        method: 'POST',
      });
      
      if (response.ok) {
        console.log('Course reset successfully');
      } else {
        console.warn('Failed to reset course in database');
      }
      
      // Refetch course data
      await fetchCourseData();
    } catch (error) {
      console.error('Error resetting course:', error);
      // Still allow local reset even if API fails
      setShowCourseSummary(false);
      setCompletionData(null);
      setCurrentLessonIndex(0);
      setProgress([]);
      setUserAnswers([]);
      fetchCourseData();
    } finally {
      setIsResetting(false);
    }
  };

  // Check for course completion whenever progress changes
  useEffect(() => {
    // Don't check completion if we're resetting or already showing summary
    if (isResetting || showCourseSummary) {
      return;
    }
    
    if (course && progress.length > 0) {
      const completedLessons = progress.filter(p => p.completed).length;
      console.log(`Progress check: ${completedLessons}/${course.lessons.length} lessons completed`);
      
      if (completedLessons === course.lessons.length) {
        console.log('All lessons completed, checking course completion...');
        // All lessons completed, check if course is passed
        setTimeout(() => {
          if (!isResetting && !showCourseSummary) {
            checkCourseCompletion();
          }
        }, 1500); // Increased delay to ensure all progress is saved
      }
    }
  }, [progress, course, checkCourseCompletion, isResetting, showCourseSummary]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
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

  const currentLesson = course.lessons[currentLessonIndex];

  // Show course summary if completed
  if (showCourseSummary && completionData) {
    return (
      <CourseSummary
        courseId={completionData.courseId}
        courseTitle={completionData.courseTitle}
        finalScore={completionData.finalScore}
        passingScore={completionData.passingScore}
        totalQuestions={completionData.totalQuestions}
        correctAnswers={completionData.correctAnswers}
        passed={completionData.passed}
        timeTaken={completionData.timeTaken}
        answers={completionData.answers}
        userEmail={completionData.userEmail}
        onSubmitForReview={handleSubmitForReview}
        onRetakeCourse={handleRetakeCourse}
        isSubmitting={isSubmitting}
        hasAlreadySubmitted={hasAlreadySubmitted}
        isRetaking={isResetting}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b pt-16 sm:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{course.title}</h1>
                <p className="text-xs sm:text-sm text-gray-600">Lektion {currentLessonIndex + 1} av {course.lessons.length}</p>
              </div>
              {/* Mobile lesson list toggle */}
              <button
                onClick={() => setShowLessonList(!showLessonList)}
                className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors"
              >
                <BookOpenIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-600">Framsteg</p>
                <p className="text-base sm:text-lg font-semibold text-primary-600">{getProgressPercentage()}%</p>
              </div>
              <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Sidebar - Lesson List */}
          <div className={`lg:col-span-1 order-2 lg:order-1 ${showLessonList ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-8">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Lektioner</h2>
              <div className="space-y-2">
                {course.lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setCurrentLessonIndex(index);
                      setShowLessonList(false); // Close lesson list on mobile when lesson is selected
                    }}
                    className={`w-full text-left p-2 sm:p-3 rounded-lg transition-colors ${
                      index === currentLessonIndex
                        ? 'bg-primary-100 text-primary-900 border border-primary-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        {isLessonCompleted(lesson.id) ? (
                          <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs text-gray-500">{index + 1}</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-xs sm:text-sm truncate">{lesson.title}</p>
                          <p className="text-xs text-gray-500">{lesson.type}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
              {currentLesson && (
                <motion.div
                  key={currentLesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{currentLesson.title}</h1>
                    {isLessonCompleted(currentLesson.id) && (
                      <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Slutförd
                      </span>
                    )}
                  </div>

                  {/* Lesson Content */}
                  <div className="space-y-6">
                    {currentLesson.type === 'video' && currentLesson.videoUrl && (
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        {videoError ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <PlayIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-600">Video kunde inte laddas</p>
                              <p className="text-sm text-gray-500">{videoError}</p>
                              <button
                                onClick={() => setVideoError(null)}
                                className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
                              >
                                Försök igen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <ReactPlayer
                            url={currentLesson.videoUrl}
                            width="100%"
                            height="100%"
                            controls={true}
                            playing={false}
                            onError={(e) => setVideoError('Video kunde inte spelas upp')}
                            config={{
                              file: {
                                attributes: {
                                  controlsList: 'nodownload',
                                  onContextMenu: (e: any) => e.preventDefault()
                                }
                              }
                            }}
                          />
                        )}
                      </div>
                    )}

                    {currentLesson.type === 'image' && currentLesson.imageUrl && (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-gray-600">Bild: {currentLesson.title}</p>
                          <p className="text-sm text-gray-500">Bild URL: {currentLesson.imageUrl}</p>
                        </div>
                      </div>
                    )}

                    {currentLesson.type === 'text' && currentLesson.content && (
                      <div className="prose max-w-none">
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {currentLesson.content}
                        </div>
                      </div>
                    )}

                    {currentLesson.type === 'question' && currentLesson.questions?.[0] && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4">Fråga</h3>
                        <p className="text-blue-800 mb-3 sm:mb-4 text-sm sm:text-base">{currentLesson.questions[0]?.question}</p>
                        
                        {!answerSubmitted ? (
                          <div className="space-y-3">
                            {parseQuestionOptions(rawQuestionOptions(currentLesson.questions[0])).map((option: string, index: number) => (
                              <label key={index} className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors">
                                <input
                                  type="radio"
                                  name="answer"
                                  value={index.toString()}
                                  checked={selectedAnswer === index}
                                  onChange={(e) => setSelectedAnswer(Number(e.target.value))}
                                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 mt-0.5 flex-shrink-0"
                                />
                                <span className="text-blue-800 text-sm sm:text-base leading-relaxed">{option}</span>
                              </label>
                            ))}
                            
                            <button
                              onClick={() => {
                                const currentQuestion = currentLesson.questions?.[0];
                                if (currentQuestion && selectedAnswer !== null) {
                                  submitAnswer(currentQuestion.id, selectedAnswer);
                                }
                              }}
                              disabled={selectedAnswer === null}
                              className="mt-4 w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
                            >
                              Svara
                            </button>
                          </div>
                        ) : (
                          <div className="mt-4">
                            {(() => {
                              const currentQuestion = currentLesson.questions?.[0];
                              const userAnswer = currentQuestion ? userAnswers.find(a => a.questionId === currentQuestion.id) : null;
                              
                              if (!currentQuestion || !userAnswer) return null;
                              
                              const options = parseQuestionOptions(rawQuestionOptions(currentQuestion));
                              const correctAnswer = parseCorrectAnswerIndex(rawCorrectAnswer(currentQuestion));
                              const selectedAnswerText = options[Number(userAnswer.answer) || 0];
                              const correctAnswerText = options[correctAnswer];
                              
                              return userAnswer.isCorrect ? (
                                <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                                  <p className="text-green-800 font-medium text-sm sm:text-base">✓ Rätt svar!</p>
                                  <p className="text-green-700 text-xs sm:text-sm mt-1">
                                    Ditt svar: {selectedAnswerText}
                                  </p>
                                  <p className="text-green-700 text-xs sm:text-sm">
                                    Alternativ: Du valde alternativ {(userAnswer.selectedIndex || 0) + 1}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                                  <p className="text-red-800 font-medium text-sm sm:text-base">✗ Fel svar</p>
                                  <p className="text-red-700 text-xs sm:text-sm mt-1">
                                    Ditt svar: {selectedAnswerText}
                                  </p>
                                  <p className="text-red-700 text-xs sm:text-sm">
                                    Du valde alternativ: {(userAnswer.selectedIndex || 0) + 1}
                                  </p>
                                  <p className="text-red-700 text-xs sm:text-sm">
                                    Rätt svar: {correctAnswerText}
                                  </p>
                                  <button
                                    onClick={() => {
                                      // Remove the incorrect answer and allow retry
                                      setUserAnswers(prev => prev.filter(a => a.questionId !== currentQuestion.id));
                                      setAnswerSubmitted(false);
                                      setSelectedAnswer(null);
                                    }}
                                    className="mt-3 w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                  >
                                    Försök igen
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t space-y-3 sm:space-y-0">
                    <button
                      onClick={goToPreviousLesson}
                      disabled={currentLessonIndex === 0}
                      className="flex items-center justify-center px-4 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                      <ArrowLeftIcon className="w-4 h-4 mr-2" />
                      Föregående
                    </button>

                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
                      {!isLessonCompleted(currentLesson.id) && (
                        <button
                          onClick={() => markLessonComplete(currentLesson.id)}
                          disabled={savingProgress}
                          className="w-full sm:w-auto bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center text-sm font-medium"
                        >
                          {savingProgress ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Sparar...
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="w-4 h-4 mr-2" />
                              Markera som slutförd
                            </>
                          )}
                        </button>
                      )}

                      {currentLessonIndex === course.lessons.length - 1 ? (
                        <button
                          onClick={() => {
                            console.log('Manual completion check triggered');
                            checkCourseCompletion();
                          }}
                          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Slutför kurs
                          <CheckCircleIcon className="w-4 h-4 ml-2" />
                        </button>
                      ) : (
                        <button
                          onClick={goToNextLesson}
                          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                        >
                          Nästa
                          <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
