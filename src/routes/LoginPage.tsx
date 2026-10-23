import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginSchema, LoginFormData } from '@/schemas/auth';
import { Button } from '@/components/ui/Button';
import {
  HeartPulse,
  Lock,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  KeyRound,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showQuickTips, setShowQuickTips] = useState(false);

  const fromPath = (location.state as any)?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
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
      setLocalError(err.message || 'Invalid credentials. Please verify your username and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (username: string, pass: string) => {
    setValue('email', username);
    setValue('password', pass);
    setLocalError(null);
  };

  const errorMessage = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors duration-200">
      {/* Decorative ambient subtle background glows */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Actions: 1990 Hotline + Instant Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
        <a
          href="tel:1990"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-100 transition-colors"
          title="1990 Suwa Seriya Emergency"
        >
          <PhoneCall className="w-3.5 h-3.5 animate-pulse text-rose-600 dark:text-rose-400" />
          <span>1990</span>
          <span className="hidden sm:inline text-[11px] font-normal text-rose-600/80 dark:text-rose-300/80">Suwa Seriya</span>
        </a>

        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold shadow-xs hover:border-cyan-500 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="text-slate-200 text-xs">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-700" />
              <span className="text-slate-700 text-xs">Dark</span>
            </>
          )}
        </button>
      </div>

      {/* Centered Professional Login Card */}
      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Hospital Branding Header */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100/80 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-900/60 text-xs text-cyan-800 dark:text-cyan-300 font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Sri Lanka National Hospital System</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#049bdb] to-teal-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-4 ring-cyan-500/20">
              <HeartPulse className="h-6 w-6" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                LankaHealth
              </h1>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                Hospital Management System
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xs mx-auto">
            Authorized Clinical & Administrative Staff Sign In
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-5">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Staff Portal Login
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter your assigned username and password to open your role dashboard.
            </p>
          </div>

          {errorMessage && (
            <ErrorMessage
              message={errorMessage}
              title="Authentication Failed"
            />
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username / Staff ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Staff Username or ID *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="e.g. superadmin, doctor, nurse"
                  className="w-full pl-10 pr-3.5 h-11 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-medium transition-colors"
                  {...register('email')}
                />
              </div>
              {errors.email?.message && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password *
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 h-11 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/60 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono transition-colors"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-3 top-1/2 -translate-y-1/2 p-1.5 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="text-xs text-rose-500 mt-1 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Remember session */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400 select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-cyan-600 focus:ring-cyan-500"
                  {...register('rememberMe')}
                />
                <span>Remember me on this device</span>
              </label>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 256-bit Encrypted
              </span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full text-sm font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-md border-0 h-11 rounded-xl flex items-center justify-center gap-2"
            >
              <span>Sign In to Hospital Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Quick Staff Demo Hints Toggle */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowQuickTips(!showQuickTips)}
              className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors py-1 focus:outline-none"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <KeyRound className="w-3.5 h-3.5" />
                Staff Role Accounts (Quick Click)
              </span>
              <span className="text-[11px] text-cyan-600 dark:text-cyan-400">
                {showQuickTips ? 'Hide' : 'Show Accounts'}
              </span>
            </button>

            {showQuickTips && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-xs space-y-2 animate-in fade-in">
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Click any account to auto-fill credentials:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFillDemo('superadmin', 'superadmin123')}
                    className="p-1.5 rounded-lg text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors"
                  >
                    <div className="font-bold text-amber-600 dark:text-amber-400 text-[11px]">👑 Super Admin</div>
                    <div className="text-[10px] text-slate-500">superadmin / superadmin123</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('doctor', 'doctor123')}
                    className="p-1.5 rounded-lg text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors"
                  >
                    <div className="font-bold text-cyan-600 dark:text-cyan-400 text-[11px]">🩺 Doctor</div>
                    <div className="text-[10px] text-slate-500">doctor / doctor123</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('nurse', 'nurse123')}
                    className="p-1.5 rounded-lg text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors"
                  >
                    <div className="font-bold text-teal-600 dark:text-teal-400 text-[11px]">🛏️ Nurse</div>
                    <div className="text-[10px] text-slate-500">nurse / nurse123</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('pharmacy', 'pharmacy123')}
                    className="p-1.5 rounded-lg text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors"
                  >
                    <div className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">💊 Pharmacy</div>
                    <div className="text-[10px] text-slate-500">pharmacy / pharmacy123</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('lab', 'lab123')}
                    className="p-1.5 rounded-lg text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors"
                  >
                    <div className="font-bold text-purple-600 dark:text-purple-400 text-[11px]">🧪 Laboratory</div>
                    <div className="text-[10px] text-slate-500">lab / lab123</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('reception', 'reception123')}
                    className="p-1.5 rounded-lg text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors"
                  >
                    <div className="font-bold text-sky-600 dark:text-sky-400 text-[11px]">👥 Reception</div>
                    <div className="text-[10px] text-slate-500">reception / reception123</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFillDemo('billing', 'billing123')}
                    className="p-1.5 rounded-lg text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 transition-colors col-span-2"
                  >
                    <div className="font-bold text-rose-600 dark:text-rose-400 text-[11px]">💳 Billing Cashier</div>
                    <div className="text-[10px] text-slate-500">billing / billing123</div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <p>
            Emergency Ambulance: <strong className="text-rose-600 dark:text-rose-400">1990 (Suwa Seriya)</strong> • Direct ETU: <strong className="text-slate-700 dark:text-slate-300">+94 11 269 1111</strong>
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Ministry of Health Sri Lanka • LankaHealth National Hospital Enterprise System
          </p>
        </div>
      </div>
    </div>
  );
}
export default LoginPage;
