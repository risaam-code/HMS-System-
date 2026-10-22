-- ==============================================================================
-- MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — AUTOMATED AUDIT LOGGING TRIGGERS
-- ==============================================================================
-- Migration: 00003_audit_triggers.sql
-- Implements automated change data capture (CDC) auditing for sensitive operations.
-- Sanitizes payloads (no passwords/tokens/PHI bloat) and records actor and timestamp.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_actor_id UUID;
  v_actor_email TEXT;
  v_actor_role TEXT;
  v_action TEXT;
  v_record_id TEXT;
  v_old_values JSONB := NULL;
  v_new_values JSONB := NULL;
BEGIN
  -- Resolve actor from auth.uid() or session
  v_actor_id := auth.uid();
  SELECT email, role_id INTO v_actor_email, v_actor_role
  FROM public.profiles WHERE id = v_actor_id;

  v_actor_email := COALESCE(v_actor_email, 'system@medpulse-hospital.org');
  v_actor_role := COALESCE(v_actor_role, 'system');

  IF TG_OP = 'INSERT' THEN
    v_action := TG_TABLE_NAME || '_CREATED';
    v_record_id := NEW.id::TEXT;
    v_new_values := to_jsonb(NEW) - 'password' - 'access_token' - 'token';
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := TG_TABLE_NAME || '_UPDATED';
    v_record_id := NEW.id::TEXT;
    v_old_values := to_jsonb(OLD) - 'password' - 'access_token' - 'token';
    v_new_values := to_jsonb(NEW) - 'password' - 'access_token' - 'token';

    -- Specific Clinical Domain Action Enhancements
    IF TG_TABLE_NAME = 'medical_records' THEN
      v_action := 'MEDICAL_RECORD_AMENDED';
    ELSIF TG_TABLE_NAME = 'laboratory_requests' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
      v_action := 'LAB_RESULT_VERIFIED';
    ELSIF TG_TABLE_NAME = 'medicines' AND NEW.stock_quantity != OLD.stock_quantity THEN
      v_action := 'INVENTORY_ADJUSTED';
    ELSIF TG_TABLE_NAME = 'patients' THEN
      v_action := 'PATIENT_RECORD_CHANGED';
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action := TG_TABLE_NAME || '_DELETED';
    v_record_id := OLD.id::TEXT;
    v_old_values := to_jsonb(OLD) - 'password' - 'access_token' - 'token';
  END IF;

  -- Insert sanitized audit log entry
  INSERT INTO public.audit_logs (
    actor_id,
    actor_email,
    actor_role,
    action,
    target_table,
    record_id,
    old_values,
    new_values
  ) VALUES (
    v_actor_id,
    v_actor_email,
    v_actor_role,
    v_action,
    TG_TABLE_NAME,
    v_record_id,
    v_old_values,
    v_new_values
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach automatic audit triggers to sensitive hospital tables
DROP TRIGGER IF EXISTS trg_audit_patients ON public.patients;
CREATE TRIGGER trg_audit_patients
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS trg_audit_medical_records ON public.medical_records;
CREATE TRIGGER trg_audit_medical_records
  AFTER INSERT OR UPDATE OR DELETE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS trg_audit_medicines ON public.medicines;
CREATE TRIGGER trg_audit_medicines
  AFTER UPDATE ON public.medicines
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS trg_audit_lab_requests ON public.laboratory_requests;
CREATE TRIGGER trg_audit_lab_requests
  AFTER UPDATE ON public.laboratory_requests
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS trg_audit_invoices ON public.invoices;
CREATE TRIGGER trg_audit_invoices
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

DROP TRIGGER IF EXISTS trg_audit_payments ON public.payments;
CREATE TRIGGER trg_audit_payments
  AFTER INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();
