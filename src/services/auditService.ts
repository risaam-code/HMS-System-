// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — AUDIT LOGGING SERVICE
// ==============================================================================
// Records all security, patient, clinical, and financial actions into public.audit_logs.
// Enforces sanitization to ensure passwords, tokens, and payment card numbers are NEVER logged.
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { AuditLogEntry } from '@/types';

const AUDIT_STORAGE_KEY = 'medpulse_hms_simulated_audit_logs';

const SENSITIVE_PATTERNS = [
  'password',
  'token',
  'secret',
  'auth',
  'creditcard',
  'cardnumber',
  'cvv',
  'ssn',
  'privatekey',
];

/**
 * Recursively strips sensitive secrets and unnecessary tokens from audit payloads
 */
export function sanitizeAuditPayload(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeAuditPayload);

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z]/g, '');
    const isSensitive = SENSITIVE_PATTERNS.some((pat) => normalizedKey.includes(pat));

    if (isSensitive) {
      clean[key] = '[REDACTED_CONFIDENTIAL]';
    } else if (value && typeof value === 'object') {
      clean[key] = sanitizeAuditPayload(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const AuditService = {
  /**
   * Logs an action to the audit trail
   */
  async log(entry: {
    actorId?: string;
    actorEmail: string;
    actorRole: string;
    action: string;
    targetTable: string;
    recordId?: string;
    ipAddress?: string;
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
  }): Promise<void> {
    const sanitizedOld = entry.oldValues ? sanitizeAuditPayload(entry.oldValues) : undefined;
    const sanitizedNew = entry.newValues ? sanitizeAuditPayload(entry.newValues) : undefined;

    if (!isSupabaseConfigured()) {
      // Store in browser ring-buffer for interactive simulation & testing
      const newEntry: AuditLogEntry = {
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        actorId: entry.actorId,
        actorEmail: entry.actorEmail,
        actorRole: entry.actorRole,
        action: entry.action,
        targetTable: entry.targetTable,
        recordId: entry.recordId,
        ipAddress: entry.ipAddress || '127.0.0.1 (Terminal)',
        oldValues: sanitizedOld,
        newValues: sanitizedNew,
        createdAt: new Date().toISOString(),
      };

      try {
        const existing = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
        const updated = [newEntry, ...existing].slice(0, 100); // Keep last 100
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Safe catch for storage limits
      }
      return;
    }

    try {
      await supabase.from('audit_logs').insert([
        {
          actor_id: entry.actorId || null,
          actor_email: entry.actorEmail,
          actor_role: entry.actorRole,
          action: entry.action,
          target_table: entry.targetTable,
          record_id: entry.recordId || null,
          ip_address: entry.ipAddress || null,
          old_values: sanitizedOld || null,
          new_values: sanitizedNew || null,
        },
      ]);
    } catch (err) {
      console.error('Failed to dispatch audit log entry:', err);
    }
  },

  /**
   * Retrieves chronological audit trail entries
   */
  async getRecentLogs(limit = 50): Promise<AuditLogEntry[]> {
    if (!isSupabaseConfigured()) {
      try {
        const stored = JSON.parse(localStorage.getItem(AUDIT_STORAGE_KEY) || '[]');
        if (stored.length > 0) return stored;
      } catch {
        // Fallback to initial seeds below
      }

      // Initial seeds for foundation audit inspection
      return [
        {
          id: 'aud-seed-1',
          actorEmail: 'admin@medpulse-hospital.org',
          actorRole: 'administrator',
          action: 'USER_ROLE_CHANGED',
          targetTable: 'profiles',
          recordId: 'usr-doc-001',
          ipAddress: '192.168.10.45',
          newValues: { role_id: 'doctor' },
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        {
          id: 'aud-seed-2',
          actorEmail: 'dr.vance@medpulse-hospital.org',
          actorRole: 'doctor',
          action: 'MEDICAL_RECORD_AMENDED',
          targetTable: 'medical_records',
          recordId: 'rec-2026-881',
          ipAddress: '192.168.10.12',
          newValues: { diagnosis: 'Hypertension Evaluation', status: 'signed' },
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        },
        {
          id: 'aud-seed-3',
          actorEmail: 'lab.tech@medpulse-hospital.org',
          actorRole: 'laboratory_staff',
          action: 'LAB_RESULT_VERIFIED',
          targetTable: 'laboratory_requests',
          recordId: 'lab-2026-901',
          ipAddress: '192.168.10.88',
          newValues: { test: 'Troponin-I STAT', is_panic_value: true },
          createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        },
        {
          id: 'aud-seed-4',
          actorEmail: 'pharmacy@medpulse-hospital.org',
          actorRole: 'pharmacist',
          action: 'INVENTORY_ADJUSTED',
          targetTable: 'medicines',
          recordId: 'med-amx-500',
          ipAddress: '192.168.10.33',
          newValues: { sku: 'MED-AMX-500', stock_quantity: 18, reorder_level: 50 },
          createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        },
      ];
    }

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).map((row: any) => ({
        id: row.id,
        actorId: row.actor_id,
        actorEmail: row.actor_email,
        actorRole: row.actor_role,
        action: row.action,
        targetTable: row.target_table,
        recordId: row.record_id,
        ipAddress: row.ip_address,
        oldValues: row.old_values,
        newValues: row.new_values,
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  },
};
