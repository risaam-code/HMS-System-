import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  HeartPulse,
  PhoneCall,
  User,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Stethoscope,
  Activity,
  Calendar,
  Bed,
  TestTube2,
  Pill,
  Receipt,
  LayoutDashboard,
  Clock,
  Sparkles,
  Sun,
  Moon,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { CANONICAL_ROLES, ROLE_INFO, normalizeRole } from '@/lib/permissions';
import { CanonicalRole } from '@/types';
import { useToast } from '@/components/ui/Toast';

interface NavItemDef {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: CanonicalRole[];
}

// Navigation links dynamically filtered by role (Super Admin sees all)
const allNavItems: NavItemDef[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/patients', label: 'Patients & OPD', icon: Activity, roles: ['administrator', 'doctor', 'nurse', 'receptionist'] },
  { href: '/doctors', label: 'Doctors', icon: Stethoscope, roles: ['administrator', 'receptionist', 'doctor'] },
  { href: '/appointments', label: 'Appointments', icon: Calendar, roles: ['administrator', 'doctor', 'receptionist'] },
  { href: '/inpatient', label: 'Wards & IPD', icon: Bed, roles: ['administrator', 'nurse', 'doctor'] },
  { href: '/laboratory', label: 'Laboratory', icon: TestTube2, roles: ['administrator', 'laboratory_staff', 'doctor'] },
  { href: '/pharmacy', label: 'Pharmacy', icon: Pill, roles: ['administrator', 'pharmacist', 'doctor'] },
  { href: '/billing', label: 'Billing (LKR)', icon: Receipt, roles: ['administrator', 'accountant', 'receptionist'] },
];

export interface NavbarProps {
  onOpenEmergency?: () => void;
  isEmergencyOpen?: boolean;
  onCloseEmergency?: () => void;
}

export function Navbar({ onOpenEmergency, isEmergencyOpen, onCloseEmergency }: NavbarProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, role, isAuthenticated, logout, switchSimulatedRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success } = useToast();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [internalEmergencyOpen, setInternalEmergencyOpen] = useState(false);

  const emergencyModalOpen = isEmergencyOpen !== undefined ? isEmergencyOpen : internalEmergencyOpen;
  const setEmergencyModalOpen = (open: boolean) => {
    if (open) {
      if (onOpenEmergency) onOpenEmergency();
      else setInternalEmergencyOpen(true);
    } else {
      if (onCloseEmergency) onCloseEmergency();
      else setInternalEmergencyOpen(false);
    }
  };

  // Sri Lanka Live Clock state (Asia/Colombo UTC+05:30)
  const [slTime, setSlTime] = useState<string>('');
  const [slDate, setSlDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Colombo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Colombo',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
      setSlTime(timeFormatter.format(now));
      setSlDate(dateFormatter.format(now));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Smooth scroll detection without jumping container widths
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    success('You have signed out of LankaHealth HMS.', 'Logged Out');
    navigate('/login');
  };

  const handleRoleChange = (newRole: CanonicalRole) => {
    switchSimulatedRole(newRole);
    setUserDropdownOpen(false);
    success(`Switched portal to ${ROLE_INFO[newRole]?.title || newRole}`, 'Worker Portal Switched');
  };

  const canonical = normalizeRole(role || 'administrator');
  const isSuperAdmin = Boolean(profile?.isSuperAdmin || canonical === 'administrator');
  const roleMeta = ROLE_INFO[canonical] || { title: role, badgeVariant: 'default' };

  // Super Admin has master access to ALL links.
  // Regular workers only see links relevant to their assigned department.
  const activeNavItems = isSuperAdmin
    ? allNavItems
    : allNavItems.filter((item) => {
        if (!item.roles) return true;
        return item.roles.includes(canonical);
      });

  const initials = isSuperAdmin
    ? 'SA'
    : profile?.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'LK';

  return (
    <>
      {/* Enterprise fixed header: stable height, edge-to-edge alignment with sidebar */}
      <header className="fixed top-0 left-0 right-0 h-16 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/90 dark:border-slate-800 backdrop-blur-md shadow-xs transition-colors duration-200">
        <nav className="w-full max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Brand Logo & Sri Lanka Hospital Name */}
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="flex items-center gap-2.5 group focus:outline-none shrink-0"
          >
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-[#049bdb] to-teal-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-200">
              <HeartPulse className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-extrabold tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                  LankaHealth
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 uppercase tracking-wider">
                  🇱🇰 HMS
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                Sri Lanka National Hospital
              </span>
            </div>
          </Link>

          {/* Center: Live Sri Lanka Real-Time Clock */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold">{slDate}</span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tracking-wider">{slTime}</span>
            <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
              SLST
            </span>
          </div>

          {/* Desktop Navigation Links (Role-tailored for workers, all for Super Admin) */}
          <div className="hidden lg:flex items-center gap-1">
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Actions: Theme Toggle + 1990 Emergency + Worker Profile Dropdown */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Dark Mode / Light Mode Theme Toggle Button - Immediate Contrast */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-colors focus:outline-none"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-slate-700" />
              )}
            </button>

            {/* 1990 Suwa Seriya Ambulance Hotline Pill */}
            <button
              onClick={() => setEmergencyModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-bold transition-colors cursor-pointer"
              title="Sri Lanka 1990 Suwa Seriya Emergency Ambulance"
            >
              <PhoneCall className="h-3 w-3 animate-pulse text-rose-600 dark:text-rose-400" />
              <span>1990</span>
              <span className="hidden xl:inline text-[10px] text-rose-600/80 dark:text-rose-300/80 font-normal">
                Suwa Seriya
              </span>
            </button>

            {/* Authenticated Staff Chip or Login Button */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white transition-colors focus:outline-none"
                >
                  <div className={`h-7 w-7 rounded-lg text-white flex items-center justify-center font-bold text-[11px] ring-1 ring-black/10 dark:ring-white/20 ${
                    isSuperAdmin
                      ? 'bg-gradient-to-tr from-amber-500 to-rose-500 shadow-xs'
                      : 'bg-gradient-to-tr from-cyan-600 to-teal-500 shadow-xs'
                  }`}>
                    {isSuperAdmin ? <Crown className="w-4 h-4 text-white" /> : initials}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight max-w-[120px] truncate">
                      {isSuperAdmin ? 'Super Admin' : (profile?.fullName || 'Staff Member')}
                    </span>
                    <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium capitalize flex items-center gap-1">
                      {isSuperAdmin && <Crown className="w-3 h-3 text-amber-500 dark:text-amber-400" />}
                      {isSuperAdmin ? 'All Access' : roleMeta.title}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                </button>

                {/* Profile Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        {isSuperAdmin && <Crown className="w-4 h-4 text-amber-500" />}
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {isSuperAdmin ? 'Dr. Ruwan Ekanayake (Super Admin)' : profile?.fullName}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{profile?.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${
                          isSuperAdmin
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                            : 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                        }`}>
                          {isSuperAdmin ? 'Super Administrator' : roleMeta.title}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                          {profile?.department || 'Hospital Directorate'}
                        </span>
                      </div>
                    </div>

                    {/* ONLY Super Admin can switch roles on the fly */}
                    {isSuperAdmin && (
                      <div className="py-2 border-b border-slate-100 dark:border-slate-800">
                        <div className="px-3 py-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-500" />
                          Super Admin Role Simulator
                        </div>
                        <div className="grid grid-cols-2 gap-1 px-1 mt-1">
                          {CANONICAL_ROLES.map((r) => {
                            const isCurrent = canonical === r;
                            return (
                              <button
                                key={r}
                                onClick={() => handleRoleChange(r)}
                                className={`text-left px-2 py-1.5 rounded-lg text-[11px] transition-colors truncate ${
                                  isCurrent
                                    ? 'bg-[#049bdb] text-white font-bold'
                                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                              >
                                {ROLE_INFO[r]?.title || r}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Sign out */}
                    <div className="pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign Out of Hospital</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#049bdb] to-teal-500 hover:from-[#0388c1] hover:to-teal-600 text-white text-xs font-semibold shadow-md transition-all"
              >
                <User className="h-3.5 w-3.5" />
                <span>Staff Login</span>
              </Link>
            )}

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Full-Screen Overlay Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-white/98 dark:bg-slate-950/98 backdrop-blur-xl flex flex-col pt-20 px-6 pb-8 lg:hidden animate-in fade-in transition-colors">
          {/* Mobile Live Time Display */}
          <div className="mb-4 p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-900 dark:text-white">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Colombo Time</span>
            </span>
            <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">{slTime}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            <div className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider mb-2">
              Navigation ({isSuperAdmin ? 'Super Admin Master Access' : roleMeta.title})
            </div>
            {activeNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-cyan-600 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Logout */}
          {isAuthenticated && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-semibold text-sm border border-rose-200 dark:border-rose-900"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* 1990 Suwa Seriya Emergency Modal */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl border border-rose-200 dark:border-rose-900/60 p-6 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setEmergencyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                <PhoneCall className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold">1990 Suwa Seriya Sri Lanka</h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">National Emergency Pre-Hospital Ambulance</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Direct emergency dispatch line for patient emergencies across all 9 provinces in Sri Lanka. Free service supported by the Government of Sri Lanka.
            </p>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Ambulance Hotline:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 text-sm font-mono">1990</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Hospital ETU Direct:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">+94 11 269 1111</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">National Poison Center:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">+94 11 268 6143</span>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href="tel:1990"
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-center text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Call 1990 Now
              </a>
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default Navbar;
