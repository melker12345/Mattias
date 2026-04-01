import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { fortnox } from '@/lib/fortnox';
import type { CoursePaymentData } from '@/lib/types/payment';

export async function POST(request: NextRequest) {
  try {
    console.log('Cart checkout API called');
    const authResult = await requireAuth();
    if (isNextResponse(authResult)) return authResult;

    const body = await request.json();
    const { items, customerData } = body;
    console.log('Request body:', { items, customerData });

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('No items in cart');
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: user } = await admin.from('users').select('id, email, name').eq('id', authResult.id).single();
    console.log('User found:', user?.email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const courses = items.filter((item: any) => item.type === 'course');
    const companyAccounts = items.filter((item: any) => item.type === 'company_account');
    const userName = `${customerData?.firstName ?? ''} ${customerData?.lastName ?? ''}`.trim() || user.name || 'Unknown';
    const userEmail = customerData?.email || user.email;

    // Create Fortnox customer
    const customerNumber = await fortnox.createOrUpdateCustomer({
      email: userEmail,
      name: userName,
      phone: customerData?.phone,
      address: customerData?.address,
      zipCode: customerData?.postalCode,
      city: customerData?.city,
      organizationNumber: customerData?.organizationNumber,
    });

    const invoiceNumbers: string[] = [];

    // Create one invoice per course
    for (const course of courses) {
      const { data: dbCourse } = await admin.from('courses').select('id, title, price, is_published').eq('id', course.id).single();
      if (!dbCourse || !dbCourse.is_published) {
        return NextResponse.json({ error: `Course ${course.title || course.id} is not available` }, { status: 400 });
      }

      const paymentData: CoursePaymentData = {
        courseId: dbCourse.id, userId: user.id, amount: dbCourse.price,
        currency: 'SEK', courseName: dbCourse.title, userEmail, userName,
      };
      const invoiceNumber = await fortnox.createCourseInvoice(customerNumber, paymentData);
      invoiceNumbers.push(invoiceNumber);

      await admin.from('enrollments').upsert(
        { user_id: user.id, course_id: dbCourse.id, is_paid: false,
          payment_amount: dbCourse.price, fortnox_invoice_id: invoiceNumber },
        { onConflict: 'user_id,course_id' }
      );
    }

    // Handle company account purchase
    if (companyAccounts.length > 0 && customerData?.organizationNumber) {
      const contactName = userName;
      const addr = [customerData.address, customerData.postalCode, customerData.city].filter(Boolean).join(', ');
      await admin.from('companies').upsert(
        { organization_number: customerData.organizationNumber, name: customerData.companyName,
          contact_person: contactName, email: userEmail, phone: customerData.phone,
          address: addr, payment_status: 'PENDING' },
        { onConflict: 'organization_number' }
      );
    }

    console.log(`Cart invoices created for ${userEmail}: ${invoiceNumbers.join(', ')}`);

    return NextResponse.json({
      success: true,
      invoiceNumbers,
      message: `${invoiceNumbers.length} faktura(or) skapad(e) och skickas till din e-post`,
    });

  } catch (error) {
    console.error('Cart checkout creation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
