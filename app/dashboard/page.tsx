'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  BookOpenIcon, 
  ClockIcon, 
  CheckCircleIcon,
  PlayIcon,
  UserIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

interface EnrolledCourse {
  id: string;
  courseId: string;
  title: string;
  description: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  enrolledAt: string;
  lastAccessed?: string;
  status: 'in-progress' | 'completed' | 'not-started';
}

export default function UserDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserCourses();
  }, []);

  const fetchUserCourses = async () => {
    try {
      const response = await fetch('/api/user/courses');
      
      if (response.ok) {
        const courses = await response.json();
        setEnrolledCourses(courses);
      } else {
        console.error('Failed to fetch user courses');
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error('Error fetching user courses:', error);
      setEnrolledCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Slutförd';
      case 'in-progress':
        return 'Pågående';
      case 'not-started':
        return 'Inte påbörjad';
      default:
        return 'Okänd';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Logga in krävs</h1>
          <p className="text-gray-600 mb-8">Du måste logga in för att se din dashboard.</p>
          <a href="/auth/signin" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
            Logga in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 pt-20 sm:pt-24 lg:pt-28">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-2 sm:mb-4">
            <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mr-2 sm:mr-3" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mina Kurser</h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Välkommen tillbaka, {(session.user as any)?.name || session.user?.email}!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-4 sm:p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-gray-600">Registrerade kurser</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-4 sm:p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-gray-600">Slutförda kurser</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {enrolledCourses.filter(course => course.status === 'completed').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-4 sm:p-6"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-gray-600">Pågående kurser</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {enrolledCourses.filter(course => course.status === 'in-progress').length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Courses */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Mina Registrerade Kurser</h2>

          {enrolledCourses.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <BookOpenIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                Inga kurser ännu
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                Du har inte registrerat dig för några kurser än. Utforska vårt utbud och börja din utbildning!
              </p>
              <a href="/courses" className="inline-block bg-primary-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base">
                Utforska kurser
              </a>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {enrolledCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{course.description}</p>
                      
                      {/* Mobile-optimized metadata */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          <span>Registrerad: {new Date(course.enrolledAt).toLocaleDateString('sv-SE')}</span>
                        </div>
                        {course.lastAccessed && (
                          <div className="flex items-center">
                            <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                            <span>Senast aktiv: {new Date(course.lastAccessed).toLocaleDateString('sv-SE')}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs sm:text-sm font-medium text-gray-700">Framsteg</span>
                          <span className="text-xs sm:text-sm text-gray-500">{course.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{course.completedLessons} av {course.totalLessons} lektioner slutförda</span>
                        </div>
                      </div>
                    </div>

                    {/* Mobile-optimized action area */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start sm:ml-6 space-x-3 sm:space-x-0 sm:space-y-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-200">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                        {getStatusText(course.status)}
                      </span>
                      
                      <button 
                        onClick={() => router.push(`/courses/${course.courseId}/learn`)}
                        className="bg-primary-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center text-sm"
                      >
                        <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">{course.status === 'completed' ? 'Granska' : 'Fortsätt'}</span>
                        <span className="sm:hidden">{course.status === 'completed' ? 'Visa' : 'Öppna'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
