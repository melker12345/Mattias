'use client';

import { motion } from 'framer-motion';
import { UserGroupIcon, AcademicCapIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function AboutPage() {
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
                <UserGroupIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-accent-400" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold font-montserrat leading-tight">
                  Om Oss
                </h1>
              </motion.div>
              
              <motion.p 
                className="text-lg sm:text-xl md:text-2xl mb-10 sm:my-16 md:mb-12 max-w-4xl mx-auto text-white font-open-sans leading-relaxed px-4 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Vi är Sveriges ledande plattform för professionella onlinekurser inom <span className="text-accent-300 font-semibold">säkerhet, arbete på väg</span> och kompetensutveckling.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center mb-8 sm:mb-12 md:mb-16 px-4 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <a href="#mission" className="group bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 font-semibold py-3 sm:py-4 px-6 sm:px-10 rounded-xl transition-all duration-300 font-open-sans shadow-medium hover:shadow-strong transform hover:scale-105 border border-accent-400/30 text-sm sm:text-base">
                  <span className="flex items-center justify-center">
                    Läs mer
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </a>
                <a href="/courses" className="group bg-white/20 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white hover:text-primary-700 font-semibold py-3 sm:py-4 px-6 sm:px-10 rounded-xl transition-all duration-300 font-open-sans hover:shadow-medium transform hover:scale-105 text-sm sm:text-base">
                  <span className="flex items-center justify-center">
                    Se våra kurser
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission Section */}
        <div id="mission" className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Vårt Uppdrag
            </h2>
            <div className="prose prose-lg mx-auto text-gray-600">
              <p className="mb-6">
                Sedan vår grundande har vi varit dedikerade till att göra kvalitativ utbildning 
                tillgänglig för alla. Vi tror på kraften i kontinuerlig lärande och strävar efter 
                att erbjuda kurser som inte bara uppfyller branschens krav utan också inspirerar 
                till personlig och professionell utveckling.
              </p>
              <p className="mb-6">
                Våra kurser är utformade av erfarna instruktörer och följer de senaste 
                reglerna och riktlinjerna inom respektive område. Vi arbetar nära branschledare 
                för att säkerställa att vårt innehåll är relevant, aktuellt och praktiskt 
                användbart.
              </p>
              <p>
                Genom vår plattform kan du studera i din egen takt, när det passar dig, 
                och få omedelbar feedback på dina framsteg. Vi är stolta över att ha hjälpt 
                tusentals professionella att utveckla sina färdigheter och uppnå sina mål.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Kvalitet</h3>
            <p className="text-gray-600">
              Vi levererar endast kurser av högsta kvalitet, utformade av experter inom sina områden.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
            <p className="text-gray-600">
              Vi använder modern teknologi för att skapa engagerande och effektiva lärupplevelser.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Samhällsansvar</h3>
            <p className="text-gray-600">
              Vi bidrar till ett säkrare samhälle genom att utbilda professionella inom säkerhet och kvalitet.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Vårt Team
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Anna Andersson</h3>
                <p className="text-primary-600 mb-2">VD & Grundare</p>
                <p className="text-sm text-gray-600">
                  Över 15 års erfarenhet inom utbildning och säkerhet. 
                  Passionerad för att göra kvalitativ utbildning tillgänglig för alla.
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Erik Eriksson</h3>
                <p className="text-primary-600 mb-2">Utbildningschef</p>
                <p className="text-sm text-gray-600">
                  Expert inom pedagogik och digital lärande. 
                  Ansvarig för utveckling av våra kurser och lärupplevelser.
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Maria Nilsson</h3>
                <p className="text-primary-600 mb-2">Säkerhetsexpert</p>
                <p className="text-sm text-gray-600">
                  Certifierad säkerhetsexpert med djup kunskap inom 
                  arbetsmiljö och säkerhetsregler.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-8">Våra Siffror</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-lg">Nöjda kunder</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-lg">Certifierade kurser</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99%</div>
              <div className="text-lg">Slutförandegrad</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
