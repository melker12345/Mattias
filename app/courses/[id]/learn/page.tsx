'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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

interface Question {
  id: string;
  question: string;
  type: string;
  options: string;
  correctAnswer: string;
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

export default function CourseLearningPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
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

  useEffect(() => {
    if (session) {
      fetchCourseData();
    }
  }, [session, params.id]);

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

      const options = JSON.parse(currentQuestion.options);
      const correctAnswer = JSON.parse(currentQuestion.correctAnswer);
      // Ensure both are numbers for comparison
      const isCorrect = Number(selectedOption) === Number(correctAnswer);

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
        
        // Mark lesson as complete after answering
        await markLessonComplete(currentLesson.id);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const markLessonComplete = async (lessonId: string) => {
    try {
      setSavingProgress(true);
      
      const response = await fetch(`/api/courses/${params.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lessonId,
          completed: true
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

  const isLessonCompleted = (lessonId: string) => {
    return progress.some(p => p.lessonId === lessonId && p.completed);
  };

  const getProgressPercentage = () => {
    if (!course) return 0;
    const completedLessons = progress.filter(p => p.completed).length;
    return Math.round((completedLessons / course.lessons.length) * 100);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-600">Lektion {currentLessonIndex + 1} av {course.lessons.length}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Framsteg</p>
                <p className="text-lg font-semibold text-primary-600">{getProgressPercentage()}%</p>
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Lesson List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lektioner</h2>
              <div className="space-y-2">
                {course.lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLessonIndex(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      index === currentLessonIndex
                        ? 'bg-primary-100 text-primary-900 border border-primary-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {isLessonCompleted(lesson.id) ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-xs text-gray-500">{index + 1}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{lesson.title}</p>
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
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {currentLesson && (
                <motion.div
                  key={currentLesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">{currentLesson.title}</h1>
                    {isLessonCompleted(currentLesson.id) && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
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
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">Fråga</h3>
                        <p className="text-blue-800 mb-4">{currentLesson.questions[0]?.question}</p>
                        
                        {!answerSubmitted ? (
                          <div className="space-y-3">
                            {JSON.parse(currentLesson.questions[0]?.options || '[]').map((option: string, index: number) => (
                              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                                <input
                                  type="radio"
                                  name="answer"
                                  value={index.toString()}
                                  checked={selectedAnswer === index}
                                  onChange={(e) => setSelectedAnswer(Number(e.target.value))}
                                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                                />
                                <span className="text-blue-800">{option}</span>
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
                              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                              
                              const options = JSON.parse(currentQuestion.options);
                              const correctAnswer = JSON.parse(currentQuestion.correctAnswer);
                              const selectedAnswerText = options[Number(userAnswer.answer) || 0];
                              const correctAnswerText = options[correctAnswer];
                              
                              return userAnswer.isCorrect ? (
                                <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                                  <p className="text-green-800 font-medium">✓ Rätt svar!</p>
                                  <p className="text-green-700 text-sm mt-1">
                                    Ditt svar: {selectedAnswerText}
                                  </p>
                                  <p className="text-green-700 text-sm">
                                    Alternativ: Du valde alternativ {(userAnswer.selectedIndex || 0) + 1}
                                  </p>
                                </div>
                              ) : (
                                <div className="bg-red-100 border border-red-200 rounded-lg p-4">
                                  <p className="text-red-800 font-medium">✗ Fel svar</p>
                                  <p className="text-red-700 text-sm mt-1">
                                    Ditt svar: {selectedAnswerText}
                                  </p>
                                  <p className="text-red-700 text-sm">
                                    Du valde alternativ: {(userAnswer.selectedIndex || 0) + 1}
                                  </p>
                                  <p className="text-red-700 text-sm">
                                    Rätt svar: {correctAnswerText}
                                  </p>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t">
                    <button
                      onClick={goToPreviousLesson}
                      disabled={currentLessonIndex === 0}
                      className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ArrowLeftIcon className="w-4 h-4 mr-2" />
                      Föregående
                    </button>

                    <div className="flex items-center space-x-4">
                      {!isLessonCompleted(currentLesson.id) && (
                        <button
                          onClick={() => markLessonComplete(currentLesson.id)}
                          disabled={savingProgress}
                          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
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

                      <button
                        onClick={goToNextLesson}
                        disabled={currentLessonIndex === course.lessons.length - 1}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Nästa
                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                      </button>
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
