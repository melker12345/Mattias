# Authentication & Invitation Flow

## Overview
This document outlines the authentication flow for different user types and how we handle BankID requirements and fallback options.

## User Types

### 1. Company Administrators (COMPANY_ADMIN)
- **Registration**: Company admins register with organization number, company details, and set their own password
- **BankID**: Required for company verification and ID06 compliance
- **Access**: Can manage employees, view reports, purchase courses, and access company dashboard

### 2. Employees (EMPLOYEE)
- **Invitation**: Invited by company admin via email
- **Initial Login**: Use temporary password sent via email
- **BankID**: Required for course access and ID06 certification
- **Access**: Can take assigned courses, view progress, and download certificates

### 3. Individual Users (INDIVIDUAL)
- **Registration**: Self-registration with personal details
- **BankID**: Required for course access and ID06 certification
- **Access**: Can purchase and take courses individually

## BankID Integration Strategy

### Required BankID Verification
BankID verification is **mandatory** for:
- Course access (all user types)
- ID06 certificate generation
- Compliance with Swedish regulations

### Fallback Options for Non-BankID Users

#### Option 1: Manual Verification (Recommended)
For users without BankID, we implement a manual verification process:

1. **Initial Registration**: Users can register with email/phone without BankID
2. **Limited Access**: Users can browse courses but cannot start them
3. **Manual Verification**: 
   - Upload government-issued ID (passport, driver's license)
   - Provide additional personal information
   - Manual review by admin team (24-48 hours)
4. **Verified Access**: After manual verification, users can access courses
5. **ID06 Compliance**: Manual verification satisfies ID06 requirements

#### Option 2: SMS/Email Verification
For users who cannot use BankID:

1. **SMS Verification**: Send verification code to registered phone number
2. **Email Verification**: Send verification link to registered email
3. **Additional Security**: Require personal number verification
4. **Limited Functionality**: Access to courses but no ID06 certificates

## Invitation Flow

### Current Implementation
1. **Company Admin** invites employee via dashboard
2. **System** creates employee account with temporary password
3. **Email** sent with login credentials and instructions
4. **Employee** logs in with temporary password
5. **Employee** must verify identity with BankID
6. **Employee** can then access courses

### Enhanced Flow (Recommended)
1. **Company Admin** invites employee via dashboard
2. **System** creates employee account with temporary password
3. **Email** sent with login credentials and instructions
4. **Employee** logs in with temporary password
5. **Employee** chooses verification method:
   - **BankID** (preferred, immediate access)
   - **Manual verification** (upload ID, wait for approval)
   - **SMS/Email verification** (limited access)
6. **Employee** can access courses based on verification level

## Technical Implementation

### Database Schema Updates Needed
```sql
-- Add verification fields to User model
ALTER TABLE User ADD COLUMN verificationMethod TEXT; -- 'BANKID', 'MANUAL', 'SMS', 'EMAIL'
ALTER TABLE User ADD COLUMN verificationStatus TEXT; -- 'PENDING', 'VERIFIED', 'REJECTED'
ALTER TABLE User ADD COLUMN verificationSubmittedAt DATETIME;
ALTER TABLE User ADD COLUMN verificationApprovedAt DATETIME;
ALTER TABLE User ADD COLUMN verificationApprovedBy TEXT;
ALTER TABLE User ADD COLUMN idDocumentUrl TEXT; -- For manual verification
```

### API Endpoints Needed
1. **POST /api/auth/verify-bankid** - BankID verification
2. **POST /api/auth/verify-manual** - Manual verification submission
3. **POST /api/auth/verify-sms** - SMS verification
4. **POST /api/auth/verify-email** - Email verification
5. **GET /api/admin/verifications** - Admin view pending verifications
6. **POST /api/admin/verifications/:id/approve** - Approve manual verification
7. **POST /api/admin/verifications/:id/reject** - Reject manual verification

### Frontend Components Needed
1. **VerificationMethodSelector** - Choose verification method
2. **BankIDVerification** - BankID integration
3. **ManualVerificationForm** - Upload ID and personal info
4. **SMSVerification** - SMS code input
5. **EmailVerification** - Email link verification
6. **VerificationStatus** - Show verification status
7. **AdminVerificationPanel** - Admin interface for manual approvals

## Security Considerations

### Data Protection
- All personal data encrypted at rest
- ID documents stored securely with access controls
- Audit trail for all verification actions
- GDPR compliance for data handling

### Fraud Prevention
- Rate limiting on verification attempts
- Document authenticity checks
- Cross-reference personal information
- Suspicious activity monitoring

## Compliance with ID06

### BankID Verification
- Meets all ID06 requirements
- Immediate access to courses
- Full certificate generation capability

### Manual Verification
- Satisfies ID06 compliance requirements
- Requires additional documentation
- Slower but equally valid for certification

### SMS/Email Verification
- Does not meet ID06 requirements
- Limited to non-certification courses
- Suitable for basic training only

## Implementation Priority

### Phase 1 (Current)
- ✅ Company registration and admin dashboard
- ✅ Employee invitation system
- ✅ Basic BankID requirement
- ✅ Email notifications

### Phase 2 (Next)
- 🔄 Manual verification system
- 🔄 Admin verification panel
- 🔄 Enhanced invitation flow
- 🔄 Verification method selection

### Phase 3 (Future)
- 📋 SMS verification
- 📋 Advanced fraud detection
- 📋 Automated document verification
- 📋 Integration with external verification services

## Recommendations

1. **Implement manual verification** as the primary fallback for non-BankID users
2. **Keep BankID as the preferred method** for immediate access
3. **Add admin tools** for managing manual verifications
4. **Implement proper audit trails** for compliance
5. **Consider SMS verification** for basic access only
6. **Plan for external verification services** for scalability

This approach ensures compliance with ID06 requirements while providing accessibility for users who cannot use BankID.
