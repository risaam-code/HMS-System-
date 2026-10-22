// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — CORE DATA STORE & STORAGE
// ==============================================================================
// Provides client-side reactive state management, persistent localStorage synchronization,
// and database operations matching Supabase PostgreSQL schema rules.
// Enforces duplicate patient prevention, doctor double-booking overlap checks,
// department deletion guards, signed medical record immutability, and 11-step OPD workflows.
// ==============================================================================

import {
  Patient,
  PatientDocument,
  Department,
  Doctor,
  Appointment,
  AppointmentStatus,
  MedicalRecord,
  MedicalRecordAmendment,
  OutpatientVisit,
  OutpatientVisitStatus,
  Ward,
  Bed,
  BedStatus,
  BedAssignment,
  DischargeSummary,
  NursingObservation,
  BedTransfer,
  Admission,
  LabTest,
  LabResultItem,
  LabRequest,
  LabCategory,
  LabRequestStatus,
  Medicine,
  MedicineBatch,
  InventoryTransaction,
  Prescription,
  PrescriptionItemDetail,
  DispensingRecord,
  Invoice,
  InvoiceItem,
  Payment,
  PaymentMethod,
  RefundRecord,
  VitalSigns,
  StaffEmployee,
  AttendanceRecord,
  LeaveRequest,
  NotificationItem,
  NotificationType,
  NotificationSeverity,
  EmploymentType,
  StaffShift,
  AttendanceStatus,
  LeaveType,
} from '@/types';
import { AuditService } from './auditService';
import {
  INITIAL_WARDS,
  INITIAL_BEDS,
  INITIAL_ADMISSIONS,
  INITIAL_BED_ASSIGNMENTS,
  INITIAL_NURSING_OBSERVATIONS,
} from './seeds/inpatientSeeds';
import { INITIAL_LAB_TESTS, INITIAL_LAB_REQUESTS } from './seeds/laboratorySeeds';
import {
  INITIAL_MEDICINES,
  INITIAL_MEDICINE_BATCHES,
  INITIAL_PRESCRIPTIONS,
  INITIAL_DISPENSING_RECORDS,
} from './seeds/pharmacySeeds';
import { INITIAL_INVOICES, INITIAL_PAYMENTS, INITIAL_REFUNDS } from './seeds/billingSeeds';
import {
  INITIAL_STAFF,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_NOTIFICATIONS,
} from './seeds/staffAndNotificationSeeds';

const PATIENTS_KEY = 'medpulse_hms_patients_v3';
const DEPARTMENTS_KEY = 'medpulse_hms_departments_v3';
const DOCTORS_KEY = 'medpulse_hms_doctors_v3';
const APPOINTMENTS_KEY = 'medpulse_hms_appointments_v3';
const RECORDS_KEY = 'medpulse_hms_records_v3';
const OPD_KEY = 'medpulse_hms_opd_v3';

// Part 4 Keys
const WARDS_KEY = 'medpulse_hms_wards_v4';
const BEDS_KEY = 'medpulse_hms_beds_v4';
const ADMISSIONS_KEY = 'medpulse_hms_admissions_v4';
const BED_ASSIGNMENTS_KEY = 'medpulse_hms_bed_assignments_v4';
const NURSING_OBS_KEY = 'medpulse_hms_nursing_obs_v4';
const BED_TRANSFERS_KEY = 'medpulse_hms_bed_transfers_v4';
const LAB_TESTS_KEY = 'medpulse_hms_lab_tests_v4';
const LAB_REQUESTS_KEY = 'medpulse_hms_lab_requests_v4';
const MEDICINES_KEY = 'medpulse_hms_medicines_v4';
const MEDICINE_BATCHES_KEY = 'medpulse_hms_medicine_batches_v4';
const INV_TRANSACTIONS_KEY = 'medpulse_hms_inv_tx_v4';
const PRESCRIPTIONS_KEY = 'medpulse_hms_prescriptions_v4';
const DISPENSING_KEY = 'medpulse_hms_dispensing_v4';
const INVOICES_KEY = 'medpulse_hms_invoices_v4';
const PAYMENTS_KEY = 'medpulse_hms_payments_v4';
const REFUNDS_KEY = 'medpulse_hms_refunds_v4';

// Part 5 Keys
const STAFF_KEY = 'medpulse_hms_staff_v5';
const ATTENDANCE_KEY = 'medpulse_hms_attendance_v5';
const LEAVES_KEY = 'medpulse_hms_leaves_v5';
const NOTIFICATIONS_KEY = 'medpulse_hms_notifications_v5';

// ------------------------------------------------------------------------------
// INITIAL HIGH-FIDELITY SEEDS
// ------------------------------------------------------------------------------

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-1',
    name: 'Cardiology',
    code: 'CARD',
    description: 'Comprehensive adult and pediatric cardiac care, cath lab, and echocardiography.',
    location: 'Tower A, 4th Floor',
    buildingWing: 'Tower A',
    floorNumber: 4,
    contactNumber: '+1 (555) 011-4001',
    departmentHead: 'Dr. Robert Vance, MD',
    headDoctorId: 'doc-1',
    totalBeds: 28,
    status: 'active',
  },
  {
    id: 'dept-2',
    name: 'Neurology',
    code: 'NEUR',
    description: 'Diagnosis and surgical treatment of nervous system disorders, stroke unit, and EEG.',
    location: 'Tower B, 3rd Floor',
    buildingWing: 'Tower B',
    floorNumber: 3,
    contactNumber: '+1 (555) 011-3002',
    departmentHead: 'Dr. Elena Rostova, MD',
    headDoctorId: 'doc-2',
    totalBeds: 22,
    status: 'active',
  },
  {
    id: 'dept-3',
    name: 'Orthopedics',
    code: 'ORTH',
    description: 'Joint replacement, spine surgery, sports trauma, and physical rehabilitation.',
    location: 'West Pavilion, 2nd Floor',
    buildingWing: 'West Pavilion',
    floorNumber: 2,
    contactNumber: '+1 (555) 011-2003',
    departmentHead: 'Dr. Marcus Brody, MD',
    headDoctorId: 'doc-3',
    totalBeds: 34,
    status: 'active',
  },
  {
    id: 'dept-4',
    name: 'Pediatrics',
    code: 'PEDS',
    description: 'General pediatric medicine, neonatal intensive care (NICU), and adolescent care.',
    location: 'Children Wing, 1st Floor',
    buildingWing: 'Children Wing',
    floorNumber: 1,
    contactNumber: '+1 (555) 011-1004',
    departmentHead: 'Dr. Sarah Jenkins, MD',
    headDoctorId: 'doc-4',
    totalBeds: 30,
    status: 'active',
  },
  {
    id: 'dept-5',
    name: 'General Surgery',
    code: 'SURG',
    description: 'Elective and emergent abdominal, laparoscopic, endocrine, and colorectal procedures.',
    location: 'Surgical Block, 5th Floor',
    buildingWing: 'Surgical Block',
    floorNumber: 5,
    contactNumber: '+1 (555) 011-5005',
    departmentHead: 'Dr. Tariq Al-Mansoor, MD',
    headDoctorId: 'doc-5',
    totalBeds: 24,
    status: 'active',
  },
  {
    id: 'dept-6',
    name: 'Emergency & Trauma (ER)',
    code: 'EMRG',
    description: 'Level 1 Trauma resuscitation, acute triage, and rapid stabilization facility.',
    location: 'Ground Level A',
    buildingWing: 'Ground Level A',
    floorNumber: 1,
    contactNumber: '+1 (555) 011-0911',
    departmentHead: 'Dr. Jonathan Blake, MD',
    headDoctorId: 'doc-6',
    totalBeds: 40,
    status: 'active',
  },
];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    fullName: 'Dr. Robert Vance, MD',
    specialization: 'Interventional Cardiology',
    departmentId: 'dept-1',
    department: 'Cardiology',
    licenseNumber: 'MD-88192-CA',
    qualifications: ['MBBS', 'MD - Internal Medicine', 'Fellowship in Interventional Cardiology', 'FACC'],
    consultationFee: 180,
    contactNumber: '+1 (555) 789-0123',
    email: 'dr.vance@medpulse-hospital.org',
    experienceYears: 18,
    biography: 'Chief of Cardiology specializing in complex percutaneous coronary interventions and structural heart disease.',
    status: 'active',
    availabilityStatus: 'in_consultation',
    availabilitySchedule: [
      { dayOfWeek: 'Monday', startTime: '09:00', endTime: '16:00', maxPatients: 20 },
      { dayOfWeek: 'Tuesday', startTime: '09:00', endTime: '16:00', maxPatients: 20 },
      { dayOfWeek: 'Thursday', startTime: '10:00', endTime: '17:00', maxPatients: 18 },
    ],
    todayAppointmentsCount: 14,
  },
  {
    id: 'doc-2',
    fullName: 'Dr. Elena Rostova, MD',
    specialization: 'Clinical Neurophysiology',
    departmentId: 'dept-2',
    department: 'Neurology',
    licenseNumber: 'MD-74129-CA',
    qualifications: ['MBBS', 'MD - Neurology', 'Board Certified Neurophysiologist (ABPN)'],
    consultationFee: 200,
    contactNumber: '+1 (555) 890-1234',
    email: 'dr.rostova@medpulse-hospital.org',
    experienceYears: 12,
    biography: 'Head of Neurology with expertise in stroke rehabilitation, epilepsy monitoring, and neuro-critical care.',
    status: 'active',
    availabilityStatus: 'available',
    availabilitySchedule: [
      { dayOfWeek: 'Monday', startTime: '08:30', endTime: '15:30', maxPatients: 16 },
      { dayOfWeek: 'Wednesday', startTime: '08:30', endTime: '15:30', maxPatients: 16 },
      { dayOfWeek: 'Friday', startTime: '09:00', endTime: '14:00', maxPatients: 12 },
    ],
    todayAppointmentsCount: 9,
  },
  {
    id: 'doc-3',
    fullName: 'Dr. Marcus Brody, MD',
    specialization: 'Adult Joint Reconstruction',
    departmentId: 'dept-3',
    department: 'Orthopedics',
    licenseNumber: 'MD-66512-CA',
    qualifications: ['MBBS', 'MS - Orthopedic Surgery', 'Fellow of Royal College of Surgeons (FRCS)'],
    consultationFee: 175,
    contactNumber: '+1 (555) 901-2345',
    email: 'dr.brody@medpulse-hospital.org',
    experienceYears: 15,
    biography: 'Specializes in computer-assisted hip and knee arthroplasty and complex revision reconstruction.',
    status: 'active',
    availabilityStatus: 'available',
    availabilitySchedule: [
      { dayOfWeek: 'Tuesday', startTime: '08:00', endTime: '16:00', maxPatients: 22 },
      { dayOfWeek: 'Thursday', startTime: '08:00', endTime: '16:00', maxPatients: 22 },
    ],
    todayAppointmentsCount: 12,
  },
  {
    id: 'doc-4',
    fullName: 'Dr. Sarah Jenkins, MD',
    specialization: 'Pediatric Critical Care',
    departmentId: 'dept-4',
    department: 'Pediatrics',
    licenseNumber: 'MD-91204-CA',
    qualifications: ['MBBS', 'MD - Pediatrics', 'FAAP'],
    consultationFee: 150,
    contactNumber: '+1 (555) 012-3456',
    email: 'dr.jenkins@medpulse-hospital.org',
    experienceYears: 9,
    biography: 'Pediatric specialist dedicated to adolescent wellness, neonatal emergencies, and preventative health.',
    status: 'active',
    availabilityStatus: 'available',
    availabilitySchedule: [
      { dayOfWeek: 'Monday', startTime: '09:00', endTime: '17:00', maxPatients: 25 },
      { dayOfWeek: 'Wednesday', startTime: '09:00', endTime: '17:00', maxPatients: 25 },
      { dayOfWeek: 'Friday', startTime: '09:00', endTime: '15:00', maxPatients: 18 },
    ],
    todayAppointmentsCount: 8,
  },
  {
    id: 'doc-5',
    fullName: 'Dr. Tariq Al-Mansoor, MD',
    specialization: 'Minimally Invasive Surgery',
    departmentId: 'dept-5',
    department: 'General Surgery',
    licenseNumber: 'MD-53291-CA',
    qualifications: ['MBBS', 'MS - General Surgery', 'Fellow of American College of Surgeons (FACS)'],
    consultationFee: 220,
    contactNumber: '+1 (555) 123-4567',
    email: 'dr.almansoor@medpulse-hospital.org',
    experienceYears: 16,
    biography: 'Senior General Surgeon pioneering advanced laparoscopic and robotic colorectal interventions.',
    status: 'active',
    availabilityStatus: 'available',
    availabilitySchedule: [
      { dayOfWeek: 'Tuesday', startTime: '10:00', endTime: '18:00', maxPatients: 15 },
      { dayOfWeek: 'Thursday', startTime: '10:00', endTime: '18:00', maxPatients: 15 },
    ],
    todayAppointmentsCount: 6,
  },
  {
    id: 'doc-6',
    fullName: 'Dr. Jonathan Blake, MD',
    specialization: 'Emergency Medicine',
    departmentId: 'dept-6',
    department: 'Emergency & Trauma (ER)',
    licenseNumber: 'MD-42109-CA',
    qualifications: ['MBBS', 'Emergency Medicine Specialist', 'ATLS Certified Instructor'],
    consultationFee: 250,
    contactNumber: '+1 (555) 234-5678',
    email: 'dr.blake@medpulse-hospital.org',
    experienceYears: 14,
    biography: 'Medical Director of Emergency Services leading rapid resuscitation, triage protocols, and disaster readiness.',
    status: 'active',
    availabilityStatus: 'available',
    availabilitySchedule: [
      { dayOfWeek: 'Monday', startTime: '07:00', endTime: '19:00', maxPatients: 30 },
      { dayOfWeek: 'Wednesday', startTime: '07:00', endTime: '19:00', maxPatients: 30 },
      { dayOfWeek: 'Friday', startTime: '07:00', endTime: '19:00', maxPatients: 30 },
    ],
    todayAppointmentsCount: 16,
  },
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    medicalRecordNumber: 'MRN-2026-00101',
    firstName: 'Eleanor',
    lastName: 'Vance',
    gender: 'female',
    dateOfBirth: '1982-04-12',
    age: 44,
    bloodGroup: 'O+',
    phone: '+1 (555) 234-5678',
    email: 'eleanor.vance@example.com',
    address: '742 Evergreen Terrace, Springfield, CA 90210',
    emergencyContact: {
      name: 'Arthur Vance',
      relationship: 'Spouse',
      phone: '+1 (555) 234-5679',
    },
    allergies: ['Penicillin', 'Sulfa Drugs'],
    registrationDate: '2026-01-15',
    status: 'active',
    assignedDoctorId: 'doc-1',
    assignedDoctor: 'Dr. Robert Vance, MD',
    lastVisit: '2026-10-18',
    documents: [
      {
        id: 'doc-pat-1-1',
        title: 'National Identity Card (Verified)',
        fileType: 'PDF',
        fileUrl: '/mock/docs/id_card.pdf',
        sizeBytes: 1048576,
        uploadedAt: '2026-01-15T10:00:00Z',
        uploadedBy: 'Receptionist Sarah',
        category: 'ID Card',
      },
      {
        id: 'doc-pat-1-2',
        title: 'BlueCross Health Insurance Card 2026',
        fileType: 'PDF',
        fileUrl: '/mock/docs/insurance.pdf',
        sizeBytes: 2097152,
        uploadedAt: '2026-01-15T10:05:00Z',
        uploadedBy: 'Receptionist Sarah',
        category: 'Insurance',
      },
    ],
    notes: 'Hypertensive patient monitoring with periodic resting ECG and lipid profile checkups.',
  },
  {
    id: 'pat-2',
    medicalRecordNumber: 'MRN-2026-00102',
    firstName: 'James',
    lastName: 'Henderson',
    gender: 'male',
    dateOfBirth: '1975-09-22',
    age: 51,
    bloodGroup: 'A+',
    phone: '+1 (555) 345-6789',
    email: 'james.henderson@example.com',
    address: '1048 Elm Boulevard, Suite 3B, Metropolis, CA 90212',
    emergencyContact: {
      name: 'Sarah Henderson',
      relationship: 'Daughter',
      phone: '+1 (555) 345-6780',
    },
    allergies: ['Latex'],
    registrationDate: '2026-02-10',
    status: 'admitted',
    assignedDoctorId: 'doc-2',
    assignedDoctor: 'Dr. Elena Rostova, MD',
    lastVisit: '2026-10-20',
    documents: [
      {
        id: 'doc-pat-2-1',
        title: 'Brain MRI T1/T2 Scan Report',
        fileType: 'PDF',
        fileUrl: '/mock/docs/mri.pdf',
        sizeBytes: 5242880,
        uploadedAt: '2026-10-17T14:30:00Z',
        uploadedBy: 'Dr. Elena Rostova, MD',
        category: 'Imaging',
      },
    ],
    notes: 'Under observation in Neurology Ward Bed N-12 for post-stroke physical recovery.',
  },
  {
    id: 'pat-3',
    medicalRecordNumber: 'MRN-2026-00103',
    firstName: 'Sophia',
    lastName: 'Alvarez',
    gender: 'female',
    dateOfBirth: '1990-11-05',
    age: 35,
    bloodGroup: 'B-',
    phone: '+1 (555) 456-7890',
    email: 'sophia.alvarez@example.com',
    address: '88 Ocean View Drive, San Diego, CA 92101',
    emergencyContact: {
      name: 'Carlos Alvarez',
      relationship: 'Brother',
      phone: '+1 (555) 456-7891',
    },
    allergies: ['Aspirin', 'NSAIDs'],
    registrationDate: '2026-03-04',
    status: 'active',
    assignedDoctorId: 'doc-3',
    assignedDoctor: 'Dr. Marcus Brody, MD',
    lastVisit: '2026-10-15',
    documents: [],
    notes: 'Right knee meniscal rehabilitation on schedule.',
  },
  {
    id: 'pat-4',
    medicalRecordNumber: 'MRN-2026-00104',
    firstName: 'Michael',
    lastName: 'Chen',
    gender: 'male',
    dateOfBirth: '2018-06-30',
    age: 8,
    bloodGroup: 'AB+',
    phone: '+1 (555) 567-8901',
    email: 'chen.family@example.com',
    address: '320 Magnolia Lane, Pasadena, CA 91101',
    emergencyContact: {
      name: 'Wei Chen',
      relationship: 'Father',
      phone: '+1 (555) 567-8902',
    },
    allergies: ['Peanuts'],
    registrationDate: '2026-04-18',
    status: 'active',
    assignedDoctorId: 'doc-4',
    assignedDoctor: 'Dr. Sarah Jenkins, MD',
    lastVisit: '2026-10-19',
    documents: [],
    notes: 'Pediatric patient; completed booster immunizations.',
  },
  {
    id: 'pat-5',
    medicalRecordNumber: 'MRN-2026-00105',
    firstName: 'Claire',
    lastName: 'Beauchamp',
    gender: 'female',
    dateOfBirth: '1968-02-14',
    age: 58,
    bloodGroup: 'O-',
    phone: '+1 (555) 678-9012',
    email: 'claire.beauchamp@example.com',
    address: '51 Highland Crest Road, Highlands, CA 93271',
    emergencyContact: {
      name: 'Frank Randall',
      relationship: 'Spouse',
      phone: '+1 (555) 678-9013',
    },
    allergies: ['Iodine Contrast Agent'],
    registrationDate: '2026-05-12',
    status: 'critical',
    assignedDoctorId: 'doc-5',
    assignedDoctor: 'Dr. Tariq Al-Mansoor, MD',
    lastVisit: '2026-10-20',
    documents: [],
    notes: 'Post-op laparoscopic appendectomy recovery in Surgical ICU Bed S-04.',
  },
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    appointmentNumber: 'APT-2026-00101',
    patientId: 'pat-1',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-2026-00101',
    patientPhone: '+1 (555) 234-5678',
    doctorId: 'doc-1',
    doctorName: 'Dr. Robert Vance, MD',
    departmentId: 'dept-1',
    department: 'Cardiology',
    date: '2026-10-21',
    startTime: '09:00',
    endTime: '09:30',
    scheduledAt: '2026-10-21T09:00:00Z',
    type: 'consultation',
    priority: 'urgent',
    visitReason: 'Hypertension evaluation and ECG review',
    status: 'In Progress',
    bookingUserName: 'Reception Desk',
    checkInTime: '2026-10-21T08:52:00Z',
    clinicalNotes: 'Resting BP 142/90 mmHg. Patient experiencing mild occasional palpitations.',
  },
  {
    id: 'apt-102',
    appointmentNumber: 'APT-2026-00102',
    patientId: 'pat-2',
    patientName: 'James Henderson',
    patientMrn: 'MRN-2026-00102',
    patientPhone: '+1 (555) 345-6789',
    doctorId: 'doc-2',
    doctorName: 'Dr. Elena Rostova, MD',
    departmentId: 'dept-2',
    department: 'Neurology',
    date: '2026-10-21',
    startTime: '09:30',
    endTime: '10:00',
    scheduledAt: '2026-10-21T09:30:00Z',
    type: 'follow_up',
    priority: 'normal',
    visitReason: 'Post-migraine therapy assessment and EEG review',
    status: 'Checked In',
    bookingUserName: 'Dr. Elena Rostova, MD',
    checkInTime: '2026-10-21T09:25:00Z',
  },
  {
    id: 'apt-103',
    appointmentNumber: 'APT-2026-00103',
    patientId: 'pat-3',
    patientName: 'Sophia Alvarez',
    patientMrn: 'MRN-2026-00103',
    patientPhone: '+1 (555) 456-7890',
    doctorId: 'doc-3',
    doctorName: 'Dr. Marcus Brody, MD',
    departmentId: 'dept-3',
    department: 'Orthopedics',
    date: '2026-10-21',
    startTime: '10:15',
    endTime: '10:45',
    scheduledAt: '2026-10-21T10:15:00Z',
    type: 'routine_checkup',
    priority: 'normal',
    visitReason: 'Knee arthroscopy rehabilitation check and range of motion',
    status: 'Scheduled',
    bookingUserName: 'Reception Desk',
  },
  {
    id: 'apt-104',
    appointmentNumber: 'APT-2026-00104',
    patientId: 'pat-4',
    patientName: 'Michael Chen',
    patientMrn: 'MRN-2026-00104',
    patientPhone: '+1 (555) 567-8901',
    doctorId: 'doc-4',
    doctorName: 'Dr. Sarah Jenkins, MD',
    departmentId: 'dept-4',
    department: 'Pediatrics',
    date: '2026-10-21',
    startTime: '11:00',
    endTime: '11:30',
    scheduledAt: '2026-10-21T11:00:00Z',
    type: 'consultation',
    priority: 'normal',
    visitReason: 'Pediatric annual immunization and wellness check',
    status: 'Completed',
    bookingUserName: 'Reception Desk',
    checkInTime: '2026-10-21T10:55:00Z',
    completedTime: '2026-10-21T11:28:00Z',
  },
  {
    id: 'apt-105',
    appointmentNumber: 'APT-2026-00105',
    patientId: 'pat-5',
    patientName: 'Claire Beauchamp',
    patientMrn: 'MRN-2026-00105',
    patientPhone: '+1 (555) 678-9012',
    doctorId: 'doc-5',
    doctorName: 'Dr. Tariq Al-Mansoor, MD',
    departmentId: 'dept-5',
    department: 'General Surgery',
    date: '2026-10-21',
    startTime: '11:45',
    endTime: '12:15',
    scheduledAt: '2026-10-21T11:45:00Z',
    type: 'emergency',
    priority: 'urgent',
    visitReason: 'Acute abdominal pain diagnostic consult',
    status: 'Confirmed',
    bookingUserName: 'ER Triage Nurse',
  },
];

export const INITIAL_MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: 'rec-1',
    recordNumber: 'REC-2026-00441',
    patientId: 'pat-1',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-2026-00101',
    doctorId: 'doc-1',
    doctorName: 'Dr. Robert Vance, MD',
    appointmentId: 'apt-101',
    encounterDate: '2026-10-18',
    visitType: 'outpatient',
    chiefComplaint: 'Periodic palpitations and morning occipital headaches for 2 weeks.',
    clinicalNotes: `SUBJECTIVE: Patient reports intermittent dizziness and morning headaches. No chest pressure or dyspnea on exertion.
OBJECTIVE: Alert and oriented x4. Heart regular rate and rhythm, no murmurs. Lungs clear to auscultation bilaterally.
ASSESSMENT: Primary Stage II Essential Hypertension with suboptimal control on current regimen.
PLAN: Increase Amlodipine to 10mg daily. Recommend lifestyle modification and daily morning BP charting. Follow-up in 4 weeks with lipid panel.`,
    diagnosisCode: 'I10',
    diagnosisTitle: 'Essential (Primary) Hypertension - Stage II',
    treatmentPlan: 'Adjust anti-hypertensive therapy, ambulatory BP monitoring, dietary sodium restriction < 2g/day.',
    vitalSigns: {
      temperature: 36.8,
      bloodPressureSystolic: 148,
      bloodPressureDiastolic: 92,
      heartRate: 78,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weightKg: 68,
      heightCm: 165,
      recordedAt: '2026-10-18T09:10:00Z',
      recordedBy: 'Nurse Emily Clark',
    },
    prescriptions: [
      {
        medicineName: 'Amlodipine Besylate',
        dosage: '10mg',
        frequency: 'Once Daily (Morning)',
        duration: '30 Days',
        instructions: 'Take with or without food. Monitor blood pressure weekly.',
      },
      {
        medicineName: 'Hydrochlorothiazide',
        dosage: '12.5mg',
        frequency: 'Once Daily (Morning)',
        duration: '30 Days',
        instructions: 'Take in the morning to prevent nocturia.',
      },
    ],
    followUpDate: '2026-11-15',
    reportReferences: ['LAB-2026-9081', 'ECG-2026-112'],
    isConfidential: false,
    isSigned: true,
    signedAt: '2026-10-18T10:00:00Z',
    signedByDoctorId: 'doc-1',
    signedByDoctorName: 'Dr. Robert Vance, MD',
    amendments: [
      {
        id: 'amend-1',
        recordId: 'rec-1',
        amendedAt: '2026-10-18T14:22:00Z',
        authorId: 'doc-1',
        authorName: 'Dr. Robert Vance, MD',
        authorRole: 'doctor',
        amendmentReason: 'Added patient allergy clarification after reviewing pharmacy profile.',
        previousNotes: 'Initial SOAP assessment filed.',
        newNotes: 'Verified patient Penicillin allergy notation and confirmed Amlodipine regimen is safe with current status.',
      },
    ],
    createdAt: '2026-10-18T09:30:00Z',
    updatedAt: '2026-10-18T14:22:00Z',
  },
  {
    id: 'rec-2',
    recordNumber: 'REC-2026-00442',
    patientId: 'pat-2',
    patientName: 'James Henderson',
    patientMrn: 'MRN-2026-00102',
    doctorId: 'doc-2',
    doctorName: 'Dr. Elena Rostova, MD',
    encounterDate: '2026-10-17',
    visitType: 'inpatient',
    chiefComplaint: 'Sudden onset right facial droop and transient left arm weakness.',
    clinicalNotes: `SUBJECTIVE: 51yo male presented with sudden neurological deficit resolved within 45 minutes.
OBJECTIVE: Glasgow Coma Scale 15. Cranial nerves intact. Motor power 5/5 all extremities. Normal reflexes.
ASSESSMENT: Transient Ischemic Attack (TIA), secondary to carotid atheroma.
PLAN: Admit to stroke unit for continuous telemetry, dual antiplatelet therapy, and neurovascular ultrasound.`,
    diagnosisCode: 'G45.9',
    diagnosisTitle: 'Transient Cerebral Ischemic Attack, Unspecified',
    treatmentPlan: 'Continuous neuro-telemetry, Aspirin 81mg + Clopidogrel 75mg daily, Atorvastatin 80mg at bedtime.',
    vitalSigns: {
      temperature: 37.1,
      bloodPressureSystolic: 154,
      bloodPressureDiastolic: 88,
      heartRate: 84,
      respiratoryRate: 18,
      oxygenSaturation: 97,
      weightKg: 82,
      heightCm: 178,
      recordedAt: '2026-10-17T11:00:00Z',
      recordedBy: 'Nurse Emily Clark',
    },
    prescriptions: [
      {
        medicineName: 'Clopidogrel',
        dosage: '75mg',
        frequency: 'Once Daily',
        duration: '21 Days',
        instructions: 'Take with full glass of water. Report unusual bruising.',
      },
      {
        medicineName: 'Atorvastatin Calcium',
        dosage: '80mg',
        frequency: 'Once Daily (Bedtime)',
        duration: '90 Days',
        instructions: 'Take at night. Avoid grapefruit consumption.',
      },
    ],
    followUpDate: '2026-10-24',
    reportReferences: ['MRI-BRAIN-2026', 'CAROTID-DOPPLER-01'],
    isConfidential: true,
    isSigned: true,
    signedAt: '2026-10-17T13:45:00Z',
    signedByDoctorId: 'doc-2',
    signedByDoctorName: 'Dr. Elena Rostova, MD',
    amendments: [],
    createdAt: '2026-10-17T11:30:00Z',
    updatedAt: '2026-10-17T13:45:00Z',
  },
  {
    id: 'rec-3',
    recordNumber: 'REC-2026-00443',
    patientId: 'pat-3',
    patientName: 'Sophia Alvarez',
    patientMrn: 'MRN-2026-00103',
    doctorId: 'doc-3',
    doctorName: 'Dr. Marcus Brody, MD',
    appointmentId: 'apt-103',
    encounterDate: '2026-10-14',
    visitType: 'outpatient',
    chiefComplaint: 'Post-op right knee evaluation, mild stiffness upon extension.',
    clinicalNotes: `SUBJECTIVE: Patient completed week 4 of physical therapy. Ambulation without crutches for 3 days.
OBJECTIVE: Right knee surgical incisions well healed. No effusion, warmth, or erythema. Range of motion 0 to 110 degrees.
ASSESSMENT: Status post right knee arthroscopic partial meniscectomy, healing as anticipated.
PLAN: Continue outpatient rehabilitation exercises. Advance weight-bearing exercise. Return in 4 weeks.`,
    diagnosisCode: 'M23.22',
    diagnosisTitle: 'Derangement of Meniscus Due to Old Tear, Right Knee',
    treatmentPlan: 'Physical therapy protocol phase II, progressive quad strengthening, ice post exercise.',
    vitalSigns: {
      temperature: 36.6,
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 74,
      heartRate: 68,
      respiratoryRate: 14,
      oxygenSaturation: 99,
      weightKg: 62,
      heightCm: 168,
      recordedAt: '2026-10-14T14:00:00Z',
      recordedBy: 'Nurse Mark Wilson',
    },
    prescriptions: [
      {
        medicineName: 'Acetaminophen Extra Strength',
        dosage: '500mg',
        frequency: 'PRN every 6-8 hrs as needed for pain',
        duration: '14 Days',
        instructions: 'Do not exceed 3000mg per 24 hours.',
      },
    ],
    followUpDate: '2026-11-12',
    reportReferences: ['XRAY-KNEE-R2'],
    isConfidential: false,
    isSigned: false, // Unsigned draft awaiting final signoff
    amendments: [],
    createdAt: '2026-10-14T14:30:00Z',
    updatedAt: '2026-10-14T14:30:00Z',
  },
];

export const INITIAL_OPD_VISITS: OutpatientVisit[] = [
  {
    id: 'opd-1',
    visitNumber: 'OPD-2026-01041',
    queueToken: 'T-101',
    patientId: 'pat-1',
    patientName: 'Eleanor Vance',
    patientMrn: 'MRN-2026-00101',
    appointmentId: 'apt-101',
    doctorId: 'doc-1',
    doctorName: 'Dr. Robert Vance, MD',
    departmentId: 'dept-1',
    departmentName: 'Cardiology',
    checkInTime: '2026-10-21T08:45:00Z',
    status: 'In Consultation',
    priority: 'Urgent',
    isWalkIn: false,
    vitals: {
      temperature: 36.9,
      bloodPressureSystolic: 144,
      bloodPressureDiastolic: 92,
      heartRate: 80,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      weightKg: 68,
      heightCm: 165,
      recordedAt: '2026-10-21T08:50:00Z',
      recordedBy: 'Triage Nurse Lisa',
    },
    chiefComplaint: 'Frequent palpitations and high morning blood pressure.',
    consultationNotes: 'ECG demonstrates sinus tachycardia. Adjusting anti-hypertensive regimen.',
    diagnosis: 'Hypertensive heart condition with sinus tachycardia',
    treatmentPlan: 'Prescribed Amlodipine 10mg, ordered comprehensive Lipid Profile and Troponin.',
    labRequests: ['LIPID-PANEL', 'TROPONIN-I'],
    prescriptions: [
      {
        medicineName: 'Amlodipine Besylate',
        dosage: '10mg',
        frequency: 'Daily (Morning)',
        duration: '30 Days',
        instructions: 'Take in morning',
      },
    ],
    consultationFee: 180.0,
    createdAt: '2026-10-21T08:45:00Z',
    updatedAt: '2026-10-21T09:15:00Z',
  },
  {
    id: 'opd-2',
    visitNumber: 'OPD-2026-01042',
    queueToken: 'T-102',
    patientId: 'pat-4',
    patientName: 'Michael Chen',
    patientMrn: 'MRN-2026-00104',
    appointmentId: 'apt-104',
    doctorId: 'doc-4',
    doctorName: 'Dr. Sarah Jenkins, MD',
    departmentId: 'dept-4',
    departmentName: 'Pediatrics',
    checkInTime: '2026-10-21T09:05:00Z',
    status: 'Completed',
    priority: 'Routine',
    isWalkIn: false,
    vitals: {
      temperature: 36.7,
      heartRate: 92,
      respiratoryRate: 20,
      oxygenSaturation: 99,
      weightKg: 26,
      heightCm: 128,
      recordedAt: '2026-10-21T09:10:00Z',
      recordedBy: 'Nurse Lisa',
    },
    chiefComplaint: 'Pediatric annual physical examination and wellness evaluation.',
    consultationNotes: 'Child is active, alert, normal development milestones for age.',
    diagnosis: 'Routine Child Health Check, normal findings',
    treatmentPlan: 'Administered annual influenza vaccination. Routine oral hygiene advice.',
    labRequests: [],
    prescriptions: [],
    consultationFee: 150.0,
    completedAt: '2026-10-21T09:40:00Z',
    createdAt: '2026-10-21T09:05:00Z',
    updatedAt: '2026-10-21T09:40:00Z',
  },
  {
    id: 'opd-3',
    visitNumber: 'OPD-2026-01043',
    queueToken: 'T-103',
    patientId: 'pat-3',
    patientName: 'Sophia Alvarez',
    patientMrn: 'MRN-2026-00103',
    appointmentId: 'apt-103',
    doctorId: 'doc-3',
    doctorName: 'Dr. Marcus Brody, MD',
    departmentId: 'dept-3',
    departmentName: 'Orthopedics',
    checkInTime: '2026-10-21T09:20:00Z',
    status: 'Checked In',
    priority: 'Routine',
    isWalkIn: true,
    chiefComplaint: 'Knee stiffness post-rehab exercises.',
    consultationFee: 175.0,
    createdAt: '2026-10-21T09:20:00Z',
    updatedAt: '2026-10-21T09:20:00Z',
  },
  {
    id: 'opd-4',
    visitNumber: 'OPD-2026-01044',
    queueToken: 'T-104',
    patientId: 'pat-5',
    patientName: 'Claire Beauchamp',
    patientMrn: 'MRN-2026-00105',
    doctorId: 'doc-5',
    doctorName: 'Dr. Tariq Al-Mansoor, MD',
    departmentId: 'dept-5',
    departmentName: 'General Surgery',
    checkInTime: '2026-10-21T09:45:00Z',
    status: 'Registered',
    priority: 'STAT',
    isWalkIn: true,
    chiefComplaint: 'Acute right lower quadrant abdominal tenderness and fever.',
    consultationFee: 220.0,
    createdAt: '2026-10-21T09:45:00Z',
    updatedAt: '2026-10-21T09:45:00Z',
  },
];

// ------------------------------------------------------------------------------
// PERSISTENT STORAGE ENGINE WITH EVENT BROADCASTING
// ------------------------------------------------------------------------------

class MockHospitalStore {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Error in store listener:', err);
      }
    });
  }

  private load<T>(key: string, fallback: T): T {
    try {
      if (typeof window === 'undefined') return fallback;
      const raw = localStorage.getItem(key);
      if (!raw) {
        localStorage.setItem(key, JSON.stringify(fallback));
        return fallback;
      }
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  private save<T>(key: string, data: T) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data));
        this.notify();
      }
    } catch (e) {
      console.error(`Failed to save to localStorage (${key}):`, e);
    }
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(PATIENTS_KEY)) {
      localStorage.setItem(PATIENTS_KEY, JSON.stringify(INITIAL_PATIENTS));
    }
    if (!localStorage.getItem(DEPARTMENTS_KEY)) {
      localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(INITIAL_DEPARTMENTS));
    }
    if (!localStorage.getItem(DOCTORS_KEY)) {
      localStorage.setItem(DOCTORS_KEY, JSON.stringify(INITIAL_DOCTORS));
    }
    if (!localStorage.getItem(APPOINTMENTS_KEY)) {
      localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(INITIAL_APPOINTMENTS));
    }
    if (!localStorage.getItem(RECORDS_KEY)) {
      localStorage.setItem(RECORDS_KEY, JSON.stringify(INITIAL_MEDICAL_RECORDS));
    }
    if (!localStorage.getItem(OPD_KEY)) {
      localStorage.setItem(OPD_KEY, JSON.stringify(INITIAL_OPD_VISITS));
    }
    if (!localStorage.getItem(WARDS_KEY)) {
      localStorage.setItem(WARDS_KEY, JSON.stringify(INITIAL_WARDS));
    }
    if (!localStorage.getItem(BEDS_KEY)) {
      localStorage.setItem(BEDS_KEY, JSON.stringify(INITIAL_BEDS));
    }
    if (!localStorage.getItem(ADMISSIONS_KEY)) {
      localStorage.setItem(ADMISSIONS_KEY, JSON.stringify(INITIAL_ADMISSIONS));
    }
    if (!localStorage.getItem(BED_ASSIGNMENTS_KEY)) {
      localStorage.setItem(BED_ASSIGNMENTS_KEY, JSON.stringify(INITIAL_BED_ASSIGNMENTS));
    }
    if (!localStorage.getItem(NURSING_OBS_KEY)) {
      localStorage.setItem(NURSING_OBS_KEY, JSON.stringify(INITIAL_NURSING_OBSERVATIONS));
    }
    if (!localStorage.getItem(BED_TRANSFERS_KEY)) {
      localStorage.setItem(BED_TRANSFERS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(LAB_TESTS_KEY)) {
      localStorage.setItem(LAB_TESTS_KEY, JSON.stringify(INITIAL_LAB_TESTS));
    }
    if (!localStorage.getItem(LAB_REQUESTS_KEY)) {
      localStorage.setItem(LAB_REQUESTS_KEY, JSON.stringify(INITIAL_LAB_REQUESTS));
    }
    if (!localStorage.getItem(MEDICINES_KEY)) {
      localStorage.setItem(MEDICINES_KEY, JSON.stringify(INITIAL_MEDICINES));
    }
    if (!localStorage.getItem(MEDICINE_BATCHES_KEY)) {
      localStorage.setItem(MEDICINE_BATCHES_KEY, JSON.stringify(INITIAL_MEDICINE_BATCHES));
    }
    if (!localStorage.getItem(INV_TRANSACTIONS_KEY)) {
      localStorage.setItem(INV_TRANSACTIONS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(PRESCRIPTIONS_KEY)) {
      localStorage.setItem(PRESCRIPTIONS_KEY, JSON.stringify(INITIAL_PRESCRIPTIONS));
    }
    if (!localStorage.getItem(DISPENSING_KEY)) {
      localStorage.setItem(DISPENSING_KEY, JSON.stringify(INITIAL_DISPENSING_RECORDS));
    }
    if (!localStorage.getItem(INVOICES_KEY)) {
      localStorage.setItem(INVOICES_KEY, JSON.stringify(INITIAL_INVOICES));
    }
    if (!localStorage.getItem(PAYMENTS_KEY)) {
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify(INITIAL_PAYMENTS));
    }
    if (!localStorage.getItem(REFUNDS_KEY)) {
      localStorage.setItem(REFUNDS_KEY, JSON.stringify(INITIAL_REFUNDS));
    }
    if (!localStorage.getItem(STAFF_KEY)) {
      localStorage.setItem(STAFF_KEY, JSON.stringify(INITIAL_STAFF));
    }
    if (!localStorage.getItem(ATTENDANCE_KEY)) {
      localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(INITIAL_ATTENDANCE));
    }
    if (!localStorage.getItem(LEAVES_KEY)) {
      localStorage.setItem(LEAVES_KEY, JSON.stringify(INITIAL_LEAVES));
    }
    if (!localStorage.getItem(NOTIFICATIONS_KEY)) {
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
  }

  // ============================================================================
  // PATIENT OPERATIONS
  // ============================================================================

  public getPatients(): Patient[] {
    return this.load<Patient[]>(PATIENTS_KEY, INITIAL_PATIENTS);
  }

  public getPatientById(id: string): Patient | undefined {
    return this.getPatients().find((p) => p.id === id || p.medicalRecordNumber === id);
  }

  public generateNextMrn(): string {
    const patients = this.getPatients();
    const currentYear = new Date().getFullYear();
    let maxSeq = 100;

    for (const p of patients) {
      const match = p.medicalRecordNumber.match(/MRN-(\d{4})-(\d+)/);
      if (match && parseInt(match[1], 10) === currentYear) {
        const seq = parseInt(match[2], 10);
        if (seq > maxSeq) maxSeq = seq;
      }
    }
    const nextSeq = String(maxSeq + 1).padStart(5, '0');
    return `MRN-${currentYear}-${nextSeq}`;
  }

  public checkDuplicatePatient(params: {
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    excludeId?: string;
  }): { isDuplicate: boolean; reason?: string; duplicatePatient?: Patient } {
    const patients = this.getPatients();
    const cleanPhone = params.phone ? params.phone.replace(/\D/g, '') : '';
    const cleanEmail = params.email ? params.email.trim().toLowerCase() : '';
    const cleanFirst = params.firstName ? params.firstName.trim().toLowerCase() : '';
    const cleanLast = params.lastName ? params.lastName.trim().toLowerCase() : '';

    for (const p of patients) {
      if (params.excludeId && p.id === params.excludeId) continue;

      // 1. Phone Match
      const pPhone = p.phone ? p.phone.replace(/\D/g, '') : '';
      const phoneMatches = Boolean(
        cleanPhone && pPhone && (
          cleanPhone.length >= 10 && pPhone.length >= 10
            ? cleanPhone.slice(-10) === pPhone.slice(-10)
            : cleanPhone === pPhone
        )
      );
      if (phoneMatches) {
        return {
          isDuplicate: true,
          reason: `A patient with contact phone ${params.phone} already exists (${p.firstName} ${p.lastName}, MRN: ${p.medicalRecordNumber}).`,
          duplicatePatient: p,
        };
      }

      // 2. Email Match
      if (cleanEmail && p.email && p.email.trim().toLowerCase() === cleanEmail) {
        return {
          isDuplicate: true,
          reason: `A patient with email address ${params.email} already exists (${p.firstName} ${p.lastName}, MRN: ${p.medicalRecordNumber}).`,
          duplicatePatient: p,
        };
      }

      // 3. Exact Full Name + Date of Birth Match
      if (
        cleanFirst &&
        cleanLast &&
        params.dateOfBirth &&
        p.firstName.trim().toLowerCase() === cleanFirst &&
        p.lastName.trim().toLowerCase() === cleanLast &&
        p.dateOfBirth === params.dateOfBirth
      ) {
        return {
          isDuplicate: true,
          reason: `A patient with identical name (${p.firstName} ${p.lastName}) and Date of Birth (${p.dateOfBirth}) is already registered (MRN: ${p.medicalRecordNumber}).`,
          duplicatePatient: p,
        };
      }
    }

    return { isDuplicate: false };
  }

  public createPatient(patientData: Omit<Patient, 'id' | 'medicalRecordNumber' | 'registrationDate'> & { medicalRecordNumber?: string }): Patient {
    const dup = this.checkDuplicatePatient({
      phone: patientData.phone,
      email: patientData.email,
      firstName: patientData.firstName,
      lastName: patientData.lastName,
      dateOfBirth: patientData.dateOfBirth,
    });

    if (dup.isDuplicate) {
      throw new Error(`Duplicate Patient Detected: ${dup.reason}`);
    }

    const mrn = patientData.medicalRecordNumber || this.generateNextMrn();
    const newId = `pat-${Date.now()}`;
    const newPatient: Patient = {
      ...patientData,
      id: newId,
      medicalRecordNumber: mrn,
      registrationDate: new Date().toISOString().split('T')[0],
      documents: patientData.documents || [],
      allergies: patientData.allergies || [],
      status: patientData.status || 'active',
    };

    const list = [newPatient, ...this.getPatients()];
    this.save(PATIENTS_KEY, list);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'receptionist',
      action: 'PATIENT_REGISTERED',
      targetTable: 'patients',
      recordId: newId,
      newValues: { mrn, name: `${newPatient.firstName} ${newPatient.lastName}`, phone: newPatient.phone },
    });

    return newPatient;
  }

  public updatePatient(id: string, updates: Partial<Patient>): Patient {
    const list = this.getPatients();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error(`Patient with ID ${id} not found.`);

    // If updating name, phone, email, or DOB, check duplicates excluding self
    if (updates.phone || updates.email || (updates.firstName && updates.lastName && updates.dateOfBirth)) {
      const dup = this.checkDuplicatePatient({
        phone: updates.phone || list[idx].phone,
        email: updates.email || list[idx].email,
        firstName: updates.firstName || list[idx].firstName,
        lastName: updates.lastName || list[idx].lastName,
        dateOfBirth: updates.dateOfBirth || list[idx].dateOfBirth,
        excludeId: id,
      });
      if (dup.isDuplicate) {
        throw new Error(`Cannot update patient: ${dup.reason}`);
      }
    }

    const updated: Patient = {
      ...list[idx],
      ...updates,
    };

    list[idx] = updated;
    this.save(PATIENTS_KEY, list);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'receptionist',
      action: 'PATIENT_UPDATED',
      targetTable: 'patients',
      recordId: id,
      newValues: updates,
    });

    return updated;
  }

  public archivePatient(id: string, reason?: string): Patient {
    return this.updatePatient(id, {
      status: 'archived',
      notes: reason ? `Archived: ${reason}` : undefined,
    });
  }

  public addPatientDocument(patientId: string, doc: Omit<PatientDocument, 'id' | 'uploadedAt'>): PatientDocument {
    const patient = this.getPatientById(patientId);
    if (!patient) throw new Error(`Patient ${patientId} not found.`);

    const newDoc: PatientDocument = {
      ...doc,
      id: `doc-pat-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };

    const existingDocs = patient.documents || [];
    this.updatePatient(patientId, {
      documents: [newDoc, ...existingDocs],
    });

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'staff',
      action: 'DOCUMENT_UPLOADED',
      targetTable: 'patients',
      recordId: patientId,
      newValues: { documentTitle: newDoc.title, category: newDoc.category },
    });

    return newDoc;
  }

  // ============================================================================
  // DEPARTMENT OPERATIONS
  // ============================================================================

  public getDepartments(): Department[] {
    return this.load<Department[]>(DEPARTMENTS_KEY, INITIAL_DEPARTMENTS);
  }

  public getDepartmentById(id: string): Department | undefined {
    return this.getDepartments().find((d) => d.id === id);
  }

  public createDepartment(deptData: Omit<Department, 'id'>): Department {
    const list = this.getDepartments();
    const existingCode = list.find((d) => d.code.toUpperCase() === deptData.code.toUpperCase());
    if (existingCode) {
      throw new Error(`Department with code ${deptData.code} already exists.`);
    }

    const newDept: Department = {
      ...deptData,
      id: `dept-${Date.now()}`,
      status: deptData.status || 'active',
    };

    this.save(DEPARTMENTS_KEY, [...list, newDept]);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'administrator',
      action: 'DEPARTMENT_CREATED',
      targetTable: 'departments',
      recordId: newDept.id,
      newValues: { name: newDept.name, code: newDept.code },
    });

    return newDept;
  }

  public updateDepartment(id: string, updates: Partial<Department>): Department {
    const list = this.getDepartments();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Department ${id} not found.`);

    const updated: Department = { ...list[idx], ...updates };
    list[idx] = updated;
    this.save(DEPARTMENTS_KEY, list);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'administrator',
      action: 'DEPARTMENT_UPDATED',
      targetTable: 'departments',
      recordId: id,
      newValues: updates,
    });

    return updated;
  }

  public deleteDepartment(id: string): { success: boolean } {
    const list = this.getDepartments();
    const dept = list.find((d) => d.id === id);
    if (!dept) throw new Error(`Department ${id} not found.`);

    // 1. Check doctors linked
    const doctors = this.getDoctors().filter((doc) => doc.departmentId === id || doc.department === dept.name);
    if (doctors.length > 0) {
      throw new Error(
        `Constraint Violation: Cannot delete department "${dept.name}" because ${doctors.length} physician(s) are assigned to it. Deactivate the department instead.`
      );
    }

    // 2. Check appointments linked
    const appointments = this.getAppointments().filter((apt) => apt.departmentId === id || apt.department === dept.name);
    if (appointments.length > 0) {
      throw new Error(
        `Constraint Violation: Cannot delete department "${dept.name}" because it is linked to ${appointments.length} historical appointment record(s). Deactivate instead.`
      );
    }

    // 3. Check OPD visits linked
    const opdVisits = this.getOutpatientVisits().filter((v) => v.departmentId === id || v.departmentName === dept.name);
    if (opdVisits.length > 0) {
      throw new Error(
        `Constraint Violation: Cannot delete department "${dept.name}" because it is linked to ${opdVisits.length} outpatient visit(s). Deactivate instead.`
      );
    }

    const filtered = list.filter((d) => d.id !== id);
    this.save(DEPARTMENTS_KEY, filtered);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'administrator',
      action: 'DEPARTMENT_DELETED',
      targetTable: 'departments',
      recordId: id,
      oldValues: { name: dept.name, code: dept.code },
    });

    return { success: true };
  }

  // ============================================================================
  // DOCTOR OPERATIONS
  // ============================================================================

  public getDoctors(): Doctor[] {
    return this.load<Doctor[]>(DOCTORS_KEY, INITIAL_DOCTORS);
  }

  public getDoctorById(id: string): Doctor | undefined {
    return this.getDoctors().find((d) => d.id === id);
  }

  public createDoctor(doctorData: Omit<Doctor, 'id'>): Doctor {
    const list = this.getDoctors();
    const existingLic = list.find((d) => d.licenseNumber.toUpperCase() === doctorData.licenseNumber.toUpperCase());
    if (existingLic) {
      throw new Error(`Doctor with license number ${doctorData.licenseNumber} already exists.`);
    }

    const newDoctor: Doctor = {
      ...doctorData,
      id: `doc-${Date.now()}`,
      status: doctorData.status || 'active',
      availabilityStatus: doctorData.availabilityStatus || 'available',
      availabilitySchedule: doctorData.availabilitySchedule || [],
      todayAppointmentsCount: 0,
    };

    this.save(DOCTORS_KEY, [...list, newDoctor]);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'administrator',
      action: 'DOCTOR_REGISTERED',
      targetTable: 'doctors',
      recordId: newDoctor.id,
      newValues: { name: newDoctor.fullName, license: newDoctor.licenseNumber, dept: newDoctor.department },
    });

    return newDoctor;
  }

  public updateDoctor(id: string, updates: Partial<Doctor>): Doctor {
    const list = this.getDoctors();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Doctor ${id} not found.`);

    const updated: Doctor = { ...list[idx], ...updates };
    list[idx] = updated;
    this.save(DOCTORS_KEY, list);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'administrator',
      action: 'DOCTOR_UPDATED',
      targetTable: 'doctors',
      recordId: id,
      newValues: updates,
    });

    return updated;
  }

  // ============================================================================
  // APPOINTMENT OPERATIONS (WITH CONCURRENCY & DOUBLE-BOOKING GUARDS)
  // ============================================================================

  public getAppointments(): Appointment[] {
    return this.load<Appointment[]>(APPOINTMENTS_KEY, INITIAL_APPOINTMENTS);
  }

  public getAppointmentById(id: string): Appointment | undefined {
    return this.getAppointments().find((a) => a.id === id || a.appointmentNumber === id);
  }

  /**
   * Concurrency Guard: Detects whether requested doctor slot overlaps with an existing
   * active consultation on the same date.
   */
  public checkDoctorSlotConflict(params: {
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    excludeAppointmentId?: string;
  }): { hasConflict: boolean; conflictingAppointment?: Appointment; reason?: string } {
    const appointments = this.getAppointments();

    const activeList = appointments.filter(
      (a) =>
        a.doctorId === params.doctorId &&
        a.date === params.date &&
        a.status !== 'Cancelled' &&
        a.status !== 'No Show' &&
        (!params.excludeAppointmentId || a.id !== params.excludeAppointmentId)
    );

    // Overlap condition: start1 < end2 && end1 > start2
    for (const apt of activeList) {
      if (params.startTime < apt.endTime && params.endTime > apt.startTime) {
        return {
          hasConflict: true,
          conflictingAppointment: apt,
          reason: `Doctor has a conflicting appointment (${apt.appointmentNumber}) from ${apt.startTime} to ${apt.endTime} for patient "${apt.patientName}".`,
        };
      }
    }

    return { hasConflict: false };
  }

  public bookAppointment(bookingData: {
    patientId: string;
    doctorId: string;
    departmentId?: string;
    date: string;
    startTime: string;
    endTime: string;
    visitReason: string;
    priority?: 'low' | 'normal' | 'urgent';
    type?: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
    notes?: string;
    bookingUserName?: string;
  }): Appointment {
    // 1. Verify Doctor
    const doctor = this.getDoctorById(bookingData.doctorId);
    if (!doctor) throw new Error(`Doctor ${bookingData.doctorId} not found.`);

    // 2. Verify Patient
    const patient = this.getPatientById(bookingData.patientId);
    if (!patient) throw new Error(`Patient ${bookingData.patientId} not found.`);

    // 3. Overlap / Double-Booking Concurrency Check
    const conflict = this.checkDoctorSlotConflict({
      doctorId: bookingData.doctorId,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
    });

    if (conflict.hasConflict) {
      throw new Error(`Double-Booking Conflict: ${conflict.reason}`);
    }

    // 4. Generate Appointment Number
    const existing = this.getAppointments();
    const apptNum = `APT-2026-${String(existing.length + 101).padStart(5, '0')}`;
    const newId = `apt-${Date.now()}`;

    const newAppointment: Appointment = {
      id: newId,
      appointmentNumber: apptNum,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMrn: patient.medicalRecordNumber,
      patientPhone: patient.phone,
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      departmentId: bookingData.departmentId || doctor.departmentId,
      department: doctor.department,
      date: bookingData.date,
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      scheduledAt: `${bookingData.date}T${bookingData.startTime}:00Z`,
      type: bookingData.type || 'consultation',
      priority: bookingData.priority || 'normal',
      visitReason: bookingData.visitReason,
      status: 'Scheduled',
      bookingUserName: bookingData.bookingUserName || 'Hospital Staff',
      notes: bookingData.notes,
    };

    this.save(APPOINTMENTS_KEY, [newAppointment, ...existing]);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'receptionist',
      action: 'APPOINTMENT_BOOKED',
      targetTable: 'appointments',
      recordId: newId,
      newValues: {
        appointmentNumber: apptNum,
        patient: newAppointment.patientName,
        doctor: newAppointment.doctorName,
        time: `${bookingData.date} ${bookingData.startTime}-${bookingData.endTime}`,
      },
    });

    return newAppointment;
  }

  public rescheduleAppointment(id: string, params: {
    date: string;
    startTime: string;
    endTime: string;
    reason?: string;
  }): Appointment {
    const list = this.getAppointments();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Appointment ${id} not found.`);

    const apt = list[idx];

    // Check slot conflict for the doctor on the new slot
    const conflict = this.checkDoctorSlotConflict({
      doctorId: apt.doctorId,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      excludeAppointmentId: id,
    });

    if (conflict.hasConflict) {
      throw new Error(`Cannot Reschedule: ${conflict.reason}`);
    }

    const updated: Appointment = {
      ...apt,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime,
      scheduledAt: `${params.date}T${params.startTime}:00Z`,
      notes: params.reason ? `${apt.notes ? apt.notes + ' | ' : ''}Rescheduled: ${params.reason}` : apt.notes,
    };

    list[idx] = updated;
    this.save(APPOINTMENTS_KEY, list);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'receptionist',
      action: 'APPOINTMENT_RESCHEDULED',
      targetTable: 'appointments',
      recordId: id,
      newValues: { newDate: params.date, newTime: `${params.startTime}-${params.endTime}`, reason: params.reason },
    });

    return updated;
  }

  public updateAppointmentStatus(id: string, status: AppointmentStatus, metadata?: {
    cancellationReason?: string;
    checkInTime?: string;
    completedTime?: string;
    clinicalNotes?: string;
  }): Appointment {
    const list = this.getAppointments();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error(`Appointment ${id} not found.`);

    if (status === 'Cancelled' && (!metadata?.cancellationReason || metadata.cancellationReason.trim().length < 3)) {
      throw new Error('A cancellation reason is strictly required when cancelling an appointment.');
    }

    const updated: Appointment = {
      ...list[idx],
      status,
      cancellationReason: metadata?.cancellationReason || list[idx].cancellationReason,
      checkInTime: metadata?.checkInTime || (status === 'Checked In' ? new Date().toISOString() : list[idx].checkInTime),
      completedTime: metadata?.completedTime || (status === 'Completed' ? new Date().toISOString() : list[idx].completedTime),
      clinicalNotes: metadata?.clinicalNotes || list[idx].clinicalNotes,
    };

    list[idx] = updated;
    this.save(APPOINTMENTS_KEY, list);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'staff',
      action: `APPOINTMENT_STATUS_${status.toUpperCase().replace(/\s+/g, '_')}`,
      targetTable: 'appointments',
      recordId: id,
      newValues: { status, reason: metadata?.cancellationReason },
    });

    return updated;
  }

  // ============================================================================
  // MEDICAL RECORDS (EMR / EHR) WITH IMMUTABLE AMENDMENT ENFORCEMENT
  // ============================================================================

  public getMedicalRecords(): MedicalRecord[] {
    return this.load<MedicalRecord[]>(RECORDS_KEY, INITIAL_MEDICAL_RECORDS);
  }

  public getMedicalRecordById(id: string): MedicalRecord | undefined {
    return this.getMedicalRecords().find((r) => r.id === id || r.recordNumber === id);
  }

  public createMedicalRecord(data: Omit<MedicalRecord, 'id' | 'recordNumber' | 'createdAt' | 'updatedAt' | 'amendments'>): MedicalRecord {
    const list = this.getMedicalRecords();
    const recNumber = `REC-2026-${String(list.length + 441).padStart(5, '0')}`;
    const newId = `rec-${Date.now()}`;
    const now = new Date().toISOString();

    const newRecord: MedicalRecord = {
      ...data,
      id: newId,
      recordNumber: recNumber,
      amendments: [],
      createdAt: now,
      updatedAt: now,
    };

    this.save(RECORDS_KEY, [newRecord, ...list]);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'doctor',
      action: 'MEDICAL_RECORD_CREATED',
      targetTable: 'medical_records',
      recordId: newId,
      newValues: {
        recordNumber: recNumber,
        patientMrn: newRecord.patientMrn,
        diagnosis: newRecord.diagnosisTitle,
      },
    });

    return newRecord;
  }

  /**
   * Digitally signs a medical record by an authorized physician.
   * Once signed, notes cannot be silently altered.
   */
  public signMedicalRecord(id: string, doctorId: string, doctorName: string): MedicalRecord {
    const list = this.getMedicalRecords();
    const idx = list.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error(`Medical record ${id} not found.`);

    if (list[idx].isSigned) {
      throw new Error('This medical record has already been digitally signed and sealed.');
    }

    const now = new Date().toISOString();
    const updated: MedicalRecord = {
      ...list[idx],
      isSigned: true,
      signedAt: now,
      signedByDoctorId: doctorId,
      signedByDoctorName: doctorName,
      updatedAt: now,
    };

    list[idx] = updated;
    this.save(RECORDS_KEY, list);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'doctor',
      action: 'MEDICAL_RECORD_DIGITALLY_SIGNED',
      targetTable: 'medical_records',
      recordId: id,
      newValues: { signedBy: doctorName, signedAt: now },
    });

    return updated;
  }

  /**
   * Enforces Signed Record Immutability:
   * Adds an immutable clinical amendment to a signed chart without overwriting original historical notes.
   */
  public amendMedicalRecord(params: {
    recordId: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    amendmentReason: string;
    newNotes: string;
  }): MedicalRecord {
    const list = this.getMedicalRecords();
    const idx = list.findIndex((r) => r.id === params.recordId);
    if (idx === -1) throw new Error(`Medical record ${params.recordId} not found.`);

    const record = list[idx];
    const now = new Date().toISOString();

    const amendment: MedicalRecordAmendment = {
      id: `amend-${Date.now()}`,
      recordId: params.recordId,
      amendedAt: now,
      authorId: params.authorId,
      authorName: params.authorName,
      authorRole: params.authorRole,
      amendmentReason: params.amendmentReason,
      previousNotes: record.clinicalNotes,
      newNotes: params.newNotes,
    };

    const updated: MedicalRecord = {
      ...record,
      clinicalNotes: `${record.clinicalNotes}\n\n[AMENDMENT - ${now.split('T')[0]} by ${params.authorName} (${params.authorRole})]:\nReason: ${params.amendmentReason}\n${params.newNotes}`,
      amendments: [amendment, ...(record.amendments || [])],
      updatedAt: now,
    };

    list[idx] = updated;
    this.save(RECORDS_KEY, list);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: params.authorRole,
      action: 'MEDICAL_RECORD_AMENDED',
      targetTable: 'medical_record_amendments',
      recordId: amendment.id,
      newValues: {
        recordId: params.recordId,
        author: params.authorName,
        reason: params.amendmentReason,
      },
    });

    return updated;
  }

  // ============================================================================
  // OUTPATIENT MANAGEMENT (OPD 11-STEP WORKFLOW)
  // ============================================================================

  public getOutpatientVisits(): OutpatientVisit[] {
    return this.load<OutpatientVisit[]>(OPD_KEY, INITIAL_OPD_VISITS);
  }

  public getOutpatientVisitById(id: string): OutpatientVisit | undefined {
    return this.getOutpatientVisits().find((v) => v.id === id || v.visitNumber === id);
  }

  public createOutpatientVisit(data: {
    patientId: string;
    doctorId: string;
    departmentId: string;
    appointmentId?: string;
    priority?: 'Routine' | 'Urgent' | 'STAT';
    isWalkIn?: boolean;
    chiefComplaint?: string;
  }): OutpatientVisit {
    const patient = this.getPatientById(data.patientId);
    if (!patient) throw new Error(`Patient ${data.patientId} not found.`);

    const doctor = this.getDoctorById(data.doctorId);
    if (!doctor) throw new Error(`Doctor ${data.doctorId} not found.`);

    const dept = this.getDepartmentById(data.departmentId);
    const deptName = dept ? dept.name : doctor.department;

    const list = this.getOutpatientVisits();
    const tokenNum = `T-${101 + list.length}`;
    const visitNum = `OPD-2026-${String(list.length + 1041).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const newVisit: OutpatientVisit = {
      id: `opd-${Date.now()}`,
      visitNumber: visitNum,
      queueToken: tokenNum,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMrn: patient.medicalRecordNumber,
      appointmentId: data.appointmentId,
      doctorId: doctor.id,
      doctorName: doctor.fullName,
      departmentId: data.departmentId,
      departmentName: deptName,
      checkInTime: now,
      status: 'Registered',
      priority: data.priority || 'Routine',
      isWalkIn: data.isWalkIn ?? true,
      chiefComplaint: data.chiefComplaint,
      consultationFee: doctor.consultationFee || 100,
      createdAt: now,
      updatedAt: now,
    };

    this.save(OPD_KEY, [newVisit, ...list]);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'receptionist',
      action: 'OUTPATIENT_VISIT_REGISTERED',
      targetTable: 'outpatient_visits',
      recordId: newVisit.id,
      newValues: { visitNumber: visitNum, token: tokenNum, patient: newVisit.patientName },
    });

    return newVisit;
  }

  public updateOutpatientVisit(id: string, updates: Partial<OutpatientVisit>): OutpatientVisit {
    const list = this.getOutpatientVisits();
    const idx = list.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error(`Outpatient visit ${id} not found.`);

    const now = new Date().toISOString();
    const updated: OutpatientVisit = {
      ...list[idx],
      ...updates,
      updatedAt: now,
      completedAt: updates.status === 'Completed' ? (updates.completedAt || now) : list[idx].completedAt,
    };

    list[idx] = updated;
    this.save(OPD_KEY, list);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'staff',
      action: `OUTPATIENT_VISIT_${updates.status ? updates.status.toUpperCase().replace(/\s+/g, '_') : 'UPDATED'}`,
      targetTable: 'outpatient_visits',
      recordId: id,
      newValues: updates,
    });

    return updated;
  }

  // ============================================================================
  // INPATIENT MANAGEMENT (IPD) OPERATIONS
  // ============================================================================

  public getWards(): Ward[] {
    return this.load<Ward[]>(WARDS_KEY, INITIAL_WARDS);
  }

  public getBeds(wardId?: string): Bed[] {
    const beds = this.load<Bed[]>(BEDS_KEY, INITIAL_BEDS);
    if (wardId) return beds.filter((b) => b.wardId === wardId);
    return beds;
  }

  public getBedById(id: string): Bed | undefined {
    return this.getBeds().find((b) => b.id === id || b.bedNumber === id);
  }

  public getAdmissions(): Admission[] {
    return this.load<Admission[]>(ADMISSIONS_KEY, INITIAL_ADMISSIONS);
  }

  public getAdmissionById(id: string): Admission | undefined {
    return this.getAdmissions().find((a) => a.id === id || a.admissionNumber === id);
  }

  public getBedAssignments(admissionId?: string): BedAssignment[] {
    const list = this.load<BedAssignment[]>(BED_ASSIGNMENTS_KEY, INITIAL_BED_ASSIGNMENTS);
    if (admissionId) return list.filter((ba) => ba.admissionId === admissionId);
    return list;
  }

  public getNursingObservations(admissionId: string): NursingObservation[] {
    const list = this.load<NursingObservation[]>(NURSING_OBS_KEY, INITIAL_NURSING_OBSERVATIONS);
    return list.filter((obs) => obs.admissionId === admissionId);
  }

  public getBedTransfers(admissionId?: string): BedTransfer[] {
    const list = this.load<BedTransfer[]>(BED_TRANSFERS_KEY, []);
    if (admissionId) return list.filter((bt) => bt.admissionId === admissionId);
    return list;
  }

  public admitPatient(data: {
    patientId: string;
    attendingDoctorId: string;
    departmentId: string;
    wardId: string;
    bedId: string;
    admissionDate: string;
    admissionReason: string;
    dailyRate: number;
    expectedDischargeDate?: string;
    diagnosis?: string;
    assignedBy?: string;
  }): Admission {
    // 1. Bed Occupancy Concurrency Check
    const beds = this.getBeds();
    const bedIdx = beds.findIndex((b) => b.id === data.bedId);
    if (bedIdx === -1) throw new Error('Selected bed does not exist.');

    const targetBed = beds[bedIdx];
    if (targetBed.status === 'occupied') {
      throw new Error(`Concurrency Conflict: Bed ${targetBed.bedNumber} is currently occupied and cannot be allocated.`);
    }

    const patient = this.getPatientById(data.patientId);
    if (!patient) throw new Error('Patient record not found.');

    const doctor = this.getDoctorById(data.attendingDoctorId);
    const department = this.getDepartmentById(data.departmentId);
    const ward = this.getWards().find((w) => w.id === data.wardId);

    const now = new Date().toISOString();
    const admissionCount = this.getAdmissions().length + 1;
    const admissionNumber = `ADM-${new Date().getFullYear()}-${String(admissionCount).padStart(4, '0')}`;
    const admissionId = `adm-${Date.now()}`;

    const newAdmission: Admission = {
      id: admissionId,
      admissionNumber,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMrn: patient.medicalRecordNumber,
      attendingDoctorId: data.attendingDoctorId,
      attendingDoctorName: doctor ? doctor.fullName : 'Attending Physician',
      departmentId: data.departmentId,
      departmentName: department ? department.name : 'Inpatient Ward',
      wardId: data.wardId,
      wardName: ward ? ward.name : targetBed.wardName,
      bedId: targetBed.id,
      bedNumber: targetBed.bedNumber,
      dailyRate: data.dailyRate || targetBed.dailyRate,
      admissionDate: data.admissionDate,
      admissionReason: data.admissionReason,
      diagnosis: data.diagnosis,
      status: 'admitted',
      expectedDischargeDate: data.expectedDischargeDate,
      createdAt: now,
      updatedAt: now,
    };

    // 2. Mark Bed Occupied
    beds[bedIdx] = {
      ...targetBed,
      status: 'occupied',
      currentPatientId: patient.id,
      currentPatientName: `${patient.firstName} ${patient.lastName}`,
      currentAdmissionId: admissionId,
    };
    this.save(BEDS_KEY, beds);

    // 3. Save Admission Record
    const admissions = this.getAdmissions();
    admissions.unshift(newAdmission);
    this.save(ADMISSIONS_KEY, admissions);

    // 4. Record Bed Assignment History
    const bedAssignments = this.getBedAssignments();
    bedAssignments.unshift({
      id: `ba-${Date.now()}`,
      admissionId,
      patientId: patient.id,
      bedId: targetBed.id,
      bedNumber: targetBed.bedNumber,
      wardId: data.wardId,
      wardName: ward ? ward.name : targetBed.wardName,
      assignedAt: now,
      reason: data.admissionReason,
      assignedBy: data.assignedBy || 'Admitting Staff',
    });
    this.save(BED_ASSIGNMENTS_KEY, bedAssignments);

    // 5. Update Patient status to 'admitted'
    this.updatePatient(patient.id, { status: 'admitted' });

    // 6. Automatically open an Inpatient Invoice
    this.createInvoice({
      patientId: patient.id,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      notes: `Inpatient Admission #${admissionNumber} - Daily Room & Board Rate: $${newAdmission.dailyRate}/day`,
      admissionId,
      items: [
        {
          serviceType: 'admission',
          description: `Inpatient Admission Initial Deposit & Room Allocation (${targetBed.bedNumber})`,
          referenceType: 'admission',
          referenceId: admissionId,
          unitPrice: newAdmission.dailyRate,
          quantity: 1,
        },
      ],
      createdBy: 'system',
      createdByName: 'Admissions Automation',
    });

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'admissions',
      action: 'INPATIENT_ADMISSION_CREATED',
      targetTable: 'admissions',
      recordId: admissionId,
      newValues: {
        admissionNumber,
        patient: newAdmission.patientName,
        bed: targetBed.bedNumber,
        ward: newAdmission.wardName,
      },
    });

    return newAdmission;
  }

  public transferBed(
    admissionId: string,
    toWardId: string,
    toBedId: string,
    reason: string,
    authorizedBy: string
  ): BedTransfer {
    const admission = this.getAdmissionById(admissionId);
    if (!admission || admission.status !== 'admitted') {
      throw new Error('Active admission record not found.');
    }

    const beds = this.getBeds();
    const targetBedIdx = beds.findIndex((b) => b.id === toBedId);
    if (targetBedIdx === -1) throw new Error('Target bed does not exist.');

    const targetBed = beds[targetBedIdx];
    if (targetBed.status === 'occupied') {
      throw new Error(`Concurrency Conflict: Destination bed ${targetBed.bedNumber} is currently occupied.`);
    }

    const currentBedIdx = beds.findIndex((b) => b.id === admission.bedId);
    const wards = this.getWards();
    const toWard = wards.find((w) => w.id === toWardId);

    const now = new Date().toISOString();

    // 1. Release Current Bed
    if (currentBedIdx !== -1) {
      beds[currentBedIdx] = {
        ...beds[currentBedIdx],
        status: 'available',
        currentPatientId: undefined,
        currentPatientName: undefined,
        currentAdmissionId: undefined,
      };
    }

    // 2. Allocate Target Bed
    beds[targetBedIdx] = {
      ...targetBed,
      status: 'occupied',
      currentPatientId: admission.patientId,
      currentPatientName: admission.patientName,
      currentAdmissionId: admission.id,
    };
    this.save(BEDS_KEY, beds);

    // 3. Log Bed Transfer History
    const transfer: BedTransfer = {
      id: `bt-${Date.now()}`,
      admissionId,
      patientId: admission.patientId,
      patientName: admission.patientName,
      fromWardId: admission.wardId,
      fromWardName: admission.wardName,
      fromBedId: admission.bedId,
      fromBedNumber: admission.bedNumber,
      toWardId,
      toWardName: toWard ? toWard.name : targetBed.wardName,
      toBedId,
      toBedNumber: targetBed.bedNumber,
      transferDate: now,
      transferReason: reason,
      authorizedBy,
    };

    const transfers = this.getBedTransfers();
    transfers.unshift(transfer);
    this.save(BED_TRANSFERS_KEY, transfers);

    // 4. Update Bed Assignments
    const bedAssignments = this.getBedAssignments();
    const activeBA = bedAssignments.find((ba) => ba.admissionId === admissionId && !ba.releasedAt);
    if (activeBA) {
      activeBA.releasedAt = now;
    }
    bedAssignments.unshift({
      id: `ba-${Date.now()}`,
      admissionId,
      patientId: admission.patientId,
      bedId: targetBed.id,
      bedNumber: targetBed.bedNumber,
      wardId: toWardId,
      wardName: toWard ? toWard.name : targetBed.wardName,
      assignedAt: now,
      reason: `Transfer: ${reason}`,
      assignedBy: authorizedBy,
    });
    this.save(BED_ASSIGNMENTS_KEY, bedAssignments);

    // 5. Update Admission
    const admissions = this.getAdmissions();
    const admIdx = admissions.findIndex((a) => a.id === admissionId);
    if (admIdx !== -1) {
      admissions[admIdx] = {
        ...admissions[admIdx],
        wardId: toWardId,
        wardName: toWard ? toWard.name : targetBed.wardName,
        bedId: targetBed.id,
        bedNumber: targetBed.bedNumber,
        dailyRate: targetBed.dailyRate,
        updatedAt: now,
      };
      this.save(ADMISSIONS_KEY, admissions);
    }

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'nurse',
      action: 'INPATIENT_BED_TRANSFERRED',
      targetTable: 'bed_assignments',
      recordId: admissionId,
      newValues: {
        fromBed: transfer.fromBedNumber,
        toBed: transfer.toBedNumber,
        reason,
      },
    });

    return transfer;
  }

  public addNursingObservation(data: {
    admissionId: string;
    patientId: string;
    nurseId: string;
    nurseName: string;
    vitals: VitalSigns;
    painScore: number;
    consciousness: 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive';
    notes: string;
    fluidsIntakeMl?: number;
    fluidsOutputMl?: number;
  }): NursingObservation {
    const obs: NursingObservation = {
      id: `obs-${Date.now()}`,
      admissionId: data.admissionId,
      patientId: data.patientId,
      nurseId: data.nurseId,
      nurseName: data.nurseName,
      recordedAt: new Date().toISOString(),
      vitals: data.vitals,
      painScore: data.painScore,
      consciousness: data.consciousness,
      notes: data.notes,
      fluidsIntakeMl: data.fluidsIntakeMl,
      fluidsOutputMl: data.fluidsOutputMl,
    };

    const observations = this.load<NursingObservation[]>(NURSING_OBS_KEY, INITIAL_NURSING_OBSERVATIONS);
    observations.unshift(obs);
    this.save(NURSING_OBS_KEY, observations);

    return obs;
  }

  public dischargePatient(data: {
    admissionId: string;
    dischargingDoctorId: string;
    dischargingDoctorName: string;
    conditionAtDischarge: 'recovered' | 'improved' | 'unchanged' | 'critical' | 'transferred_out' | 'deceased';
    dischargeDiagnosis: string;
    dischargeInstructions: string;
    dischargeMedications: string;
    followUpDate?: string;
    followUpInstructions?: string;
  }): Admission {
    const admissions = this.getAdmissions();
    const idx = admissions.findIndex((a) => a.id === data.admissionId);
    if (idx === -1) throw new Error('Admission record not found.');

    const admission = admissions[idx];
    const now = new Date().toISOString();
    const actualDischargeDate = now.slice(0, 10);

    // 1. Release Bed
    const beds = this.getBeds();
    const bedIdx = beds.findIndex((b) => b.id === admission.bedId);
    if (bedIdx !== -1) {
      beds[bedIdx] = {
        ...beds[bedIdx],
        status: 'available',
        currentPatientId: undefined,
        currentPatientName: undefined,
        currentAdmissionId: undefined,
      };
      this.save(BEDS_KEY, beds);
    }

    // 2. Close Bed Assignment
    const bedAssignments = this.getBedAssignments();
    const activeBA = bedAssignments.find((ba) => ba.admissionId === admission.id && !ba.releasedAt);
    if (activeBA) {
      activeBA.releasedAt = now;
      this.save(BED_ASSIGNMENTS_KEY, bedAssignments);
    }

    // 3. Prepare Discharge Summary
    const dischargeSummary: DischargeSummary = {
      id: `ds-${Date.now()}`,
      admissionId: admission.id,
      dischargedAt: now,
      dischargingDoctorId: data.dischargingDoctorId,
      dischargingDoctorName: data.dischargingDoctorName,
      conditionAtDischarge: data.conditionAtDischarge,
      dischargeDiagnosis: data.dischargeDiagnosis,
      dischargeInstructions: data.dischargeInstructions,
      dischargeMedications: data.dischargeMedications,
      followUpDate: data.followUpDate,
      followUpInstructions: data.followUpInstructions,
    };

    const updatedAdmission: Admission = {
      ...admission,
      status: 'discharged',
      actualDischargeDate,
      dischargeSummary,
      updatedAt: now,
    };

    admissions[idx] = updatedAdmission;
    this.save(ADMISSIONS_KEY, admissions);

    // 4. Update Patient status to 'discharged'
    this.updatePatient(admission.patientId, { status: 'discharged' });

    // 5. Finalize Inpatient Charges (Calculate stay duration)
    const admTime = new Date(admission.admissionDate).getTime();
    const disTime = new Date(actualDischargeDate).getTime();
    const daysStayed = Math.max(1, Math.ceil((disTime - admTime) / (1000 * 60 * 60 * 24)));
    const totalRoomCharge = daysStayed * admission.dailyRate;

    // Check if an existing invoice exists for this admission
    const invoices = this.getInvoices(admission.patientId);
    const existingInvoice = invoices.find((inv) => inv.admissionId === admission.id);
    if (existingInvoice) {
      this.addInvoiceItem(existingInvoice.id, {
        serviceType: 'admission',
        description: `Inpatient Daily Room & Board (${admission.wardName} - ${admission.bedNumber}, ${daysStayed} Days)`,
        referenceType: 'admission',
        referenceId: admission.id,
        unitPrice: admission.dailyRate,
        quantity: Math.max(1, daysStayed - 1), // Day 1 was charged on deposit
      });
    }

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'doctor',
      action: 'INPATIENT_DISCHARGED',
      targetTable: 'admissions',
      recordId: admission.id,
      newValues: {
        admissionNumber: admission.admissionNumber,
        patient: admission.patientName,
        daysStayed,
        condition: data.conditionAtDischarge,
      },
    });

    return updatedAdmission;
  }

  // ============================================================================
  // LABORATORY MANAGEMENT (LIS) OPERATIONS
  // ============================================================================

  public getLabTests(): LabTest[] {
    return this.load<LabTest[]>(LAB_TESTS_KEY, INITIAL_LAB_TESTS);
  }

  public getLabRequests(): LabRequest[] {
    return this.load<LabRequest[]>(LAB_REQUESTS_KEY, INITIAL_LAB_REQUESTS);
  }

  public getLabRequestById(id: string): LabRequest | undefined {
    return this.getLabRequests().find((r) => r.id === id || r.requestNumber === id);
  }

  public requestLabTest(data: {
    patientId: string;
    doctorId: string;
    testId: string;
    priority: 'Routine' | 'Urgent' | 'STAT';
    clinicalNotes?: string;
    medicalRecordId?: string;
    visitId?: string;
  }): LabRequest {
    const patient = this.getPatientById(data.patientId);
    if (!patient) throw new Error('Patient record not found.');

    const doctor = this.getDoctorById(data.doctorId);
    const test = this.getLabTests().find((t) => t.id === data.testId);
    if (!test) throw new Error('Selected laboratory diagnostic test does not exist.');

    const now = new Date().toISOString();
    const count = this.getLabRequests().length + 1;
    const requestNumber = `LRQ-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const requestId = `lrq-${Date.now()}`;

    const newRequest: LabRequest = {
      id: requestId,
      requestNumber,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMrn: patient.medicalRecordNumber,
      doctorId: data.doctorId,
      doctorName: doctor ? doctor.fullName : 'Ordering Physician',
      medicalRecordId: data.medicalRecordId,
      visitId: data.visitId,
      testId: test.id,
      testCode: test.testCode,
      testName: test.name,
      category: test.category,
      priority: data.priority,
      status: 'requested',
      clinicalNotes: data.clinicalNotes,
      billedAmount: test.price,
      createdAt: now,
      updatedAt: now,
    };

    const requests = this.getLabRequests();
    requests.unshift(newRequest);
    this.save(LAB_REQUESTS_KEY, requests);

    // Add Lab Service Charge to Patient Invoice
    const invoices = this.getInvoices(patient.id);
    const unpaidInvoice = invoices.find((i) => i.status === 'unpaid' || i.status === 'partially_paid');
    if (unpaidInvoice) {
      this.addInvoiceItem(unpaidInvoice.id, {
        serviceType: 'laboratory',
        description: `Diagnostic Test: ${test.name} (${test.testCode})`,
        referenceType: 'lab_request',
        referenceId: requestId,
        unitPrice: test.price,
        quantity: 1,
      });
      newRequest.invoiceId = unpaidInvoice.id;
    }

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'doctor',
      action: 'LAB_TEST_REQUESTED',
      targetTable: 'laboratory_requests',
      recordId: requestId,
      newValues: { requestNumber, test: test.name, patient: newRequest.patientName },
    });

    return newRequest;
  }

  public collectLabSample(
    requestId: string,
    data: { sampleType: string; collectorName: string; collectorNotes?: string }
  ): LabRequest {
    const requests = this.getLabRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error('Laboratory request not found.');

    const now = new Date().toISOString();
    const sampleBarcode = `SMP-${Math.floor(10000 + Math.random() * 90000)}`;

    const updated: LabRequest = {
      ...requests[idx],
      status: 'sample_collected',
      sampleBarcode,
      sampleType: data.sampleType,
      sampleCollectedAt: now,
      sampleCollectedBy: data.collectorName,
      updatedAt: now,
    };

    requests[idx] = updated;
    this.save(LAB_REQUESTS_KEY, requests);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'laboratory_staff',
      action: 'LAB_SAMPLE_COLLECTED',
      targetTable: 'laboratory_requests',
      recordId: requestId,
      newValues: { barcode: sampleBarcode, sampleType: data.sampleType },
    });

    return updated;
  }

  public enterLabResults(
    requestId: string,
    data: {
      resultItems: LabResultItem[];
      interpretation?: string;
      isPanicValue?: boolean;
      enteredBy: string;
    }
  ): LabRequest {
    const requests = this.getLabRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error('Laboratory request not found.');

    const now = new Date().toISOString();
    const hasPanic = data.isPanicValue || data.resultItems.some((item) => item.flag === 'critical');

    const updated: LabRequest = {
      ...requests[idx],
      status: 'results_entered',
      resultItems: data.resultItems,
      interpretation: data.interpretation,
      isPanicValue: hasPanic,
      resultsEnteredAt: now,
      resultsEnteredBy: data.enteredBy,
      updatedAt: now,
    };

    requests[idx] = updated;
    this.save(LAB_REQUESTS_KEY, requests);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'laboratory_staff',
      action: 'LAB_RESULTS_ENTERED',
      targetTable: 'laboratory_requests',
      recordId: requestId,
      newValues: {
        requestNumber: updated.requestNumber,
        itemsCount: data.resultItems.length,
        isPanic: hasPanic,
      },
    });

    return updated;
  }

  public verifyLabResults(
    requestId: string,
    data: {
      verifiedBy: string;
      verifiedByName: string;
      verifiedByRole: string;
      verificationNotes?: string;
    }
  ): LabRequest {
    const requests = this.getLabRequests();
    const idx = requests.findIndex((r) => r.id === requestId);
    if (idx === -1) throw new Error('Laboratory request not found.');

    if (!requests[idx].resultItems || requests[idx].resultItems?.length === 0) {
      throw new Error('Cannot verify laboratory test without entered result parameters.');
    }

    const now = new Date().toISOString();
    const updated: LabRequest = {
      ...requests[idx],
      status: 'verified',
      verifiedAt: now,
      verifiedBy: data.verifiedBy,
      verifiedByName: data.verifiedByName,
      verifiedByRole: data.verifiedByRole,
      verificationNotes: data.verificationNotes,
      updatedAt: now,
    };

    requests[idx] = updated;
    this.save(LAB_REQUESTS_KEY, requests);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: data.verifiedByRole,
      action: 'LAB_RESULTS_VERIFIED',
      targetTable: 'laboratory_requests',
      recordId: requestId,
      newValues: {
        requestNumber: updated.requestNumber,
        verifier: data.verifiedByName,
      },
    });

    return updated;
  }

  public getLabReport(requestId: string): { request: LabRequest; isPreliminary: boolean } {
    const request = this.getLabRequestById(requestId);
    if (!request) throw new Error('Laboratory request not found.');
    return {
      request,
      isPreliminary: request.status !== 'verified',
    };
  }

  // ============================================================================
  // PHARMACY & INVENTORY MANAGEMENT OPERATIONS
  // ============================================================================

  public getMedicines(): Medicine[] {
    return this.load<Medicine[]>(MEDICINES_KEY, INITIAL_MEDICINES);
  }

  public getMedicineBatches(medicineId?: string): MedicineBatch[] {
    const batches = this.load<MedicineBatch[]>(MEDICINE_BATCHES_KEY, INITIAL_MEDICINE_BATCHES);
    if (medicineId) return batches.filter((b) => b.medicineId === medicineId);
    return batches;
  }

  public getInventoryTransactions(): InventoryTransaction[] {
    return this.load<InventoryTransaction[]>(INV_TRANSACTIONS_KEY, []);
  }

  public getPrescriptions(patientId?: string): Prescription[] {
    const rx = this.load<Prescription[]>(PRESCRIPTIONS_KEY, INITIAL_PRESCRIPTIONS);
    if (patientId) return rx.filter((r) => r.patientId === patientId);
    return rx;
  }

  public getPrescriptionById(id: string): Prescription | undefined {
    return this.getPrescriptions().find((r) => r.id === id || r.prescriptionNumber === id);
  }

  public getDispensingRecords(): DispensingRecord[] {
    return this.load<DispensingRecord[]>(DISPENSING_KEY, INITIAL_DISPENSING_RECORDS);
  }

  public addMedicine(data: Omit<Medicine, 'id'>): Medicine {
    const medicines = this.getMedicines();
    if (medicines.some((m) => m.skuCode.toLowerCase() === data.skuCode.toLowerCase())) {
      throw new Error(`A medicine with SKU ${data.skuCode} already exists in the formulary.`);
    }

    const newMed: Medicine = {
      ...data,
      id: `med-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    medicines.push(newMed);
    this.save(MEDICINES_KEY, medicines);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'pharmacist',
      action: 'MEDICINE_REGISTERED',
      targetTable: 'medicines',
      recordId: newMed.id,
      newValues: { sku: newMed.skuCode, name: newMed.brandName },
    });

    return newMed;
  }

  public updateMedicine(id: string, updates: Partial<Medicine>): Medicine {
    const medicines = this.getMedicines();
    const idx = medicines.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Medicine not found in formulary.');

    const updated = {
      ...medicines[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    medicines[idx] = updated;
    this.save(MEDICINES_KEY, medicines);
    return updated;
  }

  public receiveMedicineBatch(data: {
    medicineId: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    unitCost: number;
    supplier: string;
    receivedBy: string;
    receivedByName: string;
  }): MedicineBatch {
    const medicines = this.getMedicines();
    const medIdx = medicines.findIndex((m) => m.id === data.medicineId);
    if (medIdx === -1) throw new Error('Target medicine not found.');

    const batches = this.getMedicineBatches();
    const existing = batches.find(
      (b) => b.medicineId === data.medicineId && b.batchNumber.toLowerCase() === data.batchNumber.toLowerCase()
    );
    if (existing) {
      throw new Error(`Batch number ${data.batchNumber} already exists for this medication.`);
    }

    const now = new Date().toISOString();
    const newBatch: MedicineBatch = {
      id: `batch-${Date.now()}`,
      medicineId: data.medicineId,
      medicineName: medicines[medIdx].brandName,
      skuCode: medicines[medIdx].skuCode,
      batchNumber: data.batchNumber,
      expiryDate: data.expiryDate,
      quantityAvailable: data.quantity,
      initialQuantity: data.quantity,
      unitCost: data.unitCost,
      receivedDate: now.slice(0, 10),
      supplier: data.supplier,
      status: 'active',
    };

    batches.push(newBatch);
    this.save(MEDICINE_BATCHES_KEY, batches);

    // Increase total medicine stock
    const newStock = medicines[medIdx].stockQuantity + data.quantity;
    medicines[medIdx] = {
      ...medicines[medIdx],
      stockQuantity: newStock,
      updatedAt: now,
    };
    this.save(MEDICINES_KEY, medicines);

    // Log Inventory Transaction
    const txList = this.getInventoryTransactions();
    txList.unshift({
      id: `tx-${Date.now()}`,
      medicineId: data.medicineId,
      medicineName: medicines[medIdx].brandName,
      batchId: newBatch.id,
      batchNumber: newBatch.batchNumber,
      transactionType: 'receipt',
      quantity: data.quantity,
      balanceAfter: newStock,
      unitPrice: data.unitCost,
      referenceType: 'purchase_order',
      reason: `Batch Receipt from ${data.supplier}`,
      performedBy: data.receivedBy,
      performedByName: data.receivedByName,
      timestamp: now,
    });
    this.save(INV_TRANSACTIONS_KEY, txList);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'pharmacist',
      action: 'PHARMACY_STOCK_RECEIVED',
      targetTable: 'medicine_batches',
      recordId: newBatch.id,
      newValues: {
        batch: newBatch.batchNumber,
        qty: data.quantity,
        med: medicines[medIdx].brandName,
      },
    });

    return newBatch;
  }

  public adjustMedicineStock(data: {
    medicineId: string;
    batchId?: string;
    adjustmentType: 'adjustment' | 'return' | 'disposal';
    quantity: number;
    reason: string;
    performedBy: string;
    performedByName: string;
  }): InventoryTransaction {
    const medicines = this.getMedicines();
    const medIdx = medicines.findIndex((m) => m.id === data.medicineId);
    if (medIdx === -1) throw new Error('Target medicine not found.');

    const newStock = medicines[medIdx].stockQuantity + data.quantity;
    if (newStock < 0) {
      throw new Error(`Stock Violation: Adjustment would result in negative stock (${newStock}). Operation rejected.`);
    }

    const now = new Date().toISOString();
    let batchNumber: string | undefined;

    if (data.batchId) {
      const batches = this.getMedicineBatches();
      const bIdx = batches.findIndex((b) => b.id === data.batchId);
      if (bIdx !== -1) {
        const newBatchQty = batches[bIdx].quantityAvailable + data.quantity;
        if (newBatchQty < 0) {
          throw new Error('Stock Violation: Adjustment exceeds available batch quantity.');
        }
        batches[bIdx] = {
          ...batches[bIdx],
          quantityAvailable: newBatchQty,
          status: newBatchQty === 0 ? 'depleted' : batches[bIdx].status,
        };
        batchNumber = batches[bIdx].batchNumber;
        this.save(MEDICINE_BATCHES_KEY, batches);
      }
    }

    medicines[medIdx] = {
      ...medicines[medIdx],
      stockQuantity: newStock,
      updatedAt: now,
    };
    this.save(MEDICINES_KEY, medicines);

    const tx: InventoryTransaction = {
      id: `tx-${Date.now()}`,
      medicineId: data.medicineId,
      medicineName: medicines[medIdx].brandName,
      batchId: data.batchId,
      batchNumber,
      transactionType: data.adjustmentType,
      quantity: data.quantity,
      balanceAfter: newStock,
      referenceType: 'manual_adjustment',
      reason: data.reason,
      performedBy: data.performedBy,
      performedByName: data.performedByName,
      timestamp: now,
    };

    const txList = this.getInventoryTransactions();
    txList.unshift(tx);
    this.save(INV_TRANSACTIONS_KEY, txList);

    return tx;
  }

  public createPrescription(data: {
    patientId: string;
    doctorId: string;
    diagnosis?: string;
    validUntil: string;
    notes?: string;
    items: Omit<PrescriptionItemDetail, 'quantityDispensed'>[];
    medicalRecordId?: string;
    visitId?: string;
  }): Prescription {
    const patient = this.getPatientById(data.patientId);
    if (!patient) throw new Error('Patient record not found.');

    const doctor = this.getDoctorById(data.doctorId);
    const medicines = this.getMedicines();

    const count = this.getPrescriptions().length + 1;
    const prescriptionNumber = `RX-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const rxId = `rx-${Date.now()}`;

    const items: PrescriptionItemDetail[] = data.items.map((it) => {
      const med = medicines.find((m) => m.id === it.medicineId);
      const unitPrice = med ? med.unitPrice : (it.unitPrice || 0);
      return {
        ...it,
        medicineName: med ? `${med.brandName} (${med.strength})` : it.medicineName,
        quantityDispensed: 0,
        unitPrice,
        totalPrice: unitPrice * it.quantityPrescribed,
      };
    });

    const newRx: Prescription = {
      id: rxId,
      prescriptionNumber,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMrn: patient.medicalRecordNumber,
      doctorId: data.doctorId,
      doctorName: doctor ? doctor.fullName : 'Prescribing Physician',
      medicalRecordId: data.medicalRecordId,
      visitId: data.visitId,
      diagnosis: data.diagnosis,
      items,
      status: 'pending',
      notes: data.notes,
      prescribedAt: new Date().toISOString(),
      validUntil: data.validUntil,
    };

    const prescriptions = this.getPrescriptions();
    prescriptions.unshift(newRx);
    this.save(PRESCRIPTIONS_KEY, prescriptions);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'doctor',
      action: 'PRESCRIPTION_ISSUED',
      targetTable: 'prescriptions',
      recordId: rxId,
      newValues: { rxNumber: prescriptionNumber, patient: newRx.patientName, itemsCount: items.length },
    });

    return newRx;
  }

  public dispensePrescription(data: {
    prescriptionId: string;
    pharmacistId: string;
    pharmacistName: string;
    items: {
      medicineId: string;
      batchId: string;
      quantity: number;
      unitPrice: number;
    }[];
    notes?: string;
  }): DispensingRecord {
    const prescriptions = this.getPrescriptions();
    const rxIdx = prescriptions.findIndex((r) => r.id === data.prescriptionId);
    if (rxIdx === -1) throw new Error('Prescription record not found.');

    const prescription = prescriptions[rxIdx];
    if (prescription.status === 'dispensed') {
      throw new Error('Prescription has already been dispensed.');
    }

    const medicines = this.getMedicines();
    const batches = this.getMedicineBatches();
    const now = new Date();
    const nowIso = now.toISOString();

    // 1. Strict Validation across all items BEFORE mutating state (Atomic guarantee)
    for (const item of data.items) {
      const bIdx = batches.findIndex((b) => b.id === item.batchId);
      if (bIdx === -1) throw new Error(`Batch ID ${item.batchId} not found in inventory.`);

      const batch = batches[bIdx];

      // Expiry Safety Guard
      const expiry = new Date(batch.expiryDate);
      if (expiry < now) {
        throw new Error(
          `Safety Violation: Batch ${batch.batchNumber} expired on ${batch.expiryDate} and cannot be dispensed.`
        );
      }

      // Negative Stock Guard
      if (batch.quantityAvailable < item.quantity) {
        throw new Error(
          `Stock Violation: Insufficient inventory in batch ${batch.batchNumber}. Available: ${batch.quantityAvailable}, Requested: ${item.quantity}.`
        );
      }
    }

    // 2. Perform Atomic Deductions
    const dispensedItems = [];
    let totalDispensedAmount = 0;

    for (const item of data.items) {
      const bIdx = batches.findIndex((b) => b.id === item.batchId);
      const mIdx = medicines.findIndex((m) => m.id === item.medicineId);

      const batch = batches[bIdx];
      const med = medicines[mIdx];
      const lineTotal = item.unitPrice * item.quantity;
      totalDispensedAmount += lineTotal;

      // Deduct from batch
      const newBatchQty = batch.quantityAvailable - item.quantity;
      batches[bIdx] = {
        ...batch,
        quantityAvailable: newBatchQty,
        status: newBatchQty === 0 ? 'depleted' : batch.status,
      };

      // Deduct from total medicine stock
      const newStockQty = med.stockQuantity - item.quantity;
      medicines[mIdx] = {
        ...med,
        stockQuantity: newStockQty,
        updatedAt: nowIso,
      };

      dispensedItems.push({
        medicineId: item.medicineId,
        medicineName: med.brandName,
        batchId: item.batchId,
        batchNumber: batch.batchNumber,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: lineTotal,
      });

      // Log Inventory Transaction
      const txList = this.getInventoryTransactions();
      txList.unshift({
        id: `tx-${Date.now()}-${item.medicineId}`,
        medicineId: item.medicineId,
        medicineName: med.brandName,
        batchId: item.batchId,
        batchNumber: batch.batchNumber,
        transactionType: 'dispense',
        quantity: -item.quantity,
        balanceAfter: newStockQty,
        unitPrice: item.unitPrice,
        referenceType: 'prescription',
        referenceId: prescription.prescriptionNumber,
        reason: `Dispensed for Rx ${prescription.prescriptionNumber} (${prescription.patientName})`,
        performedBy: data.pharmacistId,
        performedByName: data.pharmacistName,
        timestamp: nowIso,
      });
      this.save(INV_TRANSACTIONS_KEY, txList);
    }

    this.save(MEDICINE_BATCHES_KEY, batches);
    this.save(MEDICINES_KEY, medicines);

    // 3. Create Dispensing Record
    const dispCount = this.getDispensingRecords().length + 1;
    const dispensingNumber = `DSP-${now.getFullYear()}-${String(dispCount).padStart(4, '0')}`;
    const dispRecord: DispensingRecord = {
      id: `dsp-${Date.now()}`,
      dispensingNumber,
      prescriptionId: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      patientId: prescription.patientId,
      patientName: prescription.patientName,
      patientMrn: prescription.patientMrn,
      pharmacistId: data.pharmacistId,
      pharmacistName: data.pharmacistName,
      dispensedAt: nowIso,
      items: dispensedItems,
      totalAmount: totalDispensedAmount,
      notes: data.notes,
    };

    const dispRecords = this.getDispensingRecords();
    dispRecords.unshift(dispRecord);
    this.save(DISPENSING_KEY, dispRecords);

    // 4. Update Prescription Status
    prescriptions[rxIdx] = {
      ...prescription,
      status: 'dispensed',
      dispensedAt: nowIso,
      dispensedBy: data.pharmacistName,
    };
    this.save(PRESCRIPTIONS_KEY, prescriptions);

    // 5. Add Pharmacy Charge to Patient Invoice
    const invoices = this.getInvoices(prescription.patientId);
    const activeInv = invoices.find((inv) => inv.status === 'unpaid' || inv.status === 'partially_paid');
    if (activeInv) {
      for (const dItem of dispensedItems) {
        this.addInvoiceItem(activeInv.id, {
          serviceType: 'pharmacy',
          description: `Rx Medication: ${dItem.medicineName} (Qty: ${dItem.quantity}, Batch: ${dItem.batchNumber})`,
          referenceType: 'prescription',
          referenceId: prescription.id,
          unitPrice: dItem.unitPrice,
          quantity: dItem.quantity,
        });
      }
    }

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'pharmacist',
      action: 'PRESCRIPTION_DISPENSED',
      targetTable: 'dispensing_records',
      recordId: dispRecord.id,
      newValues: {
        dispensingNumber,
        rx: prescription.prescriptionNumber,
        total: totalDispensedAmount,
      },
    });

    return dispRecord;
  }

  // ============================================================================
  // BILLING & PAYMENTS (FINANCE) OPERATIONS
  // ============================================================================

  public getInvoices(patientId?: string): Invoice[] {
    const list = this.load<Invoice[]>(INVOICES_KEY, INITIAL_INVOICES);
    if (patientId) return list.filter((inv) => inv.patientId === patientId);
    return list;
  }

  public getInvoiceById(id: string): Invoice | undefined {
    return this.getInvoices().find((i) => i.id === id || i.invoiceNumber === id);
  }

  public getPayments(invoiceId?: string): Payment[] {
    const list = this.load<Payment[]>(PAYMENTS_KEY, INITIAL_PAYMENTS);
    if (invoiceId) return list.filter((p) => p.invoiceId === invoiceId);
    return list;
  }

  public getRefunds(): RefundRecord[] {
    return this.load<RefundRecord[]>(REFUNDS_KEY, INITIAL_REFUNDS);
  }

  public createInvoice(data: {
    patientId: string;
    dueDate: string;
    notes?: string;
    items: Omit<InvoiceItem, 'id' | 'totalPrice'>[];
    admissionId?: string;
    discountAmount?: number;
    insuranceCoveredAmount?: number;
    createdBy: string;
    createdByName: string;
  }): Invoice {
    const patient = this.getPatientById(data.patientId);
    if (!patient) throw new Error('Patient record not found.');

    const now = new Date().toISOString();
    const count = this.getInvoices().length + 1;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;
    const invoiceId = `inv-${Date.now()}`;

    // Server-Side Totals Calculation (Never trust browser-supplied subtotal/total)
    let subtotal = 0;
    const items: InvoiceItem[] = data.items.map((it, idx) => {
      const lineTotal = Math.round(it.unitPrice * it.quantity * 100) / 100;
      subtotal += lineTotal;
      return {
        ...it,
        id: `item-${Date.now()}-${idx}`,
        invoiceId,
        totalPrice: lineTotal,
      };
    });

    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100; // Standard 5% hospital services fee
    const discountAmount = data.discountAmount || 0;
    const insuranceCoveredAmount = data.insuranceCoveredAmount || 0;
    const totalAmount = Math.max(0, Math.round((subtotal + taxAmount - discountAmount - insuranceCoveredAmount) * 100) / 100);
    const paidAmount = 0;
    const balanceDue = totalAmount;

    const newInvoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMrn: patient.medicalRecordNumber,
      admissionId: data.admissionId,
      invoiceDate: now.slice(0, 10),
      dueDate: data.dueDate,
      status: 'unpaid',
      items,
      subtotal,
      taxAmount,
      discountAmount,
      insuranceCoveredAmount,
      totalAmount,
      paidAmount,
      balanceDue,
      notes: data.notes,
      createdBy: data.createdBy,
      createdByName: data.createdByName,
      createdAt: now,
      updatedAt: now,
    };

    const invoices = this.getInvoices();
    invoices.unshift(newInvoice);
    this.save(INVOICES_KEY, invoices);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'accountant',
      action: 'INVOICE_GENERATED',
      targetTable: 'invoices',
      recordId: invoiceId,
      newValues: { invoiceNumber, patient: newInvoice.patientName, total: totalAmount },
    });

    return newInvoice;
  }

  public addInvoiceItem(invoiceId: string, item: Omit<InvoiceItem, 'id' | 'totalPrice'>): Invoice {
    const invoices = this.getInvoices();
    const idx = invoices.findIndex((i) => i.id === invoiceId);
    if (idx === -1) throw new Error('Invoice not found.');

    const invoice = invoices[idx];
    const lineTotal = Math.round(item.unitPrice * item.quantity * 100) / 100;
    const newItem: InvoiceItem = {
      ...item,
      id: `item-${Date.now()}`,
      invoiceId,
      totalPrice: lineTotal,
    };

    const updatedItems = [...invoice.items, newItem];

    // Server-Side Recalculation
    let subtotal = 0;
    updatedItems.forEach((it) => {
      subtotal += it.totalPrice;
    });

    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = Math.max(
      0,
      Math.round((subtotal + taxAmount - invoice.discountAmount - invoice.insuranceCoveredAmount) * 100) / 100
    );
    const balanceDue = Math.max(0, Math.round((totalAmount - invoice.paidAmount) * 100) / 100);

    const updatedInvoice: Invoice = {
      ...invoice,
      items: updatedItems,
      subtotal,
      taxAmount,
      totalAmount,
      balanceDue,
      status: balanceDue <= 0 && totalAmount > 0 ? 'paid' : invoice.paidAmount > 0 ? 'partially_paid' : 'unpaid',
      updatedAt: new Date().toISOString(),
    };

    invoices[idx] = updatedInvoice;
    this.save(INVOICES_KEY, invoices);

    return updatedInvoice;
  }

  public recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionReference?: string;
    idempotencyKey: string;
    receivedBy: string;
    receivedByName: string;
    notes?: string;
  }): Payment {
    // 1. Idempotency Check: Prevent duplicate payment transactions
    const payments = this.load<Payment[]>(PAYMENTS_KEY, INITIAL_PAYMENTS);
    const existing = payments.find((p) => p.idempotencyKey === data.idempotencyKey);
    if (existing) {
      console.warn('Idempotency Guard: Payment already processed for key:', data.idempotencyKey);
      return existing;
    }

    const invoices = this.getInvoices();
    const idx = invoices.findIndex((i) => i.id === data.invoiceId);
    if (idx === -1) throw new Error('Invoice not found.');

    const invoice = invoices[idx];
    if (invoice.status === 'paid' && invoice.balanceDue <= 0) {
      throw new Error('Invoice has already been settled in full.');
    }

    const now = new Date().toISOString();
    const count = payments.length + 1;
    const receiptNumber = `REC-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    // Never store raw card details! Mask transaction reference if provided.
    const maskedRef =
      data.paymentMethod === 'credit_card' || data.paymentMethod === 'debit_card'
        ? (data.transactionReference || 'CARD-POS-APPROVED').replace(/\b(?:\d{4}[ -]?){3}(?=\d{4}\b)/g, '****-****-****-')
        : data.transactionReference;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId,
      patientName: invoice.patientName,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionReference: maskedRef,
      receivedBy: data.receivedBy,
      receivedByName: data.receivedByName,
      isRefund: false,
      paymentDate: now,
      idempotencyKey: data.idempotencyKey,
      notes: data.notes,
      createdAt: now,
    };

    payments.unshift(newPayment);
    this.save(PAYMENTS_KEY, payments);

    // Update Invoice balance and status
    const newPaidAmount = Math.round((invoice.paidAmount + data.amount) * 100) / 100;
    const newBalanceDue = Math.max(0, Math.round((invoice.totalAmount - newPaidAmount) * 100) / 100);

    invoices[idx] = {
      ...invoice,
      paidAmount: newPaidAmount,
      balanceDue: newBalanceDue,
      status: newBalanceDue <= 0 ? 'paid' : 'partially_paid',
      updatedAt: now,
    };
    this.save(INVOICES_KEY, invoices);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'accountant',
      action: 'PAYMENT_RECORDED',
      targetTable: 'payments',
      recordId: newPayment.id,
      newValues: {
        receiptNumber,
        invoiceNumber: invoice.invoiceNumber,
        amount: data.amount,
        method: data.paymentMethod,
      },
    });

    return newPayment;
  }

  public processRefund(data: {
    paymentId: string;
    invoiceId: string;
    amount: number;
    reason: string;
    authorizedBy: string;
    authorizedByName: string;
  }): RefundRecord {
    const payments = this.load<Payment[]>(PAYMENTS_KEY, INITIAL_PAYMENTS);
    const pIdx = payments.findIndex((p) => p.id === data.paymentId);
    if (pIdx === -1) throw new Error('Original payment record not found.');

    const payment = payments[pIdx];
    if (payment.isRefund) {
      throw new Error('This payment has already been refunded.');
    }
    if (data.amount > payment.amount) {
      throw new Error(`Refund amount ($${data.amount}) cannot exceed original payment amount ($${payment.amount}).`);
    }

    const invoices = this.getInvoices();
    const invIdx = invoices.findIndex((i) => i.id === data.invoiceId);
    if (invIdx === -1) throw new Error('Invoice record not found.');

    const invoice = invoices[invIdx];
    const now = new Date().toISOString();
    const refunds = this.getRefunds();
    const count = refunds.length + 1;
    const refundNumber = `REF-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`;

    const refundRecord: RefundRecord = {
      id: `ref-${Date.now()}`,
      refundNumber,
      paymentId: data.paymentId,
      invoiceId: data.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      patientId: invoice.patientId,
      patientName: invoice.patientName,
      amount: data.amount,
      reason: data.reason,
      authorizedBy: data.authorizedBy,
      authorizedByName: data.authorizedByName,
      authorizedAt: now,
      status: 'processed',
    };

    refunds.unshift(refundRecord);
    this.save(REFUNDS_KEY, refunds);

    // Mark payment as refunded
    payments[pIdx] = {
      ...payment,
      isRefund: true,
      refundReason: data.reason,
    };
    this.save(PAYMENTS_KEY, payments);

    // Reopen invoice balance
    const updatedPaid = Math.max(0, Math.round((invoice.paidAmount - data.amount) * 100) / 100);
    const updatedBalance = Math.round((invoice.totalAmount - updatedPaid) * 100) / 100;

    invoices[invIdx] = {
      ...invoice,
      paidAmount: updatedPaid,
      balanceDue: updatedBalance,
      status: updatedPaid === 0 ? 'unpaid' : 'partially_paid',
      updatedAt: now,
    };
    this.save(INVOICES_KEY, invoices);

    AuditService.log({
      actorEmail: 'system@medpulse.org',
      actorRole: 'accountant',
      action: 'PAYMENT_REFUNDED',
      targetTable: 'refund_records',
      recordId: refundRecord.id,
      newValues: {
        refundNumber,
        invoiceNumber: invoice.invoiceNumber,
        amount: data.amount,
        authorizedBy: data.authorizedByName,
      },
    });

    return refundRecord;
  }

  // ============================================================================
  // STAFF, ATTENDANCE & LEAVE OPERATIONS (Part 5)
  // ============================================================================

  public getStaff(departmentId?: string): StaffEmployee[] {
    const list = this.load<StaffEmployee[]>(STAFF_KEY, INITIAL_STAFF);
    if (!departmentId || departmentId === 'all') return list;
    return list.filter((emp) => emp.departmentId === departmentId);
  }

  public getStaffById(id: string): StaffEmployee | undefined {
    const list = this.getStaff();
    return list.find((emp) => emp.id === id);
  }

  public addStaff(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    departmentId: string;
    departmentName: string;
    designation: string;
    employmentType: EmploymentType;
    shift: StaffShift;
    hireDate: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    salary?: number;
    notes?: string;
  }): StaffEmployee {
    const list = this.load<StaffEmployee[]>(STAFF_KEY, INITIAL_STAFF);
    const id = `emp-${Date.now()}`;
    const employeeNumber = `EMP-${1090 + list.length + 1}`;
    const fullName = `${data.firstName} ${data.lastName}`;
    const now = new Date().toISOString();

    const newEmp: StaffEmployee = {
      id,
      employeeNumber,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName,
      email: data.email,
      phone: data.phone,
      role: data.role as any,
      departmentId: data.departmentId,
      departmentName: data.departmentName,
      designation: data.designation,
      employmentType: data.employmentType,
      status: 'active',
      shift: data.shift,
      hireDate: data.hireDate,
      emergencyContact: data.emergencyContact,
      salary: data.salary,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };

    list.unshift(newEmp);
    this.save(STAFF_KEY, list);

    AuditService.log({
      actorEmail: 'admin@medpulse.org',
      actorRole: 'administrator',
      action: 'USER_REGISTERED',
      targetTable: 'employees',
      recordId: id,
      newValues: {
        employeeNumber,
        fullName,
        role: data.role,
        department: data.departmentName,
      },
    });

    return newEmp;
  }

  public updateStaff(id: string, updates: Partial<StaffEmployee>): StaffEmployee {
    const list = this.load<StaffEmployee[]>(STAFF_KEY, INITIAL_STAFF);
    const idx = list.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error(`Employee ${id} not found.`);

    const existing = list[idx];
    const updated: StaffEmployee = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    list[idx] = updated;
    this.save(STAFF_KEY, list);

    AuditService.log({
      actorEmail: 'admin@medpulse.org',
      actorRole: 'administrator',
      action: 'ROLE_CHANGED',
      targetTable: 'employees',
      recordId: id,
      oldValues: { role: existing.role, status: existing.status, department: existing.departmentName },
      newValues: { role: updated.role, status: updated.status, department: updated.departmentName },
    });

    return updated;
  }

  public getAttendance(date?: string, employeeId?: string): AttendanceRecord[] {
    let list = this.load<AttendanceRecord[]>(ATTENDANCE_KEY, INITIAL_ATTENDANCE);
    if (date) {
      list = list.filter((a) => a.date === date);
    }
    if (employeeId) {
      list = list.filter((a) => a.employeeId === employeeId);
    }
    return list;
  }

  public recordAttendance(data: {
    employeeId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: AttendanceStatus;
    notes?: string;
  }): AttendanceRecord {
    const list = this.load<AttendanceRecord[]>(ATTENDANCE_KEY, INITIAL_ATTENDANCE);
    const staff = this.getStaffById(data.employeeId);
    if (!staff) throw new Error(`Staff member ${data.employeeId} not found.`);

    const now = new Date().toISOString();
    const existingIdx = list.findIndex(
      (a) => a.employeeId === data.employeeId && a.date === data.date
    );

    let record: AttendanceRecord;
    if (existingIdx >= 0) {
      record = {
        ...list[existingIdx],
        ...data,
        employeeNumber: staff.employeeNumber,
        employeeName: staff.fullName,
        departmentName: staff.departmentName,
        shift: staff.shift,
      };
      list[existingIdx] = record;
    } else {
      record = {
        id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        employeeId: data.employeeId,
        employeeNumber: staff.employeeNumber,
        employeeName: staff.fullName,
        departmentName: staff.departmentName,
        shift: staff.shift,
        date: data.date,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        status: data.status,
        notes: data.notes,
        createdAt: now,
      };
      list.unshift(record);
    }

    this.save(ATTENDANCE_KEY, list);
    return record;
  }

  public getLeaveRequests(employeeId?: string, status?: string): LeaveRequest[] {
    let list = this.load<LeaveRequest[]>(LEAVES_KEY, INITIAL_LEAVES);
    if (employeeId) {
      list = list.filter((l) => l.employeeId === employeeId);
    }
    if (status && status !== 'all') {
      list = list.filter((l) => l.status === status);
    }
    return list;
  }

  public submitLeaveRequest(data: {
    employeeId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }): LeaveRequest {
    const list = this.load<LeaveRequest[]>(LEAVES_KEY, INITIAL_LEAVES);
    const staff = this.getStaffById(data.employeeId);
    if (!staff) throw new Error(`Staff member ${data.employeeId} not found.`);

    const start = new Date(data.startDate).getTime();
    const end = new Date(data.endDate).getTime();
    const diffDays = Math.max(1, Math.round((end - start) / (1000 * 3600 * 24)) + 1);
    const now = new Date().toISOString();
    const leaveNumber = `LEV-${new Date().getFullYear()}-${String(list.length + 1).padStart(3, '0')}`;

    const newLeave: LeaveRequest = {
      id: `lev-${Date.now()}`,
      leaveNumber,
      employeeId: data.employeeId,
      employeeName: staff.fullName,
      departmentName: staff.departmentName,
      leaveType: data.leaveType,
      startDate: data.startDate,
      endDate: data.endDate,
      daysCount: diffDays,
      reason: data.reason,
      status: 'pending',
      appliedAt: now,
    };

    list.unshift(newLeave);
    this.save(LEAVES_KEY, list);

    this.createNotification({
      type: 'general_alert',
      title: 'New Leave Request Submitted',
      message: `${staff.fullName} (${staff.departmentName}) submitted a ${data.leaveType} leave request for ${diffDays} day(s).`,
      severity: 'info',
      targetRole: 'administrator',
      linkUrl: '/staff',
    });

    return newLeave;
  }

  public reviewLeaveRequest(data: {
    leaveId: string;
    status: 'approved' | 'rejected';
    reviewComments?: string;
    reviewedBy: string;
    reviewedByName: string;
  }): LeaveRequest {
    const list = this.load<LeaveRequest[]>(LEAVES_KEY, INITIAL_LEAVES);
    const idx = list.findIndex((l) => l.id === data.leaveId);
    if (idx === -1) throw new Error(`Leave request ${data.leaveId} not found.`);

    const now = new Date().toISOString();
    const existing = list[idx];
    const updated: LeaveRequest = {
      ...existing,
      status: data.status,
      reviewedBy: data.reviewedBy,
      reviewedByName: data.reviewedByName,
      reviewedAt: now,
      reviewComments: data.reviewComments,
    };

    list[idx] = updated;
    this.save(LEAVES_KEY, list);

    AuditService.log({
      actorEmail: `${data.reviewedBy}@medpulse.org`,
      actorRole: 'administrator',
      action: 'ROLE_CHANGED',
      targetTable: 'leave_requests',
      recordId: data.leaveId,
      newValues: {
        leaveNumber: existing.leaveNumber,
        status: data.status,
        employeeName: existing.employeeName,
        reviewedBy: data.reviewedByName,
      },
    });

    this.createNotification({
      type: data.status === 'approved' ? 'leave_approved' : 'general_alert',
      title: `Leave Request ${data.status.toUpperCase()}`,
      message: `Leave request ${existing.leaveNumber} for ${existing.employeeName} has been ${data.status} by ${data.reviewedByName}.`,
      severity: data.status === 'approved' ? 'success' : 'warning',
      linkUrl: '/staff',
    });

    return updated;
  }

  // ============================================================================
  // NOTIFICATIONS OPERATIONS (Part 5)
  // ============================================================================

  public getNotifications(targetRole?: string, unreadOnly?: boolean): NotificationItem[] {
    const list = this.load<NotificationItem[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    return list.filter((n) => {
      if (unreadOnly && n.isRead) return false;
      if (!targetRole || targetRole === 'all') return true;
      if (!n.targetRole || n.targetRole === 'all') return true;
      return n.targetRole === targetRole;
    });
  }

  public markNotificationAsRead(id: string): NotificationItem {
    const list = this.load<NotificationItem[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) throw new Error(`Notification ${id} not found.`);

    const updated: NotificationItem = {
      ...list[idx],
      isRead: true,
    };
    list[idx] = updated;
    this.save(NOTIFICATIONS_KEY, list);
    return updated;
  }

  public markAllNotificationsAsRead(targetRole?: string): void {
    const list = this.load<NotificationItem[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    const updated = list.map((n) => {
      if (!targetRole || targetRole === 'all' || !n.targetRole || n.targetRole === targetRole) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.save(NOTIFICATIONS_KEY, updated);
  }

  public createNotification(data: {
    type: NotificationType;
    title: string;
    message: string;
    severity: NotificationSeverity;
    targetRole?: string;
    targetUserId?: string;
    linkUrl?: string;
  }): NotificationItem {
    const list = this.load<NotificationItem[]>(NOTIFICATIONS_KEY, INITIAL_NOTIFICATIONS);
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: data.type,
      title: data.title,
      message: data.message,
      severity: data.severity,
      targetRole: data.targetRole,
      targetUserId: data.targetUserId,
      isRead: false,
      linkUrl: data.linkUrl,
      createdAt: new Date().toISOString(),
    };
    list.unshift(newNotif);
    this.save(NOTIFICATIONS_KEY, list);
    return newNotif;
  }
}

export const mockStore = new MockHospitalStore();
