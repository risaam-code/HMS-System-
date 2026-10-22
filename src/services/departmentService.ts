// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — DEPARTMENT MANAGEMENT SERVICE
// ==============================================================================
// Manages hospital departments, location mappings, and bed capacities.
// Enforces integrity constraint preventing deletion of departments linked to historical records.
// ==============================================================================

import { Department } from '@/types';
import { mockStore } from './mockHospitalStore';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const DepartmentService = {
  /**
   * Retrieves all departments
   */
  async getDepartments(filters?: { status?: string; search?: string }): Promise<Department[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('departments').select('*').order('name', { ascending: true });
        if (filters?.status && filters.status !== 'all') {
          query = query.eq('status', filters.status);
        }
        if (filters?.search) {
          query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
        }
        const { data, error } = await query;
        if (!error && data) return data as unknown as Department[];
      } catch (err) {
        console.warn('Supabase fetch failed:', err);
      }
    }

    let list = mockStore.getDepartments();
    if (filters?.status && filters.status !== 'all') {
      list = list.filter((d) => d.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          (d.departmentHead && d.departmentHead.toLowerCase().includes(q))
      );
    }
    return list;
  },

  /**
   * Retrieves single department by ID
   */
  async getDepartmentById(id: string): Promise<Department | null> {
    return mockStore.getDepartmentById(id) || null;
  },

  /**
   * Creates a new department
   */
  async createDepartment(data: Omit<Department, 'id'>): Promise<Department> {
    return mockStore.createDepartment(data);
  },

  /**
   * Updates an existing department
   */
  async updateDepartment(id: string, updates: Partial<Department>): Promise<Department> {
    return mockStore.updateDepartment(id, updates);
  },

  /**
   * Toggles department active/inactive status
   */
  async toggleStatus(id: string, status: 'active' | 'inactive'): Promise<Department> {
    return mockStore.updateDepartment(id, { status });
  },

  /**
   * Deletes department, strictly preventing deletion if historical records (doctors, appointments, OPD) are linked.
   */
  async deleteDepartment(id: string): Promise<{ success: boolean }> {
    return mockStore.deleteDepartment(id);
  },
};
