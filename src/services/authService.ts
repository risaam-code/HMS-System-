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

// Preset Sri Lankan Hospital Staff Profiles for Offline Development & Fast Role Testing
export const DEMO_STAFF_ACCOUNTS: Record<CanonicalRole, UserProfile> = {
  administrator: {
    id: 'usr-admin-001',
    email: 'admin@lankahealth.lk',
    fullName: 'Dr. Ruwan Ekanayake',
    role: 'administrator',
    roleId: 'administrator',
    department: 'Hospital Administration & IT Directorate',
    phone: '+94 11 269 1111',
    status: 'active',
    createdAt: '2026-01-15T08:00:00Z',
  },
  doctor: {
    id: 'usr-doc-001',
    email: 'dr.senaratne@lankahealth.lk',
    fullName: 'Dr. Janaka Senaratne, MBBS, MD, FRCP',
    role: 'doctor',
    roleId: 'doctor',
    department: 'Cardiology (SLMC: 18492)',
    phone: '+94 77 234 5678',
    status: 'active',
    createdAt: '2026-02-01T08:00:00Z',
  },
  nurse: {
    id: 'usr-nurse-001',
    email: 'nurse.jayawardena@lankahealth.lk',
    fullName: 'Sister Sanduni Jayawardena, RN',
    role: 'nurse',
    roleId: 'nurse',
    department: 'Inpatient ICU & Wards (Ward 04)',
    phone: '+94 71 345 6789',
    status: 'active',
    createdAt: '2026-02-15T08:00:00Z',
  },
  receptionist: {
    id: 'usr-rec-001',
    email: 'reception@lankahealth.lk',
    fullName: 'Kasun Wickramasinghe',
    role: 'receptionist',
    roleId: 'receptionist',
    department: 'OPD Admissions, Channeling & Triage Desk',
    phone: '+94 11 269 3510',
    status: 'active',
    createdAt: '2026-03-01T08:00:00Z',
  },
  laboratory_staff: {
    id: 'usr-lab-001',
    email: 'lab@lankahealth.lk',
    fullName: 'Anita Fernando, MLS (SL)',
    role: 'laboratory_staff',
    roleId: 'laboratory_staff',
    department: 'Pathology & Clinical Biochemistry Lab',
    phone: '+94 76 567 8901',
    status: 'active',
    createdAt: '2026-03-10T08:00:00Z',
  },
  pharmacist: {
    id: 'usr-pharm-001',
    email: 'pharmacy@lankahealth.lk',
    fullName: 'Malith Silva, BPharm (SL)',
    role: 'pharmacist',
    roleId: 'pharmacist',
    department: 'Central Hospital Pharmacy & Formulary',
    phone: '+94 77 678 9012',
    status: 'active',
    createdAt: '2026-03-15T08:00:00Z',
  },
  accountant: {
    id: 'usr-acct-001',
    email: 'billing@lankahealth.lk',
    fullName: 'Nadeeka Perera, CA (SL)',
    role: 'accountant',
    roleId: 'accountant',
    department: 'Billing, Cashier & Insurance (Agrahara/Private)',
    phone: '+94 11 269 4422',
    status: 'active',
    createdAt: '2026-04-01T08:00:00Z',
  },
};

export interface WorkerCredential {
  role: CanonicalRole;
  username: string;
  email: string;
  password: string;
  title: string;
  iconName: string;
  portalName: string;
  profile: UserProfile;
}

export const WORKER_CREDENTIALS: Record<CanonicalRole, WorkerCredential> = {
  doctor: {
    role: 'doctor',
    username: 'doctor',
    email: 'dr.senaratne@lankahealth.lk',
    password: 'doctor123',
    title: 'Consultant Physician / Doctor',
    iconName: 'Stethoscope',
    portalName: "Doctor's Clinical Portal",
    profile: DEMO_STAFF_ACCOUNTS.doctor,
  },
  nurse: {
    role: 'nurse',
    username: 'nurse',
    email: 'nurse.jayawardena@lankahealth.lk',
    password: 'nurse123',
    title: 'Nursing Sister / Ward In-Charge',
    iconName: 'Bed',
    portalName: 'Ward & Inpatient Nursing Portal',
    profile: DEMO_STAFF_ACCOUNTS.nurse,
  },
  pharmacist: {
    role: 'pharmacist',
    username: 'pharmacy',
    email: 'pharmacy@lankahealth.lk',
    password: 'pharmacy123',
    title: 'Hospital Pharmacist',
    iconName: 'Pill',
    portalName: 'Pharmacy & Drug Formulary Portal',
    profile: DEMO_STAFF_ACCOUNTS.pharmacist,
  },
  laboratory_staff: {
    role: 'laboratory_staff',
    username: 'lab',
    email: 'lab@lankahealth.lk',
    password: 'lab123',
    title: 'Laboratory Scientist / Pathologist',
    iconName: 'TestTube2',
    portalName: 'Diagnostic Laboratory Portal',
    profile: DEMO_STAFF_ACCOUNTS.laboratory_staff,
  },
  receptionist: {
    role: 'receptionist',
    username: 'reception',
    email: 'reception@lankahealth.lk',
    password: 'reception123',
    title: 'OPD Reception & Channeling Desk',
    iconName: 'Users',
    portalName: 'OPD Intake & Channeling Portal',
    profile: DEMO_STAFF_ACCOUNTS.receptionist,
  },
  accountant: {
    role: 'accountant',
    username: 'billing',
    email: 'billing@lankahealth.lk',
    password: 'billing123',
    title: 'Hospital Cashier & Revenue Officer',
    iconName: 'Receipt',
    portalName: 'Billing & Cashier Portal (LKR)',
    profile: DEMO_STAFF_ACCOUNTS.accountant,
  },
  administrator: {
    role: 'administrator',
    username: 'superadmin',
    email: 'superadmin@lankahealth.lk',
    password: 'superadmin123',
    title: 'Super Administrator & Medical Director',
    iconName: 'ShieldCheck',
    portalName: 'Executive Hospital Management Portal',
    profile: {
      ...DEMO_STAFF_ACCOUNTS.administrator,
      fullName: 'Dr. Ruwan Ekanayake (Super Admin)',
      isSuperAdmin: true,
    },
  },
};

const SIMULATED_SESSION_STORAGE_KEY = 'lanka_hms_staff_session_v1';

export const AuthService = {
  /**
   * Initializes and restores active session from Supabase Auth or simulated state
   */
  async getInitialSession(): Promise<AuthSessionResult> {
    if (!isSupabaseConfigured()) {
      // Restore simulated session from localStorage
      const savedRole = localStorage.getItem(SIMULATED_SESSION_STORAGE_KEY) as CanonicalRole | null;
      if (!savedRole || !DEMO_STAFF_ACCOUNTS[savedRole]) {
        // No authenticated session found: user must authenticate via LoginPage
        return { user: null, profile: null };
      }
      const demoProfile = {
        ...DEMO_STAFF_ACCOUNTS[savedRole],
        isSuperAdmin: savedRole === 'administrator',
      };
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
   * Authenticates worker using dedicated username / email and password
   */
  async signIn(identifier: string, passwordAttempt: string): Promise<AuthSessionResult> {
    if (!isSupabaseConfigured()) {
      const clean = identifier.toLowerCase().trim();
      
      // Look up worker by username, email, role or superadmin aliases
      let worker = Object.values(WORKER_CREDENTIALS).find(
        (w) =>
          w.username.toLowerCase() === clean ||
          w.email.toLowerCase() === clean ||
          w.role.toLowerCase() === clean
      );

      // Support 'admin' alias for 'superadmin'
      if (!worker && (clean === 'admin' || clean === 'admin@lankahealth.lk' || clean === 'super_admin')) {
        worker = WORKER_CREDENTIALS.administrator;
      }

      if (!worker) {
        throw new Error(`Worker account "${identifier}" not found. Please verify your staff username or email.`);
      }

      // Check password: match worker password, superadmin aliases, or universal fallback
      const passClean = passwordAttempt.trim();
      const isValidPassword =
        passClean === worker.password ||
        (worker.role === 'administrator' && (passClean === 'admin123' || passClean === 'admin@123' || passClean === 'superadmin123')) ||
        passClean === 'password123' ||
        passClean === `${worker.username}123`;

      if (!isValidPassword) {
        throw new Error(`Incorrect password for ${worker.title}. Try "${worker.password}".`);
      }

      const userProfile: UserProfile = {
        ...worker.profile,
        isSuperAdmin: worker.role === 'administrator',
      };

      localStorage.setItem(SIMULATED_SESSION_STORAGE_KEY, worker.role);
      return {
        user: { id: userProfile.id, email: userProfile.email },
        profile: userProfile,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password: passwordAttempt,
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
