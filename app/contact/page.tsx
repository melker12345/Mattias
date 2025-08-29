'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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
      <div className="mn-container py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-mn-dark-blue-green mb-4 font-montserrat">
            Kontakta Oss
          </h1>
          <p className="text-xl text-mn-dark-blue-green/80 max-w-3xl mx-auto font-open-sans">
            Har du frågor om våra kurser eller behöver hjälp? Vi finns här för att hjälpa dig!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-mn-white rounded-lg shadow-sm p-8 border border-mn-light-gray-blue">
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
                  placeholder="din@email.se"
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
                  rows={6}
                  className="input-field"
                  placeholder="Skriv ditt meddelande här..."
                />
                {errors.message && (
                  <p className="mt-1 text-sm text-red-600 font-open-sans">{errors.message.message}</p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
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
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-mn-light-gray-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-mn-dark-blue-green mb-1 font-montserrat">Adress</h3>
                    <p className="text-mn-dark-blue-green/80 font-open-sans">
                      Storgatan 123<br />
                      123 45 Stockholm
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-mn-light-gray-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-mn-dark-blue-green mb-1 font-montserrat">Telefon</h3>
                    <p className="text-mn-dark-blue-green/80 font-open-sans">
                      08-123 45 67
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-mn-light-gray-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-mn-dark-blue-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-mn-dark-blue-green mb-1 font-montserrat">E-post</h3>
                    <a href="mailto:info@mngroup.se" className="text-mn-dark-blue-green/80 hover:text-mn-dark-blue-green transition-colors font-open-sans">
                      info@mngroup.se
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-mn-dark-blue-green mb-6 font-montserrat">
                Öppettider
              </h2>
              
              <div className="space-y-2 font-open-sans">
                <div className="flex justify-between">
                  <span className="text-mn-dark-blue-green/80">Måndag - Fredag</span>
                  <span className="font-medium text-mn-dark-blue-green">08:00 - 17:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mn-dark-blue-green/80">Lördag</span>
                  <span className="font-medium text-mn-dark-blue-green">10:00 - 15:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-mn-dark-blue-green/80">Söndag</span>
                  <span className="font-medium text-mn-dark-blue-green">Stängt</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-mn-dark-blue-green mb-4 font-montserrat">
                Följ oss
              </h2>
              
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="inline-block bg-mn-dark-blue-green text-mn-white px-6 py-2 rounded-lg font-medium hover:bg-mn-dark-blue-green/90 transition-colors font-open-sans"
                >
                  LinkedIn
                </a>
                <a
                  href="#"
                  className="inline-block bg-mn-light-gray-blue text-mn-dark-blue-green px-6 py-2 rounded-lg font-medium hover:bg-mn-light-gray-blue/80 transition-colors font-open-sans"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
