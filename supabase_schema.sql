-- ============================================================
-- GENEDGE SOLAR PMS — SUPABASE DATABASE SCHEMA
-- Run this entire file in Supabase → SQL Editor → New Query
-- ============================================================

-- ── 1. PROFILES TABLE ─────────────────────────────────────────
-- Stores role, site assignment, full name for each user.
-- Automatically created when a user is added via Supabase Auth.

CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT,
  full_name   TEXT,
  role        TEXT NOT NULL CHECK (role IN ('site', 'office')),
  site        TEXT CHECK (
                site IN ('Devkigalol', 'Kanja', 'Mendapara', 'Mandodara') OR site IS NULL
              ),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile row when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 2. DPR TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dprs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  site                TEXT NOT NULL CHECK (site IN ('Devkigalol','Kanja','Mendapara','Mandodara')),
  date                DATE NOT NULL,
  weather             TEXT,
  reporter            TEXT,

  -- Civil Works
  piling_pct          INTEGER DEFAULT 0,
  pcc_pct             INTEGER DEFAULT 0,
  structure_pct       INTEGER DEFAULT 0,
  piles_today         INTEGER DEFAULT 0,
  piles_cum           INTEGER DEFAULT 0,
  civil_remarks       TEXT,

  -- Module & Electrical
  module_pct          INTEGER DEFAULT 0,
  dc_cable_pct        INTEGER DEFAULT 0,
  ac_cable_pct        INTEGER DEFAULT 0,
  inv_comm_pct        INTEGER DEFAULT 0,
  modules_today       INTEGER DEFAULT 0,
  modules_cum         INTEGER DEFAULT 0,
  inv_commissioned    INTEGER DEFAULT 0,
  elec_remarks        TEXT,

  -- Generation
  gen_today           NUMERIC(10,2) DEFAULT 0,
  gen_cum             NUMERIC(12,2) DEFAULT 0,
  availability        NUMERIC(5,2)  DEFAULT 0,
  export_kwh          NUMERIC(10,2) DEFAULT 0,
  peak_kw             NUMERIC(8,2)  DEFAULT 0,
  inv_running         INTEGER DEFAULT 0,
  inv_fault           INTEGER DEFAULT 0,

  -- Manpower
  mp_civil            INTEGER DEFAULT 0,
  mp_elec             INTEGER DEFAULT 0,
  mp_general          INTEGER DEFAULT 0,
  mp_supervisor       INTEGER DEFAULT 0,
  mp_subcon           INTEGER DEFAULT 0,

  -- Material & Equipment
  material_received   TEXT,
  material_shortage   TEXT,
  equipment_onsite    TEXT,
  equipment_issue     TEXT,

  -- Safety
  safety              TEXT DEFAULT 'None',
  tbt_conducted       TEXT DEFAULT 'Yes',
  safety_remarks      TEXT,

  -- Issues
  issues              TEXT,
  action_from         TEXT DEFAULT 'None',
  priority            TEXT DEFAULT 'Normal' CHECK (priority IN ('Normal','High','Critical')),

  -- Overall
  overall_pct         INTEGER DEFAULT 0,
  schedule_status     TEXT DEFAULT 'On Track',
  plan_tomorrow       TEXT,
  overall_remarks     TEXT,

  -- Metadata
  submitted_by        UUID REFERENCES auth.users(id),
  submitted_by_name   TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries by site and date
CREATE INDEX IF NOT EXISTS dprs_site_date_idx ON public.dprs(site, date DESC);
CREATE INDEX IF NOT EXISTS dprs_date_idx      ON public.dprs(date DESC);


-- ── 3. INVENTORY TABLE ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site        TEXT NOT NULL CHECK (site IN ('Devkigalol','Kanja','Mendapara','Mandodara')),
  name        TEXT NOT NULL,
  unit        TEXT DEFAULT 'nos',
  ordered     INTEGER DEFAULT 0,
  received    INTEGER DEFAULT 0,
  consumed    INTEGER DEFAULT 0,
  remarks     TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS inventory_site_idx ON public.inventory(site);


-- ── 4. ROW LEVEL SECURITY (RLS) ───────────────────────────────
-- This is critical: enforces data access rules at the database level.

ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dprs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: get current user's assigned site
CREATE OR REPLACE FUNCTION public.current_user_site()
RETURNS TEXT AS $$
  SELECT site FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;


-- PROFILES RLS
-- Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Office admins can read all profiles
DROP POLICY IF EXISTS "profiles_select_office" ON public.profiles;
CREATE POLICY "profiles_select_office"
  ON public.profiles FOR SELECT
  USING (public.current_user_role() = 'office');

-- Office admins can update any profile (for user management)
DROP POLICY IF EXISTS "profiles_update_office" ON public.profiles;
CREATE POLICY "profiles_update_office"
  ON public.profiles FOR UPDATE
  USING (public.current_user_role() = 'office');

-- Users can update their own profile (name etc.)
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());


-- DPR RLS
-- Site users: can only insert/select their own site's DPRs
DROP POLICY IF EXISTS "dprs_insert_site" ON public.dprs;
CREATE POLICY "dprs_insert_site"
  ON public.dprs FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      public.current_user_role() = 'office' OR
      site = public.current_user_site()
    )
  );

DROP POLICY IF EXISTS "dprs_select_site" ON public.dprs;
CREATE POLICY "dprs_select_site"
  ON public.dprs FOR SELECT
  USING (
    public.current_user_role() = 'office' OR
    site = public.current_user_site()
  );

-- Only office can update/delete DPRs
DROP POLICY IF EXISTS "dprs_update_office" ON public.dprs;
CREATE POLICY "dprs_update_office"
  ON public.dprs FOR UPDATE
  USING (public.current_user_role() = 'office');

DROP POLICY IF EXISTS "dprs_delete_office" ON public.dprs;
CREATE POLICY "dprs_delete_office"
  ON public.dprs FOR DELETE
  USING (public.current_user_role() = 'office');


-- INVENTORY RLS
-- Only office can manage inventory
DROP POLICY IF EXISTS "inventory_office_all" ON public.inventory;
CREATE POLICY "inventory_office_all"
  ON public.inventory FOR ALL
  USING (public.current_user_role() = 'office');


-- ── 5. DEMO DATA (OPTIONAL — delete before production) ────────
-- Uncomment to add sample inventory items after creating users.

/*
INSERT INTO public.inventory (site, name, unit, ordered, received, consumed, remarks) VALUES
  ('Devkigalol', 'Solar Module 545W EMVEE',      'nos', 3636, 2800, 2500, 'Lot-1 and Lot-2 received'),
  ('Devkigalol', 'Mounting Structure (Row)',      'set', 454,  400,  380,  'GI hot-dip galvanised'),
  ('Devkigalol', 'DC Cable 4sqmm (Black)',        'm',   45000,35000,28000,'Polycab make'),
  ('Kanja',      'Solar Module 545W EMVEE',       'nos', 2727, 2000, 1800, 'Lot-1 complete'),
  ('Kanja',      'DC Cable 4sqmm',                'm',   35000,25000,20000,''),
  ('Mendapara',  'Solar Module 545W EMVEE',       'nos', 4545, 3000, 2700, ''),
  ('Mendapara',  'AC Cable 240sqmm Aluminium',    'm',   8000, 6000, 4000, 'Havells make'),
  ('Mandodara',  'Solar Module 545W EMVEE',       'nos', 3272, 2200, 1900, ''),
  ('Mandodara',  'Inverter WattPower 500kW',      'nos', 4,    4,    4,    'All received, 2 commissioned');
*/

-- ============================================================
-- DONE. Your schema is ready.
-- Next: create users in Supabase Auth → update their profiles.
-- ============================================================
