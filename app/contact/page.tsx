'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'

const contactSchema = z.object({
  name: z.string().min(2, 'Namn måste vara minst 2 tecken'),
  email: z.string().email('Ogiltig e-postadress'),
  subject: z.string().min(5, 'Ämne måste vara minst 5 tecken'),
  message: z.string().min(10, 'Meddelande måste vara minst 10 tecken'),
})

type ContactForm = z.infer<typeof contactSchema>

export default function ContactPage() {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactForm) => {
    try {
      // Here you would typically send the data to your API
      console.log('Contact form data:', data)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSubmitStatus('success')
      reset()
    } catch (error) {
      setSubmitStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-mn-very-light-gray">
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
                <EnvelopeIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 sm:mb-6 text-accent-400" />
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold font-montserrat leading-tight">
                  Kontakta Oss
                </h1>
              </motion.div>
              
              <motion.p 
                className="text-lg sm:text-xl md:text-2xl mb-10 sm:my-16 md:mb-12 max-w-4xl mx-auto text-white font-open-sans leading-relaxed px-4 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Har du frågor om våra kurser eller behöver hjälp? Vi finns här för att hjälpa dig med <span className="text-accent-300 font-semibold">professionell support</span> och expertis.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center mb-8 sm:mb-12 md:mb-16 px-4 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <a href="#contact-form" className="group bg-gradient-to-r from-accent-500 to-accent-600 text-white hover:from-accent-600 hover:to-accent-700 font-semibold py-3 sm:py-4 px-6 sm:px-10 rounded-xl transition-all duration-300 font-open-sans shadow-medium hover:shadow-strong transform hover:scale-105 border border-accent-400/30 text-sm sm:text-base">
                  <span className="flex items-center justify-center">
                    Skicka meddelande
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </a>
                <a href="tel:+46701234567" className="group bg-white/20 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white hover:text-primary-700 font-semibold py-3 sm:py-4 px-6 sm:px-10 rounded-xl transition-all duration-300 font-open-sans hover:shadow-medium transform hover:scale-105 text-sm sm:text-base">
                  <span className="flex items-center justify-center">
                    Ring oss
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

      <div className="mn-container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div id="contact-form" className="bg-mn-white rounded-lg shadow-sm p-8 border border-mn-light-gray-blue">
            <h2 className="text-2xl font-bold text-mn-dark-blue-green mb-6 font-montserrat">
              Skicka ett meddelande
            </h2>

            {submitStatus === 'success' && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md mb-6 font-open-sans">
                Tack för ditt meddelande! Vi återkommer så snart som möjligt.
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-6 font-open-sans">
                Ett fel uppstod. Försök igen eller kontakta oss direkt.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-mn-dark-blue-green mb-2 font-open-sans">
                  Namn *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  className="input-field"
                  placeholder="Ditt namn"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 font-open-sans">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-mn-dark-blue-green mb-2 font-open-sans">
                  E-postadress *
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="input-field"
                  placeholder="din.email@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 font-open-sans">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-mn-dark-blue-green mb-2 font-open-sans">
                  Ämne *
                </label>
                <input
                  {...register('subject')}
                  type="text"
                  id="subject"
                  className="input-field"
                  placeholder="Vad gäller din fråga?"
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600 font-open-sans">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-mn-dark-blue-green mb-2 font-open-sans">
                  Meddelande *
                </label>
                <textarea
                  {...register('message')}
                  id="message"
                  rows={5}
                  className="input-field"
                  placeholder="Beskriv ditt ärende..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600 font-open-sans">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-mn-dark-blue-green text-white py-3 px-6 rounded-lg font-semibold hover:bg-mn-dark-blue-green/90 transition-colors font-open-sans"
              >
                Skicka meddelande
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-mn-dark-blue-green mb-6 font-montserrat">
                Kontaktinformation
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <EnvelopeIcon className="h-6 w-6 text-mn-dark-blue-green mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-mn-dark-blue-green font-open-sans">E-post</p>
                    <p className="text-mn-dark-blue-green/80 font-open-sans">info@mnutbildning.se</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <PhoneIcon className="h-6 w-6 text-mn-dark-blue-green mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-mn-dark-blue-green font-open-sans">Telefon</p>
                    <p className="text-mn-dark-blue-green/80 font-open-sans">+46 70 123 45 67</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-6 w-6 text-mn-dark-blue-green mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-mn-dark-blue-green font-open-sans">Adress</p>
                    <p className="text-mn-dark-blue-green/80 font-open-sans">
                      Utbildningsgatan 123<br />
                      123 45 Stockholm<br />
                      Sverige
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-mn-dark-blue-green mb-4 font-montserrat">
                Öppettider
              </h3>
              <div className="space-y-2 text-mn-dark-blue-green/80 font-open-sans">
                <p><span className="font-semibold">Måndag - Fredag:</span> 08:00 - 17:00</p>
                <p><span className="font-semibold">Lördag:</span> 10:00 - 15:00</p>
                <p><span className="font-semibold">Söndag:</span> Stängt</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-mn-dark-blue-green mb-4 font-montserrat">
                Vanliga frågor
              </h3>
              <div className="space-y-3">
                <details className="bg-mn-white rounded-lg p-4 border border-mn-light-gray-blue">
                  <summary className="font-semibold text-mn-dark-blue-green cursor-pointer font-open-sans">
                    Hur fungerar onlinekurserna?
                  </summary>
                  <p className="mt-2 text-mn-dark-blue-green/80 font-open-sans">
                    Våra onlinekurser är självstudier som du kan genomföra när det passar dig. 
                    Du får tillgång till videomaterial, texter och tester som du kan göra i din egen takt.
                  </p>
                </details>
                <details className="bg-mn-white rounded-lg p-4 border border-mn-light-gray-blue">
                  <summary className="font-semibold text-mn-dark-blue-green cursor-pointer font-open-sans">
                    Får jag certifikat efter slutförd kurs?
                  </summary>
                  <p className="mt-2 text-mn-dark-blue-green/80 font-open-sans">
                    Ja, alla våra kurser ger dig ett certifikat när du har slutfört kursen och klarat alla tester.
                  </p>
                </details>
                <details className="bg-mn-white rounded-lg p-4 border border-mn-light-gray-blue">
                  <summary className="font-semibold text-mn-dark-blue-green cursor-pointer font-open-sans">
                    Hur lång tid tar en kurs?
                  </summary>
                  <p className="mt-2 text-mn-dark-blue-green/80 font-open-sans">
                    Kurslängden varierar mellan 2-8 timmar beroende på kurs. Du kan studera i din egen takt 
                    och pausa när du vill.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
