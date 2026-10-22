import React from 'react';
import { ModulePlaceholder } from '@/features/common/ModulePlaceholder';
import { ColumnDef } from '@/types';

interface SystemUserItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department: string;
  twoFactorEnabled: boolean;
  lastLogin: string;
  status: 'active' | 'suspended';
}

const mockUsers: SystemUserItem[] = [
  { id: 'usr-1', fullName: 'Dr. Robert Vance', email: 'dr.vance@medpulse-hospital.org', role: 'Doctor (CMO)', department: 'Cardiology', twoFactorEnabled: true, lastLogin: '2026-10-20 08:15 AM', status: 'active' },
  { id: 'usr-2', fullName: 'Alexander Hamilton', email: 'admin@medpulse-hospital.org', role: 'System Administrator', department: 'IT & Security', twoFactorEnabled: true, lastLogin: '2026-10-20 07:45 AM', status: 'active' },
  { id: 'usr-3', fullName: 'David Kowalski', email: 'pharmacy@medpulse-hospital.org', role: 'Pharmacist', department: 'Pharmacy', twoFactorEnabled: false, lastLogin: '2026-10-19 06:12 PM', status: 'active' },
  { id: 'usr-4', fullName: 'Anita Desai', email: 'lab.tech@medpulse-hospital.org', role: 'Lab Technician', department: 'Laboratory', twoFactorEnabled: true, lastLogin: '2026-10-20 08:30 AM', status: 'active' },
];

export function UsersPage() {
  const columns: ColumnDef<SystemUserItem>[] = [
    {
      key: 'fullName',
      header: 'User Account',
      sortable: true,
      render: (u) => (
        <div>
          <span className="font-semibold text-slate-900 block">{u.fullName}</span>
          <span className="text-[11px] text-slate-500 font-mono">{u.email}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Assigned Role',
      sortable: true,
      render: (u) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {u.role}
        </span>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (u) => <span className="text-slate-700 font-medium">{u.department}</span>,
    },
    {
      key: 'twoFactorEnabled',
      header: '2FA Auth',
      render: (u) => (
        <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold ${
          u.twoFactorEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
        }`}>
          {u.twoFactorEnabled ? 'Enabled' : 'Disabled'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Authentication',
      sortable: true,
      render: (u) => <span className="text-slate-500">{u.lastLogin}</span>,
    },
    {
      key: 'status',
      header: 'Account Status',
      sortable: true,
      render: (u) => (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="capitalize">{u.status}</span>
        </span>
      ),
    },
  ];

  return (
    <ModulePlaceholder
      moduleId="users"
      title="User Management & Role Permissions (RBAC)"
      subtitle="Identity lifecycle, password policies, multi-factor authentication (MFA), and departmental roles."
      category="Security & Access"
      plannedFeatures={[
        'Role-Based Access Control (RBAC) Fine-Grained Permissions',
        'Supabase Auth Invite & Password Reset Pipeline',
        'Session Revocation & Active Token Auditing',
        'Clinical Digital Signature Management',
      ]}
      previewData={mockUsers}
      previewColumns={columns}
      searchKey="fullName"
    />
  );
}
