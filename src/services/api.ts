// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — CORE SERVICE LAYER
// ==============================================================================
// Centralized data access abstraction separating database queries from UI components.
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  Patient,
  Doctor,
  Appointment,
  DashboardMetric,
} from '@/types';
import {
  mockDashboardMetrics,
  mockRecentAppointments,
} from '@/features/dashboard/mockData';

export const HospitalService = {
  /**
   * Retrieves dashboard summary metrics
   */
  async getDashboardMetrics(): Promise<DashboardMetric[]> {
    if (!isSupabaseConfigured()) {
      return mockDashboardMetrics;
    }

    try {
      // In Part 2, these will aggregate real PostgreSQL counts
      const { data, error } = await supabase.from('hospital_metrics').select('*');
      if (error) throw error;
      return (data as unknown as DashboardMetric[]) || mockDashboardMetrics;
    } catch {
      return mockDashboardMetrics;
    }
  },

  /**
   * Retrieves recent appointments
   */
  async getAppointments(): Promise<Appointment[]> {
    if (!isSupabaseConfigured()) {
      return mockRecentAppointments;
    }

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data as unknown as Appointment[]) || mockRecentAppointments;
    } catch {
      return mockRecentAppointments;
    }
  },

  /**
   * Diagnostic health check for PostgreSQL and Auth connectivity
   */
  async checkHealth(): Promise<{ status: 'connected' | 'setup_mode' | 'error'; message: string }> {
    if (!isSupabaseConfigured()) {
      return {
        status: 'setup_mode',
        message: 'System running with temporary development mock data. Configure .env to link Supabase.',
      };
    }

    try {
      const { error } = await supabase.from('patients').select('id').limit(1);
      if (error && error.code !== 'PGRST116') {
        return {
          status: 'error',
          message: error.message,
        };
      }
      return {
        status: 'connected',
        message: 'PostgreSQL connection healthy.',
      };
    } catch (err: any) {
      return {
        status: 'error',
        message: err.message || 'Unknown network error',
      };
    }
  },
};
