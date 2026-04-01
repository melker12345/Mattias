'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSupabaseAuth } from '@/app/providers'

const inviteEmployeeSchema = z.object({
  name: z.string().min(1, 'Namn är obligatoriskt'),
  email: z.string().email('Ogiltig e-postadress'),
  personnummer: z.string().min(10, 'Ange ett giltigt personnummer (YYYYMMDDXXXX)'),
  phone: z.string().min(8, 'Ange ett giltigt telefonnummer'),
})

type InviteEmployeeForm = z.infer<typeof inviteEmployeeSchema>

export default function InviteEmployeePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [invitationData, setInvitationData] = useState<{
    invitationUrl: string
    emailSent: boolean
    existingUser: boolean
    nextSteps: string[]
  } | null>(null)
  const router = useRouter()
  const { user } = useSupabaseAuth()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteEmployeeForm>({
    resolver: zodResolver(inviteEmployeeSchema),
  })

  useEffect(() => {
    if (!user) return

    const userRole = user.user_metadata?.role
    if (userRole !== 'COMPANY_ADMIN') {
      router.push('/dashboard')
      return
    }

    const userCompanyId = user.user_metadata?.companyId
    if (!userCompanyId) {
      setError('Inget företag kopplat till ditt konto')
      return
    }

    setCompanyId(userCompanyId)
  }, [user, router])

  const onSubmit = async (data: InviteEmployeeForm) => {
    if (!companyId) {
      setError('Inget företag kopplat till ditt konto')
      return
    }
    setIsSubmitting(true)
    setError('')
    setSuccess('')
    setInvitationData(null)

    try {
      const response = await fetch(`/api/companies/${companyId}/invite-employee`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Ett fel uppstod vid inbjudan')
      } else {
        const successMessage = result.existingUser
          ? 'Befintlig användare har lagts till i företaget!'
          : 'Anställd inbjuden framgångsrikt!'

        setSuccess(successMessage)
        setInvitationData({
          invitationUrl: result.invitationUrl,
          emailSent: result.emailSent,
          existingUser: result.existingUser,
          nextSteps: result.nextSteps,
        })
        reset()
      }
    } catch (error) {
      setError('Ett fel uppstod. Försök igen.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyInvitationLink = async () => {
    if (invitationData?.invitationUrl) {
      try {
        await navigator.clipboard.writeText(invitationData.invitationUrl)
        setSuccess('Inbjudningslänk kopierad till urklipp!')
      } catch (error) {
        setError('Kunde inte kopiera länken')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bjud in anställd
            </h1>
            <p className="text-gray-600">
              Skicka en inbjudan till en ny anställd för att använda utbildningsplattformen.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">{success}</p>
              
              {invitationData && (
                <div className="mt-4 space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Inbjudningslänk</h4>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={invitationData.invitationUrl}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 text-black"
                      />
                      <button
                        onClick={copyInvitationLink}
                        className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Kopiera
                      </button>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      {invitationData.emailSent 
                        ? 'E-post har skickats, men du kan också dela denna länk direkt.'
                        : 'E-post kunde inte skickas. Dela denna länk direkt med användaren.'
                      }
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Nästa steg</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {invitationData.nextSteps.map((step, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Namn
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                className="input-field"
                placeholder="Anställds namn"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                E-postadress
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="input-field"
                placeholder="anstalld@foretag.se"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="personnummer" className="block text-sm font-medium text-gray-700 mb-1">
                Personnummer
              </label>
              <input
                {...register('personnummer')}
                type="text"
                id="personnummer"
                className="input-field"
                placeholder="YYYYMMDDXXXX"
              />
              {errors.personnummer && (
                <p className="mt-1 text-sm text-red-600">{errors.personnummer.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Används för att verifiera den anställdas identitet vid registrering.</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefonnummer
              </label>
              <input
                {...register('phone')}
                type="tel"
                id="phone"
                className="input-field"
                placeholder="07X-XXX XX XX"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Obs:</strong> Du som arbetsgivare ansvarar för att uppgifterna är korrekta. Personnumret krypteras och lagras säkert. Det används enbart för identitetsverifiering och ID06-registrering.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !companyId}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Skickar inbjudan...' :
               !companyId ? 'Inget företag hittat' :
               'Bjud in anställd'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/dashboard/company"
              className="text-primary-600 hover:text-primary-900 text-sm"
            >
              ← Tillbaka till företagsdashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
