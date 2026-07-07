'use client';

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface LessonNavigationProps {
  currentLessonIndex: number;
  totalLessons: number;
  isCurrentLessonCompleted: boolean;
  allLessonsCompleted: boolean;
  savingProgress: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onMarkComplete: () => void;
  onFinishCourse: () => void;
}

export function LessonNavigation({
  currentLessonIndex,
  totalLessons,
  isCurrentLessonCompleted,
  allLessonsCompleted,
  savingProgress,
  onPrevious,
  onNext,
  onMarkComplete,
  onFinishCourse,
}: LessonNavigationProps) {
  const isLastLesson = currentLessonIndex === totalLessons - 1;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-6 border-t space-y-3 sm:space-y-0">
      <button
        onClick={onPrevious}
        disabled={currentLessonIndex === 0}
        className="flex items-center justify-center px-4 py-3 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Föregående
      </button>

      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
        {!isCurrentLessonCompleted && (
          <button
            onClick={onMarkComplete}
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

        {isLastLesson ? (
          <button
            onClick={onFinishCourse}
            disabled={!allLessonsCompleted}
            title={!allLessonsCompleted ? 'Markera alla avsnitt som slutförda innan du slutför kursen' : undefined}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Slutför kurs
            <CheckCircleIcon className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button
            onClick={onNext}
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
          >
            Nästa
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </button>
        )}
      </div>
    </div>
  );
}