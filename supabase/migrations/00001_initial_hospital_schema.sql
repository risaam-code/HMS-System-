-- ==============================================================================
-- MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — FOUNDATIONAL POSTGRESQL SCHEMA
-- ==============================================================================
-- Part 1 Foundation Migration: Tables, Enums, Foreign Keys & RLS Security Scaffolding
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role & Status Types
CREATE TYPE user_role AS ENUM (
  'admin',
  'doctor',
  'nurse',
  'pharmacist',
  'lab_technician',
  'receptionist',
  'accountant'
);

CREATE TYPE appointment_status AS ENUM (
  'scheduled',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE patient_status AS ENUM (
  'active',
  'discharged',
  'admitted',
  'critical'
);

CREATE TYPE priority_level AS ENUM (
  'low',
  'normal',
  'urgent',
  'stat'
);

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  head_doctor_id UUID,
  building_wing TEXT,
  floor_number INTEGER,
  total_beds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Staff Profiles (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'doctor',
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  phone TEXT,
  license_number TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Patients Table (Master Patient Index)
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medical_record_number TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  blood_group TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  status patient_status NOT NULL DEFAULT 'active',
  assigned_doctor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'consultation',
  status appointment_status NOT NULL DEFAULT 'scheduled',
  priority priority_level NOT NULL DEFAULT 'normal',
  clinical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Medical Records Table
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  diagnosis_code TEXT,
  diagnosis_title TEXT NOT NULL,
  clinical_notes TEXT,
  treatment_plan TEXT,
  is_confidential BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit Logs Table (HIPAA Access Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_email TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL, -- READ, CREATE, UPDATE, DELETE, LOGIN
  target_resource TEXT NOT NULL,
  ip_address TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Initial Policies Scaffolding
CREATE POLICY "Profiles readable by authenticated staff"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Patients readable by authenticated staff"
  ON public.patients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Appointments readable by authenticated staff"
  ON public.appointments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Audit logs insertable by all actions"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
