import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginSchema, LoginFormData } from '@/schemas/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { HeartPulse, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { CanonicalRole } from '@/types';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError } = useAuth();
  const { success } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const supabaseReady = isSupabaseConfigured();

  const fromPath = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@medpulse-hospital.org',
      password: 'password123',
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setLocalError(null);
    try {
      await login(data.email, data.password);
      success(`Authenticated successfully as ${data.email}`, 'Signed In');
      navigate(fromPath, { replace: true });
    } catch (err: any) {
      setLocalError(err.message || 'Invalid credentials. Please verify your staff email and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (role: CanonicalRole, email: string) => {
    setValue('email', email);
    setValue('password', 'password123');
    setLocalError(null);
  };

  const errorMessage = localError || authError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Hospital Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white shadow-xl ring-4 ring-white/10">
            <HeartPulse className="h-8 w-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            MedPulse HMS
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Clinical Information & Hospital Administration System
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-slate-700/60 bg-white/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Staff Authentication</CardTitle>
            <CardDescription>
              Enter your hospital credentials or select a verified role preset below.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMessage && (
              <ErrorMessage
                message={errorMessage}
                title="Authentication Failed"
              />
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Staff Email"
                type="email"
                placeholder="doctor@medpulse-hospital.org"
                leftIcon={<Mail className="h-4 w-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  leftIcon={<Lock className="h-4 w-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    {...register('rememberMe')}
                  />
                  <span>Remember session</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full text-sm font-semibold"
              >
                Sign In to Hospital Portal
              </Button>
            </form>

            {/* Quick Demo Credentials for All 7 Hospital Roles */}
            <div className="pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-center">
                Quick Preset Fill (Development & Testing)
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('administrator', 'admin@medpulse-hospital.org')}
                  className="px-1.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 text-center transition-colors text-[10px] font-medium truncate"
                  title="Administrator"
                >
                  Admin
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('doctor', 'dr.vance@medpulse-hospital.org')}
                  className="px-1.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 text-center transition-colors text-[10px] font-medium truncate"
                  title="Doctor"
                >
                  Doctor
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('nurse', 'nurse.miller@medpulse-hospital.org')}
                  className="px-1.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 text-center transition-colors text-[10px] font-medium truncate"
                  title="Nurse"
                >
                  Nurse
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('receptionist', 'admissions@medpulse-hospital.org')}
                  className="px-1.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 text-center transition-colors text-[10px] font-medium truncate"
                  title="Receptionist"
                >
                  Reception
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('laboratory_staff', 'lab.tech@medpulse-hospital.org')}
                  className="px-1.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 text-center transition-colors text-[10px] font-medium truncate"
                  title="Laboratory Staff"
                >
                  Lab Staff
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('pharmacist', 'pharmacy@medpulse-hospital.org')}
                  className="px-1.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 text-center transition-colors text-[10px] font-medium truncate"
                  title="Pharmacist"
                >
                  Pharmacy
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('accountant', 'billing@medpulse-hospital.org')}
                  className="px-1.5 py-1 rounded border border-slate-200 bg-slate-50 text-slate-700 hover:bg-blue-50 hover:border-blue-300 text-center transition-colors text-[10px] font-medium truncate"
                  title="Accountant"
                >
                  Billing
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('administrator', 'admin@medpulse-hospital.org')}
                  className="px-1.5 py-1 rounded border border-dashed border-slate-300 text-slate-500 hover:bg-slate-100 text-center text-[10px] font-medium truncate"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Supabase Status Notice */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  supabaseReady ? 'bg-emerald-500' : 'bg-amber-400'
                }`}
              />
              <span className="truncate">
                {supabaseReady
                  ? 'Connected to Supabase PostgreSQL & Auth'
                  : 'Running in Setup Mode (Preset simulation active)'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-slate-400 leading-relaxed">
          Authorized personnel only. All access attempts and clinical actions are logged in the HIPAA-compliant audit registry.
        </p>
      </div>
    </div>
  );
}
