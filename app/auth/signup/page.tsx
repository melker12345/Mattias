'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const signUpSchema = z.object({
  name: z.string().min(2, 'Namnet måste vara minst 2 tecken'),
  email: z.string().email('Ogiltig e-postadress'),
  password: z.string().min(6, 'Lösenordet måste vara minst 6 tecken'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Lösenorden matchar inte",
  path: ["confirmPassword"],
})

type SignUpForm = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [invitationInfo, setInvitationInfo] = useState<{ email: string; companyName: string } | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  })

  // Check for invitation token and pre-fill email
  useEffect(() => {
    const email = searchParams.get('email')
    const token = searchParams.get('token')
    const message = searchParams.get('message')

    if (email) {
      setValue('email', email)
    }

    if (message) {
      setSuccess(message)
    }

    if (token) {
      // Fetch invitation info to show company name
      fetchInvitationInfo(token)
    }
  }, [searchParams, setValue])

  const fetchInvitationInfo = async (token: string) => {
    try {
      const response = await fetch(`/api/invitations/${token}`)
      if (response.ok) {
        const data = await response.json()
        setInvitationInfo({
          email: data.invitation.email,
          companyName: data.invitation.companyName,
        })
        
        // Pre-fill name if available from invitation
        if (data.invitation.name) {
          setValue('name', data.invitation.name)
        }
      }
    } catch (error) {
      console.error('Error fetching invitation info:', error)
    }
  }

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true)
    setError('')
    setSuccess('')

    const token = searchParams.get('token')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          invitationToken: token, // Include invitation token if present
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.message || 'Ett fel uppstod vid registrering')
      } else {
        if (token) {
          setSuccess('Kontot skapades framgångsrikt! Du är nu ansluten till företaget. Du kan logga in.')
        } else {
          setSuccess('Kontot skapades framgångsrikt! Du kan nu logga in.')
        }
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      }
    } catch (error) {
      setError('Ett fel uppstod. Försök igen.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {invitationInfo ? `Skapa konto för ${invitationInfo.companyName}` : 'Skapa ditt konto'}
        </h2>
        {invitationInfo && (
          <p className="mt-2 text-center text-sm text-gray-600">
            Du har blivit inbjuden att använda {invitationInfo.companyName}s utbildningsplattform
          </p>
        )}
        <p className="mt-2 text-center text-sm text-gray-600">
          Eller{' '}
          <Link href="/auth/signin" className="font-medium text-primary-600 hover:text-primary-500">
            logga in här
          </Link>
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Namn
              </label>
              <div className="mt-1">
                <input
                  {...register('name')}
                  type="text"
                  className={`input-field ${invitationInfo?.email === searchParams.get('email') ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="Ditt namn"
                  readOnly={invitationInfo?.email === searchParams.get('email')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-postadress
              </label>
              <div className="mt-1">
                <input
                  {...register('email')}
                  type="email"
                  className={`input-field ${invitationInfo ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  placeholder="din@email.se"
                  readOnly={!!invitationInfo}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Lösenord
              </label>
              <div className="mt-1">
                <input
                  {...register('password')}
                  type="password"
                  className="input-field"
                  placeholder="Ditt lösenord"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Bekräfta lösenord
              </label>
              <div className="mt-1">
                <input
                  {...register('confirmPassword')}
                  type="password"
                  className="input-field"
                  placeholder="Bekräfta ditt lösenord"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Skapar konto...' : 'Skapa konto'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <p className="text-xs text-gray-500 text-center">
              Genom att skapa ett konto godkänner du våra{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                användarvillkor
              </Link>{' '}
              och{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                integritetspolicy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
