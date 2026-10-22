// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — COMPREHENSIVE DOMAIN TYPES
// ==============================================================================

export type CanonicalRole =
  | 'administrator'
  | 'doctor'
  | 'nurse'
  | 'receptionist'
  | 'laboratory_staff'
  | 'pharmacist'
  | 'accountant';

// Backwards-compatible UserRole supporting canonical and aliases
export type UserRole = CanonicalRole | 'admin' | 'lab_technician';

export type PermissionName =
  | 'dashboard:view'
  | 'reports:view'
  | 'reports:export'
  | 'patients:view'
  | 'patients:create'
  | 'patients:edit'
  | 'patients:delete'
  | 'doctors:view'
  | 'doctors:manage'
  | 'staff:view'
  | 'staff:manage'
  | 'appointments:view'
  | 'appointments:create'
  | 'appointments:manage'
  | 'medical_records:view'
  | 'medical_records:create'
  | 'medical_records:amend'
  | 'inpatient:view'
  | 'inpatient:admit'
  | 'inpatient:discharge'
  | 'laboratory:view'
  | 'laboratory:request'
  | 'laboratory:process'
  | 'laboratory:verify'
  | 'pharmacy:view'
  | 'pharmacy:dispense'
  | 'pharmacy:inventory'
  | 'billing:view'
  | 'billing:create_invoice'
  | 'billing:post_payment'
  | 'billing:refund'
  | 'users:view'
  | 'users:manage'
  | 'audit_logs:view'
  | 'settings:manage';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  roleId: CanonicalRole;
  department?: string;
  avatarUrl?: string;
  phone?: string;
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export type ModuleId =
  | 'dashboard'
  | 'patients'
  | 'doctors'
  | 'departments'
  | 'appointments'
  | 'medical-records'
  | 'outpatient'
  | 'inpatient'
  | 'laboratory'
  | 'pharmacy'
  | 'billing'
  | 'staff'
  | 'reports'
  | 'notifications'
  | 'users'
  | 'audit-logs'
  | 'settings';

export interface NavigationItem {
  id: ModuleId;
  title: string;
  href: string;
  iconName: string;
  badge?: string | number;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  category: 'clinical' | 'operations' | 'administration' | 'system';
  rolesAllowed?: UserRole[];
  requiredPermission?: PermissionName;
}

export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
    timeframe: string;
  };
  icon: string;
  variant: 'blue' | 'teal' | 'amber' | 'emerald' | 'rose' | 'indigo' | 'cyan' | 'violet';
  tooltip?: string;
}

export interface AppointmentStatItem {
  department: string;
  scheduled: number;
  completed: number;
  cancelled: number;
}

export interface RevenueStatItem {
  month: string;
  revenue: number;
  expenses: number;
  net: number;
}

export interface RegistrationTrendItem {
  date: string;
  outpatients: number;
  inpatients: number;
  emergency: number;
}

// ------------------------------------------------------------------------------
// Patient Management Types
// ------------------------------------------------------------------------------

export interface PatientDocument {
  id: string;
  title: string;
  fileType: string;
  fileUrl: string;
  sizeBytes?: number;
  uploadedAt: string;
  uploadedBy: string;
  category: 'ID Card' | 'Insurance' | 'Previous Discharge' | 'Lab Report' | 'Imaging' | 'Consent Form';
}

export interface Patient {
  id: string;
  medicalRecordNumber: string; // MRN e.g. MRN-2026-00101
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  phone: string;
  email?: string;
  address?: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies?: string[];
  registrationDate: string;
  status: 'active' | 'archived' | 'admitted' | 'critical' | 'discharged';
  assignedDoctorId?: string;
  assignedDoctor?: string;
  profilePhotoUrl?: string;
  documents?: PatientDocument[];
  lastVisit?: string;
  notes?: string;
}

// ------------------------------------------------------------------------------
// Department Management Types
// ------------------------------------------------------------------------------

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  location: string;
  buildingWing: string;
  floorNumber: number;
  contactNumber?: string;
  departmentHead?: string;
  headDoctorId?: string;
  totalBeds: number;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt?: string;
  updatedAt?: string;
}

// ------------------------------------------------------------------------------
// Doctor Management Types
// ------------------------------------------------------------------------------

export interface DoctorSchedule {
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // HH:mm e.g. "09:00"
  endTime: string;   // HH:mm e.g. "17:00"
  maxPatients?: number;
}

export interface Doctor {
  id: string;
  profileId?: string;
  fullName: string;
  specialization: string;
  departmentId: string;
  department: string;
  licenseNumber: string;
  qualifications: string[];
  consultationFee: number;
  contactNumber: string;
  email: string;
  availabilitySchedule: DoctorSchedule[];
  status: 'active' | 'inactive';
  availabilityStatus: 'available' | 'in_consultation' | 'on_leave' | 'emergency';
  experienceYears: number;
  biography?: string;
  todayAppointmentsCount?: number;
}

// ------------------------------------------------------------------------------
// Appointment Management Types
// ------------------------------------------------------------------------------

export type AppointmentStatus =
  | 'Scheduled'
  | 'Confirmed'
  | 'Checked In'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled'
  | 'No Show';

export interface Appointment {
  id: string;
  appointmentNumber: string; // e.g. APT-2026-00101
  patientId: string;
  patientName: string;
  patientMrn?: string;
  patientPhone?: string;
  doctorId: string;
  doctorName: string;
  departmentId?: string;
  department: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  scheduledAt: string; // ISO String
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  priority: 'low' | 'normal' | 'urgent';
  visitReason: string;
  status: AppointmentStatus;
  bookingUserId?: string;
  bookingUserName?: string;
  cancellationReason?: string;
  checkInTime?: string;
  completedTime?: string;
  clinicalNotes?: string;
  notes?: string;
}

// ------------------------------------------------------------------------------
// Electronic Medical Records (EMR / EHR) Types
// ------------------------------------------------------------------------------

export interface VitalSigns {
  temperature?: number; // Celsius e.g. 37.0
  bloodPressureSystolic?: number; // mmHg e.g. 120
  bloodPressureDiastolic?: number; // mmHg e.g. 80
  heartRate?: number; // bpm e.g. 72
  respiratoryRate?: number; // bpm e.g. 16
  oxygenSaturation?: number; // % e.g. 98
  weightKg?: number; // kg e.g. 70
  heightCm?: number; // cm e.g. 175
  recordedAt: string;
  recordedBy: string;
}

export interface PrescriptionItem {
  id?: string;
  medicineId?: string;
  medicineName: string;
  dosage: string; // e.g. "500mg"
  frequency: string; // e.g. "TDS (3 times a day)"
  duration: string; // e.g. "7 Days"
  instructions?: string; // e.g. "Take after food"
}

export interface MedicalRecordAmendment {
  id: string;
  recordId: string;
  amendedAt: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  amendmentReason: string;
  previousNotes: string;
  newNotes: string;
}

export interface MedicalRecord {
  id: string;
  recordNumber: string; // e.g. REC-2026-00441
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  appointmentId?: string;
  encounterDate: string; // YYYY-MM-DD
  visitType: 'outpatient' | 'inpatient' | 'emergency' | 'telehealth';
  chiefComplaint: string;
  clinicalNotes: string;
  diagnosisCode?: string; // ICD-10
  diagnosisTitle: string;
  treatmentPlan: string;
  vitalSigns?: VitalSigns;
  prescriptions: PrescriptionItem[];
  followUpDate?: string;
  reportReferences?: string[];
  isConfidential: boolean;
  isSigned: boolean;
  signedAt?: string;
  signedByDoctorId?: string;
  signedByDoctorName?: string;
  amendments: MedicalRecordAmendment[];
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// Outpatient Department (OPD) Types
// ------------------------------------------------------------------------------

export type OutpatientVisitStatus =
  | 'Registered'
  | 'Checked In'
  | 'Triage Completed'
  | 'In Consultation'
  | 'Lab Requested'
  | 'Prescription Issued'
  | 'Billed'
  | 'Completed'
  | 'Cancelled';

export interface OutpatientVisit {
  id: string;
  visitNumber: string; // e.g. OPD-2026-01041
  queueToken: string;  // e.g. T-101
  patientId: string;
  patientName: string;
  patientMrn: string;
  appointmentId?: string;
  doctorId: string;
  doctorName: string;
  departmentId: string;
  departmentName: string;
  checkInTime: string;
  status: OutpatientVisitStatus;
  priority: 'Routine' | 'Urgent' | 'STAT';
  isWalkIn: boolean;
  vitals?: VitalSigns;
  chiefComplaint?: string;
  consultationNotes?: string;
  diagnosis?: string;
  treatmentPlan?: string;
  labRequests?: string[]; // Lab test codes
  prescriptions?: PrescriptionItem[];
  consultationFee: number;
  invoiceId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// Inpatient Management (IPD) Types
// ------------------------------------------------------------------------------

export type WardType = 'General' | 'ICU' | 'Maternity' | 'Pediatric' | 'Surgical' | 'Private';
export type BedType = 'standard' | 'icu' | 'ventilator' | 'bariatric' | 'pediatric';
export type BedStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved';
export type AdmissionStatus = 'admitted' | 'transferred' | 'discharged';

export interface Ward {
  id: string;
  name: string;
  code: string;
  wardType: WardType;
  floorNumber: number;
  totalBeds: number;
  dailyRate: number;
  status: 'active' | 'maintenance' | 'full';
  description?: string;
}

export interface Bed {
  id: string;
  wardId: string;
  wardName: string;
  bedNumber: string; // e.g. "ICU-B01", "GW-101"
  bedType: BedType;
  status: BedStatus;
  dailyRate: number;
  currentPatientId?: string;
  currentPatientName?: string;
  currentAdmissionId?: string;
}

export interface BedAssignment {
  id: string;
  admissionId: string;
  patientId: string;
  bedId: string;
  bedNumber: string;
  wardId: string;
  wardName: string;
  assignedAt: string;
  releasedAt?: string;
  reason?: string;
  assignedBy: string;
}

export interface DischargeSummary {
  id: string;
  admissionId: string;
  dischargedAt: string;
  dischargingDoctorId: string;
  dischargingDoctorName: string;
  conditionAtDischarge: 'recovered' | 'improved' | 'unchanged' | 'critical' | 'transferred_out' | 'deceased';
  dischargeDiagnosis: string;
  dischargeInstructions: string;
  dischargeMedications: string;
  followUpDate?: string;
  followUpInstructions?: string;
}

export interface NursingObservation {
  id: string;
  admissionId: string;
  patientId: string;
  nurseId: string;
  nurseName: string;
  recordedAt: string;
  vitals: VitalSigns;
  painScore: number; // 0 - 10
  consciousness: 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive';
  notes: string;
  fluidsIntakeMl?: number;
  fluidsOutputMl?: number;
}

export interface BedTransfer {
  id: string;
  admissionId: string;
  patientId: string;
  patientName: string;
  fromWardId: string;
  fromWardName: string;
  fromBedId: string;
  fromBedNumber: string;
  toWardId: string;
  toWardName: string;
  toBedId: string;
  toBedNumber: string;
  transferDate: string;
  transferReason: string;
  authorizedBy: string;
}

export interface Admission {
  id: string;
  admissionNumber: string; // e.g. "ADM-2026-0001"
  patientId: string;
  patientName: string;
  patientMrn: string;
  attendingDoctorId: string;
  attendingDoctorName: string;
  departmentId: string;
  departmentName: string;
  wardId: string;
  wardName: string;
  bedId: string;
  bedNumber: string;
  dailyRate: number;
  admissionDate: string;
  admissionReason: string;
  diagnosis?: string;
  status: AdmissionStatus;
  expectedDischargeDate?: string;
  actualDischargeDate?: string;
  dischargeSummary?: DischargeSummary;
  nursingObservations?: NursingObservation[];
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// Laboratory Management (LIS) Types
// ------------------------------------------------------------------------------

export type LabCategory = 'Hematology' | 'Biochemistry' | 'Microbiology' | 'Pathology' | 'Radiology' | 'Immunology';
export type LabRequestStatus = 'requested' | 'sample_collected' | 'processing' | 'results_entered' | 'verified' | 'cancelled';
export type ResultFlag = 'normal' | 'low' | 'high' | 'critical';

export interface LabTest {
  id: string;
  testCode: string; // e.g. "CBC-01", "LIP-01"
  name: string;
  category: LabCategory;
  specimenType: string; // e.g. "Whole Blood", "Serum", "Urine"
  turnaroundHours: number;
  price: number;
  normalRange: string;
  units?: string;
  description?: string;
  status: 'active' | 'inactive';
}

export interface LabResultItem {
  id?: string;
  parameter: string;
  value: string | number;
  numericValue?: number;
  unit: string;
  referenceRange: string;
  flag: ResultFlag;
}

export interface LabRequest {
  id: string;
  requestNumber: string; // e.g. "LRQ-2026-0001"
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  medicalRecordId?: string;
  visitId?: string;
  testId: string;
  testCode: string;
  testName: string;
  category: LabCategory;
  priority: 'Routine' | 'Urgent' | 'STAT';
  status: LabRequestStatus;
  clinicalNotes?: string;
  sampleBarcode?: string; // e.g. "SMP-88319"
  sampleCollectedAt?: string;
  sampleCollectedBy?: string;
  sampleType?: string;
  resultsEnteredAt?: string;
  resultsEnteredBy?: string;
  resultItems?: LabResultItem[];
  interpretation?: string;
  isPanicValue?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedByRole?: string;
  verificationNotes?: string;
  invoiceId?: string;
  billedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

// ------------------------------------------------------------------------------
// Pharmacy Management Types
// ------------------------------------------------------------------------------

export type MedicineCategory =
  | 'Antibiotics'
  | 'Analgesics'
  | 'Cardiovascular'
  | 'Antidiabetic'
  | 'Respiratory'
  | 'Psychiatric'
  | 'Gastrointestinal'
  | 'Dermatology'
  | 'Emergency'
  | 'Other';

export type MedicineForm = 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Cream' | 'Inhaler' | 'Drops' | 'Suppository';

export interface Medicine {
  id: string;
  skuCode: string; // e.g. "MED-AMX-500"
  brandName: string;
  genericName: string;
  category: MedicineCategory;
  dosageForm: MedicineForm;
  strength: string; // e.g. "500mg"
  unitPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  manufacturer: string;
  isPrescriptionRequired: boolean;
  status: 'active' | 'discontinued';
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicineBatch {
  id: string;
  medicineId: string;
  medicineName: string;
  skuCode: string;
  batchNumber: string; // e.g. "BT-9901"
  expiryDate: string;  // YYYY-MM-DD
  quantityAvailable: number;
  initialQuantity: number;
  unitCost: number;
  receivedDate: string;
  supplier: string;
  status: 'active' | 'quarantined' | 'expired' | 'depleted';
}

export interface InventoryTransaction {
  id: string;
  medicineId: string;
  medicineName: string;
  batchId?: string;
  batchNumber?: string;
  transactionType: 'receipt' | 'dispense' | 'adjustment' | 'return' | 'disposal';
  quantity: number; // positive for receipt, negative for dispense
  balanceAfter: number;
  unitPrice?: number;
  referenceType: 'prescription' | 'purchase_order' | 'stock_count' | 'expiry_disposal' | 'manual_adjustment';
  referenceId?: string;
  reason?: string;
  performedBy: string;
  performedByName: string;
  timestamp: string;
}

export interface PrescriptionItemDetail {
  id?: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantityPrescribed: number;
  quantityDispensed: number;
  instructions?: string;
  unitPrice?: number;
  totalPrice?: number;
}

export type PrescriptionStatus = 'pending' | 'partially_dispensed' | 'dispensed' | 'cancelled';

export interface Prescription {
  id: string;
  prescriptionNumber: string; // e.g. "RX-2026-0001"
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  medicalRecordId?: string;
  visitId?: string;
  diagnosis?: string;
  items: PrescriptionItemDetail[];
  status: PrescriptionStatus;
  notes?: string;
  prescribedAt: string;
  validUntil: string;
  dispensedAt?: string;
  dispensedBy?: string;
  invoiceId?: string;
}

export interface DispensingRecord {
  id: string;
  dispensingNumber: string; // e.g. "DSP-2026-0001"
  prescriptionId: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  pharmacistId: string;
  pharmacistName: string;
  dispensedAt: string;
  items: {
    medicineId: string;
    medicineName: string;
    batchId: string;
    batchNumber: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  invoiceId?: string;
  notes?: string;
}

// ------------------------------------------------------------------------------
// Billing and Payments (Finance) Types
// ------------------------------------------------------------------------------

export type ServiceType = 'consultation' | 'laboratory' | 'pharmacy' | 'admission' | 'procedure' | 'other';
export type InvoiceStatus = 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'insurance' | 'check';

export interface InvoiceItem {
  id: string;
  invoiceId?: string;
  serviceType: ServiceType;
  description: string;
  referenceId?: string;
  referenceType?: 'appointment' | 'opd_visit' | 'lab_request' | 'prescription' | 'admission' | 'manual';
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0001"
  patientId: string;
  patientName: string;
  patientMrn: string;
  admissionId?: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  insuranceCoveredAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  receiptNumber: string; // e.g. "REC-2026-0001"
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  transactionReference?: string;
  receivedBy: string;
  receivedByName: string;
  isRefund: boolean;
  refundReason?: string;
  paymentDate: string;
  idempotencyKey: string;
  notes?: string;
  createdAt: string;
}

export interface RefundRecord {
  id: string;
  refundNumber: string; // e.g. "REF-2026-0001"
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  amount: number;
  reason: string;
  authorizedBy: string;
  authorizedByName: string;
  authorizedAt: string;
  status: 'processed' | 'rejected';
}

// ------------------------------------------------------------------------------
// Audit, Table, & Utility Types
// ------------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  actorId?: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetTable: string;
  recordId?: string;
  ipAddress?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  createdAt: string;
}

export interface SortConfig<T> {
  key: keyof T | string;
  direction: 'asc' | 'desc';
}

export interface TablePagination {
  page: number;
  pageSize: number;
  totalItems: number;
}

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (item: T) => React.ReactNode;
}

// ------------------------------------------------------------------------------
// Staff & Human Resources Management Types (Part 5)
// ------------------------------------------------------------------------------

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'temporary';
export type EmploymentStatus = 'active' | 'on_leave' | 'terminated' | 'suspended';
export type StaffShift = 'Morning' | 'Evening' | 'Night' | 'Rotating';

export interface StaffEmployee {
  id: string;
  employeeNumber: string; // e.g. "EMP-1092"
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  employmentType: EmploymentType;
  status: EmploymentStatus;
  shift: StaffShift;
  hireDate: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  salary?: number; // confidential: restricted to admin/HR
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent' | 'on_leave';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  departmentName: string;
  shift?: StaffShift;
  date: string; // YYYY-MM-DD
  checkInTime?: string; // HH:mm:ss
  checkOutTime?: string; // HH:mm:ss
  status: AttendanceStatus;
  notes?: string;
  createdAt: string;
}

export type LeaveType = 'annual' | 'sick' | 'casual' | 'maternity' | 'paternity' | 'bereavement' | 'unpaid';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveRequest {
  id: string;
  leaveNumber: string; // e.g. "LEV-2026-001"
  employeeId: string;
  employeeName: string;
  departmentName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  reviewComments?: string;
}

// ------------------------------------------------------------------------------
// Notifications Management Types (Part 5)
// ------------------------------------------------------------------------------

export type NotificationType =
  | 'appointment_created'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'lab_requested'
  | 'lab_result_verified'
  | 'low_stock_alert'
  | 'expired_batch_alert'
  | 'admission_created'
  | 'patient_discharged'
  | 'invoice_created'
  | 'payment_received'
  | 'leave_approved'
  | 'general_alert';

export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  targetRole?: string;
  targetUserId?: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

// ------------------------------------------------------------------------------
// Reports & Analytics Types (Part 5)
// ------------------------------------------------------------------------------

export type ReportCategory =
  | 'patient_registrations'
  | 'appointments'
  | 'doctor_activity'
  | 'department_statistics'
  | 'outpatient_visits'
  | 'inpatient_admissions'
  | 'laboratory_requests'
  | 'pharmacy_stock'
  | 'expired_medicines'
  | 'inventory_movements'
  | 'invoices'
  | 'payments_received'
  | 'outstanding_invoices'
  | 'refunds'
  | 'staff_attendance'
  | 'leave_records';

export interface ReportFilter {
  category: ReportCategory;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  status?: string;
  searchQuery?: string;
}

export interface FinancialAnalyticsSummary {
  totalBilledRevenue: number;
  totalCollectedCash: number;
  totalOutstandingBalance: number;
  totalRefundedAmount: number;
  netRealizedRevenue: number;
  collectionRatePercent: number;
}


