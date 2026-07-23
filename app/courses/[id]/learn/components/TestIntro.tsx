'use client';

import { motion } from 'framer-motion';
import { AcademicCapIcon, CheckCircleIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

interface TestIntroProps {
  title: string;
  instructions?: string;
  questionCount: number;
  passingScore?: number;
  contentComplete: boolean;
  testCompleted: boolean;
  isBusy: boolean;
  onStart: () => void;
  onViewResults: () => void;
  onRetake: () => void;
}

export function TestIntro({
  title,
  instructions,
  questionCount,
  passingScore,
  contentComplete,
  testCompleted,
  isBusy,
  onStart,
  onViewResults,
  onRetake,
}: TestIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-6 sm:py-10"
    >
      <div className="mx-auto w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mb-5">
        <AcademicCapIcon className="w-9 h-9" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{title || 'Kunskapstest'}</h1>
      <p className="text-gray-600 mb-6">Det här är kursens prov. Ditt resultat avgör om du blir godkänd.</p>

      {instructions && (
        <div className="max-w-xl mx-auto text-left bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{instructions}</p>
        </div>
      )}

      <div className="max-w-md mx-auto grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg py-4">
          <p className="text-2xl font-bold text-gray-900">{questionCount}</p>
          <p className="text-sm text-gray-600">Frågor</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg py-4">
          <p className="text-2xl font-bold text-gray-900">{passingScore ?? 80}%</p>
          <p className="text-sm text-gray-600">Krävs för godkänt</p>
        </div>
      </div>

      {testCompleted ? (
        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-center text-green-700 text-sm mb-1">
            <CheckCircleIcon className="w-5 h-5 mr-2" />
            Du har redan gjort provet.
          </div>
          <button
            onClick={onViewResults}
            className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Visa resultat
          </button>
          <button
            onClick={onRetake}
            disabled={isBusy}
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-medium"
          >
            Gör om provet
          </button>
        </div>
      ) : (
        <div className="space-y-3 max-w-md mx-auto">
          {!contentComplete && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
              Tips: gå igenom allt kursinnehåll innan du startar provet.
            </p>
          )}
          <button
            onClick={onStart}
            disabled={isBusy || questionCount === 0}
            className="w-full inline-flex items-center justify-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
          >
            <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2" />
            Starta provet
          </button>
          <p className="text-xs text-gray-500">
            Under provet får du inte se om dina svar är rätt förrän du skickat in.
          </p>
        </div>
      )}
    </motion.div>
  );
}
