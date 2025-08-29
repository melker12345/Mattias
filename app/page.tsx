import Link from 'next/link'
import { CourseCard } from '@/components/CourseCard'
import { HeroSection } from '@/components/HeroSection'
import { FeaturesSection } from '@/components/FeaturesSection'
import { TestimonialsSection } from '@/components/TestimonialsSection'
import { prisma } from '@/lib/prisma'

async function getPopularCourses() {
  try {
    const courses = await prisma.course.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc'
      }
    })
    return courses
  } catch (error) {
    console.error('Error fetching popular courses:', error)
    return []
  }
}

export default async function HomePage() {
  const popularCourses = await getPopularCourses()

  return (
    <div className="min-h-screen bg-mn-very-light-gray">
      <HeroSection />
      
      <main className="mn-container py-12">
        {/* Popular Courses Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mn-dark-blue-green mb-4 font-montserrat">
              Populära Kurser
            </h2>
            <p className="text-lg text-mn-dark-blue-green/80 max-w-3xl mx-auto font-open-sans">
              Våra mest populära kurser inom säkerhet, arbete på väg och kompetensutveckling
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularCourses.map((course) => (
              <div key={course.id} className="h-full">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              href="/courses" 
              className="inline-flex items-center bg-mn-dark-blue-green text-mn-white px-8 py-4 rounded-lg font-semibold hover:bg-mn-dark-blue-green/90 transition-colors font-open-sans shadow-lg hover:shadow-xl"
            >
              Se Alla Kurser
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
        
        <FeaturesSection />
        <TestimonialsSection />
      </main>
    </div>
  )
}
