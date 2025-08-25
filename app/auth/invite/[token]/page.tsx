'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface InvitationData {
  id: string
  email: string
  companyId: string
  companyName: string
  isExistingUser: boolean
  temporaryPassword?: string
  expiresAt: string
}

export default function InvitePage({ params }: { params: { token: string } }) {
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${params.token}`)
        const data = await response.json()

        if (!response.ok) {
          setError(data.message || 'Ogiltig eller utgången inbjudningslänk')
        } else {
          setInvitation(data.invitation)
        }
      } catch (error) {
        setError('Ett fel uppstod vid hämtning av inbjudningen')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvitation()
  }, [params.token])

  const acceptInvitation = async () => {
    if (!invitation) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/invitations/${params.token}/accept`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Ett fel uppstod vid acceptering av inbjudningen')
      } else {
        // Redirect to sign in page with success message
        router.push('/auth/signin?message=Inbjudning accepterad! Du kan nu logga in.')
      }
    } catch (error) {
      setError('Ett fel uppstod vid acceptering av inbjudningen')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar inbjudning...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="mb-4">
              <svg className="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Inbjudningslänk ogiltig</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/auth/signin"
              className="btn-primary"
            >
              Gå till inloggning
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return null
  }

  const isExpired = new Date(invitation.expiresAt) < new Date()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="mb-4">
              <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Välkommen till {invitation.companyName}!
            </h1>
            <p className="text-gray-600">
              Du har blivit inbjuden att använda företagets utbildningsplattform.
            </p>
          </div>

          {isExpired ? (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                Denna inbjudningslänk har gått ut. Kontakta din företagsadministratör för en ny inbjudan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Inbjudningsinformation</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>E-post:</strong> {invitation.email}</p>
                  <p><strong>Företag:</strong> {invitation.companyName}</p>
                  {invitation.isExistingUser ? (
                    <p><strong>Status:</strong> Befintlig användare</p>
                  ) : (
                    <p><strong>Status:</strong> Ny användare</p>
                  )}
                </div>
              </div>

              {!invitation.isExistingUser && invitation.temporaryPassword && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-medium text-yellow-900 mb-2">Dina inloggningsuppgifter</h3>
                  <div className="text-sm text-yellow-800 space-y-1">
                    <p><strong>E-post:</strong> {invitation.email}</p>
                    <p><strong>Temporärt lösenord:</strong> {invitation.temporaryPassword}</p>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Vad händer nu?</h3>
                <ol className="text-sm text-gray-700 space-y-1">
                  <li>1. Acceptera inbjudningen</li>
                  <li>2. Logga in med dina uppgifter</li>
                  <li>3. Verifiera din identitet med BankID</li>
                  <li>4. Börja ta dina tilldelade kurser</li>
                </ol>
              </div>

              <button
                onClick={acceptInvitation}
                disabled={isProcessing}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Accepterar...' : 'Acceptera inbjudning'}
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/signin"
              className="text-primary-600 hover:text-primary-900 text-sm"
            >
              Har du redan ett konto? Logga in här
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
