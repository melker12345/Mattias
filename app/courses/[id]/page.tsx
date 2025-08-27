'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { 
  ClockIcon, 
  UserIcon, 
  PlayIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  image?: string;
  isPublished: boolean;
  enrolledUsers: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
}

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const { addItem } = useCart();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
  }, [params.id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/courses/${params.id}`);
      
      if (response.ok) {
        const courseData = await response.json();
        setCourse(courseData);
      } else {
        console.error('Failed to fetch course details');
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (course) {
      addItem({
        id: course.id,
        title: course.title,
        price: course.price,
        type: 'course',
        description: course.description,
        image: course.image
      });
    }
  };

  const handleEnroll = async () => {
    if (!session) {
      // Redirect to login
      window.location.href = '/auth/signin';
      return;
    }

    setEnrolling(true);
    try {
      const response = await fetch(`/api/courses/${params.id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setEnrolled(true);
      } else {
        console.error('Failed to enroll in course');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
    } finally {
      setEnrolling(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Kurs hittades inte</h1>
          <p className="text-gray-600 mb-8">Kursen du letar efter finns inte eller har tagits bort.</p>
          <Link href="/courses" className="btn-primary">
            Tillbaka till kurser
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/courses"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Tillbaka till kurser
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              {/* Course Image */}
              <div className="relative h-64 md:h-80">
                <Image
                  src={course.image || '/images/course-placeholder.jpg'}
                  alt={course.title}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Course Info */}
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {course.title}
                </h1>
                
                <div className="flex items-center space-x-6 mb-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 mr-2" />
                    {formatDuration(course.duration)}
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="w-5 h-5 mr-2" />
                    {course.enrolledUsers} registrerade
                  </div>
                  <div className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                    {course.category}
                  </div>
                </div>

                <div className="prose max-w-none mb-8">
                  <p className="text-gray-700 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Course Content */}
                {course.lessons && course.lessons.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                      Kursinnehåll
                    </h2>
                    <div className="space-y-3">
                      {course.lessons.map((lesson, index) => (
                        <div
                          key={lesson.id}
                          className="flex items-center p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium mr-4">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {lesson.title}
                            </h3>
                            {lesson.videoUrl && (
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <PlayIcon className="w-4 h-4 mr-1" />
                                Video
                              </div>
                            )}
                          </div>
                          <CheckCircleIcon className="w-5 h-5 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-sm p-6 sticky top-8"
            >
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {formatPrice(course.price)}
                </div>
                <p className="text-gray-600">
                  {course.price === 0 ? 'Gratis kurs' : 'Engångsbetalning'}
                </p>
              </div>

              <div className="space-y-4">
                {enrolled ? (
                  <button
                    disabled
                    className="w-full bg-green-100 text-green-800 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                  >
                    Du är redan registrerad
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full btn-primary py-3"
                    >
                      {enrolling ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Registrerar...
                        </>
                      ) : (
                        'Registrera dig för kursen'
                      )}
                    </button>
                    
                    <button
                      onClick={handleAddToCart}
                      className="w-full btn-secondary py-3"
                    >
                      Lägg till i kundvagn
                    </button>
                  </>
                )}
              </div>

              {/* Course Features */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Vad du får</h3>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                    Tillgång till alla kurslektioner
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                    Certifikat vid slutförande
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                    Livstidsåtkomst
                  </li>
                  <li className="flex items-center text-sm text-gray-600">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
                    Mobilkompatibel
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
