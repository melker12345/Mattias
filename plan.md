# Platform Plan

## Goal

A Swedish accredited course platform where companies buy training courses for their employees. Upon completing a course the employee is registered in the **ID06 database** — Sweden's national system for tracking who is certified to perform specific work (construction, road work, etc.).

---

## How it works (user flow)

1. **Company** (e.g. ExAB) registers and purchases a course via **Fortnox invoice**.
2. During purchase the company enters each employee's: **name, personnummer, email, phone**. The company is legally responsible for the accuracy of this data.
3. An invitation is sent to the employee's email. When the employee registers they must enter the **same email, personnummer, and phone** — the platform cross-checks these against what the company submitted. If they don't match, access is denied.
4. Employee takes the course and passes the test.
5. Platform marks them as certified and attempts to register the completion in the **ID06 database** via API.
6. If ID06 API access is not yet approved, the **admin downloads a secure spreadsheet** of completed users (including personnummer) to manually submit to ID06.
7. Certificates are stored on the platform and downloadable by the employee and their company.

---

## Account types

| Role | Purpose |
|---|---|
| `ADMIN` | Creates/manages courses, approves submissions, exports data, manages companies |
| `COMPANY_ADMIN` | Purchases courses, invites/manages their own employees, views their certificates |
| `EMPLOYEE` | Takes assigned courses, verifies identity via company cross-check (no BankID needed), receives certificate |
| `INDIVIDUAL` | Private person buying a single course (secondary use case) |

---

## What is already built ✅

- **Supabase Auth** — sign in, sign up, session management, middleware
- **Course management** — admin can create courses with lessons (video/text/image) and quiz questions with answers
- **Enrollment system** — companies assign courses to employees, individuals can enroll directly
- **Progress & quiz engine** — tracks lesson completion and quiz answers
- **Certificate generation** — issued on course pass, stored with ID06 fields
- **APV submission system** — employee submits personal details post-completion; admin reviews and approves (this doubles as the manual ID06 submission flow)
- **Company dashboard** — invite employees, view their progress, purchase courses
- **Admin panel** — manage courses, users, companies, APV submissions
- **Fortnox invoice creation** — partial integration for generating invoices
- **Stripe card payments** — secondary payment path, working
- **Basic ID06 fields** in schema — `bankIdVerified`, `id06Eligible`, `id06Verified`, `id06CertificateId`
- **Employee invitation system** — company invites by email, employee accepts and creates account

---

## What is missing / needs to be built ❌

### Critical path

| Feature | Notes |
|---|---|
| **Remove Prisma → use Supabase client** | All ~20 API routes use `prisma.*` — must migrate to `supabase.from()`. Also enables native RLS policies (better security). See restructuring section. |
| **Employee identity cross-check on registration** | When employee registers via invitation, verify that their entered personnummer + phone matches what the company submitted at purchase time. Block registration if mismatch. |
| **Personnummer encryption** | Currently stored in plain text in `APVSubmission` and `User` tables. Must encrypt at rest (Supabase `pgcrypto` / application-level AES encryption). |
| **ID06 API integration** | Platform needs to become an ID06 partner first (application process). Until then, the spreadsheet export route handles this. |
| **Admin spreadsheet export** | Endpoint that exports completed/approved users as `.xlsx` / `.csv` with: name, personnummer, course, completion date, certificate number. File must be generated server-side, never cached, access restricted to ADMIN only. Personnummer decrypted only at export time. |
| **Fortnox as primary payment** | Fortnox invoice flow needs to be the default checkout path for companies, not Stripe. Stripe should be secondary (individual/card payments only). |
| **Forgot password page** | `/auth/forgot-password` is linked in the UI but doesn't exist yet. |

### Secondary / polish

| Feature | Notes |
|---|---|
| ID06 API endpoints | `POST /api/id06/register` — call ID06 API once approved |
| Block course access until identity verified | Once cross-check passes at registration, mark `identityVerified = true`; block course start until set |
| Company subscription billing | Automate recurring Fortnox invoice for company plan |
| Email notifications | Course completion, certificate issued, invoice sent |
| GDPR data deletion | Employee can request account + data deletion |
| Audit log | Track who accessed/exported personnummer data |

---

## Restructuring recommendation

### Remove Prisma → native Supabase client

**Do this.** Reasons:

1. **Row Level Security (RLS)** — Supabase's built-in RLS policies enforce data isolation (employees only see their own data, company admins only see their company's data) at the database level. Prisma has no equivalent — isolation only exists in application code, which is a weaker security model.
2. **Simpler stack** — Prisma requires schema sync, migrations, generated client, `DIRECT_URL` connection. With Supabase client you write SQL migrations directly in `supabase/migrations/` and query with the typed JS client.
3. **Column-level encryption** — Supabase exposes `pgcrypto` natively; easier to encrypt personnummer at rest.
4. **Consistent auth context** — `supabase.auth.getUser()` and `supabase.from()` use the same client; RLS policies can automatically restrict rows by `auth.uid()`.

**Migration approach:**
- Replace `lib/prisma.ts` with Supabase server/browser clients (already have `lib/supabase/client.ts` + `lib/supabase/server.ts`)
- Move schema to `supabase/migrations/` SQL files
- Replace each `prisma.model.operation()` call with `supabase.from('table').select/insert/update/delete()`
- This is significant work (~20 API routes) but straightforward

### Folder structure (after migration)

```
/
├── app/
│   ├── api/
│   │   ├── admin/           # Admin-only routes
│   │   ├── auth/            # register, callback
│   │   ├── companies/       # Company management
│   │   ├── courses/         # Course content + enrollment
│   │   ├── id06/            # ID06 API integration (future)
│   │   ├── payments/        # Stripe + Fortnox
│   │   └── export/          # NEW: secure spreadsheet export
│   ├── admin/               # Admin UI pages
│   ├── auth/                # signin, signup, forgot-password
│   ├── dashboard/           # User + company dashboards
│   └── courses/             # Course catalog + learning
├── lib/
│   ├── supabase/            # client.ts + server.ts (keep)
│   ├── auth.ts              # requireAuth, requireAdmin (keep)
│   ├── bankid.ts            # NEW: BankID provider client
│   ├── id06.ts              # NEW: ID06 API client
│   ├── fortnox.ts           # Fortnox invoice helpers
│   ├── stripe.ts            # Stripe helpers
│   ├── encryption.ts        # NEW: personnummer AES encrypt/decrypt
│   └── export.ts            # NEW: spreadsheet generation (xlsx)
├── supabase/
│   ├── migrations/          # SQL schema files (replaces prisma/)
│   └── rls-policies.sql     # Row Level Security policies
└── prisma/                  # DELETE after migration
```

---

## Identity verification model (no BankID)

No BankID is used. Identity is established through a **two-party cross-check**:

- **Company side** — when purchasing, enters: employee name, personnummer, email, phone. The company takes legal responsibility for this data being correct.
- **Employee side** — when registering via the invitation link, enters: personnummer, phone. Platform checks these against the company-submitted values.
- **Match → access granted**, `identityVerified = true`, course unlocks.
- **Mismatch → registration blocked**, company admin is notified to correct the record.

This removes the need for BankID (500 kr/month + 20 öre/transaction) entirely. The employer-employee relationship provides the trust anchor — employers are already legally responsible for registering workers correctly in ID06.

---

## Personnummer handling (security)

Personnummer is sensitive personal data (GDPR Special Category adjacent). Rules:
- **Never store in plain text.** Encrypt with AES-256 before writing to database.
- **Decrypt only server-side**, never send the raw encryption key to the client.
- **Restrict access**: only `ADMIN` role can read decrypted personnummer (for export).
- **Audit log** every access and export that involves personnummer.
- **GDPR**: user can request deletion; encrypted value is deleted, not just nulled.
- The encryption key lives in `PERSONNUMMER_ENCRYPTION_KEY` env var, never in code.

---

## ID06 path — two tracks

### Track A: API integration (long term)
- Apply to become an ID06 partner (business process, weeks/months)
- Implement `lib/id06.ts` to call their API after course approval
- Admin approves APV submission → platform calls ID06 → `id06Registered = true`

### Track B: Spreadsheet export (immediate fallback)
- Admin reviews and approves APV submissions in admin panel (already works)
- Admin clicks "Export to ID06 spreadsheet" → server generates `.xlsx` with:
  - Namn, Personnummer (decrypted), Kurs, Slutdatum, Betyg, Certifikatnummer
- File is streamed directly, never written to disk or logged
- Only accessible by `ADMIN` role
- Each export is logged in audit table

---

## Environment variables needed

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Supabase pooler)
DATABASE_URL=          # pgBouncer pooled URL
DIRECT_URL=            # Direct URL for migrations

# Encryption
PERSONNUMMER_ENCRYPTION_KEY=   # 32-byte hex key, never expose

# BankID (choose a provider)
BANKID_API_URL=
BANKID_API_KEY=

# ID06 (once approved)
ID06_API_URL=
ID06_API_KEY=
ID06_API_SECRET=

# Fortnox
FORTNOX_ACCESS_TOKEN=
FORTNOX_CLIENT_SECRET=
FORTNOX_BASE_URL=https://api.fortnox.se/3

# Stripe (secondary)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_BASE_URL=
```

---

## Immediate next steps (priority order)

1. **Migrate Prisma → Supabase client** across all API routes
2. **Encrypt personnummer** — `lib/encryption.ts` + update all read/write paths
3. **Admin spreadsheet export** — `/api/export/id06-completions` route
4. **Forgot password page** — `/app/auth/forgot-password/page.tsx`
5. **Employee identity cross-check** — validate personnummer + phone at registration against company-submitted data
6. **Fortnox as primary checkout** — make invoice the default for company purchases
7. **ID06 API** — begin partnership application process in parallel with development



TODO:
- Make sure companies can buy courses for induviduals.
- Hosting
- ID06 integration
- for him to set up Supabase account.
- Bugs 
- Remove stripe
- integrate SMTP for email

What is jest.config.js and jest.setup.js for?
What are we using Zod for?
Why are we using axios?