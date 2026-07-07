'use client';

import { motion } from 'framer-motion';
import {
  BookOpenIcon,
  UsersIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import type { AdminCourse, AdminUser } from '@/lib/types/admin';
import { formatDate, formatPrice, getRoleColor, getStatusColor } from '@/lib/types/admin';

interface AdminOverviewTabProps {
  courses: AdminCourse[];
  users: AdminUser[];
  totalCompanies: number;
  onGiftCourse: () => void;
  onCreateCourse: () => void;
}

export function AdminOverviewTab({
  courses,
  users,
  totalCompanies,
  onGiftCourse,
  onCreateCourse,
}: AdminOverviewTabProps) {
  // Revenue excludes paywall-exempt test-account enrollments.
  const totalRevenue = courses.reduce(
    (sum, course) => sum + course.price * (course.payingEnrolledUsers ?? course.enrolledUsers),
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Plattform Översikt</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-blue-50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <BookOpenIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-blue-600">Totalt Kurser</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-900">{courses.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <UsersIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-green-600">Totalt Användare</p>
              <p className="text-xl sm:text-2xl font-bold text-green-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-purple-600">Företag</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-900">{totalCompanies}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 sm:p-6">
          <div className="flex items-center">
            <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-yellow-600">Total Intäkt</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-900">{formatPrice(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={onGiftCourse}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
          Ge bort kurs
        </button>

        <button
          onClick={onCreateCourse}
          className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Skapa kurs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Senaste Kurser</h3>
          <div className="space-y-3">
            {courses.slice(0, 5).map((course) => (
              <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{course.title}</p>
                  <p className="text-sm text-gray-600">{formatDate(course.createdAt)}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                  {course.isPublished ? 'Publicerad' : 'Utkast'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Senaste Användare</h3>
          <div className="space-y-3">
            {users.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}