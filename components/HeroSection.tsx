'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function HeroSection() {
 
  return (
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
        <div className="mn-container py-16 sm:py-24 md:py-32 lg:py-40">
          <div className="text-center px-4 sm:px-0 sm:mt-8">
           
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold mb-6 sm:mb-6 md:mb-8 font-montserrat leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Sveriges Ledande
              <br />
              <span className="bg-gradient-to-r from-accent-400 to-warning-400 bg-clip-text text-transparent">
                Utbildningsplattform
              </span>
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl md:text-2xl mb-10 sm:my-16 md:mb-12 max-w-4xl mx-auto text-white font-open-sans leading-relaxed px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Sveriges ledande plattform för företagsutbildning inom säkerhet och arbete på väg. 
              <span className="text-accent-300 font-semibold"> ID06-certifierade kurser</span> med BankID-verifiering för maximal säkerhet och compliance.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center mb-8 sm:mb-12 md:mb-16 px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link 
                href="/company-account" 
                className="group bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 font-semibold py-3 sm:py-4 px-6 sm:px-10 rounded-xl transition-all duration-300 font-open-sans shadow-medium hover:shadow-strong transform hover:scale-105 border border-accent-400/30 text-sm sm:text-base"
              >
                <span className="flex items-center justify-center">
                  Företagskonto
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link 
                href="/courses" 
                className="group bg-white/20 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white hover:text-primary-700 font-semibold py-3 sm:py-4 px-6 sm:px-10 rounded-xl transition-all duration-300 font-open-sans hover:shadow-medium transform hover:scale-105 text-sm sm:text-base"
              >
                <span className="flex items-center justify-center">
                  Se Kurser
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </motion.div>
            
            <motion.div 
              className="hidden sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8 pt-4 sm:pt-6 md:pt-8 lg:pt-12 max-w-4xl mx-auto px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex items-center justify-center p-3 sm:p-4 bg-white/20 backdrop-blur-md rounded-xl border-2 border-white/30">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-success-500/30 rounded-full flex items-center justify-center mr-2 sm:mr-3 border border-success-400/30">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-medium text-sm sm:text-base">Certifierade kurser</span>
                </div>
              </div>
              <div className="flex items-center justify-center p-3 sm:p-4 bg-white/20 backdrop-blur-md rounded-xl border-2 border-white/30">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent-500/30 rounded-full flex items-center justify-center mr-2 sm:mr-3 border border-accent-400/30">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-medium text-sm sm:text-base">Flexibel inlärning</span>
                </div>
              </div>
              <div className="flex items-center justify-center p-3 sm:p-4 bg-white/20 backdrop-blur-md rounded-xl border-2 border-white/30 sm:col-span-2 lg:col-span-1">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-warning-500/30 rounded-full flex items-center justify-center mr-2 sm:mr-3 border border-warning-400/30">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-medium text-sm sm:text-base">24/7 tillgång</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
