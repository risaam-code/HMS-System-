import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { CanonicalRole } from '@/types';
import { normalizeRole } from '@/lib/permissions';
import { DoctorPortal } from './portals/DoctorPortal';
import { NursePortal } from './portals/NursePortal';
import { PharmacyPortal } from './portals/PharmacyPortal';
import { LaboratoryPortal } from './portals/LaboratoryPortal';
import { ReceptionPortal } from './portals/ReceptionPortal';
import { BillingPortal } from './portals/BillingPortal';
import { AdminPortal } from './portals/AdminPortal';
import {
  Stethoscope,
  Bed,
  Pill,
  TestTube2,
  Users,
  CreditCard,
  ShieldCheck,
  Layers,
  Crown,
} from 'lucide-react';

const portalTabs = [
  { role: 'administrator' as CanonicalRole, label: 'Super Admin Overview', icon: ShieldCheck, color: 'text-blue-500 dark:text-blue-400' },
  { role: 'doctor' as CanonicalRole, label: 'Doctor OPD', icon: Stethoscope, color: 'text-cyan-500 dark:text-cyan-400' },
  { role: 'nurse' as CanonicalRole, label: 'Ward Nurse', icon: Bed, color: 'text-teal-500 dark:text-teal-400' },
  { role: 'pharmacist' as CanonicalRole, label: 'Pharmacy', icon: Pill, color: 'text-emerald-500 dark:text-emerald-400' },
  { role: 'laboratory_staff' as CanonicalRole, label: 'Laboratory', icon: TestTube2, color: 'text-purple-500 dark:text-purple-400' },
  { role: 'receptionist' as CanonicalRole, label: 'Reception', icon: Users, color: 'text-sky-500 dark:text-sky-400' },
  { role: 'accountant' as CanonicalRole, label: 'Billing Cashier', icon: CreditCard, color: 'text-amber-500 dark:text-amber-400' },
];

export function DashboardPage() {
  const { role, profile } = useAuth();
  const canonical = normalizeRole(role || 'administrator');
  const isSuperAdmin = Boolean(profile?.isSuperAdmin || canonical === 'administrator');

  // For regular workers, active portal is strictly their assigned role.
  // Super Admin can switch to preview and manage any department portal on the fly.
  const [activePortalRole, setActivePortalRole] = useState<CanonicalRole>(canonical);

  // Sync if logged-in role changes
  React.useEffect(() => {
    setActivePortalRole(canonical);
  }, [canonical]);

  const renderActivePortal = () => {
    const targetRole = isSuperAdmin ? activePortalRole : canonical;
    switch (targetRole) {
      case 'doctor':
        return <DoctorPortal />;
      case 'nurse':
        return <NursePortal />;
      case 'pharmacist':
        return <PharmacyPortal />;
      case 'laboratory_staff':
        return <LaboratoryPortal />;
      case 'receptionist':
        return <ReceptionPortal />;
      case 'accountant':
        return <BillingPortal />;
      case 'administrator':
      default:
        return <AdminPortal />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Super Admin Master Access Switcher: Only displayed when logged in as Super Admin */}
      {isSuperAdmin && (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-2 sm:p-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 pl-1 sm:pl-2 text-xs font-bold text-slate-800 dark:text-slate-200 shrink-0">
            <Crown className="w-4 h-4 text-amber-500 animate-pulse" />
            <span>Super Admin Portals:</span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1 w-full sm:w-auto no-scrollbar scroll-smooth">
            {portalTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activePortalRole === tab.role;

              return (
                <button
                  key={tab.role}
                  onClick={() => setActivePortalRole(tab.role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap h-9 shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-cyan-600 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Render the worker's dedicated portal */}
      <div className="transition-opacity duration-200 ease-in-out">
        {renderActivePortal()}
      </div>
    </div>
  );
}
export default DashboardPage;
