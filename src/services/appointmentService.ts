// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — APPOINTMENT MANAGEMENT SERVICE
// ==============================================================================
// Enforces scheduling integrity, double-booking prevention, status transitions
// (Scheduled -> Confirmed -> Checked In -> In Progress -> Completed / Cancelled / No Show),
// and cancellation audit reasons.
// ==============================================================================

import { Appointment, AppointmentStatus } from '@/types';
import { mockStore } from './mockHospitalStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const AppointmentService = {
  /**
   * Retrieves appointments with rich filtering
   */
  async getAppointments(filters?: {
    doctorId?: string;
    patientId?: string;
    department?: string;
    status?: AppointmentStatus | 'all';
    date?: string;
    search?: string;
  }): Promise<Appointment[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('appointments').select('*').order('scheduled_at', { ascending: false });
        if (filters?.doctorId && filters.doctorId !== 'all') {
          query = query.eq('doctor_id', filters.doctorId);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters?.date) {
          query = query.eq('date', filters.date);
        }
        const { data, error } = await query;
        if (!error && data) return data as unknown as Appointment[];
      } catch (err) {
        console.warn('Supabase fetch failed:', err);
      }
    }

    let list = mockStore.getAppointments();
    if (filters?.doctorId && filters.doctorId !== 'all') {
      list = list.filter((a) => a.doctorId === filters.doctorId);
    }
    if (filters?.patientId) {
      list = list.filter((a) => a.patientId === filters.patientId || a.patientMrn === filters.patientId);
    }
    if (filters?.department && filters.department !== 'all') {
      list = list.filter((a) => a.department === filters.department || a.departmentId === filters.department);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters?.date) {
      list = list.filter((a) => a.date === filters.date);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.appointmentNumber.toLowerCase().includes(q) ||
          a.patientName.toLowerCase().includes(q) ||
          a.doctorName.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          a.visitReason.toLowerCase().includes(q)
      );
    }
    return list;
  },

  /**
   * Retrieves single appointment by ID or appointmentNumber
   */
  async getAppointmentById(id: string): Promise<Appointment | null> {
    return mockStore.getAppointmentById(id) || null;
  },

  /**
   * Safe Concurrency Guard: Checks if doctor has an overlapping consultation slot
   */
  async checkDoctorSlotConflict(params: {
    doctorId: string;
    date: string;
    startTime: string;
    endTime: string;
    excludeAppointmentId?: string;
  }) {
    return mockStore.checkDoctorSlotConflict(params);
  },

  /**
   * Books a new appointment with double-booking prevention
   */
  async bookAppointment(data: {
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
  }): Promise<Appointment> {
    return mockStore.bookAppointment(data);
  },

  /**
   * Reschedules an existing appointment, verifying that new slot has no conflict
   */
  async rescheduleAppointment(
    id: string,
    params: {
      date: string;
      startTime: string;
      endTime: string;
      reason?: string;
    }
  ): Promise<Appointment> {
    return mockStore.rescheduleAppointment(id, params);
  },

  /**
   * Transitions appointment status (Confirmed, Checked In, In Progress, Completed, Cancelled, No Show)
   */
  async updateStatus(
    id: string,
    status: AppointmentStatus,
    metadata?: {
      cancellationReason?: string;
      checkInTime?: string;
      completedTime?: string;
      clinicalNotes?: string;
    }
  ): Promise<Appointment> {
    return mockStore.updateAppointmentStatus(id, status, metadata);
  },
};
