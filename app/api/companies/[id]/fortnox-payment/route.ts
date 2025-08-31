import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateFortnoxPayment, createFortnoxInvoice } from '@/lib/fortnox-payment-validation';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Du måste vara inloggad' },
        { status: 401 }
      );
    }

    const companyId = params.id;
    const { searchParams } = new URL(request.url);
    const invoiceNumber = searchParams.get('invoiceNumber');

    // Check if user has access to this company
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true }
    });

    if (!user || user.companyId !== companyId) {
      return NextResponse.json(
        { message: 'Du har inte behörighet att komma åt denna information' },
        { status: 403 }
      );
    }

    // Validate Fortnox payment
    const paymentValidation = await validateFortnoxPayment(companyId, invoiceNumber || undefined);

    return NextResponse.json(paymentValidation);

  } catch (error) {
    console.error('Error validating Fortnox payment:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid validering av betalning' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Du måste vara inloggad' },
        { status: 401 }
      );
    }

    const companyId = params.id;
    const body = await request.json();
    const { courseIds, totalAmount } = body;

    // Check if user has access to this company
    const user = await prisma.user.findUnique({
      where: { id: (session.user as any).id },
      include: { company: true }
    });

    if (!user || user.companyId !== companyId) {
      return NextResponse.json(
        { message: 'Du har inte behörighet att skapa fakturor för detta företag' },
        { status: 403 }
      );
    }

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { message: 'Kurs-ID:n krävs' },
        { status: 400 }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { message: 'Ogiltigt belopp' },
        { status: 400 }
      );
    }

    // Create Fortnox invoice
    const result = await createFortnoxInvoice(companyId, courseIds, totalAmount);

    if (!result.success) {
      return NextResponse.json(
        { message: result.error || 'Ett fel uppstod vid skapande av faktura' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Faktura skapades framgångsrikt',
      invoiceNumber: result.invoiceNumber
    });

  } catch (error) {
    console.error('Error creating Fortnox invoice:', error);
    return NextResponse.json(
      { message: 'Ett fel uppstod vid skapande av faktura' },
      { status: 500 }
    );
  }
}
