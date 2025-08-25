'use client'

import { useState, useEffect } from 'react'
import { CourseCard } from '@/components/CourseCard'

interface Course {
  id: string
  title: string
  description: string
  price: number
  image?: string
  duration: number
  category: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')


  const categories = [
    { id: 'all', name: 'Alla kategorier' },
    { id: 'arbete-pa-vag', name: 'Arbete på Väg' },
    { id: 'sakerhet-miljo', name: 'Säkerhet & Miljö' },
    { id: 'kompetensutveckling', name: 'Kompetensutveckling' },
  ]



  useEffect(() => {
    // Simulate fetching courses from API
    const fetchCourses = async () => {
      try {
        // Mock data - replace with actual API call
        const mockCourses: Course[] = [
          {
            id: '1',
            title: 'APV Grundkurs - Säkerhet på byggarbetsplatsen',
            description: 'En grundläggande kurs om säkerhet på byggarbetsplatser enligt APV-regelverket. Kursen täcker de viktigaste säkerhetsaspekterna och ger dig kunskap om hur du arbetar säkert i byggbranschen.',
            price: 995,
            duration: 120,
            category: 'sakerhet-miljo',
            image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop'
          },
          {
            id: '2',
            title: 'Säkerhet i Byggbranschen',
            description: 'Komplett kurs om säkerhet och arbetsmiljö inom byggbranschen. Lär dig identifiera och hantera risker, förstå säkerhetsregler och skapa en säker arbetsmiljö.',
            price: 1995,
            duration: 180,
            category: 'sakerhet-miljo',
            image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop'
          },
          {
            id: '3',
            title: 'Projektledning för Byggprojekt',
            description: 'Avancerad kurs i projektledning specifikt anpassad för byggprojekt. Perfekt för dig som vill utveckla din karriär och lära dig leda komplexa byggprojekt effektivt.',
            price: 2995,
            duration: 240,
            category: 'kompetensutveckling',
            image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop'
          },
          {
            id: '4',
            title: 'ADR - Farligt Gods Transport',
            description: 'Specialiserad kurs för transport av farligt gods enligt ADR-reglementet. Krävs för många transportjobb och ger dig kunskap om säker hantering av farliga ämnen.',
            price: 1795,
            duration: 150,
            category: 'sakerhet-miljo',
            image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop'
          },
          {
            id: '5',
            title: 'Vinterväghållning',
            description: 'Kurs i vinterväghållning och snöröjning. Lär dig säkra metoder för vinterarbete på vägar och hur du hanterar snö, is och kalla förhållanden.',
            price: 1295,
            duration: 90,
            category: 'arbete-pa-vag',
            image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop'
          },
          {
            id: '6',
            title: 'Ledarskap i Byggbranschen',
            description: 'Utveckla dina ledarskapsförmågor för byggbranschen. Praktiska verktyg och metoder för effektiv ledning av byggteam och projekt.',
            price: 3495,
            duration: 300,
            category: 'kompetensutveckling',
            image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400&h=300&fit=crop'
          }
        ]
        
        setCourses(mockCourses)
        setFilteredCourses(mockCourses)
      } catch (error) {
        console.error('Error fetching courses:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  useEffect(() => {
    let filtered = courses

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === selectedCategory)
    }

    setFilteredCourses(filtered)
  }, [courses, searchTerm, selectedCategory])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar kurser...</p>
        </div>
      </div>
    )
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
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Sök efter kursnamn eller beskrivning..."
                  className="input-field"
                />
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Kategori
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                  }}
                  className="w-full btn-secondary"
                >
                  Rensa filter
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-8">
          <p className="text-gray-600">
            Visar {filteredCourses.length} av {courses.length} kurser
          </p>
        </div>

        {/* Course Grid */}
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
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
              Inga kurser hittades
            </h3>
            <p className="text-gray-600">
              Prova att ändra dina sökfilter eller kontakta oss för hjälp.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
