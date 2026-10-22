import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, TableFilterConfig } from '@/components/common/DataTable';
import { ColumnDef, MedicalRecord } from '@/types';
import { MedicalRecordService } from '@/services/medicalRecordService';
import { MedicalRecordModal } from './MedicalRecordModal';
import { MedicalRecordDetailsModal } from './MedicalRecordDetailsModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { mockStore } from '@/services/mockHospitalStore';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  PlusCircle,
  ShieldCheck,
  Clock,
  Eye,
  Pill,
  HeartPulse,
  Stethoscope,
} from 'lucide-react';

export function MedicalRecordsPage() {
  const { hasPermission, role } = useAuth();
  const { toast } = useToast();

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const data = await MedicalRecordService.getMedicalRecords();
      setRecords(data);
    } catch {
      toast({
        title: 'Error Loading Records',
        message: 'Failed to retrieve electronic medical records from database.',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
    const unsub = mockStore.subscribe(() => {
      MedicalRecordService.getMedicalRecords().then(setRecords);
    });
    return unsub;
  }, []);

  // Metrics
  const metrics = useMemo(() => {
    const total = records.length;
    const signed = records.filter((r) => r.isSigned).length;
    const drafts = records.filter((r) => !r.isSigned).length;
    const totalRx = records.reduce((acc, r) => acc + (r.prescriptions?.length || 0), 0);
    return { total, signed, drafts, totalRx };
  }, [records]);

  const handleRecordSaved = (rec: MedicalRecord) => {
    toast({
      title: 'Clinical Chart Saved',
      message: `Record ${rec.recordNumber} for ${rec.patientName} created successfully.`,
      type: 'success',
    });
    setIsCreateOpen(false);
    loadRecords();
  };

  const columns: ColumnDef<MedicalRecord>[] = [
    {
      key: 'recordNumber',
      header: 'Record #',
      sortable: true,
      render: (r) => (
        <span className="font-mono font-bold text-blue-600 bg-blue-50/70 border border-blue-200 px-2 py-0.5 rounded text-xs">
          {r.recordNumber}
        </span>
      ),
    },
    {
      key: 'patientName',
      header: 'Patient & MRN',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{r.patientName}</span>
          <span className="text-[11px] font-mono text-slate-400">{r.patientMrn}</span>
        </div>
      ),
    },
    {
      key: 'diagnosisTitle',
      header: 'Clinical Diagnosis',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-800 block text-xs">{r.diagnosisTitle}</span>
          {r.diagnosisCode && (
            <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-1 py-0.2 rounded border border-teal-200">
              ICD-10: {r.diagnosisCode}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'doctorName',
      header: 'Attending Physician',
      sortable: true,
      render: (r) => <span className="font-medium text-slate-700 text-xs">{r.doctorName}</span>,
    },
    {
      key: 'encounterDate',
      header: 'Encounter Date',
      sortable: true,
      render: (r) => <span className="text-slate-500 font-mono text-xs">{formatDate(r.encounterDate)}</span>,
    },
    {
      key: 'isSigned',
      header: 'Signature Status',
      sortable: true,
      render: (r) => (
        r.isSigned ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Signed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Draft
          </span>
        )
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="Inspect Chart"
            onClick={() => setSelectedRecord(r)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filters: TableFilterConfig[] = [
    {
      key: 'isSigned',
      label: 'Signature State',
      options: [
        { label: 'Digitally Signed', value: 'true' },
        { label: 'Unsigned Draft', value: 'false' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Electronic Medical Records (EMR / EHR)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            SOAP clinical observations, ICD-10 diagnostic indexing, prescription orders, and legally binding digital signatures.
          </p>
        </div>

        {hasPermission('medical_records:create') && (
          <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-1.5" /> New Clinical Record
          </Button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Charts</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{metrics.total}</div>
          <span className="text-[10px] text-slate-400">Encounter records</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Digitally Signed</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{metrics.signed}</div>
          <span className="text-[10px] text-emerald-600">Sealed charts</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Unsigned Drafts</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1">{metrics.drafts}</div>
          <span className="text-[10px] text-amber-600">Awaiting physician signoff</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Prescriptions Filed</span>
            <Pill className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-teal-700 mt-1">{metrics.totalRx}</div>
          <span className="text-[10px] text-teal-600">Pharmacy orders</span>
        </div>
      </div>

      {/* Records DataTable */}
      <DataTable
        data={records}
        columns={columns}
        searchPlaceholder="Search by record #, patient, diagnosis, or physician..."
        searchableKeys={['recordNumber', 'patientName', 'diagnosisTitle', 'doctorName', 'diagnosisCode']}
        filters={filters}
        isLoading={isLoading}
        onRowClick={(rec) => setSelectedRecord(rec)}
        emptyTitle="No Medical Records Found"
        emptyDescription="No clinical encounter records match your search criteria."
        emptyActionLabel="Create First Record"
        onEmptyAction={() => setIsCreateOpen(true)}
      />

      {/* Create Modal */}
      <MedicalRecordModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleRecordSaved}
      />

      {/* Details & Digital Signing Modal */}
      <MedicalRecordDetailsModal
        isOpen={Boolean(selectedRecord)}
        onClose={() => setSelectedRecord(null)}
        record={selectedRecord}
        onRecordUpdated={(updated) => {
          setSelectedRecord(updated);
          loadRecords();
        }}
      />
    </div>
  );
}
