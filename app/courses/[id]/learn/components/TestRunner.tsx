'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { LearnLesson } from '@/lib/types/course-learn';

interface TestRunnerProps {
  courseTitle: string;
  questions: LearnLesson[];
  passingScore?: number;
  parseQuestionOptions: (raw: unknown) => string[];
  rawQuestionOptions: (q: { options?: unknown } | undefined) => unknown;
  isSubmitting: boolean;
  onSubmit: (answers: { questionId: string; answer: number }[]) => void;
  onCancel: () => void;
}

export function TestRunner({
  courseTitle,
  questions,
  passingScore,
  parseQuestionOptions,
  rawQuestionOptions,
  isSubmitting,
  onSubmit,
  onCancel,
}: TestRunnerProps) {
  // Flatten each test lesson to its single question.
  const items = useMemo(
    () =>
      questions
        .map((lesson) => {
          const q = lesson.questions?.[0];
          if (!q) return null;
          return { questionId: q.id, prompt: q.question, options: parseQuestionOptions(rawQuestionOptions(q)) };
        })
        .filter((x): x is { questionId: string; prompt: string; options: string[] } => x !== null),
    [questions, parseQuestionOptions, rawQuestionOptions]
  );

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const total = items.length;
  const current = items[index];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total && total > 0;
  const progressPct = total > 0 ? Math.round(((index + 1) / total) * 100) : 0;

  const select = (optionIndex: number) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.questionId]: optionIndex }));
  };

  const handleSubmit = () => {
    if (!allAnswered || isSubmitting) return;
    if (!confirm('Skicka in provet? Du kan inte ändra dina svar efteråt utan att göra om provet.')) return;
    onSubmit(items.map((it) => ({ questionId: it.questionId, answer: answers[it.questionId] })));
  };

  if (!current) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pt-24 sm:pt-28">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-gray-500">Kunskapstest</p>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">{courseTitle}</h1>
            </div>
            <span className="text-sm font-medium text-gray-600">
              Fråga {index + 1} av {total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={current.questionId}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-5 sm:p-8"
        >
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-5">{current.prompt}</h2>

          <div className="space-y-3">
            {current.options.map((option, i) => {
              const selected = answers[current.questionId] === i;
              return (
                <button
                  key={i}
                  onClick={() => select(i)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 ${
                    selected
                      ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center ${
                      selected ? 'border-primary-600' : 'border-gray-300'
                    }`}
                  >
                    {selected && <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />}
                  </span>
                  <span className="text-gray-800">{option}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            <ChevronLeftIcon className="w-5 h-5 mr-1" />
            Föregående
          </button>

          {index < total - 1 ? (
            <button
              onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
              className="inline-flex items-center px-5 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700"
            >
              Nästa
              <ChevronRightIcon className="w-5 h-5 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className="inline-flex items-center px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Skickar in...' : 'Skicka in prov'}
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 underline">
            Avbryt provet
          </button>
          <span className={allAnswered ? 'text-green-700' : 'text-gray-500'}>
            {answeredCount} av {total} besvarade
            {!allAnswered && total > 0 && ' — svara på alla frågor för att skicka in'}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-400">Krävs för godkänt: {passingScore ?? 80}%</p>
      </div>
    </div>
  );
}
