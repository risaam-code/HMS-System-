import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import {
  ReportService,
  GeneratedReport,
  ReportRow,
} from '@/services/reportService';
import {
  ReportCategory,
  FinancialAnalyticsSummary,
} from '@/types';
import {
  FileText,
  Download,
  Printer,
  Search,
  Calendar,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  DollarSign,
  CreditCard,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Users,
  Stethoscope,
  Building,
  BedDouble,
  FlaskConical,
  Pill,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const REPORT_CATEGORIES: { value: ReportCategory; label: string; icon: any }[] = [
  { value: 'patient_registrations', label: '1. Patient Registrations (MPI)', icon: Users },
  { value: 'appointments', label: '2. Clinical Appointments & Encounters', icon: Calendar },
  { value: 'doctor_activity', label: '3. Physician Workload & Activity', icon: Stethoscope },
  { value: 'department_statistics', label: '4. Department Statistics & Census', icon: Building },
  { value: 'outpatient_visits', label: '5. Outpatient (OPD) Visits', icon: Users },
  { value: 'inpatient_admissions', label: '6. Inpatient Admissions & Beds', icon: BedDouble },
  { value: 'laboratory_requests', label: '7. Laboratory Requests & Critical Results', icon: FlaskConical },
  { value: 'pharmacy_stock', label: '8. Pharmacy Stock & Reorder Levels', icon: Pill },
  { value: 'expired_medicines', label: '9. Expired & Near-Expiry Batches', icon: AlertCircle },
  { value: 'inventory_movements', label: '10. Inventory Dispensing & Adjustments', icon: Pill },
  { value: 'invoices', label: '11. Invoices & Itemized Charges', icon: FileText },
  { value: 'payments_received', label: '12. Actual Cash & Payments Received', icon: CreditCard },
  { value: 'outstanding_invoices', label: '13. Outstanding Invoices & Overdue A/R', icon: DollarSign },
  { value: 'refunds', label: '14. Authorized Payment Refunds', icon: AlertCircle },
  { value: 'staff_attendance', label: '15. Staff Daily Attendance & Punches', icon: Clock },
  { value: 'leave_records', label: '16. Personnel Leave Applications', icon: CheckCircle2 },
];

export function ReportsPage() {
  const { role } = useAuth();
  const { addToast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('invoices');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [financialSummary, setFinancialSummary] = useState<FinancialAnalyticsSummary | null>(null);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      const [summary, rep] = await Promise.all([
        ReportService.getFinancialSummary(),
        ReportService.generateReport({
          category: selectedCategory,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          searchQuery: searchQuery || undefined,
        }),
      ]);
      setFinancialSummary(summary);
      setReport(rep);
      setCurrentPage(1);
    } catch (err) {
      console.error('Failed to generate report', err);
      addToast('Failed to generate report data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [selectedCategory, startDate, endDate]);

  // Filtered and Sorted Rows
  const processedRows = useMemo(() => {
    if (!report) return [];
    let list = [...report.rows];

    // Client-side text filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    // Client-side sort
    if (sortColumn) {
      list.sort((a, b) => {
        const valA = a[sortColumn] ?? '';
        const valB = b[sortColumn] ?? '';
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
        if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [report, searchQuery, sortColumn, sortDirection]);

  // Paginated Rows
  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleExportCSV = () => {
    if (!report) return;
    try {
      // Export current filtered rows
      const exportReport: GeneratedReport = {
        ...report,
        rows: processedRows,
        totalRecords: processedRows.length,
      };
      ReportService.exportToCSV(exportReport);
      addToast(`Exported ${processedRows.length} records to CSV.`, 'success');
    } catch (err) {
      addToast('Failed to export CSV file.', 'error');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Hospital Reports & Operational Analytics"
        subtitle="16 Clinical and Administrative Audit Datasets, Billed vs. Collected Revenue, and Certified Exports."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              Print / Save PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExportCSV}
              disabled={!report || processedRows.length === 0}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="w-4 h-4" />
              Export to CSV
            </Button>
          </div>
        }
      />

      {/* Financial Intelligence & Revenue Distinction Card (Strict requirement) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-5 shadow-sm border border-slate-700">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-slate-700/80">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold tracking-tight">Hospital Revenue & Cash Collection Ledger</h2>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Strictly distinguishing Gross Billed Invoices from Realized Liquid Money Collected
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            Cash Realization Rate: {financialSummary?.collectionRatePercent ?? 0}%
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
          <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Gross Billed Revenue
            </span>
            <span className="text-xl font-mono font-bold text-white block mt-1">
              ${financialSummary?.totalBilledRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Total of all itemized patient charges</span>
          </div>

          <div className="bg-emerald-950/40 rounded-lg p-3 border border-emerald-800/60">
            <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider block">
              Actual Cash Collected
            </span>
            <span className="text-xl font-mono font-bold text-emerald-400 block mt-1">
              ${financialSummary?.totalCollectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-300/80 mt-0.5 block">Actual money received in bank</span>
          </div>

          <div className="bg-amber-950/40 rounded-lg p-3 border border-amber-800/60">
            <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
              Outstanding Balance (A/R)
            </span>
            <span className="text-xl font-mono font-bold text-amber-400 block mt-1">
              ${financialSummary?.totalOutstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-amber-300/80 mt-0.5 block">Unpaid invoices & patient balances</span>
          </div>

          <div className="bg-purple-950/40 rounded-lg p-3 border border-purple-800/60">
            <span className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider block">
              Net Realized Revenue
            </span>
            <span className="text-xl font-mono font-bold text-purple-300 block mt-1">
              ${financialSummary?.netRealizedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-purple-300/80 mt-0.5 block">
              Collected minus ${financialSummary?.totalRefundedAmount.toLocaleString()} refunds
            </span>
          </div>
        </div>
      </div>

      {/* Report Selection & Parameter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-end justify-between">
          {/* Category Dropdown */}
          <div className="w-full lg:w-1/3">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Report Dataset (16 Modules Available)
            </label>
            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ReportCategory)}
              className="text-xs"
              options={REPORT_CATEGORIES.map((c) => ({
                value: c.value,
                label: c.label,
              }))}
            />
          </div>

          {/* Date Range Pickers */}
          <div className="grid grid-cols-2 gap-2 w-full lg:w-1/3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Instant Search Bar */}
          <div className="w-full lg:w-1/3 relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Filter in Table</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search report values..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Report Banner & Summary Metrics */}
        {report && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            <div>
              <span className="font-bold text-slate-900 text-sm">{report.title}</span>
              <p className="text-slate-500 text-[11px]">
                Showing {processedRows.length} total records • Generated on{' '}
                {new Date(report.generatedAt).toLocaleString()}
              </p>
            </div>

            {report.summaryMetrics && report.summaryMetrics.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {report.summaryMetrics.map((metric, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium text-xs border border-slate-200"
                  >
                    <span className="text-slate-500">{metric.label}:</span>
                    <strong className="text-slate-900 font-mono">{metric.value}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interactive Report Data Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
              <tr>
                {report?.headers.map((header) => {
                  const isSorted = sortColumn === header.key;
                  return (
                    <th
                      key={header.key}
                      onClick={() => handleSort(header.key)}
                      className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>{header.label}</span>
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={report?.headers.length || 1}
                    className="py-12 text-center text-slate-400"
                  >
                    No records found matching the specified report parameters.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/80 transition-colors">
                    {report?.headers.map((header) => {
                      const val = row[header.key];
                      const isMoney =
                        typeof val === 'number' &&
                        (header.key.toLowerCase().includes('amount') ||
                          header.key.toLowerCase().includes('balance') ||
                          header.key.toLowerCase().includes('cost') ||
                          header.key.toLowerCase().includes('price') ||
                          header.key.toLowerCase().includes('revenue'));
                      return (
                        <td key={header.key} className="py-2.5 px-3 text-slate-800">
                          {isMoney ? (
                            <span className="font-mono font-bold text-slate-900">
                              ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          ) : header.key === 'status' ? (
                            <Badge
                              variant={
                                String(val) === 'active' || String(val) === 'paid' || String(val) === 'present'
                                  ? 'success'
                                  : String(val) === 'pending' || String(val) === 'partially_paid' || String(val) === 'late'
                                  ? 'warning'
                                  : String(val) === 'cancelled' || String(val) === 'overdue' || String(val) === 'absent'
                                  ? 'danger'
                                  : 'default'
                              }
                              size="sm"
                              className="capitalize"
                            >
                              {String(val)}
                            </Badge>
                          ) : (
                            String(val ?? '—')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-400">|</span>
            <span>
              Showing {processedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
              {Math.min(currentPage * pageSize, processedRows.length)} of {processedRows.length} entries
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 text-xs"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="font-semibold text-slate-900 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 text-xs"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
