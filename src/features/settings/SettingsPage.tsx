import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Save, ShieldCheck, Database, Building, BellRing } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export function SettingsPage() {
  const { success } = useToast();
  const supabaseReady = isSupabaseConfigured();

  const [hospitalName, setHospitalName] = useState('St. Jude Memorial Hospital');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [currency, setCurrency] = useState('USD');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    success('System configurations and hospital preferences saved.', 'Settings Updated');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hospital System Settings"
        subtitle="Configure institution profile, security policies, electronic health records standards, and integrations."
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Hospital Entity Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-blue-600" />
              <CardTitle>Institution Profile</CardTitle>
            </div>
            <CardDescription>
              Basic hospital information displayed on patient charts, discharge papers, and invoices
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Hospital Legal Name"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                required
              />
              <Input
                label="Hospital License Number"
                defaultValue="HOSP-CA-99210-A"
                required
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Contact Phone"
                defaultValue="+1 (555) 019-2831"
                required
              />
              <Select
                label="Operating Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={[
                  { label: 'Pacific Time (US & Canada)', value: 'America/Los_Angeles' },
                  { label: 'Eastern Time (US & Canada)', value: 'America/New_York' },
                  { label: 'UTC Universal', value: 'UTC' },
                ]}
              />
              <Select
                label="System Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={[
                  { label: 'USD ($)', value: 'USD' },
                  { label: 'EUR (€)', value: 'EUR' },
                  { label: 'GBP (£)', value: 'GBP' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Supabase & Cloud Backend Integration Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-teal-600" />
              <CardTitle>Supabase PostgreSQL & Cloud Data Link</CardTitle>
            </div>
            <CardDescription>
              Backend connection parameters and environment verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Connection State:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    supabaseReady
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      supabaseReady ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  {supabaseReady ? 'Connected to Supabase' : 'Running in Setup Mode'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                To link a live production Supabase instance, update <code className="px-1 py-0.5 bg-slate-200 rounded font-mono text-[11px]">.env</code> with your Project URL (<code className="text-slate-600 font-mono">VITE_SUPABASE_URL</code>) and publishable anon key (<code className="text-slate-600 font-mono">VITE_SUPABASE_ANON_KEY</code>).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security & Access Policies */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <CardTitle>HIPAA Compliance & Clinical Security Controls</CardTitle>
            </div>
            <CardDescription>
              Enforce security parameters for patient data protection and audit logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Mandatory Multi-Factor Authentication (MFA)
                </span>
                <span className="text-xs text-slate-500">
                  Enforce TOTP or hardware security keys for all physicians and administrative users.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 block">
                  Automatic Terminal Screen Lock
                </span>
                <span className="text-xs text-slate-500">
                  Lock clinical workstations after 15 minutes of inactivity to prevent unauthorized viewing.
                </span>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* Action Save Bar */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<Save className="h-4 w-4" />}
          >
            Save Hospital Settings
          </Button>
        </div>
      </form>
    </div>
  );
}
