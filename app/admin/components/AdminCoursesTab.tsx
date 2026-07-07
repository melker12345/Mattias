'use client';

import { motion } from 'framer-motion';
import { BookOpenIcon, PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import type { AdminCourse } from '@/lib/types/admin';
import { formatDate, formatPrice, getStatusColor } from '@/lib/types/admin';

interface AdminCoursesTabProps {
  courses: AdminCourse[];
  onCreateCourse: () => void;
  onEditCourse: (course: AdminCourse) => void;
  onEditCourseContent: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
}

export function AdminCoursesTab({
  courses,
  onCreateCourse,
  onEditCourse,
  onEditCourseContent,
  onDeleteCourse,
}: AdminCoursesTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Kurser</h2>
        <button
          onClick={onCreateCourse}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center justify-center text-sm font-medium w-full sm:w-auto"
        >
          <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          <span className="hidden sm:inline">Skapa Ny Kurs</span>
          <span className="sm:hidden">Ny Kurs</span>
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Inga kurser</h3>
          <p className="mt-1 text-sm text-gray-500">Börja med att skapa din första kurs.</p>
          <div className="mt-6">
            <button onClick={onCreateCourse} className="btn-primary inline-flex items-center">
              <PlusIcon className="w-5 h-5 mr-2" />
              Skapa Kurs
            </button>
          </div>
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900">{course.title}</div>
                  <div className="text-xs text-gray-500">{formatPrice(course.price)} · {course.enrolledUsers} registrerade</div>
                </div>
                <span className={`shrink-0 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                  {course.isPublished ? 'Publicerad' : 'Utkast'}
                </span>
              </div>
              <div className="flex justify-end gap-3 pt-1 border-t border-gray-100">
                <button onClick={() => onEditCourse(course)} className="text-primary-600 inline-flex items-center gap-1 text-sm" title="Redigera kursinfo">
                  <PencilIcon className="h-4 w-4" /> Info
                </button>
                <button onClick={() => onEditCourseContent(course.id)} className="text-blue-600 inline-flex items-center gap-1 text-sm" title="Redigera innehåll">
                  <DocumentTextIcon className="h-4 w-4" /> Innehåll
                </button>
                <button onClick={() => onDeleteCourse(course.id)} className="text-red-600 inline-flex items-center gap-1 text-sm" title="Ta bort kurs">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kurs</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pris</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registrerade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skapad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Åtgärder</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{course.title}</div>
                      <div className="text-sm text-gray-500">{course.description.substring(0, 60)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPrice(course.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.enrolledUsers}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                      {course.isPublished ? 'Publicerad' : 'Utkast'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(course.createdAt)}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-1 sm:space-x-2">
                      <button onClick={() => onEditCourse(course)} className="text-primary-600 hover:text-primary-900" title="Redigera kursinfo">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => onEditCourseContent(course.id)} className="text-blue-600 hover:text-blue-900" title="Redigera innehåll">
                        <DocumentTextIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDeleteCourse(course.id)} className="text-red-600 hover:text-red-900" title="Ta bort kurs">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </motion.div>
  );
}