import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import type { CoursePaymentData, CompanyPaymentData } from '@/lib/types/payment';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { items, customerData } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Separate courses and company accounts
    const courses = items.filter(item => item.type === 'course');
    const companyAccounts = items.filter(item => item.type === 'company_account');

    // Create line items for Stripe checkout
    const lineItems = [];
    let metadata = {
      userId: user.id,
      userEmail: user.email,
      userName: customerData.firstName + ' ' + customerData.lastName,
    };

    // Add course items
    for (const course of courses) {
      // Verify course exists and get current price
      const dbCourse = await prisma.course.findUnique({
        where: { id: course.id }
      });

      if (!dbCourse || !dbCourse.isPublished) {
        return NextResponse.json(
          { error: `Course ${course.title} is not available` },
          { status: 400 }
        );
      }

      lineItems.push({
        price_data: {
          currency: 'sek',
          product_data: {
            name: dbCourse.title,
            description: dbCourse.description,
            images: dbCourse.image ? [dbCourse.image] : [],
          },
          unit_amount: Math.round(dbCourse.price * 100), // Convert to öre
        },
        quantity: 1,
      });

      // Add course to metadata
      metadata[`course_${course.id}`] = dbCourse.title;
    }

    // Add company account items
    for (const companyAccount of companyAccounts) {
      lineItems.push({
        price_data: {
          currency: 'sek',
          product_data: {
            name: companyAccount.title,
            description: companyAccount.description,
            images: companyAccount.image ? [companyAccount.image] : [],
          },
          unit_amount: Math.round(companyAccount.price * 100),
        },
        quantity: 1,
      });

      metadata[`company_account`] = 'true';
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'klarna'],
      line_items: lineItems,
      customer_email: customerData.email,
      metadata: metadata,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/checkout?canceled=true`,
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
      // Store customer data in Stripe
      customer_creation: 'always',
      phone_number_collection: {
        enabled: true,
      },
    });

    // Store pending enrollments/purchases in database
    for (const course of courses) {
      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
        create: {
          userId: user.id,
          courseId: course.id,
          isPaid: false,
          paymentAmount: course.price,
          stripePaymentId: checkoutSession.payment_intent as string,
          stripeCustomerId: checkoutSession.customer as string,
        },
        update: {
          isPaid: false,
          paymentAmount: course.price,
          stripePaymentId: checkoutSession.payment_intent as string,
          stripeCustomerId: checkoutSession.customer as string,
        },
      });
    }

    // Handle company account purchases
    if (companyAccounts.length > 0) {
      // Create or update company based on customer data
      const company = await prisma.company.upsert({
        where: {
          organizationNumber: customerData.organizationNumber,
        },
        create: {
          organizationNumber: customerData.organizationNumber,
          name: customerData.companyName,
          contactPerson: `${customerData.firstName} ${customerData.lastName}`,
          email: customerData.email,
          phone: customerData.phone,
          address: `${customerData.address}, ${customerData.postalCode} ${customerData.city}`,
          paymentStatus: 'PENDING',
        },
        update: {
          contactPerson: `${customerData.firstName} ${customerData.lastName}`,
          email: customerData.email,
          phone: customerData.phone,
          address: `${customerData.address}, ${customerData.postalCode} ${customerData.city}`,
          paymentStatus: 'PENDING',
        },
      });
    }

    console.log(`Cart checkout session created: ${checkoutSession.id} for ${user.email}`);

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('Cart checkout creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
