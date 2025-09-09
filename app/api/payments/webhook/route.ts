import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { verifyWebhookSignature } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

    try {
      // Verify signature and no-op (deprecated route)
      verifyWebhookSignature(body, signature)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // This legacy endpoint is deprecated; main webhook is at /api/webhooks/stripe
    return NextResponse.json({ received: true, note: 'Use /api/webhooks/stripe' })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}



