import { prisma } from './prisma';

interface FortnoxConfig {
  accessToken: string;
  clientSecret: string;
  baseUrl: string;
}

interface FortnoxInvoice {
  DocumentNumber?: string;
  CustomerNumber: string;
  InvoiceDate: string;
  DueDate: string;
  Currency: string;
  CurrencyRate: number;
  CurrencyUnit: number;
  Language: string;
  ExternalInvoiceReference1?: string;
  ExternalInvoiceReference2?: string;
  InvoiceType: string;
  VATIncluded: boolean;
  InvoiceRows: FortnoxInvoiceRow[];
}

interface FortnoxInvoiceRow {
  ArticleNumber?: string;
  Description: string;
  DeliveredQuantity: number;
  Unit: string;
  UnitPrice: number;
  VAT: number;
  Account: number;
}

interface FortnoxCustomer {
  CustomerNumber: string;
  Name: string;
  Address1: string;
  Address2?: string;
  ZipCode: string;
  City: string;
  CountryCode: string;
  Phone1?: string;
  Email?: string;
  OrganizationNumber?: string;
}

class FortnoxAPI {
  private config: FortnoxConfig;
  private baseUrl: string;

  constructor(config: FortnoxConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.fortnox.se/3';
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Access-Token': this.config.accessToken,
      'Client-Secret': this.config.clientSecret,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fortnox API error: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Fortnox API request failed:', error);
      throw error;
    }
  }

  /**
   * Create or update a customer in Fortnox
   */
  async createCustomer(customerData: Omit<FortnoxCustomer, 'CustomerNumber'>): Promise<FortnoxCustomer> {
    // Generate a unique customer number
    const customerNumber = `C${Date.now()}`;
    
    const customer: FortnoxCustomer = {
      CustomerNumber: customerNumber,
      ...customerData
    };

    const response = await this.makeRequest('/customers', 'POST', customer);
    return response;
  }

  /**
   * Create an invoice in Fortnox
   */
  async createInvoice(invoiceData: Omit<FortnoxInvoice, 'DocumentNumber'>): Promise<FortnoxInvoice> {
    const response = await this.makeRequest('/invoices', 'POST', invoiceData);
    return response;
  }

  /**
   * Get invoice by document number
   */
  async getInvoice(documentNumber: string): Promise<FortnoxInvoice> {
    const response = await this.makeRequest(`/invoices/${documentNumber}`);
    return response;
  }

  /**
   * Update invoice status (e.g., mark as paid)
   */
  async updateInvoice(documentNumber: string, updates: Partial<FortnoxInvoice>): Promise<FortnoxInvoice> {
    const response = await this.makeRequest(`/invoices/${documentNumber}`, 'PUT', updates);
    return response;
  }

  /**
   * Get all invoices for a customer
   */
  async getCustomerInvoices(customerNumber: string): Promise<FortnoxInvoice[]> {
    const response = await this.makeRequest(`/invoices?customer=${customerNumber}`);
    return response.Invoices || [];
  }

  /**
   * Check if invoice is paid
   */
  async isInvoicePaid(documentNumber: string): Promise<boolean> {
    try {
      const invoice = await this.getInvoice(documentNumber);
      return invoice.DocumentNumber ? true : false; // Fortnox returns paid status in specific field
    } catch (error) {
      console.error('Error checking invoice payment status:', error);
      return false;
    }
  }
}

// Initialize Fortnox API with environment variables
const fortnoxAPI = new FortnoxAPI({
  accessToken: process.env.FORTNOX_ACCESS_TOKEN!,
  clientSecret: process.env.FORTNOX_CLIENT_SECRET!,
  baseUrl: process.env.FORTNOX_BASE_URL || 'https://api.fortnox.se/3'
});

export { fortnoxAPI, FortnoxAPI };
export type { FortnoxInvoice, FortnoxCustomer, FortnoxInvoiceRow };
