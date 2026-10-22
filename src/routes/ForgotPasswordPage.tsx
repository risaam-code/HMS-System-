import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { HeartPulse, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { isSupabaseConfigured } from '@/lib/supabase';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid hospital email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const { success, error } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const supabaseReady = isSupabaseConfigured();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await forgotPassword(data.email);
      setSubmittedEmail(data.email);
      setIsSubmitted(true);
      success('Password reset instructions dispatched.', 'Email Sent');
    } catch (err: any) {
      error(err.message || 'Failed to request password reset', 'Reset Error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Hospital Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white shadow-xl ring-4 ring-white/10">
            <HeartPulse className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            MedPulse HMS
          </h1>
          <p className="text-xs text-slate-300">
            Staff Credential Recovery Portal
          </p>
        </div>

        <Card className="shadow-2xl border-slate-700/60 bg-white/95 backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg">Reset Password</CardTitle>
            <CardDescription>
              Enter your verified staff email to receive a secure cryptographic password reset link.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isSubmitted ? (
              <div className="space-y-4 text-center py-2">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    Instructions Sent
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    If an active hospital account matches <strong className="text-slate-800">{submittedEmail}</strong>, an encrypted reset link has been dispatched.
                  </p>
                </div>
                {!supabaseReady && (
                  <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-xs border border-blue-200 text-left">
                    <p className="font-semibold text-blue-900 mb-0.5">Development Preview Notice:</p>
                    <p>In Setup Mode, you can proceed directly to <Link to="/reset-password" className="underline font-bold text-blue-700">/reset-password</Link> to test the new password form.</p>
                  </div>
                )}
                <div className="pt-2">
                  <Link to="/login">
                    <Button variant="outline" size="sm" className="w-full" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
                      Return to Staff Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Registered Staff Email"
                  type="email"
                  placeholder="doctor@medpulse-hospital.org"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  className="w-full text-sm font-semibold"
                >
                  Send Recovery Link
                </Button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-blue-600 font-medium"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
