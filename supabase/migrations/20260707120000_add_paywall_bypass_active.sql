-- ============================================================
-- Add paywall_bypass_active flag to users
-- Controls whether a configured paywall-exempt TEST account currently
-- bypasses payment. Toggled from the admin Users tab (Aktiv/Inaktiv).
-- Irrelevant for normal users (they are never paywall-exempt regardless).
-- Run in: Supabase Dashboard > SQL Editor, or `supabase db push`.
-- ============================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS paywall_bypass_active BOOLEAN NOT NULL DEFAULT TRUE;
