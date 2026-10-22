import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary';
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const icons = {
    danger: (
      <div className="h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
        <AlertTriangle className="h-5 w-5" />
      </div>
    ),
    warning: (
      <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
        <AlertTriangle className="h-5 w-5" />
      </div>
    ),
    info: (
      <div className="h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 shrink-0">
        <Info className="h-5 w-5" />
      </div>
    ),
    primary: (
      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
        <CheckCircle2 className="h-5 w-5" />
      </div>
    ),
  };

  const buttonVariant = {
    danger: 'destructive',
    warning: 'secondary',
    info: 'primary',
    primary: 'primary',
  }[variant] as 'destructive' | 'secondary' | 'primary';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={buttonVariant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 py-2">
        {icons[variant]}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
