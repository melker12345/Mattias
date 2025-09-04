// Payment system types
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  paymentMethod?: string;
  metadata?: Record<string, string>;
}

export interface CheckoutSession {
  id: string;
  url: string;
  paymentIntentId: string;
  customerId?: string;
  metadata: {
    userId?: string;
    courseId?: string;
    companyId?: string;
    type: 'course' | 'subscription' | 'company_plan';
  };
}

export interface PaymentWebhookEvent {
  id: string;
  type: string;
  data: {
    object: PaymentIntent | CheckoutSession;
  };
  created: number;
}

export interface FortnoxCustomer {
  CustomerNumber?: string;
  Name: string;
  Email: string;
  Phone?: string;
  Address1?: string;
  ZipCode?: string;
  City?: string;
  Country?: string;
  OrganisationNumber?: string;
}

export interface FortnoxInvoiceRow {
  ArticleNumber?: string;
  Description: string;
  Price: number;
  Unit?: string;
  VAT?: number;
  Quantity?: number;
}

export interface FortnoxInvoice {
  CustomerNumber: string;
  InvoiceDate: string;
  DueDate: string;
  InvoiceRows: FortnoxInvoiceRow[];
  Currency: string;
  Language: string;
  ExternalInvoiceReference1?: string;
  ExternalInvoiceReference2?: string;
  YourReference?: string;
  OurReference?: string;
}

export interface FortnoxInvoiceResponse {
  Invoice: {
    DocumentNumber: string;
    InvoiceNumber: number;
    CustomerNumber: string;
    Total: number;
    TotalVAT: number;
    Currency: string;
    InvoiceDate: string;
    DueDate: string;
    ExternalInvoiceReference1?: string;
    ExternalInvoiceReference2?: string;
  };
}

export interface PaymentProcessingResult {
  success: boolean;
  paymentId: string;
  enrollmentId?: string;
  fortnoxInvoiceId?: string;
  error?: string;
}

export interface CoursePaymentData {
  courseId: string;
  userId: string;
  amount: number;
  currency: string;
  courseName: string;
  userEmail: string;
  userName: string;
}

export interface CompanyPaymentData {
  companyId: string;
  amount: number;
  currency: string;
  planName: string;
  companyName: string;
  companyEmail: string;
  billingPeriod: 'monthly' | 'yearly';
}

export interface PaymentValidationResult {
  isValid: boolean;
  hasAccess: boolean;
  paymentStatus: 'paid' | 'pending' | 'failed' | 'gift' | 'none';
  expiresAt?: Date;
  message?: string;
}

// Test data interfaces
export interface PaymentTestData {
  userId: string;
  courseId: string;
  amount: number;
  paymentMethod: string;
  shouldSucceed: boolean;
  expectedFortnoxSync: boolean;
}

export interface WebhookTestPayload {
  type: string;
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
      status: string;
      metadata: Record<string, string>;
    };
  };
}

// Error types
export class PaymentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'PaymentError';
  }
}

export class FortnoxError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'FortnoxError';
  }
}

export class StripeError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'StripeError';
  }
}
