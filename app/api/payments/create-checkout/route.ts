import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse, type AuthUser } from '@/lib/auth';
import { isPaymentsDisabled } from '@/lib/payments-disabled';
import { createAdminClient } from '@/lib/supabase/admin';
import { createFortnoxCustomerFromPayment, createInvoiceFromPayment } from '@/lib/fortnox';
import type { CoursePaymentData, CompanyPaymentData } from '@/lib/types/payment';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const body = await request.json();
    const { type, courseId, companyId } = body;

    if (!type || !['course', 'company_plan'].includes(type)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: user } = await admin.from('users').select('id, email, name, role, company_id').eq('id', authResult.id).single();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (type === 'course') return await handleCoursePayment(courseId, user, admin, authResult);
    if (type === 'company_plan') return await handleCompanyPayment(companyId, user, admin);

    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });

  } catch (error) {
    console.error('Payment checkout creation error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

async function handleCoursePayment(
  courseId: string,
  user: { id: string; email: string; name: string | null; role: string; company_id: string | null },
  admin: ReturnType<typeof createAdminClient>,
  authUser: AuthUser
) {
  if (!courseId) return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });

  if (isPaymentsDisabled()) {
    return NextResponse.json(
      {
        error:
          'Betalning är avstängd i demo-läge. Registrera dig för kursen på kursens sida i stället (ingen faktura).',
      },
      { status: 400 }
    );
  }

  if (authUser.role === 'ADMIN') {
    return NextResponse.json(
      {
        error:
          'Administratörer behöver inte betala. Använd "Registrera dig för kursen" på kursens sida i stället för köp.',
      },
      { status: 400 }
    );
  }

  const { data: course } = await admin.from('courses').select('id, title, price, is_published').eq('id', courseId).single();
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  if (!course.is_published) return NextResponse.json({ error: 'Course is not available for purchase' }, { status: 400 });

  const { data: existingEnrollment } = await admin.from('enrollments').select('is_paid, is_gift')
    .eq('user_id', user.id).eq('course_id', courseId).maybeSingle();
  if (existingEnrollment?.is_paid || existingEnrollment?.is_gift) {
    return NextResponse.json({ error: 'You already have access to this course' }, { status: 400 });
  }

  const paymentData: CoursePaymentData = {
    courseId: course.id, userId: user.id, amount: course.price, currency: 'SEK',
    courseName: course.title, userEmail: user.email, userName: user.name ?? 'Unknown User',
  };

  try {
    const customerNumber = await createFortnoxCustomerFromPayment(paymentData);
    const invoiceNumber = await createInvoiceFromPayment(customerNumber, paymentData);

    await admin.from('enrollments').upsert(
      { user_id: user.id, course_id: courseId, is_paid: false, payment_amount: course.price,
        fortnox_invoice_id: invoiceNumber },
      { onConflict: 'user_id,course_id' }
    );

    return NextResponse.json({ success: true, invoiceNumber, message: 'Faktura skapad och skickas till din e-post' });
  } catch (error) {
    console.error('Course invoice creation error:', error);
    return NextResponse.json({ error: 'Failed to create invoice', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

async function handleCompanyPayment(companyId: string, user: any, admin: ReturnType<typeof createAdminClient>) {
  if (isPaymentsDisabled()) {
    return NextResponse.json(
      { error: 'Betalning är avstängd i demo-läge. Företagsåtkomst behandlas som aktiv utan faktura.' },
      { status: 400 }
    );
  }

  if (!user.company_id || user.company_id !== companyId) {
    return NextResponse.json({ error: 'You are not authorized to make payments for this company' }, { status: 403 });
  }
  if (user.role !== 'COMPANY_ADMIN') {
    return NextResponse.json({ error: 'Only company administrators can make payments' }, { status: 403 });
  }

  const { data: company } = await admin.from('companies').select('id, name, email, plan, plan_price, payment_status, plan_end_date').eq('id', companyId).single();
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  if (company.payment_status === 'PAID' && company.plan_end_date && new Date(company.plan_end_date) > new Date()) {
    return NextResponse.json({ error: 'Company already has an active subscription' }, { status: 400 });
  }

  const paymentData: CompanyPaymentData = {
    companyId: company.id, amount: company.plan_price ?? 0, currency: 'SEK',
    planName: company.plan ?? 'Standard', companyName: company.name,
    companyEmail: company.email, billingPeriod: 'yearly',
  };

  try {
    const customerNumber = await createFortnoxCustomerFromPayment(paymentData);
    const invoiceNumber = await createInvoiceFromPayment(customerNumber, paymentData);

    await admin.from('companies').update({ payment_status: 'PENDING' }).eq('id', companyId);

    return NextResponse.json({ success: true, invoiceNumber, message: 'Faktura skapad och skickas till din e-post' });
  } catch (error) {
    console.error('Company invoice creation error:', error);
    return NextResponse.json({ error: 'Failed to create company invoice', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
