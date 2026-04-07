'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';
import { MagnifyingGlassIcon, FunnelIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-cover bg-center bg-no-repeat text-white overflow-hidden" style={{
        background: `
          linear-gradient(135deg, #0c283b 0%, #1a3a4f 25%, #27404f 50%, #20313e 75%, #19222d 100%),
          radial-gradient(circle at 20% 80%, rgba(249, 115, 22, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(34, 197, 94, 0.3) 0%, transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(245, 158, 11, 0.2) 0%, transparent 50%),
          linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%),
          linear-gradient(-45deg, transparent 30%, rgba(255, 255, 255, 0.05) 50%, transparent 70%)
        `,
        backgroundSize: '100% 100%, 60% 60%, 60% 60%, 40% 40%, 200% 200%, 200% 200%',
        backgroundPosition: 'center, center, center, center, 0% 0%, 100% 100%'
      }}>
        {/* Animated geometric overlay */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
            <div className="absolute top-10 left-10 w-16 h-16 sm:w-32 sm:h-32 border border-white/20 rounded-full"></div>
            <div className="absolute top-20 right-20 w-12 h-12 sm:w-24 sm:h-24 border border-white/15 rounded-full"></div>
            <div className="absolute bottom-20 left-1/4 w-20 h-20 sm:w-40 sm:h-40 border border-white/10 rounded-full"></div>
            <div className="absolute bottom-10 right-1/3 w-8 h-8 sm:w-16 sm:h-16 border border-white/25 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 sm:w-20 sm:h-20 border border-white/20 rotate-45"></div>
          </div>
        </div>
        
        {/* Enhanced decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-20 h-20 sm:w-40 sm:h-40 bg-accent-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-30 h-30 sm:w-60 sm:h-60 bg-success-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 sm:w-32 sm:h-32 bg-warning-500/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/3 right-1/3 w-12 h-12 sm:w-24 sm:h-24 bg-primary-500/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
        </div>
        
        <div className="relative z-10">
          <div className="mn-container py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="text-center px-4 sm:px-0 sm:mt-8">
             
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-6 sm:mb-6 md:mb-8"
              >
                <AcademicCapIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-accent-400" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold font-montserrat leading-tight">
                  Kurser
                </h1>
              </motion.div>
              
              <motion.p 
                className="text-lg sm:text-xl md:text-2xl mb-10 sm:my-16 md:mb-12 max-w-4xl mx-auto text-white font-open-sans leading-relaxed px-4 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Utforska våra <span className="text-accent-300 font-semibold">certifierade kurser</span> inom säkerhet, arbete på väg och kompetensutveckling. Alla kurser ger dig officiella certifikat.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center mb-8 sm:mb-12 md:mb-16 px-4 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <a href="#courses-grid" className="group bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 font-semibold py-3 sm:py-4 px-6 sm:px-10 rounded-xl transition-all duration-300 font-open-sans shadow-medium hover:shadow-strong transform hover:scale-105 border border-accent-400/30 text-sm sm:text-base">
                  <span className="flex items-center justify-center">
                    Utforska kurser
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </a>
                <a href="/company-account" className="group bg-white/20 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white hover:text-primary-700 font-semibold py-3 sm:py-4 px-6 sm:px-10 rounded-xl transition-all duration-300 font-open-sans hover:shadow-medium transform hover:scale-105 text-sm sm:text-base">
                  <span className="flex items-center justify-center">
                    Företagskonto
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="mn-container py-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sök kurser..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {(searchTerm || selectedCategory !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Rensa filter
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div id="courses-grid" className="mn-container py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-6 bg-gray-200 rounded w-1/4" />
                    <div className="h-10 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Inga kurser hittades</h3>
            <p className="text-gray-600 mb-4">Prova att ändra dina sökfilter</p>
            <button
              onClick={clearFilters}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Rensa filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
