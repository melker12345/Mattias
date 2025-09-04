import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature } from '@/lib/stripe';
import { createFortnoxCustomerFromPayment, createInvoiceFromPayment } from '@/lib/fortnox';
import type { CoursePaymentData, CompanyPaymentData, PaymentProcessingResult } from '@/lib/types/payment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Missing Stripe signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature);
    
    console.log(`Processing Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        return await handleCheckoutSessionCompleted(event.data.object);
      
      case 'payment_intent.succeeded':
        return await handlePaymentIntentSucceeded(event.data.object);
      
      case 'payment_intent.payment_failed':
        return await handlePaymentIntentFailed(event.data.object);
      
      case 'invoice.payment_succeeded':
        return await handleInvoicePaymentSucceeded(event.data.object);
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return await handleSubscriptionEvent(event.data.object);
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return NextResponse.json({ received: true });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any): Promise<NextResponse> {
  try {
    console.log(`Processing checkout session completed: ${session.id}`);
    
    const metadata = session.metadata;
    if (!metadata || !metadata.type) {
      console.error('Missing metadata in checkout session');
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    if (metadata.type === 'course') {
      return await processCoursePayment(session);
    } else if (metadata.type === 'company_plan') {
      return await processCompanyPayment(session);
    }

    console.error(`Unknown payment type: ${metadata.type}`);
    return NextResponse.json({ error: 'Unknown payment type' }, { status: 400 });

  } catch (error) {
    console.error('Checkout session processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout session' },
      { status: 500 }
    );
  }
}

async function processCoursePayment(session: any): Promise<NextResponse> {
  const metadata = session.metadata;
  const { userId, courseId, courseName, userName } = metadata;

  try {
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error('User not found:', { userId });
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Handle single course payment
    if (courseId) {
      return await processSingleCourse(session, user, courseId);
    }
    
    // Handle cart payment (multiple courses)
    return await processCartPayment(session, user);

  } catch (error) {
    console.error('Course payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process course payment' },
      { status: 500 }
    );
  }
}

async function processSingleCourse(session: any, user: any, courseId: string): Promise<NextResponse> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    console.error('Course not found:', { courseId });
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  // Update enrollment with payment confirmation
  const enrollment = await prisma.enrollment.upsert({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
    create: {
      userId: user.id,
      courseId: courseId,
      isPaid: true,
      paidAt: new Date(),
      stripePaymentId: session.payment_intent,
      stripeCustomerId: session.customer,
      paymentAmount: course.price,
      paymentMethod: session.payment_method_types?.[0] || 'card',
    },
    update: {
      isPaid: true,
      paidAt: new Date(),
      stripePaymentId: session.payment_intent,
      stripeCustomerId: session.customer,
      paymentAmount: course.price,
      paymentMethod: session.payment_method_types?.[0] || 'card',
    },
  });

    // Create Payment record
    await prisma.payment.create({
      data: {
        userId: userId,
        courseId: courseId,
        enrollmentId: enrollment.id,
        stripePaymentId: session.payment_intent,
        stripeCustomerId: session.customer,
        stripeSessionId: session.id,
        amount: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
        status: 'succeeded',
        paymentMethod: session.payment_method_types?.[0] || 'card',
        metadata: JSON.stringify(metadata),
      },
    });

    // Process Fortnox integration asynchronously
    processFortnoxIntegration({
      userId,
      courseId,
      amount: session.amount_total / 100,
      currency: session.currency.toUpperCase(),
      courseName,
      userEmail: user.email,
      userName: userName || user.name || 'Unknown User',
    }, session.payment_intent).catch((error) => {
      console.error('Fortnox integration failed:', error);
      // Don't fail the webhook - payment is already processed
    });

  console.log(`Single course payment processed successfully for user ${user.id}, course ${courseId}`);
  return NextResponse.json({ 
    success: true, 
    enrollmentId: enrollment.id,
    message: 'Course payment processed successfully' 
  });
}

async function processCartPayment(session: any, user: any): Promise<NextResponse> {
  const metadata = session.metadata;
  
  try {
    const enrollments = [];
    
    // Process all courses in the metadata
    for (const [key, value] of Object.entries(metadata)) {
      if (key.startsWith('course_')) {
        const courseId = key.replace('course_', '');
        
        // Get course data
        const course = await prisma.course.findUnique({
          where: { id: courseId },
        });

        if (!course) {
          console.warn(`Course not found in cart payment: ${courseId}`);
          continue;
        }

        // Update enrollment with payment confirmation
        const enrollment = await prisma.enrollment.upsert({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: courseId,
            },
          },
          create: {
            userId: user.id,
            courseId: courseId,
            isPaid: true,
            paidAt: new Date(),
            stripePaymentId: session.payment_intent,
            stripeCustomerId: session.customer,
            paymentAmount: course.price,
            paymentMethod: session.payment_method_types?.[0] || 'card',
          },
          update: {
            isPaid: true,
            paidAt: new Date(),
            stripePaymentId: session.payment_intent,
            stripeCustomerId: session.customer,
            paymentAmount: course.price,
            paymentMethod: session.payment_method_types?.[0] || 'card',
          },
        });

        enrollments.push(enrollment);

        // Create Payment record
        await prisma.payment.create({
          data: {
            userId: user.id,
            courseId: courseId,
            enrollmentId: enrollment.id,
            stripePaymentId: session.payment_intent,
            stripeCustomerId: session.customer,
            stripeSessionId: session.id,
            amount: course.price,
            currency: session.currency.toUpperCase(),
            status: 'succeeded',
            paymentMethod: session.payment_method_types?.[0] || 'card',
            metadata: JSON.stringify({ source: 'cart', courseName: course.title }),
          },
        });
      }
    }

    // Handle company account creation if present
    if (metadata.company_account === 'true') {
      // Company account logic would go here
      console.log('Company account purchased in cart');
    }

    console.log(`Cart payment processed successfully for user ${user.id}, ${enrollments.length} courses`);
    return NextResponse.json({ 
      success: true, 
      enrollments: enrollments.length,
      message: 'Cart payment processed successfully' 
    });

  } catch (error) {
    console.error('Cart payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process cart payment' },
      { status: 500 }
    );
  }
}

async function processCompanyPayment(session: any): Promise<NextResponse> {
  const metadata = session.metadata;
  const { companyId, planName, companyName, billingPeriod } = metadata;

  try {
    // Get company data
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      console.error('Company not found:', companyId);
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Calculate plan end date
    const planStartDate = new Date();
    const planEndDate = new Date();
    if (billingPeriod === 'yearly') {
      planEndDate.setFullYear(planEndDate.getFullYear() + 1);
    } else {
      planEndDate.setMonth(planEndDate.getMonth() + 1);
    }

    // Update company subscription
    await prisma.company.update({
      where: { id: companyId },
      data: {
        paymentStatus: 'PAID',
        planStartDate: planStartDate,
        planEndDate: planEndDate,
        isActive: true,
      },
    });

    // Create Payment record
    await prisma.payment.create({
      data: {
        companyId: companyId,
        stripePaymentId: session.payment_intent,
        stripeCustomerId: session.customer,
        stripeSessionId: session.id,
        amount: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
        status: 'succeeded',
        paymentMethod: session.payment_method_types?.[0] || 'card',
        metadata: JSON.stringify(metadata),
      },
    });

    // Process Fortnox integration asynchronously
    processFortnoxIntegration({
      companyId,
      amount: session.amount_total / 100,
      currency: session.currency.toUpperCase(),
      planName,
      companyName,
      companyEmail: company.email,
      billingPeriod: billingPeriod as 'monthly' | 'yearly',
    }, session.payment_intent).catch((error) => {
      console.error('Fortnox company integration failed:', error);
      // Don't fail the webhook - payment is already processed
    });

    console.log(`Company payment processed successfully for company ${companyId}`);
    return NextResponse.json({ 
      success: true,
      message: 'Company payment processed successfully' 
    });

  } catch (error) {
    console.error('Company payment processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process company payment' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any): Promise<NextResponse> {
  try {
    console.log(`Payment intent succeeded: ${paymentIntent.id}`);
    
    // Update payment record status
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { status: 'succeeded' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment intent success handling error:', error);
    return NextResponse.json({ error: 'Failed to handle payment success' }, { status: 500 });
  }
}

async function handlePaymentIntentFailed(paymentIntent: any): Promise<NextResponse> {
  try {
    console.log(`Payment intent failed: ${paymentIntent.id}`);
    
    // Update payment record status
    await prisma.payment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { 
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message || 'Unknown error',
      },
    });

    // Update enrollment status
    await prisma.enrollment.updateMany({
      where: { stripePaymentId: paymentIntent.id },
      data: { isPaid: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment intent failure handling error:', error);
    return NextResponse.json({ error: 'Failed to handle payment failure' }, { status: 500 });
  }
}

async function handleInvoicePaymentSucceeded(invoice: any): Promise<NextResponse> {
  try {
    console.log(`Invoice payment succeeded: ${invoice.id}`);
    // Handle subscription invoice payments if needed
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Invoice payment success handling error:', error);
    return NextResponse.json({ error: 'Failed to handle invoice payment' }, { status: 500 });
  }
}

async function handleSubscriptionEvent(subscription: any): Promise<NextResponse> {
  try {
    console.log(`Subscription event: ${subscription.id}`);
    // Handle subscription updates if needed
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subscription event handling error:', error);
    return NextResponse.json({ error: 'Failed to handle subscription event' }, { status: 500 });
  }
}

// Async function to handle Fortnox integration without blocking webhook response
async function processFortnoxIntegration(
  paymentData: CoursePaymentData | CompanyPaymentData,
  stripePaymentId: string
): Promise<void> {
  try {
    console.log('Starting Fortnox integration...');
    
    // Create customer in Fortnox
    const customerNumber = await createFortnoxCustomerFromPayment(paymentData);
    
    // Create invoice in Fortnox
    const invoiceNumber = await createInvoiceFromPayment(customerNumber, paymentData, stripePaymentId);
    
    // Update payment record with Fortnox data
    await prisma.payment.updateMany({
      where: { stripePaymentId },
      data: {
        fortnoxInvoiceId: invoiceNumber,
        fortnoxCustomerId: customerNumber,
        fortnoxSynced: true,
        fortnoxSyncedAt: new Date(),
      },
    });

    // Update enrollment with Fortnox data if it's a course payment
    if ('courseId' in paymentData) {
      await prisma.enrollment.updateMany({
        where: { stripePaymentId },
        data: { fortnoxInvoiceId: invoiceNumber },
      });
    }

    console.log(`Fortnox integration completed: Customer ${customerNumber}, Invoice ${invoiceNumber}`);
  } catch (error) {
    console.error('Fortnox integration error:', error);
    
    // Update payment record to indicate Fortnox sync failure
    await prisma.payment.updateMany({
      where: { stripePaymentId },
      data: {
        fortnoxSynced: false,
        metadata: JSON.stringify({
          fortnoxError: error instanceof Error ? error.message : 'Unknown error',
          fortnoxErrorAt: new Date().toISOString(),
        }),
      },
    });
  }
}
