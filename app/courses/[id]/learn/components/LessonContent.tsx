'use client';

import type React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { PlayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { LearnLesson, UserAnswer } from '@/lib/types/course-learn';
import { QuestionPanel } from './QuestionPanel';

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });

interface LessonContentProps {
  lesson: LearnLesson;
  isCompleted: boolean;
  videoError: string | null;
  selectedAnswer: number | null;
  answerSubmitted: boolean;
  userAnswer: UserAnswer | null;
  parseQuestionOptions: (raw: unknown) => string[];
  rawQuestionOptions: (q: { options?: unknown } | undefined) => unknown;
  rawCorrectAnswer: (q: { correctAnswer?: unknown; correct_answer?: unknown } | undefined) => unknown;
  parseCorrectAnswerIndex: (raw: unknown) => number;
  onVideoError: (message: string) => void;
  onClearVideoError: () => void;
  onSelectAnswer: (index: number) => void;
  onSubmitAnswer: () => void;
  onRetryQuestion: () => void;
}

export function LessonContent({
  lesson,
  isCompleted,
  videoError,
  selectedAnswer,
  answerSubmitted,
  userAnswer,
  parseQuestionOptions,
  rawQuestionOptions,
  rawCorrectAnswer,
  parseCorrectAnswerIndex,
  onVideoError,
  onClearVideoError,
  onSelectAnswer,
  onSubmitAnswer,
  onRetryQuestion,
}: LessonContentProps) {
  const question = lesson.questions?.[0];

  return (
    <motion.div
      key={lesson.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{lesson.title}</h1>
        {isCompleted && (
          <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            Slutförd
          </span>
        )}
      </div>

      <div className="space-y-6">
        {lesson.type === 'video' && lesson.videoUrl && (
          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
            {videoError ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <PlayIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Video kunde inte laddas</p>
                  <p className="text-sm text-gray-500">{videoError}</p>
                  <button
                    onClick={onClearVideoError}
                    className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
                  >
                    Försök igen
                  </button>
                </div>
              </div>
            ) : (
              <ReactPlayer
                url={lesson.videoUrl}
                width="100%"
                height="100%"
                controls
                playing={false}
                onError={() => onVideoError('Video kunde inte spelas upp')}
                config={{
                  file: {
                    attributes: {
                      controlsList: 'nodownload',
                      onContextMenu: (e: React.SyntheticEvent) => e.preventDefault(),
                    },
                  },
                }}
              />
            )}
          </div>
        )}

        {lesson.type === 'image' && lesson.imageUrl && (
          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600">Bild: {lesson.title}</p>
              <p className="text-sm text-gray-500">Bild URL: {lesson.imageUrl}</p>
            </div>
          </div>
        )}

        {lesson.type === 'text' && lesson.content && (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{lesson.content}</div>
          </div>
        )}

        {lesson.type === 'question' && question && (
          <QuestionPanel
            question={question}
            options={parseQuestionOptions(rawQuestionOptions(question))}
            selectedAnswer={selectedAnswer}
            answerSubmitted={answerSubmitted}
            userAnswer={userAnswer}
            correctAnswerIndex={parseCorrectAnswerIndex(rawCorrectAnswer(question))}
            onSelectAnswer={onSelectAnswer}
            onSubmit={onSubmitAnswer}
            onRetry={onRetryQuestion}
          />
        )}
      </div>
    </motion.div>
  );
}