import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind merge support
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats numeric values to Sri Lankan Rupees (Rs. / LKR)
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rs. 0';
  }
  const formatted = new Intl.NumberFormat('en-LK', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
  return `Rs. ${formatted}`;
}

/**
 * Formats Sri Lankan National Identity Card (NIC) numbers
 * Accepts either old 9-digit format (e.g. 852341982V) or new 12-digit format (e.g. 199423801245)
 */
export function formatNIC(nic?: string): string {
  if (!nic) return 'N/A';
  const clean = nic.trim().toUpperCase();
  if (clean.length === 10 && (clean.endsWith('V') || clean.endsWith('X'))) {
    return `${clean.slice(0, 9)}${clean.slice(9)}`;
  }
  return clean;
}

/**
 * Formats Sri Lankan phone numbers to international standard (+94 XX XXX XXXX)
 */
export function formatSLPhone(phone?: string): string {
  if (!phone) return '+94 11 269 1111';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('94') && digits.length === 11) {
    return `+94 ${digits.slice(2, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+94 ${digits.slice(1, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Formats ISO date string to human-readable format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Formats ISO date string to human-readable date and time
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Maps raw status strings to badge color themes
 */
export function getStatusColor(status: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const normalized = status.toLowerCase().replace(/[\s-]/g, '_');

  switch (normalized) {
    case 'active':
    case 'completed':
    case 'available':
    case 'scheduled':
    case 'paid':
    case 'resolved':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
      };

    case 'in_progress':
    case 'in_consultation':
    case 'pending':
    case 'admitted':
    case 'partially_paid':
    case 'routine_checkup':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        dot: 'bg-sky-500',
      };

    case 'warning':
    case 'low_stock':
    case 'on_leave':
    case 'urgent':
    case 'overdue':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };

    case 'cancelled':
    case 'critical':
    case 'suspended':
    case 'emergency':
    case 'unpaid':
    case 'no_show':
    case 'out_of_stock':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
      };

    case 'discharged':
    case 'inactive':
    default:
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

/**
 * Calculates current age from a YYYY-MM-DD birthdate string
 */
export function calculateAge(birthDateString: string): number {
  if (!birthDateString) return 0;
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}
