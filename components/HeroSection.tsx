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
          <div className="absolute top-10 left-10 w-32 h-32 border border-white/20 rounded-full"></div>
          <div className="absolute top-20 right-20 w-24 h-24 border border-white/15 rounded-full"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 border border-white/10 rounded-full"></div>
          <div className="absolute bottom-10 right-1/3 w-16 h-16 border border-white/25 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 border border-white/20 rotate-45"></div>
        </div>
      </div>
      
      {/* Enhanced decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 w-40 h-40 bg-accent-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-60 h-60 bg-success-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-warning-500/20 rounded-full blur-2xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-primary-500/25 rounded-full blur-2xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>
      
      <div className="relative z-10">
        <div className="mn-container py-40">
          <div className="text-center">
           
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-8 font-montserrat leading-tight"
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
              className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto text-white font-open-sans leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Sveriges ledande plattform för företagsutbildning inom säkerhet och arbete på väg. 
              <span className="text-accent-300 font-semibold"> ID06-certifierade kurser</span> med BankID-verifiering för maximal säkerhet och compliance.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link 
                href="/company-account" 
                className="group bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 font-semibold py-4 px-10 rounded-xl transition-all duration-300 font-open-sans shadow-medium hover:shadow-strong transform hover:scale-105 border border-accent-400/30"
              >
                <span className="flex items-center">
                  Företagskonto
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>
              <Link 
                href="/courses" 
                className="group bg-white/20 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white hover:text-primary-700 font-semibold py-4 px-10 rounded-xl transition-all duration-300 font-open-sans hover:shadow-medium transform hover:scale-105"
              >
                <span className="flex items-center">
                  Se Kurser
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 pt-16 gap-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex items-center justify-center p-4 bg-white/20 backdrop-blur-md rounded-xl border-2 border-white/30">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-success-500/30 rounded-full flex items-center justify-center mr-3 border border-success-400/30">
                    <svg className="w-5 h-5 text-success-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-medium">Certifierade kurser</span>
                </div>
              </div>
              <div className="flex items-center justify-center p-4 bg-white/20 backdrop-blur-md rounded-xl border-2 border-white/30">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-accent-500/30 rounded-full flex items-center justify-center mr-3 border border-accent-400/30">
                    <svg className="w-5 h-5 text-accent-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-medium">Flexibel inlärning</span>
                </div>
              </div>
              <div className="flex items-center justify-center p-4 bg-white/20 backdrop-blur-md rounded-xl border-2 border-white/30">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-warning-500/30 rounded-full flex items-center justify-center mr-3 border border-warning-400/30">
                    <svg className="w-5 h-5 text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-white font-medium">24/7 tillgång</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
