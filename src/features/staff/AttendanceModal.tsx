import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { StaffService } from '@/services/staffService';
import { StaffEmployee, AttendanceStatus } from '@/types';
import { Clock, CalendarCheck } from 'lucide-react';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEmployeeId?: string;
  initialDate?: string;
}

export function AttendanceModal({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeId,
  initialDate,
}: AttendanceModalProps) {
  const { addToast } = useToast();
  const [staffList, setStaffList] = useState<StaffEmployee[]>([]);
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState('08:00');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [status, setStatus] = useState<AttendanceStatus>('present');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadStaff() {
      try {
        const staff = await StaffService.getStaff();
        setStaffList(staff);
        if (staff.length > 0 && !employeeId) {
          setEmployeeId(staff[0].id);
        }
      } catch (err) {
        console.error('Failed to load staff list', err);
      }
    }
    if (isOpen) {
      loadStaff();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialEmployeeId) setEmployeeId(initialEmployeeId);
    if (initialDate) setDate(initialDate);
  }, [initialEmployeeId, initialDate, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      addToast('Please select a staff member.', 'error');
      return;
    }
    if (!date) {
      addToast('Please choose the attendance date.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await StaffService.recordAttendance({
        employeeId,
        date,
        checkInTime: checkInTime ? `${checkInTime}:00` : undefined,
        checkOutTime: checkOutTime ? `${checkOutTime}:00` : undefined,
        status,
        notes: notes.trim() || undefined,
      });

      addToast('Daily attendance entry saved successfully.', 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast(err?.message || 'Failed to record attendance.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Daily Staff Attendance"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 flex items-center gap-2">
          <CalendarCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>Synchronizes real-time hospital shift presence and punch logs.</span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Staff Member <span className="text-red-500">*</span>
          </label>
          <Select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            options={staffList.map((s) => ({
              value: s.id,
              label: `${s.fullName} (${s.designation} - ${s.departmentName})`,
            }))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attendance Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Attendance Status <span className="text-red-500">*</span>
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
              options={[
                { value: 'present', label: 'Present (On Time)' },
                { value: 'late', label: 'Late Arrival' },
                { value: 'half_day', label: 'Half Day' },
                { value: 'absent', label: 'Unexcused Absent' },
                { value: 'on_leave', label: 'Approved Leave' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Check-In Time
            </label>
            <Input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Check-Out Time (Optional)
            </label>
            <Input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Attendance Notes / Shift Exceptions
          </label>
          <Input
            type="text"
            placeholder="e.g. Covered on-call shift in ICU"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Record Attendance'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
