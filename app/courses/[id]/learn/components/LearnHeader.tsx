'use client';

import { ArrowLeftIcon, BookOpenIcon } from '@heroicons/react/24/outline';

interface LearnHeaderProps {
  courseTitle: string;
  currentLessonIndex: number;
  totalLessons: number;
  progressPercentage: number;
  showLessonList: boolean;
  onBack: () => void;
  onToggleLessonList: () => void;
}

export function LearnHeader({
  courseTitle,
  currentLessonIndex,
  totalLessons,
  progressPercentage,
  showLessonList,
  onBack,
  onToggleLessonList,
}: LearnHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b pt-16 sm:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button onClick={onBack} className="text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeftIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{courseTitle}</h1>
              <p className="text-xs sm:text-sm text-gray-600">
                Lektion {currentLessonIndex + 1} av {totalLessons}
              </p>
            </div>
            <button
              onClick={onToggleLessonList}
              className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors"
              aria-label={showLessonList ? 'Dölj lektionslista' : 'Visa lektionslista'}
            >
              <BookOpenIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="text-right">
              <p className="text-xs sm:text-sm text-gray-600">Framsteg</p>
              <p className="text-base sm:text-lg font-semibold text-primary-600">{progressPercentage}%</p>
            </div>
            <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}