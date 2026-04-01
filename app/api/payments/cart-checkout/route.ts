import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, isNextResponse } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

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

    // Separate courses and company accounts
    const courses = items.filter(item => item.type === 'course');
    const companyAccounts = items.filter(item => item.type === 'company_account');

    // Create line items for Stripe checkout
    const lineItems = [] as any[];
    const metadata: Record<string, string> = {
      userId: String(user.id),
      userEmail: String(user.email),
      userName: String(customerData.firstName + ' ' + customerData.lastName),
    };

    // Add course items
    for (const course of courses) {
      const { data: dbCourse } = await admin.from('courses').select('id, title, description, price, image, is_published').eq('id', course.id).single();
      if (!dbCourse || !dbCourse.is_published) {
        return NextResponse.json({ error: `Course ${course.title} is not available` }, { status: 400 });
      }

      lineItems.push({
        price_data: {
          currency: 'sek',
          product_data: {
            name: dbCourse.title,
            description: dbCourse.description,
            images: dbCourse.image ? [(dbCourse.image as string)] : [],
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
    console.log('Creating Stripe checkout session with line items:', lineItems);
    console.log('Metadata:', metadata);
    console.log('Stripe instance:', !!stripe);
    
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

    for (const course of courses) {
      await admin.from('enrollments').upsert(
        { user_id: user.id, course_id: course.id, is_paid: false, payment_amount: course.price,
          stripe_payment_id: checkoutSession.payment_intent as string,
          stripe_customer_id: checkoutSession.customer as string },
        { onConflict: 'user_id,course_id' }
      );
    }

    if (companyAccounts.length > 0 && customerData?.organizationNumber) {
      const contactName = `${customerData.firstName} ${customerData.lastName}`;
      const addr = `${customerData.address}, ${customerData.postalCode} ${customerData.city}`;
      await admin.from('companies').upsert(
        { organization_number: customerData.organizationNumber, name: customerData.companyName,
          contact_person: contactName, email: customerData.email, phone: customerData.phone,
          address: addr, payment_status: 'PENDING' },
        { onConflict: 'organization_number' }
      );
    }

    console.log(`Cart checkout session created: ${checkoutSession.id} for ${user.email}`);

    return NextResponse.json({
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
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
