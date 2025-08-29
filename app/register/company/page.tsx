'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const companyRegistrationSchema = z.object({
  organizationNumber: z.string().regex(/^\d{6}-\d{4}$/, 'Organisationsnummer måste vara i formatet XXXXXX-XXXX'),
  name: z.string().min(2, 'Företagsnamn måste vara minst 2 tecken'),
  contactPerson: z.string().min(2, 'Kontaktperson måste vara minst 2 tecken'),
  email: z.string().email('Ogiltig e-postadress'),
  phone: z.string().min(6, 'Telefonnummer måste vara minst 6 tecken'),
  address: z.string().min(5, 'Adress måste vara minst 5 tecken'),
  password: z.string().min(8, 'Lösenord måste vara minst 8 tecken'),
  confirmPassword: z.string().min(8, 'Bekräfta lösenord måste vara minst 8 tecken'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lösenorden matchar inte",
  path: ["confirmPassword"],
})

type CompanyRegistrationForm = z.infer<typeof companyRegistrationSchema>

const COMPANY_FEATURES = [
  'Obegränsat antal anställda',
  'Alla kurser inkluderade',
  'E-post support',
  'Grundläggande rapporter',
  'Anpassade certifikat',
  'Företagsdashboard'
]

const COMPANY_PRICE = 1500 // SEK

export default function CompanyRegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyRegistrationForm>({
    resolver: zodResolver(companyRegistrationSchema),
  })

  const onSubmit = async (data: CompanyRegistrationForm) => {
    setIsSubmitting(true)
    setError('')
    setSuccess('')

    try {
      // TODO: Implement payment processing here
      // For now, we'll simulate payment success
      
      const response = await fetch('/api/companies/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          plan: 'STANDARD',
          paymentStatus: 'pending' // Will be updated after payment
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Ett fel uppstod vid registrering')
      } else {
        setSuccess('Företag registrerat framgångsrikt! Du kan nu logga in med din e-postadress och lösenord.')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      }
    } catch (error) {
      setError('Ett fel uppstod. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK'
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Registrera Företag
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Skapa ett företagskonto för att hantera anställda och köpa kurser
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
                {success}
              </div>
            )}

            {/* Company Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Företagsinformation</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="organizationNumber" className="block text-sm font-medium text-gray-700">
                    Organisationsnummer *
                  </label>
                  <input
                    {...register('organizationNumber')}
                    type="text"
                    id="organizationNumber"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="123456-7890"
                  />
                  {errors.organizationNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.organizationNumber.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Företagsnamn *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Företag AB"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                    Kontaktperson *
                  </label>
                  <input
                    {...register('contactPerson')}
                    type="text"
                    id="contactPerson"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Förnamn Efternamn"
                  />
                  {errors.contactPerson && (
                    <p className="mt-1 text-sm text-red-600">{errors.contactPerson.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    E-postadress *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="kontakt@foretag.se"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Telefonnummer *
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="070-123 45 67"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Adress *
                  </label>
                  <input
                    {...register('address')}
                    type="text"
                    id="address"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Gatan 123, 12345 Stockholm"
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Company Features */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Vad ingår i företagskontot?</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="text-center mb-4">
                  <h4 className="text-xl font-semibold text-gray-900">Företagskonto</h4>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-primary-600">
                      {formatPrice(COMPANY_PRICE)}
                    </span>
                    <span className="text-gray-500">/år</span>
                  </div>
                </div>
                
                <ul className="space-y-2 text-sm text-gray-700">
                  {COMPANY_FEATURES.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Account Password */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Skapa administratörskonto</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Lösenord *
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    id="password"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Minst 8 tecken"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Bekräfta lösenord *
                  </label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    id="confirmPassword"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Bekräfta lösenord"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Betalningssammanfattning</h3>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Företagskonto:</span>
                <span className="font-medium">Standard</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-600">Årlig kostnad:</span>
                <span className="text-xl font-bold text-primary-600">
                  {formatPrice(COMPANY_PRICE)}
                </span>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                * Faktura skickas efter registrering. Betalning sker inom 30 dagar.
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Registrerar...' : `Registrera företag - ${formatPrice(COMPANY_PRICE)}`}
            </button>

            <div className="text-center">
              <Link
                href="/auth/signin"
                className="text-primary-600 hover:text-primary-900 text-sm"
              >
                Har du redan ett konto? Logga in här
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
