import Link from 'next/link'
import Image from 'next/image'
import { ClockIcon, StarIcon, ArrowRightIcon } from '@heroicons/react/24/outline'

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


  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratis'
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 h-full flex flex-col overflow-hidden border border-gray-100 transform hover:-translate-y-2">
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden">
        <Image
          src={course.image || '/images/course-placeholder.jpg'}
          alt={course.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0  bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* Category badge */}
        <div className={`absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-bold bg-white/95 text-gray-800 shadow-lg`}>
          {course.category}
        </div>
        
        {/* Price badge */}
        <div className="absolute top-4 right-4 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-bold text-gray-800 shadow-lg">
          {formatPrice(course.price)}
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-primary-600/0 group-hover:bg-primary-600/20 transition-all duration-500"></div>
      </div>
      
      {/* Content Section */}
      <div className="flex-1 flex flex-col p-6">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 font-montserrat group-hover:text-primary-600 transition-colors leading-tight">
          {course.title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-3 font-open-sans leading-relaxed mb-6 flex-1">
          {course.description}
        </p>
        
        {/* Course Stats */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center text-sm text-gray-500 font-medium">
            <div className="w-10 h-10 bg-primary-50 rounded-full flex items-center justify-center mr-3">
              <ClockIcon className="w-5 h-5 text-primary-600" />
            </div>
            <span className="font-semibold">{formatDuration(course.duration)}</span>
          </div>
          
          {/* Rating placeholder */}
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex items-center mr-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="font-medium">4.8</span>
          </div>
        </div>
        
        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-2xl font-bold text-primary-700 font-montserrat">
            {formatPrice(course.price)}
          </div>
          
          <Link
            href={`/courses/${course.id}`}
            className="group/btn bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center text-sm font-semibold transform hover:scale-105"
          >
            Läs Mer
            <ArrowRightIcon className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
      
      {/* Decorative accent */}
      <div className={`absolute top-0 left-0 w-1 h-full  opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
    </div>
  )
}
