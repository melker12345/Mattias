import { prisma } from './prisma'

// Payment status types
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'FAILED'
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIAL' | 'EXPIRED'

// Payment validation interface
export interface PaymentValidation {
  isValid: boolean
  status: PaymentStatus
  message: string
  expiresAt?: Date
  gracePeriod?: boolean
}

// Subscription validation interface
export interface SubscriptionValidation {
  isActive: boolean
  status: SubscriptionStatus
  message: string
  expiresAt?: Date
  gracePeriodDays?: number
}

/**
 * Validate company payment status and subscription
 */
export async function validateCompanyPayment(companyId: string): Promise<PaymentValidation> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        invoices: {
          where: { status: 'PENDING' },
          orderBy: { dueDate: 'desc' },
          take: 1
        }
      }
    })

    if (!company) {
      return {
        isValid: false,
        status: 'FAILED',
        message: 'Företag hittades inte'
      }
    }

    // Check if company has active subscription
    const now = new Date()
    const planEndDate = company.planEndDate
    const gracePeriodDays = 7 // 7 days grace period after expiration

    if (!planEndDate) {
      return {
        isValid: false,
        status: 'PENDING',
        message: 'Prenumeration saknas'
      }
    }

    // Check if subscription is expired
    if (planEndDate < now) {
      const gracePeriodEnd = new Date(planEndDate.getTime() + gracePeriodDays * 24 * 60 * 60 * 1000)
      
      if (gracePeriodEnd < now) {
        // Subscription expired and grace period passed
        return {
          isValid: false,
          status: 'OVERDUE',
          message: 'Prenumerationen har löpt ut',
          expiresAt: planEndDate
        }
      } else {
        // In grace period
        return {
          isValid: true,
          status: 'OVERDUE',
          message: 'Prenumerationen har löpt ut men du har fortfarande tillgång',
          expiresAt: gracePeriodEnd,
          gracePeriod: true
        }
      }
    }

    // Check for pending invoices
    const pendingInvoice = company.invoices[0]
    if (pendingInvoice && pendingInvoice.dueDate < now) {
      return {
        isValid: true,
        status: 'OVERDUE',
        message: 'Du har en förfallen faktura men behåller tillgång',
        expiresAt: pendingInvoice.dueDate,
        gracePeriod: true
      }
    }

    // All good
    return {
      isValid: true,
      status: 'PAID',
      message: 'Prenumerationen är aktiv',
      expiresAt: planEndDate
    }

  } catch (error) {
    console.error('Payment validation error:', error)
    return {
      isValid: false,
      status: 'FAILED',
      message: 'Ett fel uppstod vid validering av betalning'
    }
  }
}

/**
 * Validate course access for a user
 */
export async function validateCourseAccess(userId: string, courseId: string): Promise<boolean> {
  try {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE'
      },
      include: {
        coursePurchase: {
          include: {
            company: true
          }
        }
      }
    })

    if (!enrollment) {
      return false
    }

    // If enrollment is through company, validate company payment
    if (enrollment.coursePurchase?.companyId) {
      const companyValidation = await validateCompanyPayment(enrollment.coursePurchase.companyId)
      return companyValidation.isValid
    }

    // Individual enrollment - check if user has paid
    return true

  } catch (error) {
    console.error('Course access validation error:', error)
    return false
  }
}

/**
 * Update payment status after successful payment
 */
export async function updatePaymentStatus(
  companyId: string, 
  paymentStatus: PaymentStatus,
  stripePaymentId?: string
): Promise<void> {
  try {
    // Update company payment status
    await prisma.company.update({
      where: { id: companyId },
      data: {
        paymentStatus,
        planEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Extend by 1 year
        updatedAt: new Date()
      }
    })

    // Update pending invoices
    await prisma.invoice.updateMany({
      where: {
        companyId,
        status: 'PENDING'
      },
      data: {
        status: paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
        paidAt: paymentStatus === 'PAID' ? new Date() : null
      }
    })

    // Log payment event
    if (stripePaymentId) {
      await prisma.paymentLog.create({
        data: {
          companyId,
          stripePaymentId,
          amount: 1500, // Fixed company price
          currency: 'SEK',
          status: paymentStatus,
          metadata: JSON.stringify({ type: 'company_registration' })
        }
      })
    }

  } catch (error) {
    console.error('Payment status update error:', error)
    throw new Error('Failed to update payment status')
  }
}

/**
 * Check if user has access to paywalled features
 */
export async function checkPaywallAccess(userId: string, feature: 'company_registration' | 'course_learning' | 'progress_tracking'): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true
      }
    })

    if (!user) {
      return false
    }

    switch (feature) {
      case 'company_registration':
        // Only allow if user is admin or doesn't have a company
        return user.role === 'ADMIN' || !user.companyId

      case 'course_learning':
      case 'progress_tracking':
        // Check if user has active enrollments
        const activeEnrollments = await prisma.enrollment.findFirst({
          where: {
            userId,
            status: 'ACTIVE'
          }
        })
        return !!activeEnrollments

      default:
        return false
    }

  } catch (error) {
    console.error('Paywall access check error:', error)
    return false
  }
}

/**
 * Get subscription details for a company
 */
export async function getSubscriptionDetails(companyId: string) {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!company) {
      return null
    }

    const now = new Date()
    const isActive = company.planEndDate ? company.planEndDate > now : false
    const daysUntilExpiry = company.planEndDate 
      ? Math.ceil((company.planEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0

    return {
      plan: company.plan,
      planPrice: company.planPrice,
      planStartDate: company.planStartDate,
      planEndDate: company.planEndDate,
      paymentStatus: company.paymentStatus,
      isActive,
      daysUntilExpiry,
      invoices: company.invoices
    }

  } catch (error) {
    console.error('Subscription details error:', error)
    return null
  }
}

/**
 * Handle payment webhook from Stripe
 */
export async function handlePaymentWebhook(event: any): Promise<void> {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSuccess(event.data.object)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailure(event.data.object)
        break
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

  } catch (error) {
    console.error('Payment webhook error:', error)
    throw error
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: any): Promise<void> {
  const { companyId } = paymentIntent.metadata
  
  if (companyId) {
    await updatePaymentStatus(companyId, 'PAID', paymentIntent.id)
    
    // Send confirmation email
    // await sendPaymentConfirmationEmail(companyId)
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent: any): Promise<void> {
  const { companyId } = paymentIntent.metadata
  
  if (companyId) {
    await updatePaymentStatus(companyId, 'FAILED', paymentIntent.id)
    
    // Send failure notification
    // await sendPaymentFailureEmail(companyId)
  }
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaymentSuccess(invoice: any): Promise<void> {
  // Handle subscription renewals
  const { companyId } = invoice.metadata
  
  if (companyId) {
    await updatePaymentStatus(companyId, 'PAID')
  }
}

/**
 * Handle failed invoice payment
 */
async function handleInvoicePaymentFailure(invoice: any): Promise<void> {
  const { companyId } = invoice.metadata
  
  if (companyId) {
    await updatePaymentStatus(companyId, 'OVERDUE')
  }
}



