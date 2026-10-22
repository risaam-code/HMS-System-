// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — OUTPATIENT (OPD) SERVICE
// ==============================================================================
// Implements the full 11-step outpatient clinical workflow:
// 1. Identify/Register -> 2. Create Visit -> 3. Link Appt -> 4. Check In
// 5. Assign Doctor -> 6. Consultation Notes -> 7. Diagnosis & Treatment
// 8. Request Lab Tests -> 9. Issue Prescriptions -> 10. Generate Charges -> 11. Complete
// ==============================================================================

import { OutpatientVisit, OutpatientVisitStatus, PrescriptionItem, VitalSigns } from '@/types';
import { mockStore } from './mockHospitalStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const OutpatientService = {
  /**
   * Retrieves outpatient visits with status, doctor, and date filtering
   */
  async getVisits(filters?: {
    status?: OutpatientVisitStatus | 'all';
    doctorId?: string;
    departmentId?: string;
    date?: string;
    search?: string;
  }): Promise<OutpatientVisit[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('outpatient_visits').select('*').order('created_at', { ascending: false });
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters?.doctorId && filters.doctorId !== 'all') {
          query = query.eq('doctor_id', filters.doctorId);
        }
        const { data, error } = await query;
        if (!error && data) return data as unknown as OutpatientVisit[];
      } catch (err) {
        console.warn('Supabase fetch failed:', err);
      }
    }

    let list = mockStore.getOutpatientVisits();
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((v) => v.status === filters.status);
    }
    if (filters?.doctorId && filters.doctorId !== 'all') {
      list = list.filter((v) => v.doctorId === filters.doctorId);
    }
    if (filters?.departmentId && filters.departmentId !== 'all') {
      list = list.filter((v) => v.departmentId === filters.departmentId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (v) =>
          v.visitNumber.toLowerCase().includes(q) ||
          v.queueToken.toLowerCase().includes(q) ||
          v.patientName.toLowerCase().includes(q) ||
          v.patientMrn.toLowerCase().includes(q) ||
          v.doctorName.toLowerCase().includes(q) ||
          v.departmentName.toLowerCase().includes(q)
      );
    }
    return list;
  },

  /**
   * Retrieves single visit by ID or visitNumber
   */
  async getVisitById(id: string): Promise<OutpatientVisit | null> {
    return mockStore.getOutpatientVisitById(id) || null;
  },

  /**
   * Step 1-3: Creates an outpatient visit (walk-in or linked to scheduled appointment)
   */
  async createVisit(data: {
    patientId: string;
    doctorId: string;
    departmentId: string;
    appointmentId?: string;
    priority?: 'Routine' | 'Urgent' | 'STAT';
    isWalkIn?: boolean;
    chiefComplaint?: string;
  }): Promise<OutpatientVisit> {
    return mockStore.createOutpatientVisit(data);
  },

  /**
   * Step 4: Check-in patient into queue
   */
  async checkInPatient(visitId: string, vitals?: VitalSigns): Promise<OutpatientVisit> {
    return mockStore.updateOutpatientVisit(visitId, {
      status: 'Checked In',
      vitals: vitals || undefined,
    });
  },

  /**
   * Step 5-7: Record physician consultation notes, diagnosis, and treatment plan
   */
  async recordConsultation(
    visitId: string,
    data: {
      consultationNotes: string;
      diagnosis: string;
      treatmentPlan: string;
      doctorId?: string;
      doctorName?: string;
    }
  ): Promise<OutpatientVisit> {
    return mockStore.updateOutpatientVisit(visitId, {
      status: 'In Consultation',
      consultationNotes: data.consultationNotes,
      diagnosis: data.diagnosis,
      treatmentPlan: data.treatmentPlan,
      doctorId: data.doctorId,
      doctorName: data.doctorName,
    });
  },

  /**
   * Step 8: Order laboratory diagnostic investigations
   */
  async requestLabTests(visitId: string, testCodes: string[]): Promise<OutpatientVisit> {
    return mockStore.updateOutpatientVisit(visitId, {
      status: 'Lab Requested',
      labRequests: testCodes,
    });
  },

  /**
   * Step 9: Issue prescriptions to pharmacy
   */
  async issuePrescriptions(visitId: string, prescriptions: PrescriptionItem[]): Promise<OutpatientVisit> {
    return mockStore.updateOutpatientVisit(visitId, {
      status: 'Prescription Issued',
      prescriptions,
    });
  },

  /**
   * Step 10: Generate billing charge
   */
  async generateBilling(visitId: string, consultationFee: number): Promise<OutpatientVisit> {
    return mockStore.updateOutpatientVisit(visitId, {
      status: 'Billed',
      consultationFee,
      invoiceId: `inv-${Date.now()}`,
    });
  },

  /**
   * Step 11: Complete outpatient encounter
   */
  async completeVisit(visitId: string): Promise<OutpatientVisit> {
    return mockStore.updateOutpatientVisit(visitId, {
      status: 'Completed',
      completedAt: new Date().toISOString(),
    });
  },

  /**
   * Generic status updater
   */
  async updateStatus(
    visitId: string,
    status: OutpatientVisitStatus,
    payload?: Partial<OutpatientVisit>
  ): Promise<OutpatientVisit> {
    return mockStore.updateOutpatientVisit(visitId, {
      status,
      ...payload,
    });
  },
};
