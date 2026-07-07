'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  email: z.string().email('Ange en giltig e-postadress'),
})

type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    const supabase = createClient()
    const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(
      data.email,
      { redirectTo: `${window.location.origin}/auth/reset-password` }
    )
    if (supabaseError) {
      setError('Något gick fel. Försök igen.')
      return
    }
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 pt-20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Glömt lösenord?</h1>
          <p className="text-gray-600">
            Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">E-post skickad</h2>
              <p className="text-gray-600 text-sm">
                Om e-postadressen finns i vårt system får du snart ett e-postmeddelande med en länk för att återställa ditt lösenord.
              </p>
              <p className="text-gray-500 text-xs">Kom ihåg att kolla skräpposten.</p>
              <Link
                href="/auth/signin"
                className="inline-block mt-4 text-primary-600 hover:text-primary-700 text-sm transition-colors"
              >
                ← Tillbaka till inloggning
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  E-postadress
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="din@email.se"
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                {isSubmitting ? 'Skickar...' : 'Skicka återställningslänk'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Kom ihåg ditt lösenord?{' '}
                <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700 transition-colors">
                  Logga in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
