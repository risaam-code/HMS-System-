// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — PATIENT MANAGEMENT SERVICE
// ==============================================================================
// Handles patient registration, MRN generation, duplicate checks, updates,
// archiving, document uploads, and comprehensive multi-module patient history.
// ==============================================================================

import { Patient, PatientDocument, Appointment, MedicalRecord, OutpatientVisit } from '@/types';
import { mockStore } from './mockHospitalStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface PatientHistoryItem {
  id: string;
  date: string;
  type: 'Registration' | 'Appointment' | 'Clinical Encounter' | 'Outpatient Visit' | 'Document';
  title: string;
  summary: string;
  actor: string;
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  metadata?: Record<string, any>;
}

export const PatientService = {
  /**
   * Retrieves all registered patients with optional filtering
   */
  async getPatients(filters?: {
    search?: string;
    status?: string;
    gender?: string;
    bloodGroup?: string;
  }): Promise<Patient[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('patients').select('*').order('created_at', { ascending: false });
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters?.gender && filters.gender !== 'all') {
          query = query.eq('gender', filters.gender);
        }
        if (filters?.search) {
          query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,medical_record_number.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
        }
        const { data, error } = await query;
        if (!error && data) {
          return data as unknown as Patient[];
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to local store:', err);
      }
    }

    let list = mockStore.getPatients();
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((p) => p.status === filters.status);
    }
    if (filters?.gender && filters.gender !== 'all') {
      list = list.filter((p) => p.gender === filters.gender);
    }
    if (filters?.bloodGroup && filters.bloodGroup !== 'all') {
      list = list.filter((p) => p.bloodGroup === filters.bloodGroup);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.firstName.toLowerCase().includes(q) ||
          p.lastName.toLowerCase().includes(q) ||
          p.medicalRecordNumber.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          (p.email && p.email.toLowerCase().includes(q))
      );
    }

    return list;
  },

  /**
   * Retrieves single patient by ID or MRN
   */
  async getPatientById(id: string): Promise<Patient | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .or(`id.eq.${id},medical_record_number.eq.${id}`)
          .maybeSingle();
        if (!error && data) return data as unknown as Patient;
      } catch (err) {
        console.warn('Supabase fetch failed:', err);
      }
    }
    return mockStore.getPatientById(id) || null;
  },

  /**
   * Checks for duplicate patient by phone, email, or exact First+Last+DOB
   */
  async checkDuplicate(params: {
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    excludeId?: string;
  }) {
    return mockStore.checkDuplicatePatient(params);
  },

  /**
   * Generates the next sequential hospital MRN (e.g., MRN-2026-00106)
   */
  async generateNextMrn(): Promise<string> {
    return mockStore.generateNextMrn();
  },

  /**
   * Registers a new patient with duplicate verification and audit logging
   */
  async createPatient(
    data: Omit<Patient, 'id' | 'medicalRecordNumber' | 'registrationDate'> & { medicalRecordNumber?: string }
  ): Promise<Patient> {
    return mockStore.createPatient(data);
  },

  /**
   * Updates an existing patient demographic or clinical profile
   */
  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient> {
    return mockStore.updatePatient(id, updates);
  },

  /**
   * Archives a patient (marks status as archived, preventing accidental deletion)
   */
  async archivePatient(id: string, reason?: string): Promise<Patient> {
    return mockStore.archivePatient(id, reason);
  },

  /**
   * Uploads and links a clinical document to the patient record
   */
  async uploadDocument(
    patientId: string,
    doc: Omit<PatientDocument, 'id' | 'uploadedAt'>
  ): Promise<PatientDocument> {
    return mockStore.addPatientDocument(patientId, doc);
  },

  /**
   * Cross-module aggregation: builds a chronological patient activity timeline
   * linking appointments, medical records, OPD visits, and admissions.
   */
  async getPatientHistory(patientId: string): Promise<PatientHistoryItem[]> {
    const patient = mockStore.getPatientById(patientId);
    if (!patient) return [];

    const history: PatientHistoryItem[] = [];

    // 1. Patient Registration Event
    history.push({
      id: `reg-${patient.id}`,
      date: patient.registrationDate,
      type: 'Registration',
      title: 'Initial Intake Registration',
      summary: `Patient registered with Medical Record Number ${patient.medicalRecordNumber}. Primary Doctor: ${patient.assignedDoctor || 'Unassigned'}.`,
      actor: 'Reception Intake Desk',
      badgeVariant: 'info',
    });

    // 2. Appointments
    const appointments = mockStore.getAppointments().filter((a) => a.patientId === patient.id || a.patientMrn === patient.medicalRecordNumber);
    for (const apt of appointments) {
      history.push({
        id: `apt-${apt.id}`,
        date: apt.date || apt.scheduledAt.split('T')[0],
        type: 'Appointment',
        title: `${apt.type.toUpperCase().replace('_', ' ')}: ${apt.department}`,
        summary: `Consultation with ${apt.doctorName}. Reason: "${apt.visitReason}". Status: ${apt.status}.`,
        actor: apt.bookingUserName || apt.doctorName,
        badgeVariant: apt.status === 'Completed' ? 'success' : apt.status === 'Cancelled' ? 'danger' : 'warning',
        metadata: { appointmentId: apt.id, status: apt.status },
      });
    }

    // 3. Medical Records (EMR)
    const records = mockStore.getMedicalRecords().filter((r) => r.patientId === patient.id || r.patientMrn === patient.medicalRecordNumber);
    for (const rec of records) {
      history.push({
        id: `rec-${rec.id}`,
        date: rec.encounterDate,
        type: 'Clinical Encounter',
        title: `EMR: ${rec.diagnosisTitle} (${rec.diagnosisCode || 'Clinical'})`,
        summary: `Attending Physician: ${rec.doctorName}. Chief complaint: "${rec.chiefComplaint}". ${rec.isSigned ? 'Digitally signed.' : 'Draft chart.'}`,
        actor: rec.doctorName,
        badgeVariant: rec.isSigned ? 'success' : 'default',
        metadata: { recordId: rec.id, isSigned: rec.isSigned },
      });
    }

    // 4. Outpatient (OPD) Visits
    const opdVisits = mockStore.getOutpatientVisits().filter((v) => v.patientId === patient.id || v.patientMrn === patient.medicalRecordNumber);
    for (const opd of opdVisits) {
      history.push({
        id: `opd-${opd.id}`,
        date: opd.checkInTime.split('T')[0],
        type: 'Outpatient Visit',
        title: `OPD Visit [${opd.queueToken}]: ${opd.departmentName}`,
        summary: `Queue Token ${opd.queueToken} • ${opd.isWalkIn ? 'Walk-in' : 'Booked'} • Attending: ${opd.doctorName}. Status: ${opd.status}.`,
        actor: opd.doctorName,
        badgeVariant: opd.status === 'Completed' ? 'success' : 'info',
        metadata: { visitId: opd.id, status: opd.status },
      });
    }

    // 5. Documents Uploaded
    if (patient.documents) {
      for (const doc of patient.documents) {
        history.push({
          id: `doc-${doc.id}`,
          date: doc.uploadedAt.split('T')[0],
          type: 'Document',
          title: `Document Upload: ${doc.title}`,
          summary: `Category: ${doc.category} (${doc.fileType}). Uploaded by ${doc.uploadedBy}.`,
          actor: doc.uploadedBy,
          badgeVariant: 'default',
        });
      }
    }

    // Sort descending by date
    return history.sort((a, b) => (a.date > b.date ? -1 : 1));
  },
};
