import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { StaffService } from '@/services/staffService';
import { LeaveRequest } from '@/types';
import { CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';

interface LeaveApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  leaveRequest: LeaveRequest | null;
  reviewerId: string;
  reviewerName: string;
}

export function LeaveApprovalModal({
  isOpen,
  onClose,
  onSuccess,
  leaveRequest,
  reviewerId,
  reviewerName,
}: LeaveApprovalModalProps) {
  const { addToast } = useToast();
  const [reviewComments, setReviewComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!leaveRequest) return null;

  const handleDecision = async (status: 'approved' | 'rejected') => {
    try {
      setIsSubmitting(true);
      await StaffService.reviewLeaveRequest({
        leaveId: leaveRequest.id,
        status,
        reviewComments: reviewComments.trim() || undefined,
        reviewedBy: reviewerId,
        reviewedByName: reviewerName,
      });

      addToast(
        `Leave request ${leaveRequest.leaveNumber} has been ${status.toUpperCase()}.`,
        status === 'approved' ? 'success' : 'warning'
      );
      onSuccess?.();
      onClose();
    } catch (err: any) {
      addToast(err?.message || 'Failed to review leave request.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Review Leave Application: ${leaveRequest.leaveNumber}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Application details */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <div>
              <span className="font-bold text-sm text-slate-900">{leaveRequest.employeeName}</span>
              <span className="text-slate-500 block">{leaveRequest.departmentName}</span>
            </div>
            <span className="capitalize font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
              {leaveRequest.leaveType} Leave
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
            <div>
              <span className="text-slate-400 block">Duration</span>
              <span className="font-semibold text-slate-800">
                {leaveRequest.startDate} to {leaveRequest.endDate} ({leaveRequest.daysCount} days)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Submitted On</span>
              <span className="font-semibold text-slate-800">
                {new Date(leaveRequest.appliedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-slate-400 block">Applicant Reason</span>
            <p className="font-medium text-slate-800 bg-white p-2 rounded border border-slate-200 mt-1">
              "{leaveRequest.reason}"
            </p>
          </div>
        </div>

        {/* Reviewer Comments */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Administrative / HR Comments
          </label>
          <Input
            type="text"
            placeholder="e.g. Approved. Clinical shift coverage arranged with ICU nurse team."
            value={reviewComments}
            onChange={(e) => setReviewComments(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => handleDecision('rejected')}
              disabled={isSubmitting}
              className="flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Reject Request
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleDecision('approved')}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve Leave
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
