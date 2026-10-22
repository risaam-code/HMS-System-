// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — DOCTOR MANAGEMENT SERVICE
// ==============================================================================
// Handles doctor registration, clinical profiles, department assignments,
// qualifications, availability schedules, and historical appointment rosters.
// ==============================================================================

import { Doctor, Appointment } from '@/types';
import { mockStore } from './mockHospitalStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const DoctorService = {
  /**
   * Retrieves all doctors with optional department and status filtering
   */
  async getDoctors(filters?: {
    departmentId?: string;
    status?: string;
    availabilityStatus?: string;
    search?: string;
  }): Promise<Doctor[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('doctors').select('*').order('full_name', { ascending: true });
        if (filters?.departmentId && filters.departmentId !== 'all') {
          query = query.eq('department_id', filters.departmentId);
        }
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters?.search) {
          query = query.or(`full_name.ilike.%${filters.search}%,specialization.ilike.%${filters.search}%,license_number.ilike.%${filters.search}%`);
        }
        const { data, error } = await query;
        if (!error && data) return data as unknown as Doctor[];
      } catch (err) {
        console.warn('Supabase fetch failed:', err);
      }
    }

    let list = mockStore.getDoctors();
    if (filters?.departmentId && filters.departmentId !== 'all') {
      list = list.filter((d) => d.departmentId === filters.departmentId);
    }
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((d) => d.status === filters.status);
    }
    if (filters?.availabilityStatus && filters.availabilityStatus !== 'all') {
      list = list.filter((d) => d.availabilityStatus === filters.availabilityStatus);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.fullName.toLowerCase().includes(q) ||
          d.specialization.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q) ||
          d.licenseNumber.toLowerCase().includes(q)
      );
    }
    return list;
  },

  /**
   * Retrieves single doctor by ID
   */
  async getDoctorById(id: string): Promise<Doctor | null> {
    return mockStore.getDoctorById(id) || null;
  },

  /**
   * Registers a new doctor with license uniqueness validation
   */
  async createDoctor(data: Omit<Doctor, 'id'>): Promise<Doctor> {
    return mockStore.createDoctor(data);
  },

  /**
   * Updates an existing doctor profile, fees, or schedules
   */
  async updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor> {
    return mockStore.updateDoctor(id, updates);
  },

  /**
   * Toggles doctor active/inactive status
   */
  async toggleStatus(id: string, status: 'active' | 'inactive'): Promise<Doctor> {
    return mockStore.updateDoctor(id, { status });
  },

  /**
   * Retrieves all appointments booked under a specific doctor
   */
  async getDoctorAppointments(doctorId: string): Promise<Appointment[]> {
    return mockStore.getAppointments().filter((a) => a.doctorId === doctorId);
  },
};
