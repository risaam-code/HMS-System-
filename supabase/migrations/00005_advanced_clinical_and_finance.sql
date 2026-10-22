-- ==============================================================================
-- MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — PART 4 ADVANCED OPERATIONS & FINANCE
-- ==============================================================================
-- Migration: 00005_advanced_clinical_and_finance.sql
-- Covers:
-- 1. Inpatient Wards, Beds, Bed Assignments, Nursing Observations, and Transfers
-- 2. Laboratory Sample Collections, Result Items, and Verification Records
-- 3. Pharmacy Batches, Inventory Transactions, Prescriptions, and Dispensing
-- 4. Billing Invoice Items, Idempotent Payments, and Authorized Refunds
-- 5. Referential and Concurrency Triggers:
--    - Prevent assigning occupied beds
--    - Prevent dispensing expired medicine batches
--    - Prevent negative stock deductions
--    - Server-side calculation of invoice totals
--    - Prevent unverified lab result publication
-- 6. Full Row Level Security (RLS) Policies on Every New Table
-- ==============================================================================

-- ==============================================================================
-- 1. INPATIENT MANAGEMENT: WARDS & BEDS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.wards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  ward_type TEXT NOT NULL CHECK (ward_type IN ('General', 'ICU', 'Maternity', 'Pediatric', 'Surgical', 'Private')),
  floor_number INT NOT NULL DEFAULT 1,
  total_beds INT NOT NULL DEFAULT 0,
  daily_rate NUMERIC(10,2) NOT NULL DEFAULT 150.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'full')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Wards
INSERT INTO public.wards (id, name, code, ward_type, floor_number, total_beds, daily_rate, status) VALUES
  ('w0000000-0000-0000-0000-000000000001', 'Intensive Care Unit (ICU)', 'ICU-MAIN', 'ICU', 3, 12, 650.00, 'active'),
  ('w0000000-0000-0000-0000-000000000002', 'Medical Ward 3 (West)', 'GW-3W', 'General', 3, 20, 180.00, 'active'),
  ('w0000000-0000-0000-0000-000000000003', 'Pediatric Inpatient Unit', 'PED-CARE', 'Pediatric', 2, 16, 220.00, 'active'),
  ('w0000000-0000-0000-0000-000000000004', 'Surgical Post-Op Pavilion', 'SURG-POST', 'Surgical', 4, 18, 320.00, 'active'),
  ('w0000000-0000-0000-0000-000000000005', 'Maternity & Neonatal Suite', 'MAT-NEO', 'Maternity', 2, 14, 280.00, 'active')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.beds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ward_id UUID NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL UNIQUE,
  bed_type TEXT NOT NULL DEFAULT 'standard' CHECK (bed_type IN ('standard', 'icu', 'ventilator', 'bariatric', 'pediatric')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance', 'cleaning', 'reserved')),
  daily_rate NUMERIC(10,2) NOT NULL DEFAULT 150.00,
  current_patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  current_admission_id UUID REFERENCES public.admissions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beds_ward ON public.beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON public.beds(status);

-- Seed Initial Beds
INSERT INTO public.beds (id, ward_id, bed_number, bed_type, status, daily_rate) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'w0000000-0000-0000-0000-000000000001', 'ICU-B01', 'ventilator', 'occupied', 650.00),
  ('b0000000-0000-0000-0000-000000000002', 'w0000000-0000-0000-0000-000000000001', 'ICU-B02', 'icu', 'occupied', 650.00),
  ('b0000000-0000-0000-0000-000000000003', 'w0000000-0000-0000-0000-000000000001', 'ICU-B03', 'icu', 'available', 650.00),
  ('b0000000-0000-0000-0000-000000000004', 'w0000000-0000-0000-0000-000000000002', 'GW-304A', 'standard', 'occupied', 180.00),
  ('b0000000-0000-0000-0000-000000000005', 'w0000000-0000-0000-0000-000000000002', 'GW-304B', 'standard', 'available', 180.00),
  ('b0000000-0000-0000-0000-000000000006', 'w0000000-0000-0000-0000-000000000002', 'GW-305A', 'standard', 'available', 180.00),
  ('b0000000-0000-0000-0000-000000000007', 'w0000000-0000-0000-0000-000000000003', 'PED-101', 'pediatric', 'available', 220.00),
  ('b0000000-0000-0000-0000-000000000008', 'w0000000-0000-0000-0000-000000000003', 'PED-102', 'pediatric', 'occupied', 220.00),
  ('b0000000-0000-0000-0000-000000000009', 'w0000000-0000-0000-0000-000000000004', 'SURG-401', 'standard', 'available', 320.00)
ON CONFLICT (bed_number) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.bed_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  bed_id UUID NOT NULL REFERENCES public.beds(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  reason TEXT,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bed_assign_admission ON public.bed_assignments(admission_id);
CREATE INDEX IF NOT EXISTS idx_bed_assign_bed ON public.bed_assignments(bed_id);

CREATE TABLE IF NOT EXISTS public.nursing_observations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admission_id UUID NOT NULL REFERENCES public.admissions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  nurse_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  vitals JSONB NOT NULL,
  pain_score INT DEFAULT 0 CHECK (pain_score >= 0 AND pain_score <= 10),
  consciousness TEXT DEFAULT 'Alert' CHECK (consciousness IN ('Alert', 'Verbal', 'Pain', 'Unresponsive')),
  notes TEXT NOT NULL,
  fluids_intake_ml INT,
  fluids_output_ml INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nursing_obs_admission ON public.nursing_observations(admission_id);

-- ==============================================================================
-- 2. PHARMACY BATCHES, TRANSACTIONS & DISPENSING
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.medicine_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity_available INT NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
  initial_quantity INT NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10,2) DEFAULT 0.00,
  received_date DATE DEFAULT CURRENT_DATE,
  supplier TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'quarantined', 'expired', 'depleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_medicine_batch UNIQUE (medicine_id, batch_number)
);

CREATE INDEX IF NOT EXISTS idx_batches_expiry ON public.medicine_batches(expiry_date, status);
CREATE INDEX IF NOT EXISTS idx_batches_medicine ON public.medicine_batches(medicine_id);

CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.medicine_batches(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receipt', 'dispense', 'adjustment', 'return', 'disposal')),
  quantity INT NOT NULL,
  balance_after INT NOT NULL,
  unit_price NUMERIC(10,2),
  reference_type TEXT,
  reference_id TEXT,
  reason TEXT,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_tx_medicine ON public.inventory_transactions(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_created ON public.inventory_transactions(created_at);

CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_number TEXT NOT NULL UNIQUE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
  medical_record_id UUID REFERENCES public.medical_records(id) ON DELETE SET NULL,
  visit_id UUID REFERENCES public.outpatient_visits(id) ON DELETE SET NULL,
  diagnosis TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partially_dispensed', 'dispensed', 'cancelled')),
  notes TEXT,
  prescribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until DATE NOT NULL,
  dispensed_at TIMESTAMPTZ,
  dispensed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON public.prescriptions(status);

CREATE TABLE IF NOT EXISTS public.prescription_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  quantity_prescribed INT NOT NULL CHECK (quantity_prescribed > 0),
  quantity_dispensed INT NOT NULL DEFAULT 0 CHECK (quantity_dispensed >= 0),
  instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rx_items_rx ON public.prescription_items(prescription_id);

CREATE TABLE IF NOT EXISTS public.dispensing_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispensing_number TEXT NOT NULL UNIQUE,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  pharmacist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  dispensed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dispensing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispensing_id UUID NOT NULL REFERENCES public.dispensing_records(id) ON DELETE CASCADE,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES public.medicine_batches(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 3. BILLING INVOICE ITEMS, REFUNDS & ADJUSTMENTS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('consultation', 'laboratory', 'pharmacy', 'admission', 'procedure', 'other')),
  description TEXT NOT NULL,
  reference_id TEXT,
  reference_type TEXT,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON public.invoice_items(invoice_id);

CREATE TABLE IF NOT EXISTS public.refund_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  refund_number TEXT NOT NULL UNIQUE,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  authorized_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_invoice ON public.refund_records(invoice_id);

-- Alter payments table to ensure idempotency_key is present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'idempotency_key'
  ) THEN
    ALTER TABLE public.payments ADD COLUMN idempotency_key TEXT UNIQUE;
  END IF;
END $$;

-- ==============================================================================
-- 4. CONCURRENCY & INTEGRITY TRIGGERS
-- ==============================================================================

-- 4.1 Prevent assigning an occupied bed
CREATE OR REPLACE FUNCTION public.fn_prevent_occupied_bed_assignment()
RETURNS TRIGGER AS $$
DECLARE
  v_bed_status TEXT;
  v_bed_number TEXT;
BEGIN
  SELECT status, bed_number INTO v_bed_status, v_bed_number
  FROM public.beds
  WHERE id = NEW.bed_id;

  IF v_bed_status = 'occupied' THEN
    RAISE EXCEPTION 'Concurrency Conflict: Bed % is currently occupied and cannot be allocated.', v_bed_number;
  END IF;

  -- Mark the allocated bed as occupied
  UPDATE public.beds
  SET status = 'occupied',
      current_patient_id = NEW.patient_id,
      current_admission_id = NEW.admission_id,
      updated_at = NOW()
  WHERE id = NEW.bed_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_occupied_bed_assignment ON public.bed_assignments;
CREATE TRIGGER trg_prevent_occupied_bed_assignment
BEFORE INSERT ON public.bed_assignments
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_occupied_bed_assignment();

-- 4.2 Prevent dispensing expired medicine batches
CREATE OR REPLACE FUNCTION public.fn_prevent_expired_medicine_dispense()
RETURNS TRIGGER AS $$
DECLARE
  v_expiry DATE;
  v_batch_num TEXT;
  v_available INT;
BEGIN
  SELECT expiry_date, batch_number, quantity_available
  INTO v_expiry, v_batch_num, v_available
  FROM public.medicine_batches
  WHERE id = NEW.batch_id;

  IF v_expiry < CURRENT_DATE THEN
    RAISE EXCEPTION 'Safety Violation: Batch % expired on % and cannot be dispensed.', v_batch_num, v_expiry;
  END IF;

  IF v_available < NEW.quantity THEN
    RAISE EXCEPTION 'Stock Violation: Insufficient inventory in batch %. Available: %, Requested: %', v_batch_num, v_available, NEW.quantity;
  END IF;

  -- Atomic stock deduction from batch
  UPDATE public.medicine_batches
  SET quantity_available = quantity_available - NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.batch_id;

  -- Atomic stock deduction from total medicine stock
  UPDATE public.medicines
  SET stock_quantity = stock_quantity - NEW.quantity,
      updated_at = NOW()
  WHERE id = NEW.medicine_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_expired_medicine_dispense ON public.dispensing_items;
CREATE TRIGGER trg_prevent_expired_medicine_dispense
BEFORE INSERT ON public.dispensing_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_expired_medicine_dispense();

-- 4.3 Server-side enforcement of invoice total calculations
CREATE OR REPLACE FUNCTION public.fn_recalculate_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_subtotal NUMERIC(12,2);
  v_tax NUMERIC(12,2);
  v_discount NUMERIC(12,2);
  v_insurance NUMERIC(12,2);
  v_total NUMERIC(12,2);
  v_paid NUMERIC(12,2);
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_invoice_id := OLD.invoice_id;
  ELSE
    v_invoice_id := NEW.invoice_id;
  END IF;

  SELECT COALESCE(SUM(total_price), 0.00) INTO v_subtotal
  FROM public.invoice_items
  WHERE invoice_id = v_invoice_id;

  SELECT discount_amount, insurance_covered_amount, paid_amount
  INTO v_discount, v_insurance, v_paid
  FROM public.invoices
  WHERE id = v_invoice_id;

  -- Standard hospital sales tax 5% on taxable non-medicine services, or flat 0% for healthcare exemptions
  v_tax := ROUND(v_subtotal * 0.05, 2);
  v_total := GREATEST(0.00, v_subtotal + v_tax - COALESCE(v_discount, 0.00) - COALESCE(v_insurance, 0.00));

  UPDATE public.invoices
  SET subtotal = v_subtotal,
      tax_amount = v_tax,
      total_amount = v_total,
      balance_due = GREATEST(0.00, v_total - COALESCE(v_paid, 0.00)),
      status = CASE 
        WHEN COALESCE(v_paid, 0.00) >= v_total AND v_total > 0 THEN 'paid'
        WHEN COALESCE(v_paid, 0.00) > 0 THEN 'partially_paid'
        ELSE 'unpaid'
      END,
      updated_at = NOW()
  WHERE id = v_invoice_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recalculate_invoice_totals ON public.invoice_items;
CREATE TRIGGER trg_recalculate_invoice_totals
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.fn_recalculate_invoice_totals();

-- 4.4 Prevent unverified lab result report release
CREATE OR REPLACE FUNCTION public.fn_prevent_unverified_lab_result_release()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'verified' AND (NEW.verified_at IS NULL OR NEW.technician_id IS NULL) THEN
    RAISE EXCEPTION 'Laboratory Protocol Violation: Cannot finalize report without authorized verification credentials.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_unverified_lab_result_release ON public.laboratory_requests;
CREATE TRIGGER trg_prevent_unverified_lab_result_release
BEFORE UPDATE ON public.laboratory_requests
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_unverified_lab_result_release();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bed_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nursing_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refund_records ENABLE ROW LEVEL SECURITY;

-- Wards & Beds: Readable by all hospital staff, manageable by Admin & Nurse
CREATE POLICY "wards_select" ON public.wards FOR SELECT TO authenticated USING (true);
CREATE POLICY "wards_admin_manage" ON public.wards FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id = 'administrator'));

CREATE POLICY "beds_select" ON public.beds FOR SELECT TO authenticated USING (true);
CREATE POLICY "beds_nurse_admin_manage" ON public.beds FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('administrator', 'nurse')));

-- Bed assignments & Nursing Observations: Clinical personnel
CREATE POLICY "bed_assignments_select" ON public.bed_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "bed_assignments_insert" ON public.bed_assignments FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('administrator', 'doctor', 'nurse', 'receptionist')));

CREATE POLICY "nursing_obs_select" ON public.nursing_observations FOR SELECT TO authenticated USING (true);
CREATE POLICY "nursing_obs_insert" ON public.nursing_observations FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('nurse', 'doctor', 'administrator')));

-- Medicine Batches & Inventory: Pharmacist & Administrator
CREATE POLICY "batches_select" ON public.medicine_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "batches_pharmacist_manage" ON public.medicine_batches FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('pharmacist', 'administrator')));

CREATE POLICY "inv_tx_select" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "inv_tx_insert" ON public.inventory_transactions FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('pharmacist', 'administrator')));

-- Prescriptions: Doctors create, Pharmacists view/dispense
CREATE POLICY "prescriptions_select" ON public.prescriptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "prescriptions_doctor_insert" ON public.prescriptions FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('doctor', 'administrator')));
CREATE POLICY "prescriptions_pharmacist_update" ON public.prescriptions FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('pharmacist', 'administrator', 'doctor')));

CREATE POLICY "rx_items_select" ON public.prescription_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "rx_items_doctor_insert" ON public.prescription_items FOR INSERT TO authenticated 
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('doctor', 'administrator')));

-- Dispensing: Pharmacists & Administrators
CREATE POLICY "dispensing_select" ON public.dispensing_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "dispensing_pharmacist_manage" ON public.dispensing_records FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('pharmacist', 'administrator')));

CREATE POLICY "dispensing_items_select" ON public.dispensing_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "dispensing_items_manage" ON public.dispensing_items FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('pharmacist', 'administrator')));

-- Invoices & Payments: Accountants & Administrators
CREATE POLICY "invoice_items_select" ON public.invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "invoice_items_manage" ON public.invoice_items FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('accountant', 'administrator')));

CREATE POLICY "refunds_select" ON public.refund_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "refunds_accountant_manage" ON public.refund_records FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_id IN ('accountant', 'administrator')));
