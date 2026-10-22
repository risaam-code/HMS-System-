// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — ELECTRONIC MEDICAL RECORDS (EMR)
// ==============================================================================
// Manages SOAP clinical notes, ICD-10 diagnoses, vitals, prescriptions,
// digital signing by authorized physicians, and immutable clinical amendments.
// ==============================================================================

import { MedicalRecord } from '@/types';
import { mockStore } from './mockHospitalStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const MedicalRecordService = {
  /**
   * Retrieves medical records with optional patient, doctor, or keyword filters
   */
  async getMedicalRecords(filters?: {
    patientId?: string;
    doctorId?: string;
    isSigned?: boolean;
    search?: string;
  }): Promise<MedicalRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('medical_records').select('*').order('created_at', { ascending: false });
        if (filters?.patientId) query = query.eq('patient_id', filters.patientId);
        if (filters?.doctorId) query = query.eq('doctor_id', filters.doctorId);
        const { data, error } = await query;
        if (!error && data) return data as unknown as MedicalRecord[];
      } catch (err) {
        console.warn('Supabase fetch failed:', err);
      }
    }

    let list = mockStore.getMedicalRecords();
    if (filters?.patientId) {
      list = list.filter((r) => r.patientId === filters.patientId || r.patientMrn === filters.patientId);
    }
    if (filters?.doctorId && filters.doctorId !== 'all') {
      list = list.filter((r) => r.doctorId === filters.doctorId);
    }
    if (filters?.isSigned !== undefined) {
      list = list.filter((r) => r.isSigned === filters.isSigned);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.recordNumber.toLowerCase().includes(q) ||
          r.patientName.toLowerCase().includes(q) ||
          r.patientMrn.toLowerCase().includes(q) ||
          r.doctorName.toLowerCase().includes(q) ||
          r.diagnosisTitle.toLowerCase().includes(q) ||
          (r.diagnosisCode && r.diagnosisCode.toLowerCase().includes(q))
      );
    }
    return list;
  },

  /**
   * Retrieves single medical record by ID or recordNumber
   */
  async getMedicalRecordById(id: string): Promise<MedicalRecord | null> {
    return mockStore.getMedicalRecordById(id) || null;
  },

  /**
   * Creates a new clinical chart record (SOAP format)
   */
  async createMedicalRecord(
    data: Omit<MedicalRecord, 'id' | 'recordNumber' | 'createdAt' | 'updatedAt' | 'amendments'>
  ): Promise<MedicalRecord> {
    return mockStore.createMedicalRecord(data);
  },

  /**
   * Digitally signs a record, sealing it from silent edits
   */
  async signRecord(id: string, doctorId: string, doctorName: string): Promise<MedicalRecord> {
    return mockStore.signMedicalRecord(id, doctorId, doctorName);
  },

  /**
   * Records an official clinical amendment to a signed chart
   */
  async amendRecord(params: {
    recordId: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    amendmentReason: string;
    newNotes: string;
  }): Promise<MedicalRecord> {
    return mockStore.amendMedicalRecord(params);
  },
};
