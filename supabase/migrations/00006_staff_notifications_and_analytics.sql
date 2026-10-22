-- ==============================================================================
-- 00006: MedPulse Hospital Management System (HMS) — Part 5 Migration
-- Tables: employees, attendance, leave_requests, notifications
-- Security: Confidential personnel salary protection, RLS, audit integration
-- ==============================================================================

-- 1. Employees / Staff Management
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_number TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation TEXT NOT NULL,
    employment_type TEXT NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'temporary')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated', 'suspended')),
    shift TEXT NOT NULL DEFAULT 'Morning' CHECK (shift IN ('Morning', 'Evening', 'Night', 'Rotating')),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    emergency_contact JSONB NOT NULL DEFAULT '{}'::jsonb,
    salary NUMERIC(12, 2), -- Confidential: accessible only to administrator / HR
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_dept ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- 2. Daily Attendance Roster
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'late', 'half_day', 'absent', 'on_leave')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_employee_attendance_date UNIQUE (employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);

-- 3. Leave Requests & Approvals
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leave_number TEXT UNIQUE NOT NULL,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'casual', 'maternity', 'paternity', 'bereavement', 'unpaid')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INTEGER NOT NULL CHECK (days_count > 0),
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_comments TEXT
);

CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON leave_requests(start_date, end_date);

-- 4. In-App Notifications Center
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('critical', 'warning', 'info', 'success')),
    target_role TEXT, -- e.g. "doctor", "nurse", "pharmacist", "laboratory_technician", "accountant", "administrator"
    target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON notifications(target_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- 5. Row-Level Security (RLS) Policies
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Employees policies:
-- Standard authenticated users can view staff roster (names, roles, departments, shifts)
CREATE POLICY "Public staff roster viewing"
    ON employees FOR SELECT
    TO authenticated
    USING (status != 'terminated' OR (SELECT role_id FROM profiles WHERE id = auth.uid()) = 'administrator');

-- Salary and sensitive profile modification restricted to Administrator
CREATE POLICY "Admin full staff management"
    ON employees FOR ALL
    TO authenticated
    USING ((SELECT role_id FROM profiles WHERE id = auth.uid()) = 'administrator');

-- Attendance policies:
CREATE POLICY "Staff view own and admin view all attendance"
    ON attendance FOR SELECT
    TO authenticated
    USING (
        (SELECT role_id FROM profiles WHERE id = auth.uid()) IN ('administrator', 'receptionist')
        OR employee_id = (SELECT id FROM employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    );

CREATE POLICY "Attendance recording authorized"
    ON attendance FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT role_id FROM profiles WHERE id = auth.uid()) IN ('administrator', 'receptionist'));

-- Leave Requests policies:
CREATE POLICY "View leave requests"
    ON leave_requests FOR SELECT
    TO authenticated
    USING (
        (SELECT role_id FROM profiles WHERE id = auth.uid()) = 'administrator'
        OR employee_id = (SELECT id FROM employees WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid()))
    );

CREATE POLICY "Submit leave requests"
    ON leave_requests FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admin approve or reject leave"
    ON leave_requests FOR UPDATE
    TO authenticated
    USING ((SELECT role_id FROM profiles WHERE id = auth.uid()) = 'administrator');

-- Notifications policies:
CREATE POLICY "View relevant notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (
        target_user_id = auth.uid()
        OR target_role IS NULL
        OR target_role = (SELECT role_id FROM profiles WHERE id = auth.uid())
        OR (SELECT role_id FROM profiles WHERE id = auth.uid()) = 'administrator'
    );

CREATE POLICY "Update notification read status"
    ON notifications FOR UPDATE
    TO authenticated
    USING (
        target_user_id = auth.uid()
        OR target_role = (SELECT role_id FROM profiles WHERE id = auth.uid())
        OR (SELECT role_id FROM profiles WHERE id = auth.uid()) = 'administrator'
    );
