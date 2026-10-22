import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/common/DataTable';
import { ColumnDef, AuditLogEntry } from '@/types';
import { AuditService } from '@/services/auditService';
import { ShieldAlert, History, RefreshCw, Eye, Download, Lock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const { success, info } = useToast();

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await AuditService.getRecentLogs(100);
      setLogs(data);
    } catch {
      // Safe catch
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleExport = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medpulse-audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('Audit trail exported securely as JSON.', 'Export Ready');
  };

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      render: (a) => (
        <span className="font-mono text-xs text-slate-500 whitespace-nowrap">
          {formatDateTime(a.createdAt)}
        </span>
      ),
    },
    {
      key: 'actorEmail',
      header: 'Actor & Role',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-semibold text-slate-900 block">{a.actorEmail}</span>
          <span className="text-[10px] text-teal-700 font-medium capitalize">
            {a.actorRole}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Audit Action',
      sortable: true,
      render: (a) => {
        const isDelete = a.action.includes('DELETE') || a.action.includes('DENIED');
        const isWarn = a.action.includes('AMENDED') || a.action.includes('ROLE');
        return (
          <span
            className={`inline-flex px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
              isDelete
                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                : isWarn
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}
          >
            {a.action}
          </span>
        );
      },
    },
    {
      key: 'targetTable',
      header: 'Target Resource',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-mono text-xs text-slate-800 block">
            {a.targetTable}
          </span>
          {a.recordId && (
            <span className="text-[10px] font-mono text-slate-400">
              ID: {a.recordId}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'Terminal IP',
      render: (a) => (
        <span className="font-mono text-xs text-slate-400 whitespace-nowrap">
          {a.ipAddress || '127.0.0.1'}
        </span>
      ),
    },
    {
      key: 'payload',
      header: 'Inspection',
      render: (a) => (
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => setSelectedLog(a)}
          title="Inspect change payload"
          aria-label="Inspect change payload"
        >
          <Eye className="h-3.5 w-3.5 text-slate-600" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="HIPAA Security & Immutable Audit Logs"
        subtitle="Chronological audit trail capturing authentication events, PHI reads, patient modifications, role changes, and clinical amendments."
        badge={
          <Badge variant="danger" className="text-[11px] font-semibold gap-1">
            <Lock className="h-3 w-3" />
            <span>Immutable Ledger</span>
          </Badge>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={handleExport}
            >
              Export JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={loadLogs}
              isLoading={isLoading}
            >
              Refresh
            </Button>
          </>
        }
      />

      {/* Security Governance Notice */}
      <Card className="border-slate-200 bg-slate-50/70 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-slate-200 text-slate-700 shrink-0">
              <History className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                Cryptographic Access Security Compliance
              </p>
              <p className="text-[11px] text-slate-500">
                Audit logs are protected by PostgreSQL RLS with UPDATE and DELETE revoked. Passwords, secret tokens, and credit cards are strictly redacted before persistence.
              </p>
            </div>
          </div>
          <Badge variant="success" className="shrink-0 self-start sm:self-center">
            Zero-Tamper Active
          </Badge>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System & Clinical Audit Events</CardTitle>
              <CardDescription>
                Live monitoring of staff interactions with Protected Health Information (PHI)
              </CardDescription>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {logs.length} Recorded Events
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={logs}
            columns={columns}
            searchPlaceholder="Filter by action, actor, or table..."
            searchableKeys={['action', 'actorEmail', 'targetTable', 'recordId', 'actorRole']}
            isLoading={isLoading}
            defaultPageSize={10}
            pageSizeOptions={[10, 25, 50]}
          />
        </CardContent>
      </Card>

      {/* Payload Inspection Modal */}
      <Modal
        isOpen={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        title="Audit Entry Inspection"
        description={`Action: ${selectedLog?.action} on table "${selectedLog?.targetTable}" at ${selectedLog?.createdAt}`}
        size="lg"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Actor</span>
              <span className="font-semibold text-slate-800">{selectedLog?.actorEmail}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Role</span>
              <span className="font-semibold text-teal-700 capitalize">{selectedLog?.actorRole}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">IP Address</span>
              <span className="font-mono text-slate-800">{selectedLog?.ipAddress}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Record ID</span>
              <span className="font-mono text-slate-800">{selectedLog?.recordId || 'N/A'}</span>
            </div>
          </div>

          {selectedLog?.oldValues && (
            <div>
              <h5 className="font-bold text-slate-800 mb-1">Previous Values (Before Change):</h5>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto max-h-40">
                {JSON.stringify(selectedLog.oldValues, null, 2)}
              </pre>
            </div>
          )}

          {selectedLog?.newValues && (
            <div>
              <h5 className="font-bold text-slate-800 mb-1">Committed Values (After Change):</h5>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto max-h-40">
                {JSON.stringify(selectedLog.newValues, null, 2)}
              </pre>
            </div>
          )}

          {!selectedLog?.oldValues && !selectedLog?.newValues && (
            <div className="p-4 bg-slate-50 rounded text-center text-slate-500 italic">
              No change payload recorded for this event.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
