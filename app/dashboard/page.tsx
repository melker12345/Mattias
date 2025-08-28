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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <UserIcon className="w-8 h-8 text-primary-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Mina Kurser</h1>
          </div>
          <p className="text-gray-600">
            Välkommen tillbaka, {(session.user as any)?.name || session.user?.email}!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <BookOpenIcon className="w-8 h-8 text-primary-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Registrerade kurser</p>
                <p className="text-2xl font-bold text-gray-900">{enrolledCourses.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Slutförda kurser</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrolledCourses.filter(course => course.status === 'completed').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-6"
          >
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Pågående kurser</p>
                <p className="text-2xl font-bold text-gray-900">
                  {enrolledCourses.filter(course => course.status === 'in-progress').length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Courses */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Mina Registrerade Kurser</h2>

          {enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Inga kurser ännu
              </h3>
              <p className="text-gray-600 mb-6">
                Du har inte registrerat dig för några kurser än. Utforska vårt utbud och börja din utbildning!
              </p>
              <a href="/courses" className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors">
                Utforska kurser
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {enrolledCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{course.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          <span>Registrerad: {new Date(course.enrolledAt).toLocaleDateString('sv-SE')}</span>
                        </div>
                        {course.lastAccessed && (
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            <span>Senast aktiv: {new Date(course.lastAccessed).toLocaleDateString('sv-SE')}</span>
                          </div>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Framsteg</span>
                          <span className="text-sm text-gray-500">{course.progress}%</span>
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

                    <div className="ml-6 flex flex-col items-end space-y-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(course.status)}`}>
                        {getStatusText(course.status)}
                      </span>
                      
                      <button 
                        onClick={() => router.push(`/courses/${course.courseId}/learn`)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                      >
                        <PlayIcon className="w-4 h-4 mr-2" />
                        {course.status === 'completed' ? 'Granska' : 'Fortsätt'}
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
