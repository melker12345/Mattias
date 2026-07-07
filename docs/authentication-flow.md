# Authentication & Invitation Flow

## Overview
This document outlines the authentication flow for different user types and how we
establish identity verification. There is **no external e-identification integration**.
Identity is verified through a two-party cross-check between the employer and the
employee, which sets the `users.identity_verified` flag.

## User Types

### 1. Company Administrators (COMPANY_ADMIN)
- **Registration**: Company admins register with organization number, company details, and set their own password
- **Company verification**: The company itself is verified separately (`companies.verified` / `verified_at`)
- **Access**: Can manage employees, view reports, purchase courses, and access company dashboard

### 2. Employees (EMPLOYEE)
- **Invitation**: Invited by company admin via email
- **Initial Login**: Use temporary password sent via email
- **Identity verification**: Established via the personnummer + phone cross-check (see below); sets `identity_verified`
- **Access**: Can take assigned courses, view progress, and download certificates

### 3. Individual Users (INDIVIDUAL)
- **Registration**: Self-registration with personal details
- **Identity verification**: Established via the personnummer + phone cross-check; sets `identity_verified`
- **Access**: Can purchase and take courses individually

## Identity Verification Strategy

### How identity is established
No external e-identification provider is used. Identity is established through a
**two-party cross-check** performed at signup:

1. The employer registers the worker with their personnummer (stored encrypted as
   `personnummer_encrypted`) and phone number.
2. When the employee completes signup, the system cross-checks the personnummer and
   phone number provided against what the employer registered.
3. On a successful match, `users.identity_verified` is set to `true`
   (and the verification timestamp is recorded).

The employer-employee relationship provides the trust anchor: employers are already
legally responsible for registering workers correctly in ID06.

### Where the flag is used
- Course access and ID06 certificate generation depend on `identity_verified`
- Company and admin dashboards surface a "Verifierad" / "Identitetsverifierad" badge
  driven by this flag

## Invitation Flow

1. **Company Admin** invites employee via dashboard
2. **System** creates employee account with temporary password
3. **Email** sent with login credentials and instructions
4. **Employee** logs in with temporary password
5. **Employee** identity is verified via the personnummer + phone cross-check
6. **Employee** can then access courses

## Technical Implementation

### Relevant fields (existing schema, no migration required)
- `users.identity_verified` — boolean, set on successful cross-check
- `users.personnummer_encrypted` — encrypted personnummer (see `lib/encryption.ts`)
- `companies.verified` / `companies.verified_at` — separate company-level verification

## Security Considerations

### Data Protection
- Personnummer is encrypted at rest (`lib/encryption.ts`)
- All personal data encrypted at rest and in transit
- Audit trail for verification-related actions
- GDPR compliance for data handling

### Fraud Prevention
- Cross-reference personnummer and phone against employer-registered data
- Rate limiting on authentication attempts
- Suspicious activity monitoring

## Compliance with ID06

The personnummer + phone cross-check satisfies ID06 identity requirements: the employer
is accountable for the accuracy of the worker data they register, and the successful
cross-check confirms the individual signing up matches that record. A verified identity
(`identity_verified = true`) enables full certificate generation.
