-- ==============================================================================
-- MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — PART 3 CORE OPERATIONS
-- ==============================================================================
-- Migration: 00004_core_operations.sql
-- Covers:
-- 1. Patient allergies, documents, and registration metadata
-- 2. Department deletion protection trigger
-- 3. Doctor qualifications and schedule slots
-- 4. Appointment double-booking safe concurrency trigger
-- 5. Medical record digital signing & immutable amendment history
-- 6. Outpatient (OPD) 11-step visit management
-- ==============================================================================

-- 1. Patients Table Enhancements
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS registration_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- 2. Departments Table Enhancements & Deletion Protection
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS contact_number TEXT;

CREATE OR REPLACE FUNCTION public.check_department_has_records()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent deletion if linked to doctors
  IF EXISTS (SELECT 1 FROM public.doctors WHERE department_id = OLD.id) THEN
    RAISE EXCEPTION 'Constraint Violation: Cannot delete department with active physician assignments. Deactivate instead.';
  END IF;

  -- Prevent deletion if linked to historical appointments
  IF EXISTS (SELECT 1 FROM public.appointments WHERE department_id = OLD.id) THEN
    RAISE EXCEPTION 'Constraint Violation: Cannot delete department linked to historical appointments.';
  END IF;

  -- Prevent deletion if linked to inpatient admissions
  IF EXISTS (SELECT 1 FROM public.admissions WHERE department_id = OLD.id) THEN
    RAISE EXCEPTION 'Constraint Violation: Cannot delete department linked to inpatient admission records.';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_department_deletion ON public.departments;
CREATE TRIGGER trg_prevent_department_deletion
  BEFORE DELETE ON public.departments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_department_has_records();

-- 3. Doctors Table Enhancements
ALTER TABLE public.doctors
  ADD COLUMN IF NOT EXISTS qualifications TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS availability_schedule JSONB DEFAULT '[]';

-- 4. Appointments Table Enhancements & Overlap Prevention
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS visit_reason TEXT,
  ADD COLUMN IF NOT EXISTS booking_user_id UUID,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_time TIMESTAMPTZ;

-- Doctor Double-Booking Prevention Trigger
CREATE OR REPLACE FUNCTION public.prevent_doctor_double_booking()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate non-cancelled and non-no-show appointments
  IF NEW.status NOT IN ('cancelled', 'no_show', 'Cancelled', 'No Show') THEN
    IF EXISTS (
      SELECT 1 FROM public.appointments
      WHERE doctor_id = NEW.doctor_id
        AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND status NOT IN ('cancelled', 'no_show', 'Cancelled', 'No Show')
        -- Overlap check: Scheduled time overlap or explicit date/time overlap
        AND (
          (NEW.start_time IS NOT NULL AND NEW.end_time IS NOT NULL AND date = NEW.date
           AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time))
          OR (NEW.scheduled_at IS NOT NULL AND scheduled_at = NEW.scheduled_at)
        )
    ) THEN
      RAISE EXCEPTION 'Scheduling Conflict: Doctor already has an active consultation scheduled during this time slot.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_doctor_double_booking ON public.appointments;
CREATE TRIGGER trg_prevent_doctor_double_booking
  BEFORE INSERT OR UPDATE OF doctor_id, scheduled_at, date, start_time, end_time, status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_doctor_double_booking();

-- 5. Medical Records Digital Signing & Amendments
ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS vital_signs JSONB,
  ADD COLUMN IF NOT EXISTS prescriptions JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS follow_up_date DATE,
  ADD COLUMN IF NOT EXISTS report_references TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_signed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_by_doctor_id UUID REFERENCES public.doctors(id);

CREATE TABLE IF NOT EXISTS public.medical_record_amendments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
  amended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  amendment_reason TEXT NOT NULL,
  previous_notes TEXT NOT NULL,
  new_notes TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mr_amendments_record ON public.medical_record_amendments(record_id);

-- Enforce that signed medical records cannot have their clinical notes overwritten silently
CREATE OR REPLACE FUNCTION public.enforce_signed_record_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.is_signed = TRUE AND NEW.clinical_notes IS DISTINCT FROM OLD.clinical_notes THEN
    -- A corresponding amendment entry MUST exist or be created in the transaction
    IF NOT EXISTS (
      SELECT 1 FROM public.medical_record_amendments
      WHERE record_id = OLD.id
        AND amended_at >= NOW() - INTERVAL '5 seconds'
    ) THEN
      RAISE EXCEPTION 'Integrity Error: Signed clinical notes cannot be modified without recording an official clinical amendment.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_signed_record_immutability ON public.medical_records;
CREATE TRIGGER trg_enforce_signed_record_immutability
  BEFORE UPDATE ON public.medical_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_signed_record_immutability();

-- 6. Outpatient (OPD) Visits Table
CREATE TABLE IF NOT EXISTS public.outpatient_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_number TEXT NOT NULL UNIQUE,
  queue_token TEXT NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'Registered' CHECK (status IN (
    'Registered', 'Checked In', 'Triage Completed', 'In Consultation',
    'Lab Requested', 'Prescription Issued', 'Billed', 'Completed', 'Cancelled'
  )),
  priority TEXT NOT NULL DEFAULT 'Routine' CHECK (priority IN ('Routine', 'Urgent', 'STAT')),
  is_walk_in BOOLEAN DEFAULT FALSE,
  vitals JSONB,
  chief_complaint TEXT,
  consultation_notes TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  lab_requests TEXT[] DEFAULT '{}',
  prescriptions JSONB DEFAULT '[]',
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 100.00,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opd_patient ON public.outpatient_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_doctor ON public.outpatient_visits(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_status ON public.outpatient_visits(status);

-- RLS on new tables
ALTER TABLE public.medical_record_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outpatient_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Medical record amendments readable by clinical staff"
  ON public.medical_record_amendments FOR SELECT TO authenticated
  USING (public.current_user_has_permission('medical_records:view') OR public.is_admin());

CREATE POLICY "Medical record amendments insertable by doctors"
  ON public.medical_record_amendments FOR INSERT TO authenticated
  WITH CHECK (public.current_user_has_permission('medical_records:amend') OR public.is_admin());

CREATE POLICY "Outpatient visits readable by staff"
  ON public.outpatient_visits FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Outpatient visits manageable by receptionist and clinical staff"
  ON public.outpatient_visits FOR ALL TO authenticated
  USING (public.current_user_has_permission('appointments:manage') OR public.is_clinical_staff() OR public.is_admin())
  WITH CHECK (public.current_user_has_permission('appointments:manage') OR public.is_clinical_staff() OR public.is_admin());
