import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { StaffService } from '@/services/staffService';
import { DepartmentService } from '@/services/departmentService';
import {
  StaffEmployee,
  Department,
  EmploymentType,
  StaffShift,
} from '@/types';
import {
  UserPlus,
  ShieldAlert,
  Building2,
  Lock,
  Phone,
  Clock,
  Briefcase,
} from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  employeeToEdit?: StaffEmployee | null;
  currentUserRole?: string;
}

export function EmployeeModal({
  isOpen,
  onClose,
  onSuccess,
  employeeToEdit,
  currentUserRole,
}: EmployeeModalProps) {
  const { addToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('nurse');
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('full_time');
  const [shift, setShift] = useState<StaffShift>('Morning');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRel, setEmergencyRel] = useState('');
  const [salary, setSalary] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const isAdmin = currentUserRole === 'administrator';

  useEffect(() => {
    async function loadDepts() {
      try {
        const depts = await DepartmentService.getDepartments();
        setDepartments(depts);
        if (depts.length > 0 && !departmentId) {
          setDepartmentId(depts[0].id);
        }
      } catch (err) {
        console.error('Failed to load departments', err);
      }
    }
    if (isOpen) {
      loadDepts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (employeeToEdit) {
      setFirstName(employeeToEdit.firstName);
      setLastName(employeeToEdit.lastName);
      setEmail(employeeToEdit.email);
      setPhone(employeeToEdit.phone);
      setRole(employeeToEdit.role);
      setDepartmentId(employeeToEdit.departmentId);
      setDesignation(employeeToEdit.designation);
      setEmploymentType(employeeToEdit.employmentType);
      setShift(employeeToEdit.shift);
      setHireDate(employeeToEdit.hireDate);
      setEmergencyName(employeeToEdit.emergencyContact?.name || '');
      setEmergencyPhone(employeeToEdit.emergencyContact?.phone || '');
      setEmergencyRel(employeeToEdit.emergencyContact?.relationship || '');
      setSalary(employeeToEdit.salary ?? '');
      setNotes(employeeToEdit.notes || '');
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setRole('nurse');
      setDesignation('');
      setEmploymentType('full_time');
      setShift('Morning');
      setHireDate(new Date().toISOString().split('T')[0]);
      setEmergencyName('');
      setEmergencyPhone('');
      setEmergencyRel('');
      setSalary('');
      setNotes('');
    }
  }, [employeeToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      addToast('First name and Last name are required.', 'error');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      addToast('Please provide a valid email address.', 'error');
      return;
    }
    if (!phone.trim()) {
      addToast('Contact phone number is required.', 'error');
      return;
    }
    if (!designation.trim()) {
      addToast('Clinical/Staff designation is required.', 'error');
      return;
    }

    const dept = departments.find((d) => d.id === departmentId);
    const departmentName = dept ? dept.name : 'General Hospital';

    try {
      setIsSubmitting(true);
      if (employeeToEdit) {
        await StaffService.updateStaff(employeeToEdit.id, {
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          email,
          phone,
          role,
          departmentId,
          departmentName,
          designation,
          employmentType,
          shift,
          hireDate,
          emergencyContact: {
            name: emergencyName,
            phone: emergencyPhone,
            relationship: emergencyRel,
          },
          salary: isAdmin && salary !== '' ? Number(salary) : employeeToEdit.salary,
          notes,
        });
        addToast(`Employee ${firstName} ${lastName} profile updated successfully.`, 'success');
      } else {
        await StaffService.addStaff({
          firstName,
          lastName,
          email,
          phone,
          role,
          departmentId,
          departmentName,
          designation,
          employmentType,
          shift,
          hireDate,
          emergencyContact: {
            name: emergencyName,
            phone: emergencyPhone,
            relationship: emergencyRel,
          },
          salary: isAdmin && salary !== '' ? Number(salary) : undefined,
          notes,
        });
        addToast(`New staff member ${firstName} ${lastName} registered successfully.`, 'success');
      }
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast(err?.message || 'Failed to save staff record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? `Edit Staff Profile: ${employeeToEdit.fullName}` : 'Register New Hospital Employee'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-sm text-teal-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-teal-700 flex-shrink-0" />
            <span>Personnel profiles maintain verified departmental assignment and shift schedules.</span>
          </div>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
              <Lock className="w-3 h-3 text-amber-700" />
              HR Admin Access Active
            </span>
          )}
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Eleanor"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Vance"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        {/* Contact info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Work Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              required
              placeholder="e.g. e.vance@medpulse.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contact Phone <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              required
              placeholder="e.g. +1 (555) 234-5678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Role, Department, Designation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hospital Role <span className="text-red-500">*</span>
            </label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'doctor', label: 'Doctor (Physician)' },
                { value: 'nurse', label: 'Registered Nurse (RN)' },
                { value: 'pharmacist', label: 'Pharmacist (PharmD)' },
                { value: 'laboratory_technician', label: 'Laboratory Technologist' },
                { value: 'accountant', label: 'Financial Accountant' },
                { value: 'receptionist', label: 'Patient Receptionist' },
                { value: 'administrator', label: 'System Administrator' },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <Select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              options={departments.map((d) => ({
                value: d.id,
                label: `${d.name} (${d.code})`,
              }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Designation / Title <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Staff Nurse II"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
          </div>
        </div>

        {/* Employment Type, Shift, Hire Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Employment Type
            </label>
            <Select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
              options={[
                { value: 'full_time', label: 'Full Time' },
                { value: 'part_time', label: 'Part Time' },
                { value: 'contract', label: 'Contractor' },
                { value: 'temporary', label: 'Temporary / Locum' },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assigned Shift
            </label>
            <Select
              value={shift}
              onChange={(e) => setShift(e.target.value as StaffShift)}
              options={[
                { value: 'Morning', label: 'Morning (07:00 - 15:00)' },
                { value: 'Evening', label: 'Evening (15:00 - 23:00)' },
                { value: 'Night', label: 'Night (23:00 - 07:00)' },
                { value: 'Rotating', label: 'Rotating On-Call' },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hire Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              required
              value={hireDate}
              onChange={(e) => setHireDate(e.target.value)}
            />
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/70 space-y-3">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            Emergency Contact Information
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Contact Name</label>
              <Input
                type="text"
                placeholder="e.g. Robert Smith"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Contact Phone</label>
              <Input
                type="tel"
                placeholder="e.g. +1 (555) 987-6543"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">Relationship</label>
              <Input
                type="text"
                placeholder="e.g. Spouse / Sibling"
                value={emergencyRel}
                onChange={(e) => setEmergencyRel(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Strictly Confidential Personnel Information: SALARY (Admin-Only) */}
        {isAdmin ? (
          <div className="border border-amber-300 rounded-lg p-3.5 bg-amber-50/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                Confidential Salary & Compensation (Administrator Eyes Only)
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                HIPAA & HR Restricted
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-medium text-amber-900 mb-1">
                  Annual Gross Compensation ($ USD)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="500"
                  placeholder="e.g. 115000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                This field is protected by PostgreSQL Row-Level Security policies. Non-administrator roles receive redacted null responses.
              </p>
            </div>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-lg p-3 bg-slate-100 text-slate-500 text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>Confidential personnel compensation is strictly restricted to hospital administrators.</span>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Professional Notes / Credentials
          </label>
          <Input
            type="text"
            placeholder="e.g. Certified Pediatric Advanced Life Support Lead"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : employeeToEdit ? 'Save Changes' : 'Register Employee'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
