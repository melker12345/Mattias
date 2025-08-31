# APV Submission System & Fortnox Payment Integration

## Overview

This document explains the implementation of two key systems:

1. **APV Submission System** - Manual "Svära på heder och samvete" workflow for course completion
2. **Fortnox Payment Integration** - Invoice-based payment system with validation

## 1. APV Submission System

### Purpose
When users complete a course with a passing grade, they can submit an APV (Application for Professional Validation) to have their certificate registered in the ID06 system. This requires a manual "swear on honor and conscience" process.

### Workflow

#### 1.1 Course Completion Trigger
- User completes all lessons in a course
- System calculates final score
- If score ≥ passing threshold (default 80%), user is prompted for APV submission

#### 1.2 APV Submission Form
The user must provide:
- **Full Name** (required)
- **Personal Number** (required, format: YYYYMMDD-XXXX)
- **Address** (required)
- **Postal Code** (required, 5 digits)
- **City** (required)
- **Phone** (optional)

#### 1.3 Oath Section
User must check a box confirming they swear on honor and conscience that:
- They have completed the course
- They received a passing grade
- All information provided is correct
- They understand false information can lead to certificate revocation

#### 1.4 Validation Rules
- All required fields must be filled
- Personal number must be in correct format (12 digits)
- Postal code must be 5 digits
- User must have actually passed the course
- Only one APV submission per user per course

### Database Schema

```prisma
model APVSubmission {
  id        String   @id @default(cuid())
  userId    String
  courseId  String
  certificateId String
  
  // User information for APV
  fullName  String
  personalNumber String
  address   String
  postalCode String
  city      String
  phone     String?
  
  // Course completion verification
  courseTitle String
  completionDate DateTime
  finalScore Int
  passingScore Int
  
  // Submission status
  status    String @default("PENDING") // PENDING, APPROVED, REJECTED, ID06_REGISTERED
  submittedAt DateTime @default(now())
  reviewedAt DateTime?
  reviewedBy String? // Admin who reviewed
  reviewNotes String?
  
  // ID06 registration
  id06Registered Boolean @default(false)
  id06RegisteredAt DateTime?
  id06CertificateId String?
  
  // Relations
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  certificate Certificate @relation(fields: [certificateId], references: [id], onDelete: Cascade)
  
  @@unique([userId, courseId])
}
```

### API Endpoints

#### POST `/api/courses/[id]/apv-submission`
Creates a new APV submission for a completed course.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "personalNumber": "19850101-1234",
  "address": "Storgatan 1",
  "postalCode": "12345",
  "city": "Stockholm",
  "phone": "070-123 45 67",
  "finalScore": 85,
  "passingScore": 80
}
```

**Response:**
```json
{
  "message": "APV submission skickades framgångsrikt",
  "submission": {
    "id": "sub_123",
    "status": "PENDING",
    "submittedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### GET `/api/courses/[id]/apv-submission`
Retrieves existing APV submission for a user and course.

### Admin Panel Integration

The admin panel includes a new "APV Submissions" tab that shows:
- User information
- Course details
- Submission status
- Review actions (Approve/Reject)
- ID06 registration status

### Status Flow
1. **PENDING** - Initial status when submitted
2. **APPROVED** - Admin has reviewed and approved
3. **REJECTED** - Admin has rejected (with notes)
4. **ID06_REGISTERED** - Successfully registered in ID06 system

## 2. Fortnox Payment Integration

### Purpose
Replace Stripe with Fortnox for invoice-based payments, allowing companies to pay via traditional invoice rather than immediate card payment.

### Requirements for Fortnox Integration

#### 2.1 Fortnox Account Setup
1. **Create Fortnox Account**
   - Sign up at [fortnox.se](https://fortnox.se)
   - Choose appropriate plan (Basic/Standard/Premium)

2. **API Access**
   - Enable API access in Fortnox settings
   - Generate Access Token and Client Secret
   - Note: Fortnox API requires paid subscription

3. **Environment Variables**
   ```env
   FORTNOX_ACCESS_TOKEN="your-fortnox-access-token"
   FORTNOX_CLIENT_SECRET="your-fortnox-client-secret"
   FORTNOX_BASE_URL="https://api.fortnox.se/3"
   ```

#### 2.2 Fortnox API Configuration
- **Base URL**: `https://api.fortnox.se/3`
- **Authentication**: Access Token + Client Secret
- **Rate Limits**: Varies by plan (typically 1000 requests/hour)
- **Webhooks**: Available for payment notifications

### Payment Workflow

#### 2.1 Invoice Creation
1. Company purchases courses
2. System creates customer in Fortnox (if not exists)
3. System creates invoice in Fortnox with course details
4. Invoice is sent to company via Fortnox
5. Local database records invoice details

#### 2.2 Payment Validation
1. **Manual Validation**: Admin checks Fortnox for payment
2. **API Validation**: System polls Fortnox API for payment status
3. **Webhook Validation**: Fortnox sends webhook when payment received

#### 2.3 Access Control
- Users cannot access paywalled content until payment is validated
- System checks payment status before allowing course access
- Grace period (7 days) after invoice due date

### Database Schema Updates

```prisma
model Company {
  // ... existing fields ...
  
  // Fortnox integration
  fortnoxCustomerNumber String?
  fortnoxEnabled Boolean @default(false)
  
  // Payment validation
  lastPaymentCheck DateTime?
  paymentValidationStatus String @default("PENDING") // PENDING, VALIDATED, FAILED
}

model Invoice {
  // ... existing fields ...
  
  // Fortnox integration
  fortnoxDocumentNumber String? // Fortnox invoice number
  fortnoxCustomerNumber String?
  fortnoxStatus String? // DRAFT, SENT, PAID, OVERDUE, CANCELLED
  lastFortnoxCheck DateTime?
}
```

### API Endpoints

#### GET `/api/companies/[id]/fortnox-payment`
Validates payment status for a company.

**Query Parameters:**
- `invoiceNumber` (optional) - Specific invoice to check

**Response:**
```json
{
  "isValid": true,
  "status": "PAID",
  "message": "Fakturan är betald",
  "invoiceNumber": "INV-12345",
  "amount": 1500,
  "dueDate": "2024-02-15T00:00:00Z",
  "paidAt": "2024-01-20T10:30:00Z",
  "fortnoxCustomerNumber": "C12345"
}
```

#### POST `/api/companies/[id]/fortnox-payment`
Creates a new Fortnox invoice for course purchase.

**Request Body:**
```json
{
  "courseIds": ["course_1", "course_2"],
  "totalAmount": 2500
}
```

**Response:**
```json
{
  "message": "Faktura skapades framgångsrikt",
  "invoiceNumber": "INV-12345"
}
```

### Payment Validation Process

#### 2.1 Invoice Validation
```typescript
async function validateFortnoxInvoice(invoiceNumber: string, company: any) {
  // 1. Get invoice from Fortnox API
  const fortnoxInvoice = await fortnoxAPI.getInvoice(invoiceNumber);
  
  // 2. Validate customer information
  const customer = await fortnoxAPI.getCustomerInvoices(fortnoxInvoice.CustomerNumber);
  
  // 3. Validate invoice items match course purchase
  const items = fortnoxInvoice.InvoiceRows.map(row => ({
    description: row.Description,
    quantity: row.DeliveredQuantity,
    unitPrice: row.UnitPrice,
    total: row.DeliveredQuantity * row.UnitPrice
  }));
  
  // 4. Check payment status
  const isPaid = await fortnoxAPI.isInvoicePaid(invoiceNumber);
  
  return {
    isValid: true,
    invoiceNumber: fortnoxInvoice.DocumentNumber,
    customerNumber: fortnoxInvoice.CustomerNumber,
    amount: totalAmount,
    status: isPaid ? 'PAID' : 'PENDING'
  };
}
```

#### 2.2 Fraud Prevention
- **Invoice Validation**: Verify invoice exists in Fortnox
- **Customer Validation**: Verify customer matches company
- **Amount Validation**: Verify invoice amount matches purchase
- **Date Validation**: Check invoice dates are reasonable
- **Duplicate Prevention**: Prevent multiple invoices for same purchase

### Access Control Implementation

#### 2.1 Paywall Check
```typescript
async function checkFortnoxPaywallAccess(userId: string, feature: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { company: true }
  });
  
  if (!user?.companyId) return false;
  
  const paymentValidation = await validateFortnoxPayment(user.companyId);
  return paymentValidation.isValid && paymentValidation.status === 'PAID';
}
```

#### 2.2 Course Access Validation
```typescript
// In course learning page
const hasAccess = await checkFortnoxPaywallAccess(userId, 'course_learning');
if (!hasAccess) {
  // Show payment required message
  // Redirect to payment page
}
```

### Error Handling

#### 2.1 Common Fortnox Errors
- **401 Unauthorized**: Invalid access token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Invoice/customer doesn't exist
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Fortnox service issue

#### 2.2 Fallback Strategy
1. **Primary**: Fortnox API validation
2. **Secondary**: Manual admin validation
3. **Tertiary**: Local payment status (with warning)

### Monitoring & Alerts

#### 2.1 Payment Monitoring
- Daily check for overdue invoices
- Weekly validation of all pending payments
- Monthly reconciliation with Fortnox

#### 2.2 Alert System
- Email notifications for overdue invoices
- Admin dashboard alerts for payment issues
- System logs for all payment validation attempts

## Implementation Steps

### Phase 1: APV Submission System
1. ✅ Update database schema
2. ✅ Create APV submission modal
3. ✅ Implement API endpoints
4. ✅ Add admin panel integration
5. ✅ Test submission workflow

### Phase 2: Fortnox Integration
1. ✅ Create Fortnox API library
2. ✅ Implement payment validation
3. ✅ Create invoice generation
4. ✅ Add access control
5. ⏳ Set up Fortnox account and API keys
6. ⏳ Test payment workflow
7. ⏳ Implement webhook handling
8. ⏳ Add monitoring and alerts

### Phase 3: Production Deployment
1. ⏳ Configure production Fortnox account
2. ⏳ Set up webhook endpoints
3. ⏳ Implement monitoring dashboard
4. ⏳ Create admin training materials
5. ⏳ Go-live with both systems

## Security Considerations

### APV Submissions
- Personal data encryption at rest
- Secure transmission of personal numbers
- Audit logging of all submissions
- Admin access controls

### Fortnox Integration
- Secure storage of API credentials
- Rate limiting to prevent abuse
- Validation of all API responses
- Backup validation methods

## Testing Strategy

### APV System Testing
- Unit tests for validation logic
- Integration tests for submission flow
- Admin panel functionality tests
- Data integrity tests

### Fortnox Integration Testing
- API connection tests
- Invoice creation tests
- Payment validation tests
- Error handling tests
- Rate limiting tests

## Support & Maintenance

### APV System
- Admin training on submission review
- User support for submission issues
- Regular audit of submission data
- ID06 integration monitoring

### Fortnox Integration
- Fortnox API monitoring
- Payment validation monitoring
- Invoice reconciliation
- Customer support for payment issues
