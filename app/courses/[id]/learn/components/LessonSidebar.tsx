'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import type { LearnLesson } from '@/lib/types/course-learn';

interface LessonSidebarProps {
  lessons: LearnLesson[];
  currentLessonIndex: number;
  showLessonList: boolean;
  isLessonCompleted: (lessonId: string) => boolean;
  onSelectLesson: (index: number) => void;
}

export function LessonSidebar({
  lessons,
  currentLessonIndex,
  showLessonList,
  isLessonCompleted,
  onSelectLesson,
}: LessonSidebarProps) {
  return (
    <div className={`lg:col-span-1 order-2 lg:order-1 ${showLessonList ? 'block' : 'hidden lg:block'}`}>
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:sticky lg:top-8">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Lektioner</h2>
        <div className="space-y-2">
          {lessons.map((lesson, index) => (
            <button
              key={lesson.id}
              onClick={() => onSelectLesson(index)}
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
  );
}