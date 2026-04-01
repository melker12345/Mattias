import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  FortnoxCustomer,
  FortnoxInvoice,
  FortnoxInvoiceResponse,
  FortnoxError,
  CoursePaymentData,
  CompanyPaymentData,
} from './types/payment';

class FortnoxAPI {
  private client: AxiosInstance;
  private baseURL = 'https://api.fortnox.se/3';

  constructor() {
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Client-Secret': process.env.FORTNOX_CLIENT_SECRET!,
        'Access-Token': process.env.FORTNOX_ACCESS_TOKEN!,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`Fortnox API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Fortnox API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`Fortnox API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        console.error('Fortnox API Response Error:', error.response?.data || error.message);
        throw new FortnoxError(
          error.response?.data?.ErrorInformation?.message || error.message,
          error.response?.data?.ErrorInformation?.code || 'FORTNOX_API_ERROR',
          error.response?.status || 500
        );
      }
    );
  }

  /**
   * Create or update a customer in Fortnox
   */
  async createOrUpdateCustomer(customerData: {
    email: string;
    name: string;
    phone?: string;
    address?: string;
    zipCode?: string;
    city?: string;
    organizationNumber?: string;
  }): Promise<string> {
    try {
      // First, try to find existing customer by email
      const existingCustomer = await this.findCustomerByEmail(customerData.email);
      
      if (existingCustomer) {
        console.log(`Customer found with number: ${existingCustomer.CustomerNumber}`);
        return existingCustomer.CustomerNumber!;
      }

      // Create new customer
      const fortnoxCustomer: FortnoxCustomer = {
        Name: customerData.name,
        Email: customerData.email,
        Phone: customerData.phone,
        Address1: customerData.address,
        ZipCode: customerData.zipCode,
        City: customerData.city,
        Country: 'SE',
        OrganisationNumber: customerData.organizationNumber,
      };

      const response: AxiosResponse<{ Customer: FortnoxCustomer }> = await this.client.post(
        '/customers',
        { Customer: fortnoxCustomer }
      );

      const customerNumber = response.data.Customer.CustomerNumber!;
      console.log(`Created new Fortnox customer: ${customerNumber}`);
      return customerNumber;
    } catch (error) {
      console.error('Failed to create/update Fortnox customer:', error);
      throw new FortnoxError(
        `Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CUSTOMER_CREATION_FAILED',
        500
      );
    }
  }

  /**
   * Find customer by email
   */
  private async findCustomerByEmail(email: string): Promise<FortnoxCustomer | null> {
    try {
      const response: AxiosResponse<{ Customers: FortnoxCustomer[] }> = await this.client.get(
        `/customers?filter=email~${encodeURIComponent(email)}`
      );

      const customers = response.data.Customers || [];
      return customers.length > 0 ? customers[0] : null;
    } catch (error) {
      console.log('Customer not found or error searching:', error);
      return null;
    }
  }

  /**
   * Create invoice for course purchase
   */
  async createCourseInvoice(
    customerNumber: string,
    paymentData: CoursePaymentData,
    referenceId?: string
  ): Promise<string> {
    try {
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

      const invoice: FortnoxInvoice = {
        CustomerNumber: customerNumber,
        InvoiceDate: invoiceDate.toISOString().split('T')[0],
        DueDate: dueDate.toISOString().split('T')[0],
        Currency: paymentData.currency.toUpperCase(),
        Language: 'SV',
        ExternalInvoiceReference1: referenceId ?? paymentData.courseId,
        ExternalInvoiceReference2: paymentData.courseId,
        YourReference: paymentData.userName,
        OurReference: 'MN Utbildning',
        InvoiceRows: [
          {
            Description: `Kurs: ${paymentData.courseName}`,
            Price: paymentData.amount,
            Unit: 'st',
            VAT: 25, // 25% Swedish VAT for digital services
            Quantity: 1,
          },
        ],
      };

      const response: AxiosResponse<FortnoxInvoiceResponse> = await this.client.post(
        '/invoices',
        { Invoice: invoice }
      );

      const invoiceNumber = response.data.Invoice.DocumentNumber;
      console.log(`Created Fortnox invoice: ${invoiceNumber}`);
      return invoiceNumber;
    } catch (error) {
      console.error('Failed to create Fortnox invoice:', error);
      throw new FortnoxError(
        `Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INVOICE_CREATION_FAILED',
        500
      );
    }
  }

  /**
   * Create invoice for company subscription
   */
  async createCompanyInvoice(
    customerNumber: string,
    paymentData: CompanyPaymentData,
    referenceId?: string
  ): Promise<string> {
    try {
      const invoiceDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const invoice: FortnoxInvoice = {
        CustomerNumber: customerNumber,
        InvoiceDate: invoiceDate.toISOString().split('T')[0],
        DueDate: dueDate.toISOString().split('T')[0],
        Currency: paymentData.currency.toUpperCase(),
        Language: 'SV',
        ExternalInvoiceReference1: referenceId ?? paymentData.companyId,
        ExternalInvoiceReference2: paymentData.companyId,
        YourReference: paymentData.companyName,
        OurReference: 'MN Utbildning',
        InvoiceRows: [
          {
            Description: `${paymentData.planName} - ${paymentData.billingPeriod === 'yearly' ? 'Årlig' : 'Månadsvis'} prenumeration`,
            Price: paymentData.amount,
            Unit: 'st',
            VAT: 25,
            Quantity: 1,
          },
        ],
      };

      const response: AxiosResponse<FortnoxInvoiceResponse> = await this.client.post(
        '/invoices',
        { Invoice: invoice }
      );

      const invoiceNumber = response.data.Invoice.DocumentNumber;
      console.log(`Created Fortnox company invoice: ${invoiceNumber}`);
      return invoiceNumber;
    } catch (error) {
      console.error('Failed to create Fortnox company invoice:', error);
      throw new FortnoxError(
        `Failed to create company invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'COMPANY_INVOICE_CREATION_FAILED',
        500
      );
    }
  }

  /**
   * Mark invoice as paid
   */
  async markInvoiceAsPaid(
    documentNumber: string,
    amount: number,
    paymentReference?: string
  ): Promise<void> {
    try {
      const paymentData = {
        InvoicePayment: {
          InvoiceNumber: documentNumber,
          Amount: amount,
          PaymentDate: new Date().toISOString().split('T')[0],
          ModeOfPayment: 'BANK',
          ModeOfPaymentAccount: '1930',
          ...(paymentReference ? { ExternalInvoiceReference1: paymentReference } : {}),
        },
      };

      await this.client.post('/invoicepayments', paymentData);
      console.log(`Marked invoice ${documentNumber} as paid`);
    } catch (error) {
      console.error(`Failed to mark invoice ${documentNumber} as paid:`, error);
    }
  }

  /**
   * Get invoice by document number
   */
  async getInvoice(documentNumber: string): Promise<FortnoxInvoiceResponse['Invoice'] | null> {
    try {
      const response: AxiosResponse<FortnoxInvoiceResponse> = await this.client.get(
        `/invoices/${documentNumber}`
      );
      return response.data.Invoice;
    } catch (error) {
      console.error(`Failed to get invoice ${documentNumber}:`, error);
      return null;
    }
  }

  /**
   * Test Fortnox connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/companyinformation');
      console.log('Fortnox connection test successful');
      return true;
    } catch (error) {
      console.error('Fortnox connection test failed:', error);
      return false;
    }
  }

  /**
   * Get company information
   */
  async getCompanyInfo(): Promise<any> {
    try {
      const response = await this.client.get('/companyinformation');
      return response.data.CompanyInformation;
    } catch (error) {
      console.error('Failed to get company information:', error);
      throw new FortnoxError(
        `Failed to get company info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'COMPANY_INFO_FAILED',
        500
      );
    }
  }
}

// Export singleton instance
export const fortnox = new FortnoxAPI();

// Export helper functions
export async function createFortnoxCustomerFromPayment(
  paymentData: CoursePaymentData | CompanyPaymentData
): Promise<string> {
  const customerData = {
    email: 'userEmail' in paymentData ? paymentData.userEmail : paymentData.companyEmail,
    name: 'userName' in paymentData ? paymentData.userName : paymentData.companyName,
    organizationNumber: 'companyId' in paymentData ? undefined : undefined, // TODO: Get org number from company
  };

  return await fortnox.createOrUpdateCustomer(customerData);
}

export async function createInvoiceFromPayment(
  customerNumber: string,
  paymentData: CoursePaymentData | CompanyPaymentData,
  referenceId?: string
): Promise<string> {
  if ('courseId' in paymentData) {
    return await fortnox.createCourseInvoice(customerNumber, paymentData, referenceId);
  } else {
    return await fortnox.createCompanyInvoice(customerNumber, paymentData, referenceId);
  }
}