'use client';

import type { LearnQuestion, UserAnswer } from '@/lib/types/course-learn';

interface QuestionPanelProps {
  question: LearnQuestion;
  options: string[];
  selectedAnswer: number | null;
  answerSubmitted: boolean;
  userAnswer: UserAnswer | null;
  correctAnswerIndex: number;
  onSelectAnswer: (index: number) => void;
  onSubmit: () => void;
  onRetry: () => void;
}

export function QuestionPanel({
  question,
  options,
  selectedAnswer,
  answerSubmitted,
  userAnswer,
  correctAnswerIndex,
  onSelectAnswer,
  onSubmit,
  onRetry,
}: QuestionPanelProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-blue-900 mb-3 sm:mb-4">Fråga</h3>
      <p className="text-blue-800 mb-3 sm:mb-4 text-sm sm:text-base">{question.question}</p>

      {!answerSubmitted ? (
        <div className="space-y-3">
          {options.map((option, index) => (
            <label
              key={index}
              className="flex items-start space-x-3 cursor-pointer p-2 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <input
                type="radio"
                name="answer"
                value={index.toString()}
                checked={selectedAnswer === index}
                onChange={() => onSelectAnswer(index)}
                className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 mt-0.5 flex-shrink-0"
              />
              <span className="text-blue-800 text-sm sm:text-base leading-relaxed">{option}</span>
            </label>
          ))}

          <button
            onClick={onSubmit}
            disabled={selectedAnswer === null}
            className="mt-4 w-full sm:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base font-medium"
          >
            Svara
          </button>
        </div>
      ) : userAnswer ? (
        <div className="mt-4">
          {userAnswer.isCorrect ? (
            <div className="bg-green-100 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium text-sm sm:text-base">✓ Rätt svar!</p>
              <p className="text-green-700 text-xs sm:text-sm mt-1">
                Ditt svar: {options[Number(userAnswer.answer) || 0]}
              </p>
              <p className="text-green-700 text-xs sm:text-sm">
                Alternativ: Du valde alternativ {(userAnswer.selectedIndex || 0) + 1}
              </p>
            </div>
          ) : (
            <div className="bg-red-100 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium text-sm sm:text-base">✗ Fel svar</p>
              <p className="text-red-700 text-xs sm:text-sm mt-1">
                Ditt svar: {options[Number(userAnswer.answer) || 0]}
              </p>
              <p className="text-red-700 text-xs sm:text-sm">
                Du valde alternativ: {(userAnswer.selectedIndex || 0) + 1}
              </p>
              <p className="text-red-700 text-xs sm:text-sm">
                Rätt svar: {options[correctAnswerIndex]}
              </p>
              <button
                onClick={onRetry}
                className="mt-3 w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Försök igen
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}