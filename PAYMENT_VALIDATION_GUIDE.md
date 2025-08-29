# 🔐 Payment Validation & Paywall Management Guide

## 🎯 **Overview**

This guide explains how the payment validation and paywall system works in our Swedish online course platform. The system ensures that users can only access features they've paid for, with proper validation, grace periods, and subscription management.

## 🔒 **How Paywalls Work**

### **1. Payment Flow**
```
User Action → Payment Processing → Webhook Validation → Database Update → Access Granted
```

### **2. Validation Layers**
- **Frontend**: React hooks check access before rendering
- **Middleware**: Route-level protection
- **API**: Server-side validation on protected endpoints
- **Database**: Payment status stored and validated

## 💰 **Payment Status Types**

### **Company Payment Status**
```typescript
type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED' | 'FAILED'
```

| Status | Description | Access Level |
|--------|-------------|--------------|
| `PENDING` | Payment not yet processed | ❌ No access |
| `PAID` | Payment successful | ✅ Full access |
| `OVERDUE` | Payment past due date | ⚠️ Grace period access |
| `CANCELLED` | Subscription cancelled | ❌ No access |
| `FAILED` | Payment failed | ❌ No access |

### **Subscription Status**
```typescript
type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIAL' | 'EXPIRED'
```

## 🛡️ **Access Control System**

### **1. Protected Features**
- **Company Registration**: Requires payment (1,500 SEK/year)
- **Course Learning**: Requires enrollment
- **Progress Tracking**: Requires enrollment
- **Admin Panel**: Requires ADMIN role

### **2. Validation Logic**

#### **Company Payment Validation**
```typescript
async function validateCompanyPayment(companyId: string): Promise<PaymentValidation> {
  // 1. Check if company exists
  // 2. Check subscription end date
  // 3. Check for grace period (7 days)
  // 4. Check for pending invoices
  // 5. Return validation result
}
```

#### **Course Access Validation**
```typescript
async function validateCourseAccess(userId: string, courseId: string): Promise<boolean> {
  // 1. Check if user is enrolled
  // 2. If company enrollment, validate company payment
  // 3. If individual enrollment, check payment status
  // 4. Return access boolean
}
```

### **3. Grace Periods**
- **Subscription Expiry**: 7 days grace period
- **Invoice Overdue**: Access maintained during grace period
- **Payment Processing**: Temporary access during processing

## 🔧 **Implementation Details**

### **1. Database Schema**

#### **Company Model**
```prisma
model Company {
  // Payment fields
  plan              String    @default("STANDARD")
  planPrice         Float     @default(1500)
  planStartDate     DateTime  @default(now())
  planEndDate       DateTime?
  paymentStatus     String    @default("PENDING")
  
  // Relations
  invoices          Invoice[]
  paymentLogs       PaymentLog[]
}
```

#### **Payment Log Model**
```prisma
model PaymentLog {
  id              String   @id @default(cuid())
  companyId       String?
  stripePaymentId String   @unique
  amount          Float
  currency        String   @default("SEK")
  status          String
  paymentMethod   String?
  metadata        String?
  createdAt       DateTime @default(now())
  
  company         Company? @relation(fields: [companyId], references: [id])
}
```

### **2. API Endpoints**

#### **Payment Status**
```typescript
GET /api/companies/[id]/payment-status
// Returns: PaymentValidation object
```

#### **Subscription Details**
```typescript
GET /api/companies/[id]/subscription
// Returns: Subscription details with expiry info
```

#### **Payment Intent Creation**
```typescript
POST /api/payments/create-intent
// Creates Stripe payment intent
```

#### **Webhook Handler**
```typescript
POST /api/payments/webhook
// Processes Stripe webhook events
```

### **3. Middleware Protection**

#### **Route Protection**
```typescript
// middleware.ts
const PAYWALLED_ROUTES = {
  '/dashboard/company': 'company_registration',
  '/courses/[id]/learn': 'course_learning',
  '/dashboard': 'progress_tracking',
  '/admin': 'admin_access'
}
```

#### **Access Validation**
```typescript
// Checks user access before allowing route access
async function checkPaywallAccess(userId: string, feature: string): Promise<boolean>
```

### **4. React Hooks**

#### **Payment Validation Hook**
```typescript
const { isValid, status, message, loading, error, refresh } = usePaymentValidation(companyId)
```

#### **Subscription Details Hook**
```typescript
const { subscription, loading, error, refresh } = useSubscriptionDetails(companyId)
```

## 🔄 **Payment Processing Flow**

### **1. Company Registration**
```
1. User fills registration form
2. Create company with PENDING status
3. Generate invoice (1,500 SEK)
4. Create Stripe payment intent
5. Process payment
6. Webhook updates status to PAID
7. Extend subscription by 1 year
8. Grant access to company features
```

### **2. Payment Webhook Processing**
```typescript
// Stripe webhook events handled
- payment_intent.succeeded → Update status to PAID
- payment_intent.payment_failed → Update status to FAILED
- invoice.payment_succeeded → Handle subscription renewal
- invoice.payment_failed → Update status to OVERDUE
```

### **3. Status Updates**
```typescript
async function updatePaymentStatus(
  companyId: string, 
  paymentStatus: PaymentStatus,
  stripePaymentId?: string
): Promise<void> {
  // 1. Update company payment status
  // 2. Update pending invoices
  // 3. Log payment event
  // 4. Extend subscription if paid
}
```

## 🚨 **Error Handling & Edge Cases**

### **1. Payment Failures**
- **Card Declined**: Status set to FAILED, retry allowed
- **Insufficient Funds**: Status set to FAILED, invoice remains
- **Network Errors**: Retry mechanism with exponential backoff

### **2. Grace Period Management**
- **Automatic Extension**: 7 days after expiry
- **Warning Notifications**: Email alerts before expiry
- **Graceful Degradation**: Limited access during grace period

### **3. Subscription Renewals**
- **Automatic Renewal**: Stripe handles recurring payments
- **Manual Renewal**: Invoice-based for annual plans
- **Cancellation**: Immediate access removal after grace period

## 📊 **Monitoring & Analytics**

### **1. Payment Metrics**
- **Success Rate**: Successful payments vs attempts
- **Conversion Rate**: Registration completion rate
- **Churn Rate**: Subscription cancellations
- **Revenue**: Monthly recurring revenue

### **2. Access Logging**
- **Failed Access Attempts**: Logged for security
- **Payment Events**: Complete audit trail
- **Subscription Changes**: Track all status updates

### **3. Alert System**
- **Payment Failures**: Immediate notifications
- **Expiring Subscriptions**: 30, 7, 1 day warnings
- **System Errors**: Payment processing failures

## 🔐 **Security Considerations**

### **1. Payment Security**
- **Stripe PCI Compliance**: Card data never stored
- **Webhook Verification**: Signature validation
- **Idempotency**: Prevent duplicate payments
- **Fraud Detection**: Stripe's built-in protection

### **2. Access Security**
- **Session Validation**: JWT token verification
- **Role-Based Access**: Different permissions per role
- **Company Isolation**: Users can only access their company data
- **API Rate Limiting**: Prevent abuse

### **3. Data Protection**
- **GDPR Compliance**: Proper data handling
- **Encryption**: Sensitive data encrypted
- **Audit Logging**: Complete activity trail
- **Data Retention**: Automatic cleanup of old data

## 🧪 **Testing Strategy**

### **1. Unit Tests**
```typescript
// Test payment validation logic
describe('Payment Validation', () => {
  test('should validate active subscription', async () => {
    // Test implementation
  })
  
  test('should handle grace period', async () => {
    // Test implementation
  })
})
```

### **2. Integration Tests**
```typescript
// Test payment flow end-to-end
describe('Payment Flow', () => {
  test('should process payment and grant access', async () => {
    // Test implementation
  })
})
```

### **3. Webhook Testing**
```bash
# Test Stripe webhooks locally
stripe listen --forward-to localhost:3000/api/payments/webhook
```

## 🚀 **Deployment Checklist**

### **1. Environment Variables**
```bash
# Required for payment processing
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **2. Database Migration**
```bash
# Apply schema changes
npx prisma db push
npx prisma generate
```

### **3. Webhook Configuration**
```bash
# Configure Stripe webhooks
stripe webhook create \
  --url https://yourdomain.com/api/payments/webhook \
  --events payment_intent.succeeded,payment_intent.payment_failed
```

## 📈 **Future Enhancements**

### **1. Advanced Features**
- **Multiple Payment Methods**: Swish, Bank Transfer
- **Subscription Tiers**: Different pricing plans
- **Bulk Discounts**: Volume-based pricing
- **Trial Periods**: Free trial for new companies

### **2. Analytics & Reporting**
- **Revenue Dashboard**: Real-time payment analytics
- **Churn Analysis**: Subscription cancellation insights
- **Payment Performance**: Success rate optimization
- **Customer Lifetime Value**: Revenue per customer tracking

### **3. Automation**
- **Auto-Renewal**: Automatic subscription extensions
- **Dunning Management**: Automated payment reminders
- **Invoice Generation**: Automatic PDF generation
- **Email Notifications**: Payment status updates

---

## 🎯 **Key Takeaways**

1. **Multi-Layer Protection**: Frontend, middleware, API, and database validation
2. **Grace Periods**: User-friendly access during payment issues
3. **Real-Time Updates**: Webhook-based status updates
4. **Security First**: PCI compliance and fraud protection
5. **Comprehensive Logging**: Complete audit trail for all payments
6. **Scalable Architecture**: Easy to extend for new payment methods

This system ensures that your platform is properly monetized while providing a smooth user experience with appropriate access controls and payment validation.



