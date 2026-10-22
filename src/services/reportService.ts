import { mockStore } from './mockHospitalStore';
import {
  ReportCategory,
  ReportFilter,
  FinancialAnalyticsSummary,
} from '@/types';

export interface ReportRow {
  [key: string]: any;
}

export interface GeneratedReport {
  category: ReportCategory;
  title: string;
  generatedAt: string;
  totalRecords: number;
  headers: { key: string; label: string }[];
  rows: ReportRow[];
  summaryMetrics?: { label: string; value: string | number }[];
}

export const ReportService = {
  async getFinancialSummary(): Promise<FinancialAnalyticsSummary> {
    const invoices = mockStore.getInvoices();
    const payments = mockStore.getPayments();
    const refunds = mockStore.getRefunds();

    const totalBilledRevenue = Math.round(invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) * 100) / 100;
    const totalCollectedCash = Math.round(payments.filter((p) => !p.isRefund).reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
    const totalRefundedAmount = Math.round(refunds.reduce((sum, r) => sum + r.amount, 0) * 100) / 100;
    const netRealizedRevenue = Math.round((totalCollectedCash - totalRefundedAmount) * 100) / 100;
    const totalOutstandingBalance = Math.round(invoices.reduce((sum, inv) => sum + inv.balanceDue, 0) * 100) / 100;
    const collectionRatePercent =
      totalBilledRevenue > 0 ? Math.round((totalCollectedCash / totalBilledRevenue) * 1000) / 10 : 0;

    return Promise.resolve({
      totalBilledRevenue,
      totalCollectedCash,
      totalOutstandingBalance,
      totalRefundedAmount,
      netRealizedRevenue,
      collectionRatePercent,
    });
  },

  async generateReport(filter: ReportFilter): Promise<GeneratedReport> {
    const now = new Date().toISOString();

    switch (filter.category) {
      case 'patient_registrations': {
        const patients = mockStore.getPatients();
        const rows = patients.map((p) => ({
          mrn: p.medicalRecordNumber,
          fullName: `${p.firstName} ${p.lastName}`,
          gender: p.gender,
          age: p.age,
          phone: p.phone,
          bloodGroup: p.bloodGroup || 'N/A',
          status: p.status,
          regDate: p.registrationDate,
        }));
        return {
          category: filter.category,
          title: 'Master Patient Index Registration Report',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'mrn', label: 'MRN' },
            { key: 'fullName', label: 'Patient Name' },
            { key: 'gender', label: 'Gender' },
            { key: 'age', label: 'Age' },
            { key: 'phone', label: 'Phone' },
            { key: 'bloodGroup', label: 'Blood Group' },
            { key: 'status', label: 'Status' },
            { key: 'regDate', label: 'Registration Date' },
          ],
          rows,
        };
      }

      case 'appointments': {
        const appointments = mockStore.getAppointments();
        const rows = appointments.map((a) => ({
          appointmentNumber: a.appointmentNumber,
          patientName: a.patientName,
          doctorName: a.doctorName,
          department: a.department,
          date: a.date,
          time: `${a.startTime} - ${a.endTime}`,
          type: a.type,
          status: a.status,
        }));
        return {
          category: filter.category,
          title: 'Comprehensive Clinical Appointments Report',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'appointmentNumber', label: 'Appointment #' },
            { key: 'patientName', label: 'Patient' },
            { key: 'doctorName', label: 'Physician' },
            { key: 'department', label: 'Department' },
            { key: 'date', label: 'Date' },
            { key: 'time', label: 'Time Window' },
            { key: 'type', label: 'Encounter Type' },
            { key: 'status', label: 'Status' },
          ],
          rows,
        };
      }

      case 'invoices': {
        const invoices = mockStore.getInvoices();
        const rows = invoices.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          patientName: i.patientName,
          issueDate: new Date(i.createdAt).toLocaleDateString(),
          dueDate: i.dueDate,
          subtotal: `$${i.subtotal.toFixed(2)}`,
          tax: `$${i.taxAmount.toFixed(2)}`,
          discount: `$${i.discountAmount.toFixed(2)}`,
          totalAmount: `$${i.totalAmount.toFixed(2)}`,
          paidAmount: `$${i.paidAmount.toFixed(2)}`,
          balanceDue: `$${i.balanceDue.toFixed(2)}`,
          status: i.status.toUpperCase(),
        }));
        return {
          category: filter.category,
          title: 'Accounts Receivable & Invoicing Ledger',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'invoiceNumber', label: 'Invoice #' },
            { key: 'patientName', label: 'Patient' },
            { key: 'issueDate', label: 'Issued Date' },
            { key: 'dueDate', label: 'Due Date' },
            { key: 'subtotal', label: 'Subtotal' },
            { key: 'tax', label: 'Tax (5%)' },
            { key: 'discount', label: 'Discounts' },
            { key: 'totalAmount', label: 'Total Invoiced' },
            { key: 'paidAmount', label: 'Paid' },
            { key: 'balanceDue', label: 'Balance Due' },
            { key: 'status', label: 'Status' },
          ],
          rows,
        };
      }

      case 'payments_received': {
        const payments = mockStore.getPayments();
        const rows = payments.map((p) => ({
          receiptNumber: p.receiptNumber,
          invoiceNumber: p.invoiceNumber,
          patientName: p.patientName,
          tenderMethod: p.paymentMethod.replace('_', ' ').toUpperCase(),
          reference: p.transactionReference || 'N/A',
          amount: `$${p.amount.toFixed(2)}`,
          cashier: p.receivedByName,
          date: new Date(p.paymentDate).toLocaleString(),
          isRefund: p.isRefund ? 'YES (REFUNDED)' : 'ACTIVE',
        }));
        return {
          category: filter.category,
          title: 'Cash Collections & Realized Payments Ledger',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'receiptNumber', label: 'Receipt #' },
            { key: 'invoiceNumber', label: 'Invoice #' },
            { key: 'patientName', label: 'Patient' },
            { key: 'tenderMethod', label: 'Payment Tender' },
            { key: 'reference', label: 'Transaction Ref' },
            { key: 'amount', label: 'Amount Paid' },
            { key: 'cashier', label: 'Cashier' },
            { key: 'date', label: 'Transaction Time' },
            { key: 'isRefund', label: 'Settlement Status' },
          ],
          rows,
        };
      }

      case 'outstanding_invoices': {
        const invoices = mockStore.getInvoices().filter((i) => i.balanceDue > 0);
        const rows = invoices.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          patientName: i.patientName,
          dueDate: i.dueDate,
          totalAmount: `$${i.totalAmount.toFixed(2)}`,
          paidAmount: `$${i.paidAmount.toFixed(2)}`,
          balanceDue: `$${i.balanceDue.toFixed(2)}`,
          status: i.status.toUpperCase(),
        }));
        return {
          category: filter.category,
          title: 'Aging Accounts Receivable & Outstanding Balances',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'invoiceNumber', label: 'Invoice #' },
            { key: 'patientName', label: 'Debtor Patient' },
            { key: 'dueDate', label: 'Payment Due Date' },
            { key: 'totalAmount', label: 'Gross Invoiced' },
            { key: 'paidAmount', label: 'Partial Tender' },
            { key: 'balanceDue', label: 'Uncollected Balance' },
            { key: 'status', label: 'Status' },
          ],
          rows,
        };
      }

      case 'refunds': {
        const refunds = mockStore.getRefunds();
        const rows = refunds.map((r) => ({
          refundNumber: r.refundNumber,
          invoiceNumber: r.invoiceNumber,
          patientName: r.patientName,
          amount: `$${r.amount.toFixed(2)}`,
          reason: r.reason,
          authorizedBy: r.authorizedByName,
          date: new Date(r.authorizedAt).toLocaleString(),
        }));
        return {
          category: filter.category,
          title: 'Authorized Financial Reversals & Refunds Log',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'refundNumber', label: 'Refund #' },
            { key: 'invoiceNumber', label: 'Invoice Ref' },
            { key: 'patientName', label: 'Patient' },
            { key: 'amount', label: 'Reversal Amount' },
            { key: 'reason', label: 'Clinical Justification' },
            { key: 'authorizedBy', label: 'Authorizer' },
            { key: 'date', label: 'Processed Date' },
          ],
          rows,
        };
      }

      case 'inpatient_admissions': {
        const admissions = mockStore.getAdmissions();
        const rows = admissions.map((a) => ({
          admissionNumber: a.admissionNumber,
          patientName: a.patientName,
          doctorName: a.attendingDoctorName,
          wardName: a.wardName,
          bedNumber: a.bedNumber,
          admissionDate: new Date(a.admissionDate).toLocaleDateString(),
          dischargeDate: a.actualDischargeDate ? new Date(a.actualDischargeDate).toLocaleDateString() : 'ACTIVE',
          status: a.status.toUpperCase(),
          dailyRate: `$${a.dailyRate.toFixed(2)}`,
        }));
        return {
          category: filter.category,
          title: 'Inpatient Census & Admission Length of Stay',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'admissionNumber', label: 'Admission #' },
            { key: 'patientName', label: 'Patient' },
            { key: 'doctorName', label: 'Attending Physician' },
            { key: 'wardName', label: 'Ward' },
            { key: 'bedNumber', label: 'Bed #' },
            { key: 'admissionDate', label: 'Admission Date' },
            { key: 'dischargeDate', label: 'Discharge Date' },
            { key: 'status', label: 'Census Status' },
            { key: 'dailyRate', label: 'Daily Room Rate' },
          ],
          rows,
        };
      }

      case 'laboratory_requests': {
        const requests = mockStore.getLabRequests();
        const rows = requests.map((r) => ({
          requestNumber: r.requestNumber,
          patientName: r.patientName,
          testName: r.testName,
          category: r.category,
          priority: r.priority,
          barcode: r.sampleBarcode || 'PENDING',
          status: r.status.toUpperCase(),
          verifiedBy: r.verifiedByName || 'UNVERIFIED',
          requestedAt: new Date(r.createdAt).toLocaleDateString(),
        }));
        return {
          category: filter.category,
          title: 'Laboratory Diagnostic Requests & Pathology Verification',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'requestNumber', label: 'Order #' },
            { key: 'patientName', label: 'Patient' },
            { key: 'testName', label: 'Diagnostic Test' },
            { key: 'category', label: 'Subspecialty' },
            { key: 'priority', label: 'Priority' },
            { key: 'barcode', label: 'Accession Barcode' },
            { key: 'status', label: 'Status' },
            { key: 'verifiedBy', label: 'Pathologist Sign-off' },
            { key: 'requestedAt', label: 'Date Ordered' },
          ],
          rows,
        };
      }

      case 'pharmacy_stock': {
        const medicines = mockStore.getMedicines();
        const rows = medicines.map((m) => ({
          skuCode: m.skuCode,
          brandName: m.brandName,
          genericName: m.genericName,
          category: m.category,
          dosageForm: m.dosageForm,
          strength: m.strength,
          unitPrice: `$${m.unitPrice.toFixed(2)}`,
          stock: m.stockQuantity,
          reorderLevel: m.reorderLevel,
          isLowStock: m.stockQuantity <= m.reorderLevel ? 'ALERT: LOW' : 'OPTIMAL',
        }));
        return {
          category: filter.category,
          title: 'Pharmacy Formulary Inventory & Safety Reorder Thresholds',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'skuCode', label: 'SKU Code' },
            { key: 'brandName', label: 'Brand Name' },
            { key: 'genericName', label: 'Pharmaceutical Name' },
            { key: 'category', label: 'Therapeutic Class' },
            { key: 'dosageForm', label: 'Dosage Form' },
            { key: 'strength', label: 'Strength' },
            { key: 'unitPrice', label: 'Unit Retail Price' },
            { key: 'stock', label: 'Units On Hand' },
            { key: 'reorderLevel', label: 'Reorder Point' },
            { key: 'isLowStock', label: 'Stock Status' },
          ],
          rows,
        };
      }

      case 'expired_medicines': {
        const batches = mockStore.getMedicineBatches();
        const today = new Date().toISOString().slice(0, 10);
        const rows = batches.map((b) => {
          const isExpired = b.expiryDate < today;
          return {
            batchNumber: b.batchNumber,
            medicineName: b.medicineName,
            skuCode: b.skuCode,
            expiryDate: b.expiryDate,
            quantity: b.quantityAvailable,
            unitCost: `$${b.unitCost.toFixed(2)}`,
            supplier: b.supplier,
            status: isExpired ? 'EXPIRED (LOCKED)' : 'VALID',
          };
        });
        return {
          category: filter.category,
          title: 'Pharmaceutical FEFO Lot Expirations & Quarantine Audit',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'batchNumber', label: 'Lot / Batch #' },
            { key: 'medicineName', label: 'Medicine' },
            { key: 'skuCode', label: 'SKU' },
            { key: 'expiryDate', label: 'Expiration Date' },
            { key: 'quantity', label: 'Quantity' },
            { key: 'unitCost', label: 'Acquisition Cost' },
            { key: 'supplier', label: 'Supplier Source' },
            { key: 'status', label: 'Quarantine Status' },
          ],
          rows,
        };
      }

      case 'staff_attendance': {
        const attendance = mockStore.getAttendance();
        const rows = attendance.map((att) => ({
          employeeNumber: att.employeeNumber,
          employeeName: att.employeeName,
          department: att.departmentName,
          date: att.date,
          checkIn: att.checkInTime || 'N/A',
          status: att.status.toUpperCase(),
          notes: att.notes || 'None',
        }));
        return {
          category: filter.category,
          title: 'Hospital Personnel Daily Attendance Roster',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'employeeNumber', label: 'Emp ID' },
            { key: 'employeeName', label: 'Staff Member' },
            { key: 'department', label: 'Department' },
            { key: 'date', label: 'Roster Date' },
            { key: 'checkIn', label: 'Check-In' },
            { key: 'status', label: 'Attendance Status' },
            { key: 'notes', label: 'Supervisor Notes' },
          ],
          rows,
        };
      }

      case 'leave_records': {
        const leaves = mockStore.getLeaveRequests();
        const rows = leaves.map((l) => ({
          leaveNumber: l.leaveNumber,
          employeeName: l.employeeName,
          department: l.departmentName,
          type: l.leaveType.toUpperCase(),
          start: l.startDate,
          end: l.endDate,
          days: l.daysCount,
          reason: l.reason,
          status: l.status.toUpperCase(),
          reviewedBy: l.reviewedByName || 'PENDING',
        }));
        return {
          category: filter.category,
          title: 'Staff Leave Utilization & Absence Governance',
          generatedAt: now,
          totalRecords: rows.length,
          headers: [
            { key: 'leaveNumber', label: 'Leave ID' },
            { key: 'employeeName', label: 'Staff Member' },
            { key: 'department', label: 'Department' },
            { key: 'type', label: 'Leave Type' },
            { key: 'start', label: 'Start Date' },
            { key: 'end', label: 'End Date' },
            { key: 'days', label: 'Days' },
            { key: 'reason', label: 'Reason' },
            { key: 'status', label: 'Approval Status' },
            { key: 'reviewedBy', label: 'Reviewed By' },
          ],
          rows,
        };
      }

      default: {
        // Fallback generic report
        const patients = mockStore.getPatients();
        return {
          category: filter.category,
          title: 'Hospital Operations Activity Report',
          generatedAt: now,
          totalRecords: patients.length,
          headers: [
            { key: 'id', label: 'Record ID' },
            { key: 'mrn', label: 'MRN' },
            { key: 'name', label: 'Name' },
          ],
          rows: patients.map((p) => ({ id: p.id, mrn: p.medicalRecordNumber, name: `${p.firstName} ${p.lastName}` })),
        };
      }
    }
  },

  exportToCSV(report: GeneratedReport): void {
    const headerRow = report.headers.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(',');
    const dataRows = report.rows.map((row) => {
      return report.headers
        .map((h) => {
          const val = row[h.key] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = [headerRow, ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.category}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
