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
      const response = await fetch('/api/companies/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Registrera Företag
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Skapa ett företagskonto för att hantera anställda och köpa kurser
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
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

            <div>
              <label htmlFor="organizationNumber" className="block text-sm font-medium text-gray-700">
                Organisationsnummer *
              </label>
              <div className="mt-1">
                <input
                  {...register('organizationNumber')}
                  type="text"
                  id="organizationNumber"
                  className="input-field"
                  placeholder="123456-7890"
                />
                {errors.organizationNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.organizationNumber.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Företagsnamn *
              </label>
              <div className="mt-1">
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  className="input-field"
                  placeholder="ABC Bygg AB"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                Kontaktperson *
              </label>
              <div className="mt-1">
                <input
                  {...register('contactPerson')}
                  type="text"
                  id="contactPerson"
                  className="input-field"
                  placeholder="Anna Andersson"
                />
                {errors.contactPerson && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactPerson.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-postadress *
              </label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className="input-field"
                  placeholder="anna@abcbygg.se"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefonnummer *
              </label>
              <div className="mt-1">
                <input
                  {...register('phone')}
                  type="tel"
                  id="phone"
                  className="input-field"
                  placeholder="08-123 45 67"
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Adress *
              </label>
              <div className="mt-1">
                <textarea
                  {...register('address')}
                  id="address"
                  rows={3}
                  className="input-field"
                  placeholder="Storgatan 1, 123 45 Stockholm"
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Lösenord *
              </label>
              <div className="mt-1">
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  className="input-field"
                  placeholder="Minst 8 tecken"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Bekräfta lösenord *
              </label>
              <div className="mt-1">
                <input
                  {...register('confirmPassword')}
                  type="password"
                  id="confirmPassword"
                  className="input-field"
                  placeholder="Upprepa lösenord"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registrerar...' : 'Registrera Företag'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Eller</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3">
              <Link
                href="/auth/signin"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-600 bg-white hover:bg-gray-50"
              >
                Logga in på befintligt konto
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                Viktig information
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Företagskonton kräver inte BankID-verifiering</li>
                <li>• Du kan bjuda in anställda efter registrering</li>
                <li>• Anställda måste verifiera sig med BankID för ID06-certifikat</li>
                <li>• Betalning sker via faktura (30 dagars betalningsvillkor)</li>
                <li>• Du kan logga in direkt efter registrering</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
