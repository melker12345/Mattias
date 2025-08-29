'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-mn-dark-blue-green to-mn-dark-blue-green/90 text-mn-white">
      <div className="mn-container py-24">
        <div className="text-center">
          <motion.h1 
            className="text-4xl md:text-6xl font-bold mb-6 font-montserrat"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Sveriges Ledande
            <br />
            <span className="text-mn-light-gray-blue">Utbildningsplattform</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-mn-light-gray-blue font-open-sans"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Sveriges ledande plattform för företagsutbildning inom säkerhet och arbete på väg. 
            ID06-certifierade kurser med BankID-verifiering för maximal säkerhet och compliance.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link 
              href="/company-account" 
              className="bg-mn-white text-mn-dark-blue-green hover:bg-mn-nearly-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 font-open-sans"
            >
              Företagskonto
            </Link>
            <Link 
              href="/courses" 
              className="border-2 border-mn-white text-mn-white hover:bg-mn-white hover:text-mn-dark-blue-green font-semibold py-3 px-8 rounded-lg transition-colors duration-200 font-open-sans"
            >
              Se Kurser
            </Link>
          </motion.div>
          
          <motion.div 
            className="mt-12 flex items-center justify-center space-x-8 text-sm text-mn-light-gray-blue font-open-sans"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Certifierade kurser
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Flexibel inlärning
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              24/7 tillgång
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
