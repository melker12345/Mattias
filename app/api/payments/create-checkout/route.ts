import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createCourseCheckoutSession, createCompanyCheckoutSession } from '@/lib/stripe';
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
    const { type, courseId, companyId } = body;

    // Validate request type
    if (!type || !['course', 'company_plan'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid payment type. Must be "course" or "company_plan"' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { company: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (type === 'course') {
      return await handleCoursePayment(courseId, user);
    } else if (type === 'company_plan') {
      return await handleCompanyPayment(companyId, user);
    }

    return NextResponse.json(
      { error: 'Invalid payment type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Payment checkout creation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleCoursePayment(courseId: string, user: any) {
  if (!courseId) {
    return NextResponse.json(
      { error: 'Course ID is required for course payments' },
      { status: 400 }
    );
  }

  // Get course details
  const course = await prisma.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    return NextResponse.json(
      { error: 'Course not found' },
      { status: 404 }
    );
  }

  if (!course.isPublished) {
    return NextResponse.json(
      { error: 'Course is not available for purchase' },
      { status: 400 }
    );
  }

  // Check if user already has access to this course
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: courseId,
      },
    },
  });

  if (existingEnrollment) {
    if (existingEnrollment.isPaid || existingEnrollment.isGift) {
      return NextResponse.json(
        { error: 'You already have access to this course' },
        { status: 400 }
      );
    }
  }

  // Create payment data
  const paymentData: CoursePaymentData = {
    courseId: course.id,
    userId: user.id,
    amount: course.price,
    currency: 'SEK',
    courseName: course.title,
    userEmail: user.email,
    userName: user.name || 'Unknown User',
  };

  try {
    // Create Stripe checkout session
    const checkoutSession = await createCourseCheckoutSession(paymentData);

    // Create or update enrollment record
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: courseId,
        },
      },
      create: {
        userId: user.id,
        courseId: courseId,
        isPaid: false,
        paymentAmount: course.price,
        stripePaymentId: checkoutSession.paymentIntentId,
        stripeCustomerId: checkoutSession.customerId,
      },
      update: {
        isPaid: false,
        paymentAmount: course.price,
        stripePaymentId: checkoutSession.paymentIntentId,
        stripeCustomerId: checkoutSession.customerId,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('Course payment creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function handleCompanyPayment(companyId: string, user: any) {
  // Check if user is admin of the company
  if (!user.companyId || user.companyId !== companyId) {
    return NextResponse.json(
      { error: 'You are not authorized to make payments for this company' },
      { status: 403 }
    );
  }

  if (user.role !== 'COMPANY_ADMIN') {
    return NextResponse.json(
      { error: 'Only company administrators can make payments' },
      { status: 403 }
    );
  }

  // Get company details
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    return NextResponse.json(
      { error: 'Company not found' },
      { status: 404 }
    );
  }

  // Check if company already has active subscription
  if (company.paymentStatus === 'PAID' && company.planEndDate && company.planEndDate > new Date()) {
    return NextResponse.json(
      { error: 'Company already has an active subscription' },
      { status: 400 }
    );
  }

  // Create payment data
  const paymentData: CompanyPaymentData = {
    companyId: company.id,
    amount: company.planPrice,
    currency: 'SEK',
    planName: company.plan,
    companyName: company.name,
    companyEmail: company.email,
    billingPeriod: 'yearly',
  };

  try {
    // Create Stripe checkout session
    const checkoutSession = await createCompanyCheckoutSession(paymentData);

    // Update company payment tracking
    await prisma.company.update({
      where: { id: companyId },
      data: {
        paymentStatus: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    });

  } catch (error) {
    console.error('Company payment creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create company payment session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
