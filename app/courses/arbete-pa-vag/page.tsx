'use client';

import { useState, useEffect } from 'react';
import { CourseCard } from '@/components/CourseCard';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  duration: number;
  category: string;
}

export default function ArbetePaVagPage() {
  const { addItem } = useCart();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockCourses: Course[] = [
      {
        id: '5',
        title: 'Vinterväghållning',
        description: 'Kurs i vinterväghållning och snöröjning. Lär dig säkra metoder för vinterarbete på vägar och hur du hanterar snö, is och kalla förhållanden.',
        price: 1295,
        duration: 90,
        category: 'arbete-pa-vag',
        image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop'
      }
    ];
    
    setCourses(mockCourses);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 sm:pt-28">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Tillbaka till startsidan
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Arbete på Väg</h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Grundläggande och avancerade kurser för säkert arbete i trafikmiljö. 
            Våra kurser följer de senaste säkerhetsstandarderna och regelverken.
          </p>
        </div>

        {/* Course Grid */}
        {courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                onAddToCart={(course) => addItem({
                  id: course.id,
                  type: 'course',
                  title: course.title,
                  price: course.price,
                  description: course.description,
                  image: course.image
                })}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Inga kurser tillgängliga
            </h3>
            <p className="text-gray-600">
              Fler kurser inom detta område kommer snart.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
