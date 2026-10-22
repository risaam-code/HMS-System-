import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { StaffService } from '@/services/staffService';
import { StaffEmployee, LeaveType } from '@/types';
import { CalendarRange, Info } from 'lucide-react';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialEmployeeId?: string;
}

export function LeaveRequestModal({
  isOpen,
  onClose,
  onSuccess,
  initialEmployeeId,
}: LeaveRequestModalProps) {
  const { addToast } = useToast();
  const [staffList, setStaffList] = useState<StaffEmployee[]>([]);
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || '');
  const [leaveType, setLeaveType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
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
  }, [initialEmployeeId, isOpen]);

  const daysCalculated = React.useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (end < start) return 0;
    return Math.round((end - start) / (1000 * 3600 * 24)) + 1;
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      addToast('Please select a staff member.', 'error');
      return;
    }
    if (!startDate || !endDate) {
      addToast('Please specify valid start and end dates.', 'error');
      return;
    }
    if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
      addToast('End date cannot precede the start date.', 'error');
      return;
    }
    if (!reason.trim()) {
      addToast('Please provide a justification reason for this leave request.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await StaffService.submitLeaveRequest({
        employeeId,
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
      });

      addToast('Leave request submitted to administration successfully.', 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast(err?.message || 'Failed to submit leave request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Apply for Personnel Leave"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800 flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>Leave requests require departmental review and administrative authorization.</span>
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Leave Category <span className="text-red-500">*</span>
          </label>
          <Select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value as LeaveType)}
            options={[
              { value: 'annual', label: 'Annual / Paid Vacation' },
              { value: 'sick', label: 'Medical / Sick Leave' },
              { value: 'casual', label: 'Casual Leave' },
              { value: 'maternity', label: 'Maternity Leave' },
              { value: 'paternity', label: 'Paternity Leave' },
              { value: 'bereavement', label: 'Compassionate / Bereavement' },
              { value: 'unpaid', label: 'Unpaid Leave of Absence' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Start Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              End Date <span className="text-red-500">*</span>
            </label>
            <Input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-xs">
          <span className="text-slate-600 font-medium flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Total Duration:
          </span>
          <span className="font-bold text-slate-900">
            {daysCalculated} calendar day{daysCalculated !== 1 ? 's' : ''}
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Leave <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            required
            placeholder="e.g. Attending national medical oncology symposium"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Leave Request'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
