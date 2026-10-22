import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  CalendarDays,
  FileText,
  UserPlus,
  BedDouble,
  FlaskConical,
  Pill,
  CreditCard,
  Briefcase,
  BarChart3,
  Bell,
  ShieldCheck,
  History,
  Settings,
  HeartPulse,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { canAccessModule, ROLE_INFO } from '@/lib/permissions';
import { ModuleId } from '@/types';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavSection {
  title: string;
  items: {
    id: ModuleId;
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  }[];
}

const navSections: NavSection[] = [
  {
    title: 'Clinical & Patient Care',
    items: [
      { id: 'dashboard', title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { id: 'patients', title: 'Patients', href: '/patients', icon: Users, badge: '1,420' },
      { id: 'doctors', title: 'Doctors', href: '/doctors', icon: UserCheck },
      { id: 'departments', title: 'Departments', href: '/departments', icon: Building2 },
      { id: 'appointments', title: 'Appointments', href: '/appointments', icon: CalendarDays, badge: '38', badgeVariant: 'info' },
      { id: 'medical-records', title: 'Medical Records', href: '/medical-records', icon: FileText },
    ],
  },
  {
    title: 'Hospital Operations',
    items: [
      { id: 'outpatient', title: 'Outpatient (OPD)', href: '/outpatient', icon: UserPlus },
      { id: 'inpatient', title: 'Inpatient (IPD)', href: '/inpatient', icon: BedDouble, badge: '64 Beds' },
      { id: 'laboratory', title: 'Laboratory', href: '/laboratory', icon: FlaskConical, badge: '12 req', badgeVariant: 'warning' },
      { id: 'pharmacy', title: 'Pharmacy', href: '/pharmacy', icon: Pill, badge: 'Low 4', badgeVariant: 'danger' },
    ],
  },
  {
    title: 'Administration & Finance',
    items: [
      { id: 'billing', title: 'Billing & Payments', href: '/billing', icon: CreditCard },
      { id: 'staff', title: 'Staff Management', href: '/staff', icon: Briefcase },
      { id: 'reports', title: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'System & Governance',
    items: [
      { id: 'notifications', title: 'Notifications', href: '/notifications', icon: Bell, badge: '5', badgeVariant: 'danger' },
      { id: 'users', title: 'User Management', href: '/users', icon: ShieldCheck },
      { id: 'audit-logs', title: 'Audit Logs', href: '/audit-logs', icon: History },
      { id: 'settings', title: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const location = useLocation();
  const { role, profile } = useAuth();
  const roleMeta = ROLE_INFO[role] || { title: role, badgeVariant: 'default' };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar Element */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-200 border-r border-slate-800 transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-teal-500 text-white shadow-md">
              <HeartPulse className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold tracking-tight text-white leading-tight">
                  MedPulse HMS
                </span>
                <span className="text-[10px] uppercase font-semibold text-teal-400 tracking-wider">
                  St. Jude Memorial
                </span>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Active Role Badge */}
        {!isCollapsed && (
          <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex flex-col truncate">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Current Access Role
              </span>
              <span className="text-xs font-semibold text-teal-300 truncate">
                {roleMeta.title}
              </span>
            </div>
            <Badge variant={roleMeta.badgeVariant as any} className="text-[9px] px-1.5 py-0">
              RBAC
            </Badge>
          </div>
        )}

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => {
            return (
              <div key={section.title} className="space-y-1">
                {!isCollapsed && (
                  <h4 className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 select-none">
                    {section.title}
                  </h4>
                )}

                <div className="space-y-0.5 pt-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isPermitted = canAccessModule(role, item.id);
                    const isActive =
                      item.href === '/dashboard'
                        ? location.pathname === '/dashboard' || location.pathname === '/'
                        : location.pathname.startsWith(item.href);

                    if (!isPermitted) {
                      // Render restricted locked item
                      return (
                        <div
                          key={item.id}
                          title={`${item.title} requires additional role clearance (${roleMeta.title} restricted)`}
                          className={cn(
                            'group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 opacity-60 cursor-not-allowed select-none',
                            isCollapsed && 'justify-center px-2'
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-slate-600" />
                          {!isCollapsed && (
                            <div className="flex flex-1 items-center justify-between truncate">
                              <span className="truncate">{item.title}</span>
                              <Lock className="h-3 w-3 text-slate-500 shrink-0" />
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <NavLink
                        key={item.id}
                        to={item.href}
                        onClick={onClose}
                        title={isCollapsed ? item.title : undefined}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors select-none',
                          isActive
                            ? 'bg-blue-600 text-white font-semibold shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white',
                          isCollapsed && 'justify-center px-2'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-4 w-4 shrink-0 transition-transform group-hover:scale-105',
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                          )}
                        />

                        {!isCollapsed && (
                          <div className="flex flex-1 items-center justify-between truncate">
                            <span className="truncate">{item.title}</span>
                            {item.badge && (
                              <Badge
                                variant={item.badgeVariant || 'default'}
                                className={cn(
                                  'text-[10px] px-1.5 py-0 font-semibold h-4',
                                  isActive && 'bg-white/20 text-white border-transparent'
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Toggle */}
        <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-800 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate">{profile?.fullName || 'Active Session'}</span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className={cn(
              'p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors',
              isCollapsed && 'w-full flex justify-center'
            )}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
