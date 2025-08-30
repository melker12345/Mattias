import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'

interface CourseCardProps {
  course: {
    id: string
    title: string
    description: string
    price: number
    image?: string | null
    duration: number
    category: string
  }
  onAddToCart?: (course: any) => void
}

export function CourseCard({ course, onAddToCart }: CourseCardProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'säkerhet':
        return 'bg-success-100 text-success-700 border-success-200'
      case 'arbete på väg':
        return 'bg-warning-100 text-warning-700 border-warning-200'
      case 'kompetensutveckling':
        return 'bg-accent-100 text-accent-700 border-accent-200'
      default:
        return 'bg-primary-100 text-primary-700 border-primary-200'
    }
  }

  return (
    <div className="group bg-white rounded-2xl shadow-soft hover:shadow-strong transition-all duration-300 h-full flex flex-col overflow-hidden border border-gray-100 hover:border-primary-200 transform hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <Image
          src={course.image || '/images/course-placeholder.jpg'}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        {/* Category badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(course.category)}`}>
          {course.category}
        </div>
        
        {/* Price badge */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-bold text-primary-700">
          {course.price === 0 ? 'Gratis' : `${course.price} kr`}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-6">
        <div className="mb-4 flex-1">
          <h3 className="text-xl font-bold text-primary-800 mb-3 line-clamp-2 font-montserrat group-hover:text-primary-600 transition-colors">
            {course.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3 font-open-sans leading-relaxed">
            {course.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-sm text-gray-500 font-open-sans">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-2">
              <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {formatDuration(course.duration)}
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="text-2xl font-bold text-primary-700 font-montserrat">
            {course.price === 0 ? 'Gratis' : `${course.price} kr`}
          </div>
          <div className="flex space-x-3">
            {onAddToCart && (
              <button
                onClick={() => onAddToCart(course)}
                className="bg-accent-50 text-accent-700 px-4 py-2 rounded-lg hover:bg-accent-100 transition-colors flex items-center text-sm font-medium border border-accent-200 hover:border-accent-300"
              >
                <ShoppingCartIcon className="w-4 h-4 mr-2" />
                Lägg till
              </button>
            )}
            <Link
              href={`/courses/${course.id}`}
              className="bg-gradient-primary text-white px-6 py-2 rounded-lg hover:shadow-medium transition-all duration-300 flex items-center text-sm font-medium transform hover:scale-105"
            >
              Läs Mer
              <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
