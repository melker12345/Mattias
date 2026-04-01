-- ============================================================
-- Initial schema migration
-- Supabase (PostgreSQL) — replaces prisma/schema.prisma
-- Run via: Supabase Dashboard > SQL Editor, or supabase db push
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- companies
-- ============================================================
CREATE TABLE public.companies (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_number TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  contact_person      TEXT NOT NULL,
  email               TEXT NOT NULL,
  phone               TEXT NOT NULL,
  address             TEXT NOT NULL,
  verified            BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at         TIMESTAMPTZ,
  verification_method TEXT NOT NULL DEFAULT 'BUSINESS_REGISTRATION',
  plan                TEXT NOT NULL DEFAULT 'STANDARD',
  plan_price          DECIMAL(10,2) NOT NULL DEFAULT 1500.00,
  plan_start_date     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  plan_end_date       TIMESTAMPTZ,
  payment_status      TEXT NOT NULL DEFAULT 'PENDING',
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- users (mirrors auth.users with extra profile fields)
-- ============================================================
CREATE TABLE public.users (
  id                   UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                TEXT UNIQUE NOT NULL,
  name                 TEXT,
  personnummer_encrypted TEXT,       -- AES-256-GCM encrypted; NULL until user provides it
  phone                TEXT,
  role                 TEXT NOT NULL DEFAULT 'EMPLOYEE',
  company_id           UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  identity_verified    BOOLEAN NOT NULL DEFAULT FALSE, -- true once personnummer+phone cross-check passes
  id06_eligible        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_role_check CHECK (role IN ('ADMIN','COMPANY_ADMIN','EMPLOYEE','INDIVIDUAL'))
);

CREATE INDEX idx_users_company_id ON public.users(company_id);
CREATE INDEX idx_users_role ON public.users(role);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- courses
-- ============================================================
CREATE TABLE public.courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  price         DECIMAL(10,2) NOT NULL,
  image         TEXT,
  duration      INT NOT NULL,
  category      TEXT NOT NULL,
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  passing_score INT NOT NULL DEFAULT 80,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- lessons
-- ============================================================
CREATE TABLE public.lessons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  type        TEXT NOT NULL,              -- 'video','image','text','question'
  content     TEXT,
  video_url   TEXT,
  image_url   TEXT,
  "order"     INT NOT NULL,
  course_id   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_course_id ON public.lessons(course_id);

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- questions
-- ============================================================
CREATE TABLE public.questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question       TEXT NOT NULL,
  type           TEXT NOT NULL,           -- 'multiple_choice','true_false','text'
  options        TEXT NOT NULL,           -- JSON string
  correct_answer TEXT NOT NULL,
  explanation    TEXT,
  image          TEXT,
  lesson_id      UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  "order"        INT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_questions_lesson_id ON public.questions(lesson_id);

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- course_purchases
-- ============================================================
CREATE TABLE public.course_purchases (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  course_id      UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  quantity       INT NOT NULL,
  price_per_unit DECIMAL(10,2) NOT NULL,
  total_amount   DECIMAL(10,2) NOT NULL,
  purchased_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_course_purchases_company_id ON public.course_purchases(company_id);

-- ============================================================
-- enrollments
-- ============================================================
CREATE TABLE public.enrollments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id          UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  course_purchase_id UUID REFERENCES public.course_purchases(id) ON DELETE CASCADE,
  enrolled_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at       TIMESTAMPTZ,
  passed             BOOLEAN NOT NULL DEFAULT FALSE,
  final_score        INT,
  total_questions    INT NOT NULL DEFAULT 0,
  correct_answers    INT NOT NULL DEFAULT 0,
  is_gift            BOOLEAN NOT NULL DEFAULT FALSE,
  gifted_by          UUID REFERENCES public.users(id) ON DELETE SET NULL,
  gifted_at          TIMESTAMPTZ,
  gift_reason        TEXT,
  is_paid            BOOLEAN NOT NULL DEFAULT FALSE,
  paid_at            TIMESTAMPTZ,
  fortnox_invoice_id TEXT,
  payment_amount     DECIMAL(10,2),
  payment_method     TEXT,
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON public.enrollments(course_id);

-- ============================================================
-- answers
-- ============================================================
CREATE TABLE public.answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer      TEXT NOT NULL,
  is_correct  BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

CREATE INDEX idx_answers_user_id ON public.answers(user_id);

-- ============================================================
-- progress
-- ============================================================
CREATE TABLE public.progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id    UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  score        INT,
  attempts     INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX idx_progress_user_id ON public.progress(user_id);
CREATE INDEX idx_progress_lesson_id ON public.progress(lesson_id);

-- ============================================================
-- apv_submissions  (created before certificates to resolve circular FK)
-- ============================================================
CREATE TABLE public.apv_submissions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id             UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_id        UUID UNIQUE,                -- FK added after certificates table
  full_name             TEXT NOT NULL,
  personnummer_encrypted TEXT,                       -- AES-256-GCM encrypted
  address               TEXT,
  postal_code           TEXT,
  city                  TEXT,
  phone                 TEXT,
  course_title          TEXT NOT NULL,
  completion_date       TIMESTAMPTZ NOT NULL,
  final_score           INT NOT NULL,
  passing_score         INT NOT NULL,
  total_questions       INT NOT NULL,
  correct_answers       INT NOT NULL,
  time_taken            INT,
  answers_data          TEXT NOT NULL,               -- JSON string
  status                TEXT NOT NULL DEFAULT 'PENDING',
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at           TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  review_notes          TEXT,
  id06_registered       BOOLEAN NOT NULL DEFAULT FALSE,
  id06_registered_at    TIMESTAMPTZ,
  id06_certificate_id   TEXT,
  UNIQUE(user_id, course_id),
  CONSTRAINT apv_status_check CHECK (status IN ('PENDING','APPROVED','REJECTED','ID06_REGISTERED'))
);

CREATE INDEX idx_apv_submissions_user_id ON public.apv_submissions(user_id);
CREATE INDEX idx_apv_submissions_status ON public.apv_submissions(status);

-- ============================================================
-- certificates
-- ============================================================
CREATE TABLE public.certificates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id           UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_number  TEXT UNIQUE NOT NULL,
  id06_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  id06_certificate_id TEXT,
  id06_registered_at  TIMESTAMPTZ,
  apv_submitted       BOOLEAN NOT NULL DEFAULT FALSE,
  apv_submitted_at    TIMESTAMPTZ,
  apv_submission_id   UUID,                          -- FK added below
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_certificates_user_id ON public.certificates(user_id);

-- Resolve circular FKs now both tables exist
ALTER TABLE public.apv_submissions
  ADD CONSTRAINT fk_apv_submissions_certificate
  FOREIGN KEY (certificate_id) REFERENCES public.certificates(id) ON DELETE SET NULL;

ALTER TABLE public.certificates
  ADD CONSTRAINT fk_certificates_apv_submission
  FOREIGN KEY (apv_submission_id) REFERENCES public.apv_submissions(id) ON DELETE SET NULL;

-- ============================================================
-- invoices
-- ============================================================
CREATE TABLE public.invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,
  currency       TEXT NOT NULL DEFAULT 'SEK',
  due_date       TIMESTAMPTZ NOT NULL,
  status         TEXT NOT NULL DEFAULT 'PENDING',
  paid_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invoice_status_check CHECK (status IN ('PENDING','PAID','OVERDUE','CANCELLED'))
);

-- ============================================================
-- invoice_items
-- ============================================================
CREATE TABLE public.invoice_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  quantity   INT NOT NULL,
  price      DECIMAL(10,2) NOT NULL,
  total      DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- payments
-- ============================================================
CREATE TABLE public.payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES public.users(id) ON DELETE CASCADE,
  company_id          UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  course_id           UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  enrollment_id       UUID UNIQUE REFERENCES public.enrollments(id) ON DELETE CASCADE,
  fortnox_invoice_id  TEXT UNIQUE,
  fortnox_customer_id TEXT,
  amount              DECIMAL(10,2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'SEK',
  status              TEXT NOT NULL DEFAULT 'PENDING',
  payment_method      TEXT DEFAULT 'INVOICE',
  fortnox_synced      BOOLEAN NOT NULL DEFAULT FALSE,
  fortnox_synced_at   TIMESTAMPTZ,
  metadata            TEXT,
  failure_reason      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- payment_logs
-- ============================================================
CREATE TABLE public.payment_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id          UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  fortnox_invoice_id  TEXT,
  fortnox_customer_id TEXT,
  amount              DECIMAL(10,2) NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'SEK',
  status              TEXT NOT NULL,
  payment_method      TEXT DEFAULT 'INVOICE',
  metadata            TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- invitations  (includes personnummer + phone for identity cross-check)
-- ============================================================
CREATE TABLE public.invitations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  TEXT NOT NULL,
  name                   TEXT,
  phone                  TEXT,                   -- company-provided phone for cross-check
  personnummer_encrypted TEXT,                   -- company-provided personnummer (encrypted)
  token                  TEXT UNIQUE NOT NULL,
  company_id             UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  expires_at             TIMESTAMPTZ NOT NULL,
  is_existing_user       BOOLEAN NOT NULL DEFAULT FALSE,
  temporary_password     TEXT,
  used                   BOOLEAN NOT NULL DEFAULT FALSE,
  used_at                TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_company_id ON public.invitations(company_id);

CREATE TRIGGER update_invitations_updated_at
  BEFORE UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- audit_logs  (track all access to sensitive data / exports)
-- ============================================================
CREATE TABLE public.audit_logs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,   -- 'EXPORT_ID06', 'VIEW_PERSONNUMMER', 'DELETE_USER', etc.
  resource   TEXT NOT NULL,   -- table or entity being accessed
  metadata   TEXT,            -- JSON: count, filters, etc.
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
