# 💳 Payment Integration Plan

## 🎯 **Overview**

This document outlines the complete payment integration strategy for the Swedish online course platform, including company registration paywalls, course purchases, and multiple payment methods.

## 🔒 **Current Paywall Status**

### ✅ **IMPLEMENTED - Company Registration Paywall**
- **Company Registration**: Now behind paywall with 3 pricing tiers
- **Course Learning**: Already paywalled (requires enrollment)
- **Progress Tracking**: Already paywalled (requires enrollment)

### ❌ **NOT IMPLEMENTED - Payment Processing**
- **Actual Payment Processing**: Not implemented (simulated)
- **Stripe Integration**: Not connected
- **Invoice Generation**: Basic implementation only
- **Payment Verification**: Not implemented

## 💰 **Pricing Structure**

### **1. Company Registration**

| Plan | Price (SEK/year) | Features |
|------|------------------|----------|
| **Standard** | 1,500 | • Unlimited employees<br>• All courses included<br>• Email support<br>• Basic reports<br>• Custom certificates<br>• Company dashboard |

### **2. Individual Course Prices**

| Course Category | Course | Price (SEK) |
|----------------|--------|-------------|
| **Arbete på Väg** | Steg 1.1 - Grundkurs | 995 |
| | Steg 1.2 - Fordonsförare | 1,295 |
| | Steg 1.3 - Vägarbetare | 1,295 |
| | Steg 2.2 - Utmärkningsansvarig | 1,995 |
| | Steg 2.3 - Skyddsanordningsansvarig | 1,995 |
| | Steg 3.0 - Styra och leda | 2,995 |
| **ADR - Farligt Gods** | ADR 1.3 - Farligt Gods Transport | 1,795 |
| **Vinterväghållning** | Vinterväghållning och snöröjning | 1,495 |
| **Säkerhet & Miljö** | Säker Schakt - Schaktansvarig | 1,295 |
| | Auktorisation Lågspänning | 1,495 |

### **3. Bulk Purchase Discounts**

| Quantity | Discount |
|----------|----------|
| 5+ courses | 10% off |
| 10+ courses | 15% off |
| 25+ courses | 20% off |
| 50+ courses | 25% off |

## 🏗️ **Implementation Phases**

### **Phase 1: Stripe Integration (Week 1-2)**

#### **1.1 Environment Setup**
```bash
# Install Stripe
npm install stripe @stripe/stripe-js

# Environment variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### **1.2 Stripe Configuration**
```typescript
// lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

export const stripeConfig = {
  currency: 'sek',
  paymentMethods: ['card', 'sepa_debit'],
  automaticPaymentMethods: {
    enabled: true,
  },
};
```

#### **1.3 Payment Intent API**
```typescript
// app/api/payments/create-intent/route.ts
export async function POST(request: NextRequest) {
  const { amount, currency, metadata } = await request.json();
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: currency || 'sek',
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return NextResponse.json({ clientSecret: paymentIntent.client_secret });
}
```

### **Phase 2: Company Registration Payment (Week 3-4)**

#### **2.1 Payment Flow**
```typescript
// 1. User fills company registration form
// 2. Create payment intent (1500 SEK)
// 3. Process payment
// 4. Create company account
// 5. Send welcome email
```

#### **2.2 Implementation Steps**
1. **Update Company Registration Form**
   - Add Stripe Elements
   - Add payment processing (1500 SEK)
   - Handle payment success/failure

2. **Payment Processing API**
   - Create payment intent (1500 SEK)
   - Handle webhook events
   - Update company status

3. **Invoice Generation**
   - Generate PDF invoice (1500 SEK)
   - Send to company email
   - Store in database

### **Phase 3: Course Purchase System (Week 5-6)**

#### **3.1 Individual Course Purchases**
```typescript
// Course purchase flow
interface CoursePurchase {
  courseId: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  paymentMethod: 'card' | 'invoice';
  companyId?: string;
}
```

#### **3.2 Bulk Purchase System**
```typescript
// Bulk purchase with discounts
const calculateBulkDiscount = (quantity: number, basePrice: number) => {
  const discountRates = { 5: 0.10, 10: 0.15, 25: 0.20, 50: 0.25 };
  const discount = Object.entries(discountRates)
    .filter(([qty]) => quantity >= parseInt(qty))
    .map(([, rate]) => rate)
    .pop() || 0;
  
  return basePrice * (1 - discount);
};
```

### **Phase 4: Invoice System (Week 7-8)**

#### **4.1 Invoice Generation**
```typescript
// PDF invoice generation
import PDFDocument from 'pdfkit';

const generateInvoicePDF = async (invoice: Invoice) => {
  const doc = new PDFDocument();
  // Add company details, items, totals
  // Return PDF buffer
};
```

#### **4.2 Payment Tracking**
```typescript
// Invoice status tracking
enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}
```

### **Phase 5: Swedish Payment Methods (Week 9-10)**

#### **5.1 Swish Integration**
```typescript
// Swish payment
const swishPayment = {
  payee: {
    value: '1234567890', // Swish number
    editable: false
  },
  amount: {
    value: 2995,
    editable: false
  },
  message: {
    value: 'Företagsregistrering',
    editable: false
  }
};
```

#### **5.2 Bank Transfer (SEPA)**
```typescript
// SEPA direct debit
const sepaPayment = {
  mandate: {
    reference: 'SEPA-REF-123',
    url: 'https://example.com/mandate'
  },
  account: {
    iban: 'SE1234567890123456789012',
    bic: 'SWEDSESS'
  }
};
```

## 🔧 **Technical Implementation**

### **1. Database Schema Updates**

```prisma
// Additional payment-related models
model Payment {
  id              String   @id @default(cuid())
  stripePaymentId String   @unique
  amount          Float
  currency        String   @default("SEK")
  status          String   // succeeded, failed, pending
  paymentMethod   String   // card, sepa, swish, invoice
  metadata        String?  // JSON string
  createdAt       DateTime @default(now())
  
  // Relations
  companyId       String?
  company         Company? @relation(fields: [companyId], references: [id])
  invoiceId       String?
  invoice         Invoice? @relation(fields: [invoiceId], references: [id])
}

model Subscription {
  id              String   @id @default(cuid())
  companyId       String
  stripeSubId     String   @unique
  plan            String
  status          String   // active, canceled, past_due
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd Boolean @default(false)
  createdAt       DateTime @default(now())
  
  // Relations
  company         Company  @relation(fields: [companyId], references: [id])
}
```

### **2. API Endpoints**

```typescript
// Payment APIs
POST /api/payments/create-intent          // Create Stripe payment intent
POST /api/payments/confirm                // Confirm payment
POST /api/payments/webhook                // Stripe webhook handler
GET  /api/companies/[id]/invoices         // Get company invoices
POST /api/companies/[id]/invoices         // Create invoice
GET  /api/invoices/[id]/pdf               // Download invoice PDF
POST /api/courses/purchase                // Purchase courses
GET  /api/courses/pricing                 // Get course pricing
```

### **3. Frontend Components**

```typescript
// Payment components
<PaymentForm />           // Stripe payment form
<InvoiceList />           // Company invoice list
<CoursePricing />         // Course pricing display
<BulkPurchase />          // Bulk purchase interface
<PaymentHistory />        // Payment history
```

## 🚀 **Deployment Strategy**

### **1. Development Environment**
```bash
# Test with Stripe test keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### **2. Production Environment**
```bash
# Production Stripe keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### **3. Webhook Configuration**
```bash
# Stripe webhook endpoints
stripe listen --forward-to localhost:3000/api/payments/webhook
```

## 📊 **Success Metrics**

### **Business Metrics**
- **Conversion Rate**: Company registration completion
- **Payment Success Rate**: Successful payments vs attempts
- **Average Order Value**: Revenue per transaction
- **Customer Lifetime Value**: Total revenue per customer

### **Technical Metrics**
- **Payment Processing Time**: Time from intent to success
- **Error Rate**: Failed payment attempts
- **Webhook Reliability**: Successful webhook processing
- **Invoice Generation Time**: PDF generation performance

## 🔐 **Security Considerations**

### **1. Payment Security**
- **PCI Compliance**: Stripe handles card data
- **Webhook Verification**: Verify Stripe webhook signatures
- **Idempotency**: Prevent duplicate payments
- **Fraud Detection**: Implement fraud prevention

### **2. Data Protection**
- **GDPR Compliance**: Handle personal data properly
- **Encryption**: Encrypt sensitive payment data
- **Access Control**: Restrict payment data access
- **Audit Logging**: Log all payment activities

## 📋 **Next Steps**

### **Immediate (This Week)**
1. ✅ **Company Registration Paywall** - IMPLEMENTED
2. 🔄 **Stripe Integration Setup** - IN PROGRESS
3. 📝 **Payment API Development** - PLANNED

### **Short Term (Next 2 Weeks)**
1. 💳 **Stripe Payment Processing**
2. 📄 **Invoice Generation**
3. 🧪 **Payment Testing**

### **Medium Term (Next Month)**
1. 🛒 **Course Purchase System**
2. 📊 **Payment Analytics**
3. 🔄 **Subscription Management**

### **Long Term (Next Quarter)**
1. 🇸🇪 **Swedish Payment Methods**
2. 🤖 **Automated Billing**
3. 📱 **Mobile Payment Support**

---

**Status**: Company registration paywall implemented ✅  
**Next**: Stripe integration and payment processing 🔄
