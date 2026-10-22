// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — SUPABASE CLIENT CONFIGURATION
// ==============================================================================
// Safe client initialization with graceful 'Setup Mode' fallback when credentials
// are not yet provided in the environment.
// ==============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * Checks if the environment contains real, non-placeholder Supabase credentials.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }
  const isPlaceholderUrl =
    supabaseUrl.includes('your-project') ||
    supabaseUrl.includes('example.com') ||
    supabaseUrl.trim() === '';
  const isPlaceholderKey =
    supabaseAnonKey.includes('your-anon-publishable-key') ||
    supabaseAnonKey.trim() === '';

  return !isPlaceholderUrl && !isPlaceholderKey;
}

/**
 * Diagnostic status for UI banners and audit views.
 */
export function getSupabaseConfigStatus(): {
  isConfigured: boolean;
  url: string | null;
  message: string;
} {
  const configured = isSupabaseConfigured();
  if (configured) {
    return {
      isConfigured: true,
      url: supabaseUrl || null,
      message: 'Connected to Supabase PostgreSQL & Auth',
    };
  }

  return {
    isConfigured: false,
    url: supabaseUrl || null,
    message:
      'Running in HMS Setup Mode. Connect your Supabase credentials in .env to enable real-time cloud data.',
  };
}

// Fallback dummy URL so createClient does not crash the bundle during initial setup
const effectiveUrl = isSupabaseConfigured()
  ? supabaseUrl!
  : 'https://placeholder-hms.supabase.co';

const effectiveKey = isSupabaseConfigured()
  ? supabaseAnonKey!
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase: SupabaseClient = createClient(effectiveUrl, effectiveKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
