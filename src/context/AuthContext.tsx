import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, CanonicalRole, UserRole, PermissionName } from '@/types';
import { AuthService } from '@/services/authService';
import { AuditService } from '@/services/auditService';
import {
  hasPermission as checkPermission,
  ROLE_PERMISSIONS,
  normalizeRole,
} from '@/lib/permissions';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  role: CanonicalRole;
  permissions: PermissionName[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  switchSimulatedRole: (newRole: CanonicalRole) => void;
  hasPermission: (permission: PermissionName) => boolean;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const activeRole: CanonicalRole = profile ? profile.roleId : 'doctor';
  const activePermissions: PermissionName[] = ROLE_PERMISSIONS[activeRole] || [];

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        setIsLoading(true);
        const sessionResult = await AuthService.getInitialSession();
        if (isMounted) {
          setUser(sessionResult.user);
          setProfile(sessionResult.profile);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to initialize session');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    // Listen to real Supabase auth state changes if configured
    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!isMounted) return;

          if (event === 'SIGNED_IN' && session?.user) {
            setUser({ id: session.user.id, email: session.user.email || '' });
            const p = await AuthService.getUserProfile(session.user.id, session.user.email);
            setProfile(p);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            setUser({ id: session.user.id, email: session.user.email || '' });
          }
        }
      );

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await AuthService.signIn(email, password);
      setUser(result.user);
      setProfile(result.profile);

      // Audit user login
      if (result.profile) {
        await AuditService.log({
          actorId: result.profile.id,
          actorEmail: result.profile.email,
          actorRole: result.profile.roleId,
          action: 'USER_LOGIN',
          targetTable: 'auth.users',
          recordId: result.profile.id,
          ipAddress: '127.0.0.1 (Terminal)',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Invalid staff email or password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    if (profile) {
      await AuditService.log({
        actorId: profile.id,
        actorEmail: profile.email,
        actorRole: profile.roleId,
        action: 'USER_LOGOUT',
        targetTable: 'auth.users',
        recordId: profile.id,
      });
    }

    await AuthService.signOut();
    setUser(null);
    setProfile(null);
  }, [profile]);

  const forgotPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await AuthService.requestPasswordReset(email);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch reset email');
      throw err;
    }
  }, []);

  const resetPassword = useCallback(async (newPassword: string) => {
    setError(null);
    try {
      await AuthService.updatePassword(newPassword);
      if (profile) {
        await AuditService.log({
          actorId: profile.id,
          actorEmail: profile.email,
          actorRole: profile.roleId,
          action: 'USER_PASSWORD_RESET',
          targetTable: 'auth.users',
          recordId: profile.id,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
      throw err;
    }
  }, [profile]);

  const changePassword = useCallback(async (newPassword: string) => {
    await resetPassword(newPassword);
  }, [resetPassword]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!profile) return;
    try {
      await AuthService.updateProfile(profile.id, updates);
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));

      await AuditService.log({
        actorId: profile.id,
        actorEmail: profile.email,
        actorRole: profile.roleId,
        action: 'USER_PROFILE_UPDATED',
        targetTable: 'profiles',
        recordId: profile.id,
        newValues: updates,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
      throw err;
    }
  }, [profile]);

  const switchSimulatedRole = useCallback((newRole: CanonicalRole) => {
    const updated = AuthService.setSimulatedRole(newRole);
    setUser({ id: updated.id, email: updated.email });
    setProfile(updated);
  }, []);

  const hasPermission = useCallback((permission: PermissionName): boolean => {
    return checkPermission(activeRole, permission);
  }, [activeRole]);

  const hasRole = useCallback((roles: UserRole | UserRole[]): boolean => {
    const list = Array.isArray(roles) ? roles : [roles];
    const canonicalList = list.map(normalizeRole);
    return canonicalList.includes(activeRole);
  }, [activeRole]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: activeRole,
        permissions: activePermissions,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        forgotPassword,
        resetPassword,
        changePassword,
        updateProfile,
        switchSimulatedRole,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
