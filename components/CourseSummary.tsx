'use client';

import { useState } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  TrophyIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Answer {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  options: string[];
  selectedIndex: number;
}

interface CourseSummaryProps {
  courseId: string;
  courseTitle: string;
  finalScore: number;
  passingScore: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  timeTaken?: number; // in minutes
  answers: Answer[];
  userEmail: string;
  onSubmitForReview: () => void;
  onRetakeCourse: () => void;
  isSubmitting: boolean;
  hasAlreadySubmitted: boolean;
  isRetaking?: boolean;
}

export default function CourseSummary({
  courseId,
  courseTitle,
  finalScore,
  passingScore,
  totalQuestions,
  correctAnswers,
  passed,
  timeTaken,
  answers,
  userEmail,
  onSubmitForReview,
  onRetakeCourse,
  isSubmitting,
  hasAlreadySubmitted,
  isRetaking = false
}: CourseSummaryProps) {
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minuter`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 pt-24 sm:pt-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`px-6 py-8 text-center ${passed ? 'bg-green-50' : 'bg-red-50'}`}>
            <div className="flex justify-center mb-4">
              {passed ? (
                <TrophyIcon className="w-16 h-16 text-green-600" />
              ) : (
                <XCircleIcon className="w-16 h-16 text-red-600" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {passed ? 'Grattis! Du har klarat kursen!' : 'Kursen inte klarad'}
            </h1>
            <p className="text-lg text-gray-600 mb-4">{courseTitle}</p>
            
            {/* Score Display */}
            <div className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold ${
              passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {finalScore}% ({correctAnswers}/{totalQuestions} rätt)
            </div>
            
            <p className="text-sm text-gray-600 mt-2">
              Krävs för godkänt: {passingScore}%
            </p>
          </div>

          {/* Stats */}
          <div className="px-6 py-6 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2">
                  <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{correctAnswers}</p>
                <p className="text-sm text-gray-600">Rätta svar</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg mx-auto mb-2">
                  <XCircleIcon className="w-6 h-6 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{totalQuestions - correctAnswers}</p>
                <p className="text-sm text-gray-600">Fel svar</p>
              </div>
              
              {timeTaken && (
                <div className="text-center">
                  <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mx-auto mb-2">
                    <ClockIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatTime(timeTaken)}</p>
                  <p className="text-sm text-gray-600">Total tid</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-6">
            {passed ? (
              <div className="space-y-4">
                {hasAlreadySubmitted ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <p className="text-blue-800 font-medium">
                        Du har redan skickat in denna kurs för granskning.
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={onSubmitForReview}
                    disabled={isSubmitting}
                    className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Skickar in för granskning...
                      </>
                    ) : (
                      <>
                        <DocumentTextIcon className="w-5 h-5 mr-2" />
                        Skicka in för granskning
                      </>
                    )}
                  </button>
                )}
                
                <p className="text-sm text-gray-600 text-center">
                  Genom att skicka in för granskning kommer dina svar och resultat att granskas av en administratör.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={onRetakeCourse}
                  disabled={isRetaking}
                  className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center font-medium"
                >
                  {isRetaking ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Återställer kursen...
                    </>
                  ) : (
                    <>
                      <ArrowPathIcon className="w-5 h-5 mr-2" />
                      Gör om kursen
                    </>
                  )}
                </button>
                
                <p className="text-sm text-gray-600 text-center">
                  Du behöver minst {passingScore}% för att klara kursen. Försök igen!
                </p>
              </div>
            )}
          </div>

          {/* Detailed Results Toggle */}
          <div className="border-t px-6 py-4">
            <button
              onClick={() => setShowDetailedResults(!showDetailedResults)}
              className="w-full text-left text-primary-600 hover:text-primary-700 font-medium flex items-center justify-between"
            >
              <span>Visa detaljerade resultat</span>
              <div className={`transition-transform duration-200 ${showDetailedResults ? 'rotate-180' : 'rotate-0'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Detailed Results */}
          {showDetailedResults && (
            <div className="border-t bg-gray-50 transition-all duration-300">
              <div className="px-6 py-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alla dina svar</h3>
                
                {answers.map((answer, index) => (
                  <div
                    key={answer.questionId}
                    className={`p-4 rounded-lg border ${
                      answer.isCorrect 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 mt-1">
                        {answer.isCorrect ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Fråga {index + 1}: {answer.question}
                        </h4>
                        
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Ditt svar: </span>
                            <span className={answer.isCorrect ? 'text-green-700' : 'text-red-700'}>
                              {answer.options[answer.selectedIndex]} (Alternativ {answer.selectedIndex + 1})
                            </span>
                          </div>
                          
                          {!answer.isCorrect && (
                            <div>
                              <span className="font-medium text-gray-700">Rätt svar: </span>
                              <span className="text-green-700">
                                {answer.options[parseInt(answer.correctAnswer)]} (Alternativ {parseInt(answer.correctAnswer) + 1})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
