// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — AUTHENTICATION SERVICE
// ==============================================================================
// Handles Supabase Auth workflows: Login, Logout, Password Reset, Profile Hydration.
// Resiliently falls back to simulated staff sessions when running in Setup Mode.
// ==============================================================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile, CanonicalRole } from '@/types';
import { normalizeRole } from '@/lib/permissions';

export interface AuthSessionResult {
  user: {
    id: string;
    email: string;
  } | null;
  profile: UserProfile | null;
}

// Preset Staff Profiles for Offline Development & Fast Role Testing
export const DEMO_STAFF_ACCOUNTS: Record<CanonicalRole, UserProfile> = {
  administrator: {
    id: 'usr-admin-001',
    email: 'admin@medpulse-hospital.org',
    fullName: 'Alexander Hamilton',
    role: 'administrator',
    roleId: 'administrator',
    department: 'Hospital Administration & IT',
    phone: '+1 (555) 100-0001',
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z',
  },
  doctor: {
    id: 'usr-doc-001',
    email: 'dr.vance@medpulse-hospital.org',
    fullName: 'Dr. Robert Vance, MD',
    role: 'doctor',
    roleId: 'doctor',
    department: 'Cardiology',
    phone: '+1 (555) 200-0002',
    status: 'active',
    createdAt: '2026-02-01T08:00:00Z',
  },
  nurse: {
    id: 'usr-nurse-001',
    email: 'nurse.miller@medpulse-hospital.org',
    fullName: 'Nurse Beatrice Miller, RN',
    role: 'nurse',
    roleId: 'nurse',
    department: 'Inpatient ICU & Wards',
    phone: '+1 (555) 300-0003',
    status: 'active',
    createdAt: '2026-02-15T08:00:00Z',
  },
  receptionist: {
    id: 'usr-rec-001',
    email: 'admissions@medpulse-hospital.org',
    fullName: 'Marcus Young',
    role: 'receptionist',
    roleId: 'receptionist',
    department: 'Outpatient Reception & Triage',
    phone: '+1 (555) 400-0004',
    status: 'active',
    createdAt: '2026-03-01T08:00:00Z',
  },
  laboratory_staff: {
    id: 'usr-lab-001',
    email: 'lab.tech@medpulse-hospital.org',
    fullName: 'Anita Desai, MLS',
    role: 'laboratory_staff',
    roleId: 'laboratory_staff',
    department: 'Pathology & Hematology Lab',
    phone: '+1 (555) 500-0005',
    status: 'active',
    createdAt: '2026-03-10T08:00:00Z',
  },
  pharmacist: {
    id: 'usr-pharm-001',
    email: 'pharmacy@medpulse-hospital.org',
    fullName: 'David Kowalski, PharmD',
    role: 'pharmacist',
    roleId: 'pharmacist',
    department: 'Central Hospital Pharmacy',
    phone: '+1 (555) 600-0006',
    status: 'active',
    createdAt: '2026-03-15T08:00:00Z',
  },
  accountant: {
    id: 'usr-acct-001',
    email: 'billing@medpulse-hospital.org',
    fullName: 'Eleanor Sterling, CPA',
    role: 'accountant',
    roleId: 'accountant',
    department: 'Patient Billing & Finance',
    phone: '+1 (555) 700-0007',
    status: 'active',
    createdAt: '2026-04-01T08:00:00Z',
  },
};

const SIMULATED_SESSION_STORAGE_KEY = 'medpulse_hms_simulated_session';

export const AuthService = {
  /**
   * Initializes and restores active session from Supabase Auth or simulated state
   */
  async getInitialSession(): Promise<AuthSessionResult> {
    if (!isSupabaseConfigured()) {
      // Restore simulated session from localStorage
      const savedRole = localStorage.getItem(SIMULATED_SESSION_STORAGE_KEY) as CanonicalRole | null;
      const targetRole = savedRole && DEMO_STAFF_ACCOUNTS[savedRole] ? savedRole : 'administrator';
      const demoProfile = DEMO_STAFF_ACCOUNTS[targetRole];
      return {
        user: { id: demoProfile.id, email: demoProfile.email },
        profile: demoProfile,
      };
    }

    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user) {
        return { user: null, profile: null };
      }

      const profile = await this.getUserProfile(session.user.id, session.user.email);
      return {
        user: { id: session.user.id, email: session.user.email || '' },
        profile,
      };
    } catch {
      return { user: null, profile: null };
    }
  },

  /**
   * Authenticates user using Supabase Email/Password
   */
  async signIn(email: string, password: string): Promise<AuthSessionResult> {
    if (!isSupabaseConfigured()) {
      // Match demo account or default to administrator
      const matched = Object.values(DEMO_STAFF_ACCOUNTS).find(
        (a) => a.email.toLowerCase() === email.toLowerCase()
      ) || DEMO_STAFF_ACCOUNTS.administrator;

      localStorage.setItem(SIMULATED_SESSION_STORAGE_KEY, matched.roleId);
      return {
        user: { id: matched.id, email: matched.email },
        profile: matched,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Authentication succeeded but user identity was missing.');
    }

    const profile = await this.getUserProfile(data.user.id, data.user.email);
    return {
      user: { id: data.user.id, email: data.user.email || '' },
      profile,
    };
  },

  /**
   * Signs the user out of the active session
   */
  async signOut(): Promise<void> {
    if (!isSupabaseConfigured()) {
      localStorage.removeItem(SIMULATED_SESSION_STORAGE_KEY);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Dispatches Supabase password reset email with secure recovery link
   */
  async requestPasswordReset(email: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      // Simulated response
      return;
    }

    const redirectUrl = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Updates authenticated user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Fetches user profile from public.profiles table
   */
  async getUserProfile(userId: string, emailFallback?: string): Promise<UserProfile> {
    if (!isSupabaseConfigured()) {
      return DEMO_STAFF_ACCOUNTS.administrator;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Safe fallback profile if record is being provisioned
      const roleId = normalizeRole('doctor');
      return {
        id: userId,
        email: emailFallback || 'staff@medpulse-hospital.org',
        fullName: emailFallback ? emailFallback.split('@')[0] : 'Hospital Staff',
        role: roleId,
        roleId,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
    }

    const roleId = normalizeRole(data.role_id || data.role);
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name || 'Hospital Staff',
      role: roleId,
      roleId,
      department: data.department,
      phone: data.phone,
      avatarUrl: data.avatar_url,
      status: data.status || 'active',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Updates non-role user profile fields
   */
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    if (!isSupabaseConfigured()) {
      return;
    }

    // Role cannot be updated here (enforced by RLS & DB trigger)
    const payload: Record<string, any> = {};
    if (updates.fullName) payload.full_name = updates.fullName;
    if (updates.phone) payload.phone = updates.phone;
    if (updates.avatarUrl) payload.avatar_url = updates.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Switches simulated role in Setup Mode for quick UI and testing verification
   */
  setSimulatedRole(role: CanonicalRole): UserProfile {
    const canonical = normalizeRole(role);
    const profile = DEMO_STAFF_ACCOUNTS[canonical] || DEMO_STAFF_ACCOUNTS.administrator;
    localStorage.setItem(SIMULATED_SESSION_STORAGE_KEY, canonical);
    return profile;
  },
};
