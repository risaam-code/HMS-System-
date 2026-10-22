import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { InpatientService } from '@/services/inpatientService';
import { Admission, Bed, Ward, BedTransfer, NursingObservation } from '@/types';
import { AdmissionModal } from './AdmissionModal';
import { BedTransferModal } from './BedTransferModal';
import { NursingObservationsModal } from './NursingObservationsModal';
import { DischargeModal } from './DischargeModal';
import {
  BedDouble,
  Search,
  Filter,
  ArrowRightLeft,
  Activity,
  LogOut,
  Plus,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  HeartPulse,
} from 'lucide-react';

export function InpatientPage() {
  const [activeTab, setActiveTab] = useState<'census' | 'admissions' | 'observations' | 'transfers'>('census');
  const [wards, setWards] = useState<Ward[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [transfers, setTransfers] = useState<BedTransfer[]>([]);
  const [observations, setObservations] = useState<NursingObservation[]>([]);

  const [selectedWardFilter, setSelectedWardFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [preselectedBedId, setPreselectedBedId] = useState<string | undefined>();
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);

  const loadData = () => {
    Promise.all([
      InpatientService.getWards(),
      InpatientService.getBeds(),
      InpatientService.getAdmissions(),
      InpatientService.getBedTransfers(),
    ]).then(([wList, bList, aList, tList]) => {
      setWards(wList);
      setBeds(bList);
      setAdmissions(aList);
      setTransfers(tList);
    });
  };

  useEffect(() => {
    loadData();
    const unsub = InpatientService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, []);

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === 'occupied').length;
  const availableBeds = beds.filter((b) => b.status === 'available').length;
  const maintenanceBeds = beds.filter((b) => b.status === 'maintenance' || b.status === 'cleaning').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const filteredBeds = beds.filter((b) => {
    if (selectedWardFilter !== 'all' && b.wardId !== selectedWardFilter) return false;
    if (selectedStatusFilter !== 'all' && b.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchBed = b.bedNumber.toLowerCase().includes(q);
      const matchWard = b.wardName.toLowerCase().includes(q);
      const matchPatient = b.currentPatientName ? b.currentPatientName.toLowerCase().includes(q) : false;
      return matchBed || matchWard || matchPatient;
    }
    return true;
  });

  const activeAdmissionsList = admissions.filter((a) => a.status === 'admitted');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inpatient Management (IPD & Bed Census)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time ward floor bed matrix, nursing observations, bed transfers, and automated discharge billing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={() => {
              setPreselectedBedId(undefined);
              setIsAdmitModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Admit Patient
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bed Capacity</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <BedDouble className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalBeds}</span>
            <span className="text-xs text-slate-500">Across {wards.length} Wards</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Occupied Beds</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-900">{occupiedBeds}</span>
            <span className="text-xs text-amber-700 font-medium">{occupancyRate}% Occupancy</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Available Beds</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-900">{availableBeds}</span>
            <span className="text-xs text-emerald-700 font-medium">Ready for Intake</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Inpatients</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <HeartPulse className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-900">{activeAdmissionsList.length}</span>
            <span className="text-xs text-slate-500">In Clinical Care</span>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-medium">
        <button
          onClick={() => setActiveTab('census')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'census'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BedDouble className="h-4 w-4" />
          <span>Bed Census Matrix</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{beds.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('admissions')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'admissions'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Active Admissions</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
            {activeAdmissionsList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('transfers')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'transfers'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Bed Transfers</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{transfers.length}</span>
        </button>
      </div>

      {/* Tab 1: Bed Census Matrix */}
      {activeTab === 'census' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Ward Filter */}
              <select
                value={selectedWardFilter}
                onChange={(e) => setSelectedWardFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="all">All Wards ({beds.length} Beds)</option>
                {wards.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.wardType})
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="all">All Bed Statuses</option>
                <option value="available">Available ({availableBeds})</option>
                <option value="occupied">Occupied ({occupiedBeds})</option>
                <option value="maintenance">Maintenance ({maintenanceBeds})</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search bed code or patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          </div>

          {/* Visual Bed Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBeds.map((bed) => {
              const isOccupied = bed.status === 'occupied';
              const isAvailable = bed.status === 'available';
              const admission = admissions.find((a) => a.id === bed.currentAdmissionId);

              return (
                <div
                  key={bed.id}
                  className={`rounded-xl border p-4 transition-all duration-200 shadow-sm flex flex-col justify-between ${
                    isOccupied
                      ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300'
                      : isAvailable
                      ? 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div>
                    {/* Top row: Bed Number and Status badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-slate-900">{bed.bedNumber}</span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {bed.bedType}
                        </span>
                      </div>
                      <Badge
                        variant={isOccupied ? 'warning' : isAvailable ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {bed.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {bed.wardName}
                    </div>

                    {/* Patient info if occupied */}
                    {isOccupied && admission && (
                      <div className="mt-3 p-2.5 bg-white/80 rounded-lg border border-amber-200/80 text-xs space-y-1">
                        <div className="font-semibold text-slate-900 flex items-center justify-between">
                          <span>{admission.patientName}</span>
                          <span className="font-mono text-[10px] text-slate-500">{admission.patientMrn}</span>
                        </div>
                        <div className="text-[11px] text-slate-600">
                          Dr. {admission.attendingDoctorName}
                        </div>
                        <div className="text-[10px] text-slate-400 pt-0.5 flex items-center justify-between">
                          <span>Admitted: {admission.admissionDate}</span>
                          <span className="font-semibold text-emerald-700">${bed.dailyRate}/d</span>
                        </div>
                      </div>
                    )}

                    {isAvailable && (
                      <div className="mt-4 text-xs text-slate-400 italic">
                        Clean and sanitized. Ready for immediate patient admission.
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
                    {isOccupied && admission ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-[11px] h-7 px-2"
                          onClick={() => {
                            setSelectedAdmission(admission);
                            setIsObsModalOpen(true);
                          }}
                        >
                          <Activity className="h-3 w-3 mr-1 text-emerald-600" />
                          Vitals
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-[11px] h-7 px-2"
                          onClick={() => {
                            setSelectedAdmission(admission);
                            setIsTransferModalOpen(true);
                          }}
                        >
                          <ArrowRightLeft className="h-3 w-3 mr-1 text-blue-600" />
                          Transfer
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => {
                            setSelectedAdmission(admission);
                            setIsDischargeModalOpen(true);
                          }}
                        >
                          <LogOut className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : isAvailable ? (
                      <Button
                        size="sm"
                        variant="primary"
                        className="w-full text-xs h-7"
                        onClick={() => {
                          setPreselectedBedId(bed.id);
                          setIsAdmitModalOpen(true);
                        }}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Admit Patient Here
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Maintenance Mode</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Active Admissions Table */}
      {activeTab === 'admissions' && (
        <Card className="p-0 border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">Admission #</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Ward & Bed</th>
                  <th className="py-3 px-4">Attending Doctor</th>
                  <th className="py-3 px-4">Admission Date</th>
                  <th className="py-3 px-4">Diagnosis</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {admissions.map((adm) => (
                  <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{adm.admissionNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{adm.patientName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{adm.patientMrn}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{adm.wardName}</div>
                      <div className="font-mono font-bold text-slate-600">Bed: {adm.bedNumber}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{adm.attendingDoctorName}</td>
                    <td className="py-3 px-4 text-slate-600">{adm.admissionDate}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{adm.diagnosis || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={adm.status === 'admitted' ? 'warning' : 'neutral'} size="sm">
                        {adm.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {adm.status === 'admitted' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedAdmission(adm);
                              setIsObsModalOpen(true);
                            }}
                          >
                            Vitals
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedAdmission(adm);
                              setIsTransferModalOpen(true);
                            }}
                          >
                            Transfer
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelectedAdmission(adm);
                              setIsDischargeModalOpen(true);
                            }}
                          >
                            Discharge
                          </Button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Discharged ({adm.actualDischargeDate})</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Bed Transfer Logs */}
      {activeTab === 'transfers' && (
        <Card className="p-0 border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Origin Bed</th>
                  <th className="py-3 px-4">Destination Bed</th>
                  <th className="py-3 px-4">Transfer Reason</th>
                  <th className="py-3 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No patient bed transfers logged yet.
                    </td>
                  </tr>
                ) : (
                  transfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 text-slate-600">{new Date(tr.transferDate).toLocaleString()}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{tr.patientName}</td>
                      <td className="py-3 px-4 text-slate-700">
                        {tr.fromWardName} — <span className="font-mono font-bold text-slate-900">{tr.fromBedNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {tr.toWardName} — <span className="font-mono font-bold text-blue-700">{tr.toBedNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-sm">{tr.transferReason}</td>
                      <td className="py-3 px-4 text-slate-500">{tr.authorizedBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Admission Modal */}
      <AdmissionModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        initialBedId={preselectedBedId}
        onSuccess={loadData}
      />

      {/* Bed Transfer Modal */}
      <BedTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        admission={selectedAdmission}
        onSuccess={loadData}
      />

      {/* Nursing Observations Modal */}
      <NursingObservationsModal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        admission={selectedAdmission}
        onSuccess={loadData}
      />

      {/* Discharge Summary Modal */}
      <DischargeModal
        isOpen={isDischargeModalOpen}
        onClose={() => setIsDischargeModalOpen(false)}
        admission={selectedAdmission}
        onSuccess={loadData}
      />
    </div>
  );
}
