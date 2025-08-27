'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { CourseCard } from '@/components/CourseCard';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string;
  duration: number;
  category: string;
  enrolledUsers: number;
}

export default function CoursesPage() {
  const { addItem } = useCart();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Alla kategorier' },
    { id: 'arbete-pa-vag', name: 'Arbete på Väg' },
    { id: 'sakerhet-miljo', name: 'Säkerhet & Miljö' },
    { id: 'kompetensutveckling', name: 'Kompetensutveckling' },
  ];

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      
      if (response.ok) {
        const coursesData = await response.json();
        setCourses(coursesData);
        setFilteredCourses(coursesData);
      } else {
        console.error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = courses;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  }, [courses, selectedCategory, searchTerm]);

  const handleAddToCart = (course: Course) => {
    addItem({
      id: course.id,
      title: course.title,
      price: course.price,
      type: 'course',
      description: course.description,
      image: course.image
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Våra Kurser
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Utforska vårt utbud av professionella onlinekurser inom säkerhet, 
            arbete på väg och kompetensutveckling
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Sök kurser
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Sök efter kursnamn eller beskrivning..."
                    className="input-field pl-10"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="input-field pl-10"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Rensa filter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Visar {filteredCourses.length} av {courses.length} kurser
          </p>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inga kurser hittades</h3>
            <p className="text-gray-600 mb-4">
              Prova att ändra dina sökfilter eller kontakta oss om du letar efter något specifikt.
            </p>
            <button
              onClick={clearFilters}
              className="btn-primary"
            >
              Rensa alla filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CourseCard
                  course={course}
                  onAddToCart={() => handleAddToCart(course)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
