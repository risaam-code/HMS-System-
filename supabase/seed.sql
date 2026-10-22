-- ==============================================================================
-- MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — DEVELOPMENT SEED DATA
-- ==============================================================================
-- Fictional dataset for local development, clinical testing, and demo environments.
-- Contains zero real patient health information (PHI) or privileged secrets.
-- ==============================================================================

-- 1. Clinical Departments
INSERT INTO public.departments (id, name, code, description, location, building_wing, contact_phone, is_active)
VALUES
  ('dept-1', 'Cardiology', 'CARD', 'Comprehensive adult and pediatric cardiac care, cath lab, and echocardiography.', 'Tower A, 4th Floor', 'Tower A', '+1 (555) 019-2831', true),
  ('dept-2', 'Neurology', 'NEUR', 'Advanced stroke response, epilepsy management, EEG, and neuromuscular diagnostics.', 'Tower B, 3rd Floor', 'Tower B', '+1 (555) 019-2832', true),
  ('dept-3', 'Orthopedics', 'ORTH', 'Joint reconstruction, sports medicine, trauma surgery, and spine therapy.', 'West Wing, 2nd Floor', 'West Wing', '+1 (555) 019-2833', true),
  ('dept-4', 'Pediatrics', 'PEDS', 'Comprehensive inpatient pediatric care, neonatal intensive care, and child development.', 'East Wing, 1st Floor', 'East Wing', '+1 (555) 019-2834', true),
  ('dept-5', 'General Surgery', 'SURG', 'Laparoscopic surgery, oncology resections, surgical trauma, and post-op care.', 'Tower A, 6th Floor', 'Tower A', '+1 (555) 019-2835', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Wards & Inpatient Beds
INSERT INTO public.wards (id, ward_number, name, department_id, ward_type, floor_number, building_wing, total_beds, daily_rate, status)
VALUES
  ('w-1', 'WRD-ICU-01', 'Cardiovascular Intensive Care Unit', 'dept-1', 'ICU', 4, 'Tower A', 12, 450.00, 'active'),
  ('w-2', 'WRD-GEN-02', 'Medical-Surgical Stepdown Unit', 'dept-5', 'General', 3, 'Tower B', 24, 180.00, 'active'),
  ('w-3', 'WRD-MAT-03', 'Pediatric & Neonatal Suite', 'dept-4', 'Maternity', 2, 'East Wing', 16, 220.00, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.beds (id, ward_id, bed_number, bed_type, daily_rate, status)
VALUES
  ('bed-101', 'w-1', 'ICU-101', 'ICU', 450.00, 'occupied'),
  ('bed-102', 'w-1', 'ICU-102', 'ICU', 450.00, 'available'),
  ('bed-103', 'w-1', 'ICU-103', 'ICU', 450.00, 'cleaning'),
  ('bed-201', 'w-2', 'GEN-201', 'Standard', 180.00, 'available'),
  ('bed-202', 'w-2', 'GEN-202', 'Standard', 180.00, 'available'),
  ('bed-301', 'w-3', 'PEDS-301', 'Pediatric', 220.00, 'available')
ON CONFLICT (id) DO NOTHING;

-- 3. Master Patient Index (MPI)
INSERT INTO public.patients (id, medical_record_number, first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact, blood_group, allergies, status)
VALUES
  ('pat-1', 'MRN-2026-00101', 'Eleanor', 'Vance', '1984-06-12', 'Female', '+1 (555) 234-5678', 'eleanor.vance@example.com', '742 Evergreen Terrace, Springfield', '{"name": "Arthur Vance", "phone": "+1 (555) 234-9999", "relationship": "Spouse"}', 'A_POSITIVE', ARRAY['Penicillin', 'Sulfa'], 'active'),
  ('pat-2', 'MRN-2026-00102', 'Arthur', 'Pendelton', '1962-11-28', 'Male', '+1 (555) 345-6789', 'arthur.pendelton@example.com', '128 Baker Street, Boston, MA', '{"name": "Mary Pendelton", "phone": "+1 (555) 345-0011", "relationship": "Daughter"}', 'O_POSITIVE', ARRAY['Aspirin'], 'active'),
  ('pat-3', 'MRN-2026-00103', 'Sophia', 'Alvarez', '1995-03-24', 'Female', '+1 (555) 456-7890', 'sophia.alvarez@example.com', '89 Ocean Drive, Miami, FL', '{"name": "Carlos Alvarez", "phone": "+1 (555) 456-1122", "relationship": "Father"}', 'B_POSITIVE', ARRAY[]::text[], 'active'),
  ('pat-4', 'MRN-2026-00104', 'Michael', 'Chen', '2016-08-15', 'Male', '+1 (555) 567-8901', 'chen.family@example.com', '45 Elm Street, Seattle, WA', '{"name": "Linda Chen", "phone": "+1 (555) 567-3344", "relationship": "Mother"}', 'O_NEGATIVE', ARRAY['Peanuts'], 'active'),
  ('pat-5', 'MRN-2026-00105', 'Claire', 'Beauchamp', '1978-09-02', 'Female', '+1 (555) 678-9012', 'claire.beauchamp@example.com', '31 High Street, Savannah, GA', '{"name": "Jamie Fraser", "phone": "+1 (555) 678-5566", "relationship": "Spouse"}', 'AB_POSITIVE', ARRAY[]::text[], 'active')
ON CONFLICT (id) DO NOTHING;

-- 4. Laboratory Diagnostic Catalog
INSERT INTO public.laboratory_tests (id, test_code, test_name, category, price, turnaround_time, specimen_type)
VALUES
  ('lt-1', 'CBC-DIFF', 'Complete Blood Count with Differential', 'Hematology', 45.00, '2 Hours', 'Whole Blood (EDTA)'),
  ('lt-2', 'BMP-7', 'Basic Metabolic Panel (7 Analytes)', 'Biochemistry', 65.00, '3 Hours', 'Serum'),
  ('lt-3', 'TROP-STAT', 'Troponin-T High Sensitivity (Cardiac Marker)', 'Biochemistry', 85.00, '45 Mins (STAT)', 'Plasma (Heparin)'),
  ('lt-4', 'LIPID-PANEL', 'Comprehensive Lipid Profile', 'Biochemistry', 55.00, '4 Hours', 'Serum (Fasting)'),
  ('lt-5', 'COVID-PCR', 'SARS-CoV-2 RT-PCR Molecular Assay', 'Microbiology', 95.00, '6 Hours', 'Nasopharyngeal Swab')
ON CONFLICT (id) DO NOTHING;

-- 5. Pharmaceutical Formulary & Inventory
INSERT INTO public.medicines (id, sku_code, brand_name, generic_name, category, dosage_form, strength, unit_price, stock_quantity, reorder_level, manufacturer, is_prescription_required, status)
VALUES
  ('med-1', 'MED-AMX-500', 'Amoxil', 'Amoxicillin Trihydrate', 'Antibiotics', 'Capsule', '500mg', 0.85, 450, 50, 'GlaxoSmithKline', true, 'active'),
  ('med-2', 'MED-AML-10', 'Norvasc', 'Amlodipine Besylate', 'Cardiovascular', 'Tablet', '10mg', 1.20, 280, 40, 'Pfizer Labs', true, 'active'),
  ('med-3', 'MED-MET-850', 'Glucophage', 'Metformin Hydrochloride', 'Antidiabetic', 'Tablet', '850mg', 0.65, 320, 50, 'Merck Santé', true, 'active'),
  ('med-4', 'MED-LEV-500', 'Levaquin', 'Levofloxacin', 'Antibiotics', 'Tablet', '500mg', 2.45, 12, 30, 'Janssen Pharmaceuticals', true, 'active'),
  ('med-5', 'MED-ATOR-20', 'Lipitor', 'Atorvastatin Calcium', 'Cardiovascular', 'Tablet', '20mg', 1.15, 180, 35, 'Viatris', true, 'active')
ON CONFLICT (id) DO NOTHING;

-- 6. Hospital Employees & Staff
INSERT INTO public.employees (id, employee_number, first_name, last_name, email, phone, role, department_id, designation, employment_type, status, shift, hire_date, salary)
VALUES
  ('emp-1', 'EMP-1091', 'Robert', 'Vance', 'robert.vance@medpulse.org', '+1 (555) 234-5601', 'doctor', 'dept-1', 'Senior Interventional Cardiologist', 'full_time', 'active', 'Morning', '2021-03-15', 245000),
  ('emp-2', 'EMP-1092', 'Sarah', 'Lin', 'sarah.lin@medpulse.org', '+1 (555) 345-6702', 'doctor', 'dept-4', 'Attending Pediatrician', 'full_time', 'active', 'Morning', '2022-01-10', 210000),
  ('emp-3', 'EMP-1093', 'Beatrice', 'Miller', 'beatrice.miller@medpulse.org', '+1 (555) 432-1093', 'nurse', 'dept-1', 'Head Emergency & ICU Triage Nurse', 'full_time', 'active', 'Rotating', '2020-06-01', 92000),
  ('emp-4', 'EMP-1094', 'David', 'Kowalski', 'david.kowalski@medpulse.org', '+1 (555) 543-2104', 'pharmacist', 'dept-1', 'Director of Pharmacy Services', 'full_time', 'active', 'Morning', '2019-11-15', 135000),
  ('emp-5', 'EMP-1095', 'Anita', 'Desai', 'anita.desai@medpulse.org', '+1 (555) 654-3205', 'laboratory_staff', 'dept-1', 'Lead Clinical Laboratory Technologist', 'full_time', 'active', 'Morning', '2021-08-20', 88000),
  ('emp-6', 'EMP-1096', 'Patricia', 'Sterling', 'patricia.sterling@medpulse.org', '+1 (555) 765-4306', 'accountant', 'dept-1', 'Chief Hospital Comptroller', 'full_time', 'active', 'Morning', '2018-04-01', 115000),
  ('emp-7', 'EMP-1097', 'Marcus', 'Young', 'marcus.young@medpulse.org', '+1 (555) 876-5407', 'receptionist', 'dept-1', 'Patient Admissions Coordinator', 'full_time', 'active', 'Evening', '2023-02-15', 52000)
ON CONFLICT (id) DO NOTHING;

-- 7. In-App Notifications
INSERT INTO public.notifications (id, type, title, message, severity, target_role, is_read, created_at)
VALUES
  ('not-1', 'lab_result_verified', 'CRITICAL LAB PANIC: Elevated Troponin STAT', 'High-sensitivity Troponin-T elevated (0.42 ng/mL) for ICU Bed #101 (Eleanor Vance). Immediate cardiology evaluation advised.', 'critical', 'doctor', false, NOW() - INTERVAL '15 minutes'),
  ('not-2', 'low_stock_alert', 'Formulary Depletion: Levofloxacin 500mg', 'Current inventory for Levofloxacin 500mg is 12 units, below the safety reorder threshold of 30 units.', 'warning', 'pharmacist', false, NOW() - INTERVAL '45 minutes'),
  ('not-3', 'admission_created', 'New Inpatient Admission to ICU-101', 'Eleanor Vance admitted under Dr. Robert Vance for Acute Coronary Syndrome.', 'info', 'nurse', true, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;
