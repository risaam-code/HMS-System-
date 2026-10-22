import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// Maps module path slugs to clean human-readable names
const routeNameMap: Record<string, string> = {
  dashboard: 'Dashboard',
  patients: 'Patients',
  doctors: 'Doctors',
  departments: 'Departments',
  appointments: 'Appointments',
  'medical-records': 'Medical Records',
  outpatient: 'Outpatient Management',
  inpatient: 'Inpatient Management',
  laboratory: 'Laboratory',
  pharmacy: 'Pharmacy',
  billing: 'Billing & Payments',
  staff: 'Staff Management',
  reports: 'Reports & Analytics',
  notifications: 'Notifications',
  users: 'User Management',
  'audit-logs': 'Audit Logs',
  settings: 'Settings',
  login: 'Sign In',
  unauthorized: 'Unauthorized',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || pathnames[0] === 'login') {
    return null;
  }

  return (
    <nav className="flex items-center text-xs text-slate-500 font-medium mb-3 select-none" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1.5 flex-wrap">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="sr-only">Home</span>
          </Link>
        </li>

        {pathnames.map((segment, index) => {
          const isLast = index === pathnames.length - 1;
          const href = `/${pathnames.slice(0, index + 1).join('/')}`;
          const formattedName = routeNameMap[segment] || segment.replace(/-/g, ' ');

          return (
            <React.Fragment key={href}>
              <li className="text-slate-300">
                <ChevronRight className="h-3 w-3" />
              </li>
              <li>
                {isLast ? (
                  <span className="font-semibold text-slate-800 capitalize" aria-current="page">
                    {formattedName}
                  </span>
                ) : (
                  <Link
                    to={href}
                    className="text-slate-500 hover:text-blue-600 capitalize transition-colors"
                  >
                    {formattedName}
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
