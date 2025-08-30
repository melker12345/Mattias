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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      <HeroSection />
      
      <main className="mn-container py-16">
        {/* Popular Courses Section */}
        <section className="mb-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-accent-100 text-accent-700 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-accent-500 rounded-full mr-2"></span>
              Populära Kurser
            </div>
            <h2 className="text-4xl font-bold text-primary-700 mb-6 font-montserrat">
              Utforska Våra Mest Populära Kurser
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-open-sans leading-relaxed">
              Våra mest populära kurser inom säkerhet, arbete på väg och kompetensutveckling
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {popularCourses.map((course, index) => (
              <div key={course.id} className="h-full transform hover:scale-105 transition-transform duration-300">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <Link 
              href="/courses" 
              className="inline-flex items-center bg-gradient-primary text-white px-10 py-4 rounded-xl font-semibold hover:shadow-strong transition-all duration-300 font-open-sans shadow-medium group"
            >
              Se Alla Kurser
              <svg className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
        
        {/* Stats Section */}
        <section className="mb-20 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-12 text-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-primary-100">Nöjda Kunder</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-primary-100">Kurser Tillgängliga</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-primary-100">Genomförande</div>
            </div>
          </div>
        </section>
        
        <FeaturesSection />
        <TestimonialsSection />
      </main>
    </div>
  )
}
