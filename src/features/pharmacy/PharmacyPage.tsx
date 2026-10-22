import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PharmacyService } from '@/services/pharmacyService';
import {
  Medicine,
  MedicineBatch,
  Prescription,
  DispensingRecord,
  InventoryTransaction,
} from '@/types';
import { MedicineModal } from './MedicineModal';
import { BatchReceiptModal } from './BatchReceiptModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { DispensePrescriptionModal } from './DispensePrescriptionModal';
import { CreatePrescriptionModal } from './CreatePrescriptionModal';
import { formatCurrency } from '@/lib/utils';
import {
  Pill,
  PackageCheck,
  AlertTriangle,
  History,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpDown,
  Calendar,
  ShieldAlert,
  FileSpreadsheet,
} from 'lucide-react';

export function PharmacyPage() {
  const [activeTab, setActiveTab] = useState<'prescriptions' | 'formulary' | 'batches' | 'dispensing' | 'transactions'>('prescriptions');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [dispensingRecords, setDispensingRecords] = useState<DispensingRecord[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [isCreateRxModalOpen, setIsCreateRxModalOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [targetMedicineId, setTargetMedicineId] = useState<string | undefined>(undefined);

  const loadData = () => {
    Promise.all([
      PharmacyService.getMedicines(),
      PharmacyService.getMedicineBatches(),
      PharmacyService.getPrescriptions(),
      PharmacyService.getDispensingRecords(),
      PharmacyService.getInventoryTransactions(),
    ]).then(([mList, bList, pList, dList, tList]) => {
      setMedicines(mList);
      setBatches(bList);
      setPrescriptions(pList);
      setDispensingRecords(dList);
      setTransactions(tList);
    });
  };

  useEffect(() => {
    loadData();
    const unsub = PharmacyService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const activeRxCount = prescriptions.filter((p) => p.status === 'pending' || p.status === 'partially_dispensed').length;
  const lowStockCount = medicines.filter((m) => m.stockQuantity <= m.reorderLevel).length;
  const expiredBatchesCount = batches.filter((b) => b.expiryDate < today).length;
  const totalDispensedCount = dispensingRecords.length;

  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesSearch =
      p.prescriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.diagnosis && p.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      m.skuCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredBatches = batches.filter((b) => {
    const matchesSearch =
      b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.supplier.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredDispensing = dispensingRecords.filter((d) => {
    return (
      d.dispensingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.prescriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.patientName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getDaysUntilExpiry = (expiryDate: string) => {
    const exp = new Date(expiryDate).getTime();
    const now = new Date().getTime();
    return Math.ceil((exp - now) / (1000 * 3600 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-teal-50 text-teal-700 rounded-xl">
              <Pill className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Pharmacy & Inventory Management</h1>
              <p className="text-sm text-slate-500">
                Prescription dispensing, FEFO batch tracking, low-stock alerts, and controlled substance audit trails
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTargetMedicineId(undefined);
              setIsAdjustmentModalOpen(true);
            }}
            className="gap-1.5 text-xs"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            Stock Adjustment
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTargetMedicineId(undefined);
              setIsBatchModalOpen(true);
            }}
            className="gap-1.5 text-xs"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            Receive Batch
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingMedicine(null);
              setIsMedicineModalOpen(true);
            }}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Formulary Item
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateRxModalOpen(true)}
            className="gap-1.5 text-xs shadow-sm shadow-teal-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Issue Prescription
          </Button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Prescriptions</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{activeRxCount}</h3>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Awaiting dispensing fulfillment</p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dispensed Orders</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{totalDispensedCount}</h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Fulfilled patient regimens</p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Low Stock Alert</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-1">{lowStockCount}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Below safe reorder levels</p>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-slate-200/80 bg-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expired Batches</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{expiredBatchesCount}</h3>
              <p className="text-[11px] text-rose-600 font-medium mt-0.5">Segregated & dispensing locked</p>
            </div>
            <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-1 bg-white p-1 rounded-xl shadow-xs">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'prescriptions'
              ? 'bg-teal-50 text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Prescription Queue</span>
          {activeRxCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-teal-600 text-white text-[10px] font-bold">
              {activeRxCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('formulary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'formulary'
              ? 'bg-teal-50 text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Formulary Catalog ({medicines.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('batches')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'batches'
              ? 'bg-teal-50 text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>FEFO Batches ({batches.length})</span>
          {expiredBatchesCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-bold">
              {expiredBatchesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('dispensing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'dispensing'
              ? 'bg-teal-50 text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Dispensing Log</span>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
            activeTab === 'transactions'
              ? 'bg-teal-50 text-teal-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Inventory Audit Ledger</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'prescriptions'
                ? 'Search Rx #, patient, doctor, diagnosis...'
                : activeTab === 'formulary'
                ? 'Search SKU, brand, generic name...'
                : 'Search lots, batches, records...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
          />
        </div>

        {activeTab === 'prescriptions' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
            >
              <option value="all">All Prescriptions</option>
              <option value="pending">Pending Dispense</option>
              <option value="partially_dispensed">Partially Dispensed</option>
              <option value="dispensed">Fully Dispensed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Prescription Queue */}
      {activeTab === 'prescriptions' && (
        <Card className="overflow-hidden border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3 pl-4">Prescription #</th>
                  <th className="p-3">Patient & MRN</th>
                  <th className="p-3">Prescribing Physician</th>
                  <th className="p-3">Diagnosis / Items</th>
                  <th className="p-3">Valid Until</th>
                  <th className="p-3">Fulfillment Status</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No prescriptions found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((rx) => {
                    const isFulfillable = rx.status === 'pending' || rx.status === 'partially_dispensed';
                    return (
                      <tr key={rx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 pl-4">
                          <span className="font-mono font-bold text-teal-700">{rx.prescriptionNumber}</span>
                          <span className="block text-[11px] text-slate-400">
                            {new Date(rx.prescribedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-900 block">{rx.patientName}</span>
                          <span className="text-[11px] text-slate-500 font-mono">{rx.patientMrn}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-slate-800">{rx.doctorName}</span>
                        </td>
                        <td className="p-3">
                          {rx.diagnosis && (
                            <span className="font-semibold text-slate-700 block text-[11px] mb-1">
                              Dx: {rx.diagnosis}
                            </span>
                          )}
                          <div className="space-y-0.5">
                            {rx.items.map((it, idx) => (
                              <div key={idx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                <span>
                                  {it.medicineName} ({it.dosage}) • {it.quantityPrescribed} prescribed
                                  {it.quantityDispensed > 0 && (
                                    <span className="text-emerald-700 font-medium"> ({it.quantityDispensed} dispensed)</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-slate-600 font-medium">{rx.validUntil}</span>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              rx.status === 'dispensed'
                                ? 'success'
                                : rx.status === 'partially_dispensed'
                                ? 'warning'
                                : rx.status === 'pending'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {rx.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3 pr-4 text-right">
                          {isFulfillable ? (
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setSelectedPrescription(rx);
                                setIsDispenseModalOpen(true);
                              }}
                              className="gap-1 text-xs py-1 h-auto"
                            >
                              <Pill className="w-3.5 h-3.5" />
                              Dispense
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Fulfilled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 2: Formulary Catalog */}
      {activeTab === 'formulary' && (
        <Card className="overflow-hidden border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3 pl-4">SKU Code</th>
                  <th className="p-3">Pharmaceutical & Brand Name</th>
                  <th className="p-3">Category & Form</th>
                  <th className="p-3">Unit Price</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Reorder Alert</th>
                  <th className="p-3">Rx Policy</th>
                  <th className="p-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMedicines.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No medications found in formulary.
                    </td>
                  </tr>
                ) : (
                  filteredMedicines.map((m) => {
                    const isLow = m.stockQuantity <= m.reorderLevel;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 pl-4">
                          <span className="font-mono font-semibold text-teal-700">{m.skuCode}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{m.brandName}</span>
                          <span className="text-[11px] text-slate-500">
                            {m.genericName} • {m.strength}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-medium text-slate-800 block">{m.category}</span>
                          <span className="text-[11px] text-slate-500">{m.dosageForm}</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">
                          {formatCurrency(m.unitPrice)}
                        </td>
                        <td className="p-3">
                          <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                            {m.stockQuantity} units
                          </span>
                        </td>
                        <td className="p-3">
                          {isLow ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Low Stock (&le; {m.reorderLevel})
                            </Badge>
                          ) : (
                            <Badge variant="success">Optimal (&gt; {m.reorderLevel})</Badge>
                          )}
                        </td>
                        <td className="p-3">
                          {m.isPrescriptionRequired ? (
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Rx Required
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              OTC / General
                            </span>
                          )}
                        </td>
                        <td className="p-3 pr-4 text-right space-x-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTargetMedicineId(m.id);
                              setIsBatchModalOpen(true);
                            }}
                            className="text-[11px] py-1 h-auto"
                          >
                            Receive
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTargetMedicineId(m.id);
                              setIsAdjustmentModalOpen(true);
                            }}
                            className="text-[11px] py-1 h-auto"
                          >
                            Adjust
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingMedicine(m);
                              setIsMedicineModalOpen(true);
                            }}
                            className="text-[11px] py-1 h-auto text-teal-700"
                          >
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 3: Batches & FEFO Tracker */}
      {activeTab === 'batches' && (
        <Card className="overflow-hidden border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3 pl-4">Batch / Lot #</th>
                  <th className="p-3">Medicine & Strength</th>
                  <th className="p-3">Expiry Date</th>
                  <th className="p-3">FEFO Urgency Alert</th>
                  <th className="p-3">Quantity Available</th>
                  <th className="p-3">Unit Acquisition Cost</th>
                  <th className="p-3">Supplier Source</th>
                  <th className="p-3 pr-4 text-right">Batch Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No active batches recorded.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => {
                    const days = getDaysUntilExpiry(b.expiryDate);
                    const isExpired = days <= 0;
                    const isUrgent = days > 0 && days <= 60;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 pl-4 font-mono font-bold text-slate-900">
                          {b.batchNumber}
                        </td>
                        <td className="p-3 font-medium text-slate-800">
                          {b.medicineName}
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {b.expiryDate}
                        </td>
                        <td className="p-3">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                              EXPIRED ({Math.abs(days)}d ago) - LOCKED
                            </span>
                          ) : isUrgent ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              FIRST-EXPIRY: {days} Days Left
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Valid ({days} Days)
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-slate-900">
                          {b.quantityAvailable} units
                        </td>
                        <td className="p-3 text-slate-700">
                          {formatCurrency(b.unitCost)}
                        </td>
                        <td className="p-3 text-slate-600">
                          {b.supplier}
                        </td>
                        <td className="p-3 pr-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTargetMedicineId(b.medicineId);
                              setIsAdjustmentModalOpen(true);
                            }}
                            className="text-[11px] py-1 h-auto"
                          >
                            {isExpired ? 'Dispose Batch' : 'Adjust'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 4: Dispensing Log */}
      {activeTab === 'dispensing' && (
        <Card className="overflow-hidden border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3 pl-4">Dispensing ID</th>
                  <th className="p-3">Prescription #</th>
                  <th className="p-3">Patient & MRN</th>
                  <th className="p-3">Dispensed Items & Batches</th>
                  <th className="p-3">Total Cost</th>
                  <th className="p-3">Dispensing Pharmacist</th>
                  <th className="p-3 pr-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDispensing.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No dispensing records recorded.
                    </td>
                  </tr>
                ) : (
                  filteredDispensing.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 pl-4 font-mono font-bold text-teal-700">
                        {rec.dispensingNumber}
                      </td>
                      <td className="p-3 font-mono text-slate-700">
                        {rec.prescriptionNumber}
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {rec.patientName}
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          {rec.items.map((it, idx) => (
                            <div key={idx} className="text-[11px] text-slate-700">
                              <span className="font-semibold">{it.medicineName}</span> (Qty: {it.quantity}) •{' '}
                              <span className="font-mono text-slate-500">Lot: {it.batchNumber}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {formatCurrency(rec.totalAmount)}
                      </td>
                      <td className="p-3 text-slate-700">
                        {rec.pharmacistName}
                      </td>
                      <td className="p-3 pr-4 text-slate-500">
                        {new Date(rec.dispensedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tab 5: Inventory Audit Ledger */}
      {activeTab === 'transactions' && (
        <Card className="overflow-hidden border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3 pl-4">Transaction Type</th>
                  <th className="p-3">Medicine</th>
                  <th className="p-3">Quantity Delta</th>
                  <th className="p-3">Reference / Order</th>
                  <th className="p-3">Clinical / Audit Reason</th>
                  <th className="p-3">Performed By</th>
                  <th className="p-3 pr-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      No inventory movements recorded.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 pl-4">
                        <Badge
                          variant={
                            tx.transactionType === 'receipt'
                              ? 'success'
                              : tx.transactionType === 'dispense'
                              ? 'default'
                              : tx.transactionType === 'disposal'
                              ? 'destructive'
                              : 'warning'
                          }
                        >
                          {tx.transactionType.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="p-3 font-medium text-slate-900">
                        {tx.medicineName}
                      </td>
                      <td className="p-3">
                        <span
                          className={`font-mono font-bold ${
                            tx.quantity > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {tx.referenceId || 'N/A'}
                      </td>
                      <td className="p-3 text-slate-700">
                        {tx.reason || 'Routine inventory movement'}
                      </td>
                      <td className="p-3 text-slate-800">
                        {tx.performedByName}
                      </td>
                      <td className="p-3 pr-4 text-slate-500">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modals */}
      <MedicineModal
        isOpen={isMedicineModalOpen}
        onClose={() => {
          setIsMedicineModalOpen(false);
          setEditingMedicine(null);
        }}
        medicine={editingMedicine}
        onSuccess={loadData}
      />

      <BatchReceiptModal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          setTargetMedicineId(undefined);
        }}
        preselectedMedicineId={targetMedicineId}
        onSuccess={loadData}
      />

      <StockAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => {
          setIsAdjustmentModalOpen(false);
          setTargetMedicineId(undefined);
        }}
        preselectedMedicineId={targetMedicineId}
        onSuccess={loadData}
      />

      {selectedPrescription && (
        <DispensePrescriptionModal
          isOpen={isDispenseModalOpen}
          onClose={() => {
            setIsDispenseModalOpen(false);
            setSelectedPrescription(null);
          }}
          prescription={selectedPrescription}
          onSuccess={loadData}
        />
      )}

      <CreatePrescriptionModal
        isOpen={isCreateRxModalOpen}
        onClose={() => setIsCreateRxModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
