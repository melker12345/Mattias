import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCartIcon } from '@heroicons/react/24/outline'

interface CourseCardProps {
  course: {
    id: string
    title: string
    description: string
    price: number
    image?: string
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



  return (
    <div className="card hover:shadow-lg transition-shadow duration-300">
      <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
        <Image
          src={course.image || '/images/course-placeholder.jpg'}
          alt={course.title}
          fill
          className="object-cover"
        />

      </div>
      
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-3">
          {course.description}
        </p>
      </div>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {formatDuration(course.duration)}
        </div>
        <div className="text-sm text-gray-500">
          {course.category}
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-primary-600">
          {course.price === 0 ? 'Gratis' : `${course.price} kr`}
        </div>
        <div className="flex space-x-2">
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(course)}
              className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm"
            >
              <ShoppingCartIcon className="w-4 h-4 mr-1" />
              Lägg till
            </button>
          )}
          <Link
            href={`/courses/${course.id}`}
            className="btn-primary"
          >
            Läs Mer
          </Link>
        </div>
      </div>
    </div>
  )
}
