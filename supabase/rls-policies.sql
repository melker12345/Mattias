-- ============================================================
-- Row Level Security (RLS) Policies
-- Run after initial_schema.sql
-- ============================================================

-- Helper: get current user's role from public.users
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's company_id
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- users
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: read own row"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users: company_admin reads own company employees"
  ON public.users FOR SELECT
  USING (
    get_my_role() = 'COMPANY_ADMIN'
    AND company_id = get_my_company_id()
  );

CREATE POLICY "users: admin reads all"
  ON public.users FOR SELECT
  USING (get_my_role() = 'ADMIN');

CREATE POLICY "users: update own row"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "users: admin updates all"
  ON public.users FOR UPDATE
  USING (get_my_role() = 'ADMIN');

CREATE POLICY "users: insert own row on signup"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "users: admin deletes"
  ON public.users FOR DELETE
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- companies
-- ============================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "companies: company_admin reads own"
  ON public.companies FOR SELECT
  USING (id = get_my_company_id());

CREATE POLICY "companies: admin full access"
  ON public.companies FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- courses
-- ============================================================
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "courses: anyone reads published"
  ON public.courses FOR SELECT
  USING (is_published = TRUE OR get_my_role() = 'ADMIN');

CREATE POLICY "courses: admin full access"
  ON public.courses FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- lessons
-- ============================================================
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons: authenticated reads (enrolled or admin)"
  ON public.lessons FOR SELECT
  USING (
    get_my_role() = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.user_id = auth.uid() AND e.course_id = lessons.course_id
    )
  );

CREATE POLICY "lessons: admin full access"
  ON public.lessons FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- questions
-- ============================================================
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "questions: enrolled user reads"
  ON public.questions FOR SELECT
  USING (
    get_my_role() = 'ADMIN'
    OR EXISTS (
      SELECT 1 FROM public.lessons l
      JOIN public.enrollments e ON e.course_id = l.course_id
      WHERE l.id = questions.lesson_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "questions: admin full access"
  ON public.questions FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- enrollments
-- ============================================================
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments: read own"
  ON public.enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "enrollments: company_admin reads own company"
  ON public.enrollments FOR SELECT
  USING (
    get_my_role() = 'COMPANY_ADMIN'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = enrollments.user_id AND u.company_id = get_my_company_id()
    )
  );

CREATE POLICY "enrollments: admin full access"
  ON public.enrollments FOR ALL
  USING (get_my_role() = 'ADMIN');

CREATE POLICY "enrollments: insert own"
  ON public.enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "enrollments: update own"
  ON public.enrollments FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================
-- answers
-- ============================================================
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "answers: read own"
  ON public.answers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "answers: insert/update own"
  ON public.answers FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "answers: update own"
  ON public.answers FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "answers: admin full access"
  ON public.answers FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- progress
-- ============================================================
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress: read own"
  ON public.progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "progress: insert own"
  ON public.progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "progress: update own"
  ON public.progress FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "progress: admin full access"
  ON public.progress FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- certificates
-- ============================================================
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificates: read own"
  ON public.certificates FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "certificates: company_admin reads own company"
  ON public.certificates FOR SELECT
  USING (
    get_my_role() = 'COMPANY_ADMIN'
    AND EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = certificates.user_id AND u.company_id = get_my_company_id()
    )
  );

CREATE POLICY "certificates: admin full access"
  ON public.certificates FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- apv_submissions
-- NOTE: personnummer_encrypted is only decrypted server-side in ADMIN routes.
--       RLS does not expose raw encrypted values to non-admins.
-- ============================================================
ALTER TABLE public.apv_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apv_submissions: read own"
  ON public.apv_submissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "apv_submissions: insert own"
  ON public.apv_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "apv_submissions: update own pending"
  ON public.apv_submissions FOR UPDATE
  USING (user_id = auth.uid() AND status = 'PENDING');

CREATE POLICY "apv_submissions: admin full access"
  ON public.apv_submissions FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- course_purchases
-- ============================================================
ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "course_purchases: company_admin reads own"
  ON public.course_purchases FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "course_purchases: admin full access"
  ON public.course_purchases FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- invoices
-- ============================================================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices: company_admin reads own"
  ON public.invoices FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "invoices: admin full access"
  ON public.invoices FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- invoice_items
-- ============================================================
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoice_items: company_admin reads own"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_items.invoice_id AND i.company_id = get_my_company_id()
    )
  );

CREATE POLICY "invoice_items: admin full access"
  ON public.invoice_items FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- payments
-- ============================================================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments: read own"
  ON public.payments FOR SELECT
  USING (user_id = auth.uid() OR company_id = get_my_company_id());

CREATE POLICY "payments: admin full access"
  ON public.payments FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- payment_logs  (admin only)
-- ============================================================
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_logs: admin full access"
  ON public.payment_logs FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- invitations
-- ============================================================
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations: company_admin reads own company"
  ON public.invitations FOR SELECT
  USING (company_id = get_my_company_id());

CREATE POLICY "invitations: company_admin inserts for own company"
  ON public.invitations FOR INSERT
  WITH CHECK (company_id = get_my_company_id() AND get_my_role() = 'COMPANY_ADMIN');

CREATE POLICY "invitations: read by token (unauthenticated — for signup flow)"
  ON public.invitations FOR SELECT
  USING (TRUE);   -- token lookup is secured at the API layer; token is a secret

CREATE POLICY "invitations: admin full access"
  ON public.invitations FOR ALL
  USING (get_my_role() = 'ADMIN');

-- ============================================================
-- audit_logs  (admin read-only; insert via service role in API routes)
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs: admin reads all"
  ON public.audit_logs FOR SELECT
  USING (get_my_role() = 'ADMIN');
