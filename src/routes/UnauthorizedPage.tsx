import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_INFO } from '@/lib/permissions';
import { Badge } from '@/components/ui/Badge';

export function UnauthorizedPage() {
  const location = useLocation();
  const { role, profile } = useAuth();
  const state = location.state as {
    requiredPermission?: string;
    allowedRoles?: string[];
    userRole?: string;
    attemptedPath?: string;
  } | null;

  const roleMeta = ROLE_INFO[role] || { title: role, badgeVariant: 'default' };

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6 max-w-xl mx-auto">
      <div className="h-16 w-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 ring-8 ring-rose-50/50">
        <ShieldAlert className="h-8 w-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
        403 Access Restricted
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
        Clinical Authorization Required
      </h1>

      <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
        Your current staff role does not possess the cryptographic permissions or security clearance
        required to inspect or modify records in this hospital module.
      </p>

      {/* Access Diagnostics Box */}
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-left text-xs space-y-2.5 mb-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
          <span className="font-semibold text-slate-700">Authenticated Staff:</span>
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-slate-900">{profile?.fullName || 'Active Staff'}</span>
            <Badge variant={roleMeta.badgeVariant as any} className="text-[10px]">
              {roleMeta.title}
            </Badge>
          </div>
        </div>

        {state?.attemptedPath && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Attempted Resource:</span>
            <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
              {state.attemptedPath}
            </span>
          </div>
        )}

        {state?.requiredPermission && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Required Privilege:</span>
            <span className="font-mono text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {state.requiredPermission}
            </span>
          </div>
        )}

        {state?.allowedRoles && (
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Permitted Roles:</span>
            <span className="font-medium text-slate-700">
              {state.allowedRoles.join(', ')}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
          leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
        >
          Return to Previous
        </Button>
        <Link to="/dashboard">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Home className="h-3.5 w-3.5" />}
          >
            Go to My Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
