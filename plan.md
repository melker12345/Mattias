# Utbildningsplattform - Implementation Plan

## 🎯 **Project Overview**

A comprehensive Swedish online course platform focused on professional safety and compliance training, with integrated ID06 certification and company-employee management system.

## 📋 **Core Requirements**

### **1. Account Types**

#### **Company Accounts (Primary Customers)**
- **Purpose**: Purchase courses for employees
- **Features**:
  - Course catalog browsing and purchasing
  - Employee management (invite, remove, monitor progress)
  - Bulk course purchases
  - Invoice-based payments
  - Progress reporting and analytics
  - Certificate management for employees

#### **Employee/Individual Accounts**
- **Purpose**: Take assigned courses and receive certifications
- **Features**:
  - Access to assigned courses
  - Course completion tracking
  - ID06 certification upon completion
  - Digital certificate generation
  - Progress history

### **2. Course Management System**

#### **Course Types** (Based on PDFs)
- **Arbete på Väg** (Work on Roads)
  - Steg 1.1 - Grundkurs
  - Steg 1.2 - Fordonsförare
  - Steg 1.3 - Vägarbetare
  - Steg 2.2 - Utmärkningsansvarig
  - Steg 2.3 - Skyddsanordningsansvarig
  - Steg 3.0 - Styra och leda

- **ADR - Farligt Gods**
  - ADR 1.3 - Farligt Gods Transport

- **Vinterväghållning**
  - Vinterväghållning och snöröjning

- **Säkerhet & Miljö**
  - Säker Schakt - Schaktansvarig
  - Auktorisation Lågspänning

#### **Course Features**
- Video lessons with interactive content
- Quiz questions with images and videos
- Progress tracking
- ID06 certification requirement
- Digital certificate generation

### **3. ID06 Integration**

#### **Technical Implementation**
```typescript
// ID06 Authentication Flow
interface ID06Auth {
  personalNumber: string;
  organizationNumber?: string; // For company accounts
  certificateData: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  verifiedAt: DateTime;
}
```

#### **Integration Requirements**
- **BankID Integration**:
  - Personal BankID for individual users
  - Organizational BankID for company accounts
  - QR code generation for mobile BankID
  - Authentication status polling

- **API Endpoints**:
  ```
  POST /api/auth/id06/init
  GET  /api/auth/id06/collect
  POST /api/auth/id06/complete
  GET  /api/auth/id06/verify
  ```

- **Database Schema Updates**:
  ```sql
  -- User model additions
  personalNumber String?
  organizationNumber String?
  id06Verified Boolean @default(false)
  id06VerifiedAt DateTime?
  id06Certificate String?
  
  -- Company model
  model Company {
    id String @id @default(cuid())
    name String
    organizationNumber String @unique
    contactPerson String
    email String
    phone String
    address String
    employees User[]
    courses Course[]
    invoices Invoice[]
  }
  ```

### **4. Payment System**

#### **Invoice Payments (Primary)**
- **Features**:
  - Automatic invoice generation
  - 30-day payment terms
  - PDF invoice generation
  - Payment status tracking
  - Reminder system

- **Implementation**:
  ```typescript
  interface Invoice {
    id: string;
    companyId: string;
    amount: number;
    currency: string;
    dueDate: Date;
    status: 'pending' | 'paid' | 'overdue';
    items: InvoiceItem[];
  }
  ```

#### **Card Payments (Secondary)**
- **Features**:
  - Stripe integration
  - Secure payment processing
  - Receipt generation
  - Refund handling

- **Implementation**:
  ```typescript
  // Stripe integration
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  // Payment intent creation
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'sek',
    metadata: { courseId, userId }
  });
  ```

## 🏗️ **System Architecture**

### **Database Schema Updates**

```prisma
// Updated schema with company support
model User {
  id String @id @default(cuid())
  email String @unique
  name String?
  personalNumber String?
  organizationNumber String?
  role UserRole @default(EMPLOYEE)
  companyId String?
  id06Verified Boolean @default(false)
  id06VerifiedAt DateTime?
  id06Certificate String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  company Company? @relation(fields: [companyId], references: [id])
  enrollments Enrollment[]
  progress Progress[]
  certificates Certificate[]
}

model Company {
  id String @id @default(cuid())
  name String
  organizationNumber String @unique
  contactPerson String
  email String
  phone String
  address String
  isActive Boolean @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  employees User[]
  coursePurchases CoursePurchase[]
  invoices Invoice[]
}

model CoursePurchase {
  id String @id @default(cuid())
  companyId String
  courseId String
  quantity Int
  pricePerUnit Float
  totalAmount Float
  purchasedAt DateTime @default(now())
  
  // Relations
  company Company @relation(fields: [companyId], references: [id])
  course Course @relation(fields: [courseId], references: [id])
  enrollments Enrollment[]
}

model Certificate {
  id String @id @default(cuid())
  userId String
  courseId String
  certificateNumber String @unique
  id06Verified Boolean @default(false)
  id06VerifiedAt DateTime?
  issuedAt DateTime @default(now())
  
  // Relations
  user User @relation(fields: [userId], references: [id])
  course Course @relation(fields: [courseId], references: [id])
}

model Invoice {
  id String @id @default(cuid())
  companyId String
  invoiceNumber String @unique
  amount Float
  currency String @default("SEK")
  dueDate DateTime
  status InvoiceStatus @default(PENDING)
  paidAt DateTime?
  createdAt DateTime @default(now())
  
  // Relations
  company Company @relation(fields: [companyId], references: [id])
  items InvoiceItem[]
}

enum UserRole {
  ADMIN
  COMPANY_ADMIN
  EMPLOYEE
  INDIVIDUAL
}

enum InvoiceStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
}
```

### **API Structure**

```
/api
├── auth/
│   ├── id06/
│   │   ├── init
│   │   ├── collect
│   │   ├── complete
│   │   └── verify
│   ├── register
│   └── [...nextauth]
├── companies/
│   ├── [id]/
│   │   ├── employees
│   │   ├── courses
│   │   └── invoices
│   └── invite
├── courses/
│   ├── [id]/
│   │   ├── lessons
│   │   ├── questions
│   │   └── enroll
│   └── purchase
├── payments/
│   ├── invoice/
│   │   ├── create
│   │   ├── [id]
│   │   └── webhook
│   └── stripe/
│       ├── create-payment-intent
│       └── webhook
└── certificates/
    ├── [id]
    └── verify
```

## 🎨 **User Interface Design**

### **Company Dashboard**
- **Overview**: Employee progress, course completion rates
- **Employee Management**: Invite, remove, assign courses
- **Course Purchases**: Buy courses in bulk
- **Invoices**: View and download invoices
- **Reports**: Progress and completion analytics

### **Employee Dashboard**
- **Assigned Courses**: List of courses to complete
- **Progress Tracking**: Visual progress indicators
- **Certificates**: View and download earned certificates
- **ID06 Status**: Verification status and history

### **Admin Panel**
- **Course Management**: Create, edit, publish courses
- **Company Management**: Approve, manage company accounts
- **User Management**: Monitor all users and their progress
- **System Analytics**: Platform usage and performance metrics

## 🔧 **Implementation Phases**

### **Phase 1: Foundation (Weeks 1-2)**
- [ ] Update database schema
- [ ] Implement company and user models
- [ ] Create basic company dashboard
- [ ] Set up authentication with role-based access

### **Phase 2: Course System (Weeks 3-4)**
- [ ] Implement course purchase system
- [ ] Create employee course assignment
- [ ] Build progress tracking
- [ ] Develop certificate generation

### **Phase 3: ID06 Integration (Weeks 5-6)**
- [ ] Integrate BankID API
- [ ] Implement ID06 verification flow
- [ ] Create certificate verification system
- [ ] Add ID06 status tracking

### **Phase 4: Payment System (Weeks 7-8)**
- [ ] Implement invoice generation
- [ ] Integrate Stripe for card payments
- [ ] Create payment tracking system
- [ ] Build reminder and notification system

### **Phase 5: Polish & Testing (Weeks 9-10)**
- [ ] User acceptance testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation and training materials

## 🔐 **Security & Compliance**

### **Data Protection**
- **GDPR Compliance**: Proper handling of personal data
- **BankID Security**: Secure certificate storage and transmission
- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **Audit Logging**: Complete audit trail for all actions

### **Access Control**
- **Role-Based Access**: Different permissions for different user types
- **Company Isolation**: Companies can only access their own data
- **Session Management**: Secure session handling with proper timeouts
- **API Security**: Rate limiting and input validation

## 📊 **Success Metrics**

### **Business Metrics**
- **Customer Acquisition**: Number of companies onboarded
- **Course Completion**: Employee course completion rates
- **Revenue**: Monthly recurring revenue from course sales
- **Customer Satisfaction**: Net Promoter Score (NPS)

### **Technical Metrics**
- **System Uptime**: 99.9% availability target
- **Performance**: Page load times under 2 seconds
- **Security**: Zero security incidents
- **User Adoption**: Active user engagement rates

## 🚀 **Deployment Strategy**

### **Infrastructure**
- **Hosting**: Vercel for frontend, Railway for backend
- **Database**: PostgreSQL with connection pooling
- **CDN**: Cloudflare for static assets
- **Monitoring**: Sentry for error tracking, Vercel Analytics

### **Environment Setup**
```bash
# Required environment variables
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="https://..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_PUBLISHABLE_KEY="pk_..."
BANKID_API_URL="https://..."
BANKID_CERT_PATH="..."
BANKID_KEY_PATH="..."
```

## 📝 **Next Steps**

1. **Review and approve this plan**
2. **Set up development environment**
3. **Begin Phase 1 implementation**
4. **Schedule regular progress reviews**
5. **Plan user testing sessions**

---

*This plan provides a comprehensive roadmap for building a professional Swedish course platform with ID06 integration and company-employee management capabilities.*
