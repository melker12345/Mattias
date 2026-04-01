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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Glömt lösenord?</h1>
          <p className="text-gray-400">
            Ange din e-postadress så skickar vi en länk för att återställa ditt lösenord.
          </p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">E-post skickad</h2>
              <p className="text-gray-400 text-sm">
                Om e-postadressen finns i vårt system får du snart ett e-postmeddelande med en länk för att återställa ditt lösenord.
              </p>
              <p className="text-gray-500 text-xs">Kom ihåg att kolla skräpposten.</p>
              <Link
                href="/auth/signin"
                className="inline-block mt-4 text-blue-400 hover:text-blue-300 text-sm transition-colors"
              >
                ← Tillbaka till inloggning
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">
                  E-postadress
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="din@email.se"
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
              >
                {isSubmitting ? 'Skickar...' : 'Skicka återställningslänk'}
              </button>

              <p className="text-center text-sm text-gray-500">
                Kom ihåg ditt lösenord?{' '}
                <Link href="/auth/signin" className="text-blue-400 hover:text-blue-300 transition-colors">
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
