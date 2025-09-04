import Stripe from 'stripe';
import { loadStripe } from '@stripe/stripe-js';
import { 
  StripeError 
} from './types/payment';
import type { 
  CheckoutSession, 
  CoursePaymentData, 
  CompanyPaymentData
} from './types/payment';

// Server-side Stripe instance
export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 
  'sk_test_51S3admAg9GYbrVh7z5KfLTkM34Rw9Jha40ep38J6g1Fq4fjtOWZEjhWvX2dtgPWe5NyzFXShYLq7iYSImZBlSNsu00xLEeFXcw', 
  {
    apiVersion: '2023-10-16',
    typescript: true,
  }
);

// Client-side Stripe promise
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
  'pk_test_51S3admAg9GYbrVh7DPV15rklddjVOQBqZcshYmL262JPrVGK61M05wjqwfd7a6o2NSHUydoOPYutpKg3CLm8X0sH000UWjcTnR'
);

/**
 * Create a checkout session for course purchase
 */
export async function createCourseCheckoutSession(
  paymentData: CoursePaymentData
): Promise<CheckoutSession> {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'klarna'],
      line_items: [
        {
          price_data: {
            currency: paymentData.currency.toLowerCase(),
            product_data: {
              name: paymentData.courseName,
              description: `Tillgång till kursen "${paymentData.courseName}"`,
              images: [], // TODO: Add course image URL
            },
            unit_amount: Math.round(paymentData.amount * 100), // Convert to öre
          },
          quantity: 1,
        },
      ],
      customer_email: paymentData.userEmail,
      metadata: {
        userId: paymentData.userId,
        courseId: paymentData.courseId,
        type: 'course',
        userName: paymentData.userName,
        courseName: paymentData.courseName,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/courses/${paymentData.courseId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/courses/${paymentData.courseId}?payment=canceled`,
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['SE', 'NO', 'DK', 'FI'],
      },
      locale: 'sv',
    });

    return {
      id: session.id,
      url: session.url!,
      paymentIntentId: session.payment_intent as string,
      customerId: session.customer as string,
      metadata: {
        userId: paymentData.userId,
        courseId: paymentData.courseId,
        type: 'course',
      },
    };
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
    throw new StripeError(
      `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CHECKOUT_SESSION_FAILED',
      500
    );
  }
}

/**
 * Create a checkout session for company subscription
 */
export async function createCompanyCheckoutSession(
  paymentData: CompanyPaymentData
): Promise<CheckoutSession> {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: paymentData.currency.toLowerCase(),
            product_data: {
              name: `${paymentData.planName} - Företagsplan`,
              description: `Årlig prenumeration för ${paymentData.companyName}`,
            },
            unit_amount: Math.round(paymentData.amount * 100),
            recurring: {
              interval: paymentData.billingPeriod === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      customer_email: paymentData.companyEmail,
      metadata: {
        companyId: paymentData.companyId,
        type: 'company_plan',
        planName: paymentData.planName,
        companyName: paymentData.companyName,
        billingPeriod: paymentData.billingPeriod,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/company?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard/company?payment=canceled`,
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
      billing_address_collection: 'required',
      locale: 'sv',
    });

    return {
      id: session.id,
      url: session.url!,
      paymentIntentId: session.payment_intent as string,
      customerId: session.customer as string,
      metadata: {
        companyId: paymentData.companyId,
        type: 'company_plan',
      },
    };
  } catch (error) {
    console.error('Stripe company checkout session creation failed:', error);
    throw new StripeError(
      `Failed to create company checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'COMPANY_CHECKOUT_SESSION_FAILED',
      500
    );
  }
}

/**
 * Retrieve a checkout session
 */
export async function retrieveCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'],
    });
    return session;
  } catch (error) {
    console.error('Failed to retrieve checkout session:', error);
    throw new StripeError(
      `Failed to retrieve checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CHECKOUT_SESSION_RETRIEVAL_FAILED',
      500
    );
  }
}

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(email: string, name: string, metadata?: Record<string, string>) {
  try {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: metadata || {},
    });
    return customer;
  } catch (error) {
    console.error('Failed to create Stripe customer:', error);
    throw new StripeError(
      `Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'CUSTOMER_CREATION_FAILED',
      500
    );
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): any {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new StripeError(
      `Invalid webhook signature: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'WEBHOOK_SIGNATURE_INVALID',
      400
    );
  }
}

/**
 * Process refund
 */
export async function processRefund(paymentIntentId: string, amount?: number, reason?: string) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason as any,
      metadata: {
        refundedAt: new Date().toISOString(),
      },
    });
    return refund;
  } catch (error) {
    console.error('Failed to process refund:', error);
    throw new StripeError(
      `Failed to process refund: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'REFUND_FAILED',
      500
    );
  }
}

/**
 * Get payment method details
 */
export async function getPaymentMethod(paymentMethodId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    console.error('Failed to retrieve payment method:', error);
    throw new StripeError(
      `Failed to retrieve payment method: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'PAYMENT_METHOD_RETRIEVAL_FAILED',
      500
    );
  }
}

/**
 * Format amount for display (convert from öre to SEK)
 */
export function formatAmount(amount: number, currency: string = 'SEK'): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Validate webhook event type
 */
export function isValidWebhookEventType(eventType: string): boolean {
  const validTypes = [
    'checkout.session.completed',
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted',
  ];
  return validTypes.includes(eventType);
}
