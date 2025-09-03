'use client';

import { useState } from 'react';
import { 
  XMarkIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface Answer {
  questionId: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  options: string[];
  selectedIndex: number;
  correctAnswerText: string;
  userAnswerText: string;
}

interface APVSubmission {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
    personalNumber?: string;
  };
  course: {
    id: string;
    title: string;
    category: string;
  };
  courseTitle: string;
  completionDate: string;
  finalScore: number;
  passingScore: number;
  totalQuestions: number;
  correctAnswers: number;
  timeTaken?: number;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  answersData: Answer[];
}

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: APVSubmission | null;
  onUpdateStatus: (submissionId: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string) => void;
}

export default function SubmissionModal({
  isOpen,
  onClose,
  submission,
  onUpdateStatus
}: SubmissionModalProps) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!submission) return null;

  const handleApprove = async () => {
    setIsUpdating(true);
    await onUpdateStatus(submission.id, 'APPROVED', reviewNotes);
    setIsUpdating(false);
    setReviewNotes('');
  };

  const handleReject = async () => {
    setIsUpdating(true);
    await onUpdateStatus(submission.id, 'REJECTED', reviewNotes);
    setIsUpdating(false);
    setReviewNotes('');
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minuter`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity duration-300 bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div
          className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all duration-300 transform bg-white shadow-xl rounded-lg"
          onClick={(e) => e.stopPropagation()}
        >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  APV Submission - {submission.courseTitle}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <UserIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Användarinformation</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Namn:</span>
                        <span className="ml-2 text-gray-900">{submission.user.name || 'Ej angivet'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">E-post:</span>
                        <span className="ml-2 text-gray-900">{submission.user.email}</span>
                      </div>
                      {submission.user.personalNumber && (
                        <div>
                          <span className="text-gray-500">Personnummer:</span>
                          <span className="ml-2 text-gray-900">{submission.user.personalNumber}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Inskickad:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(submission.submittedAt).toLocaleDateString('sv-SE')} {' '}
                          {new Date(submission.submittedAt).toLocaleTimeString('sv-SE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Results */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <AcademicCapIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Kursresultat</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Slutpoäng:</span>
                        <span className="ml-2 text-gray-900 font-medium">{submission.finalScore}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Rätta svar:</span>
                        <span className="ml-2 text-gray-900">
                          {submission.correctAnswers}/{submission.totalQuestions}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Krävs för godkänt:</span>
                        <span className="ml-2 text-gray-900">{submission.passingScore}%</span>
                      </div>
                      {submission.timeTaken && (
                        <div>
                          <span className="text-gray-500">Tid:</span>
                          <span className="ml-2 text-gray-900">{formatTime(submission.timeTaken)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Slutförd:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(submission.completionDate).toLocaleDateString('sv-SE')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Kategori:</span>
                        <span className="ml-2 text-gray-900">{submission.course.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Answers */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Detaljerade svar</h4>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {submission.answersData.map((answer, index) => (
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
                          <h5 className="font-medium text-gray-900 mb-2">
                            Fråga {index + 1}: {answer.question}
                          </h5>
                          
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Användarens svar: </span>
                              <span className={answer.isCorrect ? 'text-green-700' : 'text-red-700'}>
                                {answer.userAnswerText} (Alternativ {answer.selectedIndex + 1})
                              </span>
                            </div>
                            
                            {!answer.isCorrect && (
                              <div>
                                <span className="font-medium text-gray-700">Rätt svar: </span>
                                <span className="text-green-700">
                                  {answer.correctAnswerText} (Alternativ {parseInt(answer.correctAnswer) + 1})
                                </span>
                              </div>
                            )}

                            <div className="mt-2">
                              <span className="font-medium text-gray-700">Alla alternativ:</span>
                              <ul className="mt-1 ml-4 list-disc list-inside text-gray-600">
                                {answer.options.map((option, optionIndex) => (
                                  <li 
                                    key={optionIndex}
                                    className={`${
                                      optionIndex === parseInt(answer.correctAnswer) 
                                        ? 'text-green-700 font-medium' 
                                        : optionIndex === answer.selectedIndex && !answer.isCorrect
                                        ? 'text-red-700'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {option}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Notes */}
              {submission.status === 'PENDING' && (
                <div className="mb-6">
                  <label htmlFor="reviewNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Granskningsanteckningar (valfritt)
                  </label>
                  <textarea
                    id="reviewNotes"
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Lägg till kommentarer om granskningen..."
                  />
                </div>
              )}

              {/* Existing Review Info */}
              {submission.status !== 'PENDING' && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Granskningsinformation</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2 text-gray-900">{
                        submission.status === 'APPROVED' ? 'Godkänd' : 
                        submission.status === 'REJECTED' ? 'Avvisad' : submission.status
                      }</span>
                    </div>
                    {submission.reviewedAt && (
                      <div>
                        <span className="text-gray-500">Granskad:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(submission.reviewedAt).toLocaleDateString('sv-SE')} {' '}
                          {new Date(submission.reviewedAt).toLocaleTimeString('sv-SE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    )}
                    {submission.reviewedBy && (
                      <div>
                        <span className="text-gray-500">Granskad av:</span>
                        <span className="ml-2 text-gray-900">{submission.reviewedBy}</span>
                      </div>
                    )}
                    {submission.reviewNotes && (
                      <div>
                        <span className="text-gray-500">Anteckningar:</span>
                        <p className="ml-2 text-gray-900 mt-1">{submission.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Stäng
                </button>
                
                {submission.status === 'PENDING' && (
                  <>
                    <button
                      onClick={handleReject}
                      disabled={isUpdating}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Uppdaterar...' : 'Avvisa'}
                    </button>
                    
                    <button
                      onClick={handleApprove}
                      disabled={isUpdating}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdating ? 'Uppdaterar...' : 'Godkänn'}
                    </button>
                  </>
                )}
              </div>
        </div>
      </div>
    </div>
  );
}
