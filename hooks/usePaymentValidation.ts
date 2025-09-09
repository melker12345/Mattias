import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import type { PaymentValidationResult } from '@/lib/types/payment'

interface UsePaymentValidationReturn {
  isValid: boolean
  status: string
  message: string
  loading: boolean
  error: string | null
  refresh: () => void
}

export function usePaymentValidation(companyId?: string): UsePaymentValidationReturn {
  const { data: session } = useSession()
  const [validation, setValidation] = useState<PaymentValidationResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchValidation = async () => {
    if (!companyId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/companies/${companyId}/payment-status`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch payment status')
      }

      setValidation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchValidation()
  }, [companyId])

  return {
    isValid: validation?.isValid ?? false,
    status: (validation?.paymentStatus ?? 'none').toUpperCase(),
    message: validation?.message ?? '',
    loading,
    error,
    refresh: fetchValidation
  }
}

interface UseSubscriptionDetailsReturn {
  subscription: any
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useSubscriptionDetails(companyId?: string): UseSubscriptionDetailsReturn {
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscription = async () => {
    if (!companyId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/companies/${companyId}/subscription`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch subscription details')
      }

      setSubscription(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscription()
  }, [companyId])

  return {
    subscription,
    loading,
    error,
    refresh: fetchSubscription
  }
}



