import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  PhoneCall,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { normalizeRole } from '@/lib/permissions';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
  onOpenEmergency: () => void;
}

export function MobileBottomNav({ onOpenMenu, onOpenEmergency }: MobileBottomNavProps) {
  const location = useLocation();
  const { role } = useAuth();
  const canonical = normalizeRole(role || 'administrator');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-slate-800 shadow-2xl px-2 py-1 flex items-center justify-around transition-colors">
      {/* 1. Dashboard */}
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all min-w-[56px] min-h-[48px] ${
            isActive
              ? 'text-cyan-600 dark:text-cyan-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Portal</span>
      </NavLink>

      {/* 2. Patients */}
      <NavLink
        to="/patients"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all min-w-[56px] min-h-[48px] ${
            isActive
              ? 'text-cyan-600 dark:text-cyan-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span>Patients</span>
      </NavLink>

      {/* 3. 1990 Emergency (Prominent center pill) */}
      <button
        type="button"
        onClick={onOpenEmergency}
        className="flex flex-col items-center justify-center -mt-3.5 bg-gradient-to-tr from-rose-600 to-red-500 text-white rounded-full h-12 w-12 shadow-lg shadow-rose-600/30 border-2 border-white dark:border-slate-900 active:scale-95 transition-transform"
        aria-label="1990 Emergency Ambulance"
      >
        <PhoneCall className="w-5 h-5 animate-pulse" />
        <span className="text-[9px] font-extrabold uppercase leading-none mt-0.5">1990</span>
      </button>

      {/* 4. Appointments / Queue */}
      <NavLink
        to="/appointments"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold transition-all min-w-[56px] min-h-[48px] ${
            isActive
              ? 'text-cyan-600 dark:text-cyan-400 font-bold scale-105'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`
        }
      >
        <Calendar className="w-5 h-5 mb-0.5" />
        <span>Schedule</span>
      </NavLink>

      {/* 5. More Menu */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white min-w-[56px] min-h-[48px] active:scale-95 transition-all"
        aria-label="Open Navigation Drawer"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>Menu</span>
      </button>
    </nav>
  );
}
export default MobileBottomNav;
