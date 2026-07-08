-- ============================================================
-- Course bundles (packages)
-- A bundle groups several courses under one title/price. Buying a
-- bundle simply unlocks (enrolls in) each of its courses individually —
-- the courses are not merged, just sold together.
--
-- Written to be idempotent so it is safe to re-run.
-- Requires update_updated_at_column() (initial schema) and
-- get_my_role() (rls-policies.sql).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.course_bundles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price         DECIMAL(10,2) NOT NULL,
  image         TEXT,
  is_published  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_course_bundles_updated_at ON public.course_bundles;
CREATE TRIGGER update_course_bundles_updated_at BEFORE UPDATE ON public.course_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Join table: which courses belong to a bundle
CREATE TABLE IF NOT EXISTS public.bundle_courses (
  bundle_id  UUID NOT NULL REFERENCES public.course_bundles(id) ON DELETE CASCADE,
  course_id  UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  PRIMARY KEY (bundle_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_bundle_courses_bundle_id ON public.bundle_courses(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_courses_course_id ON public.bundle_courses(course_id);

-- ============================================================
-- Row Level Security — mirrors the courses convention:
-- anyone may read published bundles; admins have full access.
-- (The app uses the service-role key server-side, which bypasses RLS;
--  these policies protect against direct anon/authenticated access.)
-- ============================================================
ALTER TABLE public.course_bundles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_bundles: anyone reads published" ON public.course_bundles;
CREATE POLICY "course_bundles: anyone reads published"
  ON public.course_bundles FOR SELECT
  USING (is_published = TRUE OR get_my_role() = 'ADMIN');

DROP POLICY IF EXISTS "course_bundles: admin full access" ON public.course_bundles;
CREATE POLICY "course_bundles: admin full access"
  ON public.course_bundles FOR ALL
  USING (get_my_role() = 'ADMIN');

ALTER TABLE public.bundle_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bundle_courses: anyone reads for published bundles" ON public.bundle_courses;
CREATE POLICY "bundle_courses: anyone reads for published bundles"
  ON public.bundle_courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.course_bundles b
      WHERE b.id = bundle_courses.bundle_id
        AND (b.is_published = TRUE OR get_my_role() = 'ADMIN')
    )
  );

DROP POLICY IF EXISTS "bundle_courses: admin full access" ON public.bundle_courses;
CREATE POLICY "bundle_courses: admin full access"
  ON public.bundle_courses FOR ALL
  USING (get_my_role() = 'ADMIN');
