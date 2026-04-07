import { createAdminClient } from './supabase/admin';
import { isPaymentsDisabled } from './payments-disabled';
import { fortnox } from './fortnox';

export interface FortnoxPaymentValidation {
  isValid: boolean;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'FAILED';
  message: string;
  invoiceNumber?: string;
  amount?: number;
  dueDate?: Date;
  paidAt?: Date;
  fortnoxCustomerNumber?: string;
}

export interface FortnoxInvoiceValidation {
  isValid: boolean;
  invoiceNumber: string;
  customerNumber: string;
  amount: number;
  currency: string;
  dueDate: Date;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  items: FortnoxInvoiceItem[];
}

interface FortnoxInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vat: number;
}

/**
 * Validate Fortnox invoice and payment status
 */
export async function validateFortnoxPayment(
  companyId: string, 
  invoiceNumber?: string
): Promise<FortnoxPaymentValidation> {
  try {
    const admin = createAdminClient();
    const { data: company } = await admin.from('companies').select('id, name, email').eq('id', companyId).single();

    if (!company) {
      return { isValid: false, status: 'FAILED', message: 'Företag hittades inte' };
    }

    let targetInvoiceNumber = invoiceNumber;
    if (!targetInvoiceNumber) {
      const { data: latestInvoice } = await admin.from('invoices').select('invoice_number')
        .eq('company_id', companyId).eq('status', 'PENDING').order('due_date', { ascending: false }).limit(1).maybeSingle();
      targetInvoiceNumber = latestInvoice?.invoice_number;
    }
    
    if (!targetInvoiceNumber) {
      return {
        isValid: false,
        status: 'PENDING',
        message: 'Ingen faktura hittades'
      };
    }

    // Check if we have Fortnox integration enabled
    if (!process.env.FORTNOX_ACCESS_TOKEN) {
      return {
        isValid: false,
        status: 'FAILED',
        message: 'Fortnox integration är inte konfigurerad'
      };
    }

    // Validate invoice in Fortnox
    const fortnoxValidation = await validateFortnoxInvoice(targetInvoiceNumber, company);
    
    if (!fortnoxValidation.isValid) {
      return {
        isValid: false,
        status: 'FAILED',
        message: 'Faktura validering misslyckades'
      };
    }

    // Check payment status
    const isPaid = await (async () => {
      // Our Fortnox SDK getInvoice returns the Invoice object; check a permissive Paid flag if present
      const invoice = await fortnox.getInvoice(targetInvoiceNumber);
      return !!(invoice && (invoice as any).Paid);
    })();
    
    if (isPaid) {
      // Update local database
      await updateLocalPaymentStatus(companyId, targetInvoiceNumber, 'PAID');
      
      return {
        isValid: true,
        status: 'PAID',
        message: 'Fakturan är betald',
        invoiceNumber: targetInvoiceNumber,
        amount: fortnoxValidation.amount,
        dueDate: fortnoxValidation.dueDate,
        paidAt: new Date(),
        fortnoxCustomerNumber: fortnoxValidation.customerNumber
      };
    }

    // Check if overdue
    const now = new Date();
    const dueDate = fortnoxValidation.dueDate;
    const isOverdue = dueDate < now;

    if (isOverdue) {
      return {
        isValid: false,
        status: 'OVERDUE',
        message: 'Fakturan är förfallen',
        invoiceNumber: targetInvoiceNumber,
        amount: fortnoxValidation.amount,
        dueDate: fortnoxValidation.dueDate,
        fortnoxCustomerNumber: fortnoxValidation.customerNumber
      };
    }

    return {
      isValid: true,
      status: 'PENDING',
      message: 'Fakturan väntar på betalning',
      invoiceNumber: targetInvoiceNumber,
      amount: fortnoxValidation.amount,
      dueDate: fortnoxValidation.dueDate,
      fortnoxCustomerNumber: fortnoxValidation.customerNumber
    };

  } catch (error) {
    console.error('Fortnox payment validation error:', error);
    return {
      isValid: false,
      status: 'FAILED',
      message: 'Ett fel uppstod vid validering av betalning'
    };
  }
}

/**
 * Validate Fortnox invoice details
 */
async function validateFortnoxInvoice(
  invoiceNumber: string, 
  company: any
): Promise<FortnoxInvoiceValidation> {
  try {
    // Get invoice from Fortnox
    const fortnoxInvoice = await fortnox.getInvoice(invoiceNumber);
    
    if (!fortnoxInvoice) {
      throw new Error('Faktura hittades inte i Fortnox');
    }

    // Validate customer information
    if (fortnoxInvoice.CustomerNumber) {
      // Optional: could fetch and validate more customer data here if needed
    }

    // Items not available via current SDK response; compute amount from totals
    const items: FortnoxInvoiceItem[] = [];
    const totalAmount = (fortnoxInvoice as any).Total ?? 0;

    return {
      isValid: true,
      invoiceNumber: (fortnoxInvoice as any).DocumentNumber || invoiceNumber,
      customerNumber: (fortnoxInvoice as any).CustomerNumber,
      amount: totalAmount,
      currency: (fortnoxInvoice as any).Currency,
      dueDate: new Date((fortnoxInvoice as any).DueDate),
      status: determineInvoiceStatus(fortnoxInvoice as any),
      items
    };

  } catch (error) {
    console.error('Fortnox invoice validation error:', error);
    throw error;
  }
}

/**
 * Determine invoice status from Fortnox data
 */
function determineInvoiceStatus(fortnoxInvoice: any): 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' {
  // This would need to be adjusted based on actual Fortnox API response structure
  // For now, we'll use a simplified approach
  
  if (fortnoxInvoice.Cancelled) {
    return 'CANCELLED';
  }
  
  if (fortnoxInvoice.Paid) {
    return 'PAID';
  }
  
  const dueDate = new Date(fortnoxInvoice.DueDate);
  const now = new Date();
  
  if (dueDate < now) {
    return 'OVERDUE';
  }
  
  return 'SENT';
}

/**
 * Update local payment status after Fortnox validation
 */
async function updateLocalPaymentStatus(
  companyId: string, 
  invoiceNumber: string, 
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED'
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('invoices').update({ status, paid_at: status === 'PAID' ? new Date().toISOString() : null })
      .eq('company_id', companyId).eq('invoice_number', invoiceNumber);

    if (status === 'PAID') {
      await admin.from('companies').update({
        payment_status: 'PAID',
        plan_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('id', companyId);
    }

  } catch (error) {
    console.error('Error updating local payment status:', error);
    throw error;
  }
}

/**
 * Create Fortnox invoice for course purchase
 */
export async function createFortnoxInvoice(
  companyId: string,
  courseIds: string[],
  totalAmount: number
): Promise<{ success: boolean; invoiceNumber?: string; error?: string }> {
  try {
    const admin = createAdminClient();
    const { data: company } = await admin.from('companies').select('*').eq('id', companyId).single();
    if (!company) return { success: false, error: 'Företag hittades inte' };

    const { data: courses } = await admin.from('courses').select('*').in('id', courseIds);
    if (!courses || courses.length === 0) return { success: false, error: 'Inga kurser hittades' };

    // Create or get Fortnox customer
    const customerData = {
      Name: company.name,
      Address1: company.address,
      ZipCode: company.address.split(' ').pop() || '12345', // Extract postal code
      City: company.address.split(' ').slice(-2).join(' ') || 'Stockholm',
      CountryCode: 'SE',
      Phone1: company.phone,
      Email: company.email,
      OrganizationNumber: company.organizationNumber
    };

    const fortnoxCustomerNumber = await fortnox.createOrUpdateCustomer({
      email: company.email,
      name: company.name,
      phone: company.phone,
      address: company.address,
      zipCode: company.address.split(' ').pop() || '12345',
      city: company.address.split(' ').slice(-2).join(' ') || 'Stockholm',
      organizationNumber: company.organizationNumber,
    });

    // Create invoice rows
    const invoiceRows = courses.map(course => ({
      Description: course.title,
      DeliveredQuantity: 1,
      Unit: 'st',
      UnitPrice: course.price,
      VAT: 25, // Swedish VAT rate
      Account: 3000 // Revenue account (adjust as needed)
    }));

    // Create Fortnox invoice
    const invoiceData = {
      CustomerNumber: fortnoxCustomerNumber,
      InvoiceDate: new Date().toISOString().split('T')[0],
      DueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      Currency: 'SEK',
      CurrencyRate: 1,
      CurrencyUnit: 1,
      Language: 'sv',
      ExternalInvoiceReference1: `COMPANY-${companyId}`,
      ExternalInvoiceReference2: `COURSES-${courseIds.join(',')}`,
      InvoiceType: 'INVOICE',
      VATIncluded: true,
      InvoiceRows: invoiceRows
    };

    const fortnoxInvoiceNumber = await fortnox.createCourseInvoice(
      fortnoxCustomerNumber,
      {
        courseId: courses[0].id,
        userId: company.id, // using company id as placeholder
        amount: totalAmount,
        currency: 'SEK',
        courseName: courses[0].title,
        userEmail: company.email,
        userName: company.name,
      },
      `LOCAL-${Date.now()}`
    );

    const invNum = fortnoxInvoiceNumber || `INV-${Date.now()}`;
    await admin.from('invoices').insert({
      company_id: companyId,
      invoice_number: invNum,
      amount: totalAmount,
      currency: 'SEK',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'PENDING',
    });

    return { success: true, invoiceNumber: invNum };

  } catch (error) {
    console.error('Error creating Fortnox invoice:', error);
    return {
      success: false,
      error: 'Ett fel uppstod vid skapande av faktura'
    };
  }
}

/**
 * Check if user has access to paywalled features based on Fortnox payment status
 */
export async function checkFortnoxPaywallAccess(
  userId: string, 
  feature: 'company_registration' | 'course_learning' | 'progress_tracking'
): Promise<boolean> {
  try {
    if (isPaymentsDisabled()) return true;

    const admin = createAdminClient();
    const { data: user } = await admin.from('users').select('company_id').eq('id', userId).single();
    if (!user || !user.company_id) return false;

    const paymentValidation = await validateFortnoxPayment(user.company_id);
    
    return paymentValidation.isValid && paymentValidation.status === 'PAID';

  } catch (error) {
    console.error('Error checking Fortnox paywall access:', error);
    return false;
  }
}
