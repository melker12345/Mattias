import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, isNextResponse } from '@/lib/auth'
import { validateCompanySubscription } from '@/lib/payment-validation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth()
    if (isNextResponse(authResult)) return authResult

    const companyId = params.id

    // Validate that user has access to this company
    if (authResult.role !== 'ADMIN' && authResult.companyId !== companyId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const validation = await validateCompanySubscription(companyId)

    return NextResponse.json(validation)

  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment status' },
      { status: 500 }
    )
  }
}



