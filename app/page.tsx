import Link from 'next/link'
import { CourseCard } from '@/components/CourseCard'
import { HeroSection } from '@/components/HeroSection'
import { FeaturesSection } from '@/components/FeaturesSection'
import { TestimonialsSection } from '@/components/TestimonialsSection'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-mn-very-light-gray">
      <HeroSection />
      
      <main className="mn-container py-12">
        {/* Course Categories */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-mn-dark-blue-green mb-4 font-montserrat">
              Våra Utbildningsområden
            </h2>
            <p className="text-lg text-mn-dark-blue-green/80 max-w-3xl mx-auto font-open-sans">
              Vi erbjuder professionella onlinekurser inom säkerhet, arbete på väg och kompetensutveckling
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-mn-light-gray-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-mn-dark-blue-green mb-2 font-montserrat">Arbete på Väg</h3>
                <p className="text-mn-dark-blue-green/80 mb-4 font-open-sans">
                  Grundläggande och avancerade kurser för säkert arbete i trafikmiljö
                </p>
                <Link href="/courses/arbete-pa-vag" className="btn-primary">
                  Se kurser
                </Link>
              </div>
            </div>
            
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-mn-light-gray-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-mn-dark-blue-green mb-2 font-montserrat">Säkerhet & Miljö</h3>
                <p className="text-mn-dark-blue-green/80 mb-4 font-open-sans">
                  Kurser inom arbetsmiljö, säkerhet och miljömedvetenhet
                </p>
                <Link href="/courses/sakerhet-miljo" className="btn-primary">
                  Se kurser
                </Link>
              </div>
            </div>
            
            <div className="card hover:shadow-lg transition-shadow duration-300">
              <div className="text-center">
                <div className="w-16 h-16 bg-mn-light-gray-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-mn-dark-blue-green mb-2 font-montserrat">Kompetensutveckling</h3>
                <p className="text-mn-dark-blue-green/80 mb-4 font-open-sans">
                  Professionella utbildningar för att utveckla din karriär
                </p>
                <Link href="/courses/kompetensutveckling" className="btn-primary">
                  Se kurser
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        <FeaturesSection />
        <TestimonialsSection />
      </main>
    </div>
  )
}
