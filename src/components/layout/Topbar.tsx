import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Plus,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Database,
  User,
  KeyRound,
  CheckCheck,
} from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { CANONICAL_ROLES, ROLE_INFO } from '@/lib/permissions';
import { CanonicalRole, NotificationItem } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { NotificationService } from '@/services/notificationService';

export interface TopbarProps {
  onOpenMobileSidebar: () => void;
  onQuickAction?: (action: 'patient' | 'appointment') => void;
}

export function Topbar({ onOpenMobileSidebar, onQuickAction }: TopbarProps) {
  const navigate = useNavigate();
  const { profile, role, logout, switchSimulatedRole, changePassword, updateProfile } = useAuth();
  const { success, error } = useToast();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Live in-app notifications
  const [liveNotifications, setLiveNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    async function fetchNotifs() {
      try {
        const list = await NotificationService.getNotifications(role);
        setLiveNotifications(list);
      } catch (e) {
        console.error('Failed to load notifications in Topbar', e);
      }
    }
    fetchNotifs();
    const unsub = NotificationService.subscribe(() => {
      fetchNotifs();
    });
    return unsub;
  }, [role]);

  const unreadCount = liveNotifications.filter((n) => !n.isRead).length;

  // Profile modal states
  const [editFullName, setEditFullName] = useState(profile?.fullName || '');
  const [editPhone, setEditPhone] = useState(profile?.phone || '');

  // Password modal states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const supabaseReady = isSupabaseConfigured();
  const roleMeta = ROLE_INFO[role] || { title: role, badgeVariant: 'default' };

  const handleRoleChange = (newRole: CanonicalRole) => {
    switchSimulatedRole(newRole);
    setShowUserMenu(false);
    success(`Active staff role switched to ${ROLE_INFO[newRole].title}`, 'Role Switched');
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    success('You have been signed out of the hospital terminal.', 'Logged Out');
    navigate('/login');
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      error('Password must be at least 8 characters long.', 'Validation Error');
      return;
    }
    if (newPassword !== confirmPassword) {
      error('Passwords do not match.', 'Validation Error');
      return;
    }

    setIsChangingPass(true);
    try {
      await changePassword(newPassword);
      success('Your password has been changed securely.', 'Success');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      error(err.message || 'Failed to change password', 'Error');
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ fullName: editFullName, phone: editPhone });
      success('Staff profile details updated.', 'Profile Saved');
      setShowProfileModal(false);
    } catch (err: any) {
      error(err.message || 'Failed to update profile', 'Error');
    }
  };

  // Avatar initials
  const initials = profile?.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ST';

  return (
    <>
      <header className="sticky top-16 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-xs px-4 sm:px-6">
        {/* Left: Mobile hamburger & Global Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg focus:outline-none"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Global Search Bar */}
          <div className="relative w-full max-w-xs sm:max-w-sm hidden sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="search"
              placeholder="Search MRN, patient, doctor, diagnosis..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 transition-colors focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Right: Actions, Database status, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Supabase Status Pill */}
          <div
            title={
              supabaseReady
                ? 'Connected to Supabase PostgreSQL & Auth'
                : 'Running in Setup Mode (Configure credentials in .env)'
            }
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium select-none bg-slate-50 border-slate-200 text-slate-600"
          >
            <Database className="h-3 w-3 text-slate-500" />
            <span>PostgreSQL</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                supabaseReady ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-[10px] text-slate-500 uppercase font-semibold">
              {supabaseReady ? 'Active' : 'Setup'}
            </span>
          </div>

          {/* Quick Add Action Button */}
          <Button
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => onQuickAction && onQuickAction('appointment')}
          >
            New Appointment
          </Button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative text-slate-600 hover:text-slate-900"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-xl bg-white shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">Hospital Alerts</span>
                    {unreadCount > 0 && (
                      <Badge variant="danger" className="text-[10px]">
                        {unreadCount} New
                      </Badge>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        await NotificationService.markAllAsRead(role);
                        const list = await NotificationService.getNotifications(role);
                        setLiveNotifications(list);
                      }}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-1">
                  {liveNotifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No notifications for your role.
                    </div>
                  ) : (
                    liveNotifications.slice(0, 4).map((notif) => (
                      <div
                        key={notif.id}
                        onClick={async () => {
                          if (!notif.isRead) {
                            await NotificationService.markAsRead(notif.id);
                          }
                          setShowNotifications(false);
                          if (notif.linkUrl) navigate(notif.linkUrl);
                          else navigate('/notifications');
                        }}
                        className={`py-2 px-1.5 rounded-lg text-xs space-y-0.5 cursor-pointer transition-colors ${
                          !notif.isRead ? 'bg-slate-50/80 hover:bg-slate-100 font-medium' : 'hover:bg-slate-50 opacity-80'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold truncate max-w-[190px] ${
                              notif.severity === 'critical'
                                ? 'text-rose-600'
                                : notif.severity === 'warning'
                                ? 'text-amber-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {notif.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View All Notifications ({liveNotifications.length})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
              aria-expanded={showUserMenu}
            >
              <div className="h-8 w-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-blue-100">
                {initials}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 leading-tight">
                  {profile?.fullName || 'Hospital Staff'}
                </span>
                <span className="text-[10px] text-slate-500 capitalize">
                  {roleMeta.title}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{profile?.fullName}</p>
                  <p className="text-[11px] text-slate-500 truncate">{profile?.email}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge variant={roleMeta.badgeVariant as any} className="capitalize text-[10px] px-1.5">
                      {roleMeta.title}
                    </Badge>
                    <span className="text-[10px] text-slate-400 font-medium truncate">
                      {profile?.department || 'Medical Division'}
                    </span>
                  </div>
                </div>

                {/* Role Simulation Switcher for Testing (All 7 Roles) */}
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">
                    Test Role Permissions (RBAC)
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    {CANONICAL_ROLES.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className={`text-left px-2 py-1 rounded capitalize transition-colors ${
                          role === r
                            ? 'bg-blue-600 text-white font-bold'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {r.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Menu Actions */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setEditFullName(profile?.fullName || '');
                      setEditPhone(profile?.phone || '');
                      setShowProfileModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>My Staff Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowPasswordModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  >
                    <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                    <span>Change Password</span>
                  </button>

                  {role === 'administrator' && (
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/audit-logs');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                      <span>Security Audit Log</span>
                    </button>
                  )}
                </div>

                <div className="pt-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-md font-medium transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Staff Profile Modal */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="My Staff Profile"
        description="View your active credential assignments. Contact Administrator for department or role updates."
      >
        <form onSubmit={handleUpdateProfileSubmit} className="space-y-4 pt-1">
          <Input
            label="Staff Full Name"
            value={editFullName}
            onChange={(e) => setEditFullName(e.target.value)}
            required
          />
          <Input
            label="Official Hospital Email"
            value={profile?.email || ''}
            disabled
            helperText="Hospital email is managed centrally by IT administration."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Phone"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+94 77 000 0000"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Current Role (RBAC)
              </label>
              <div className="h-9 px-3 rounded-lg border border-slate-200 bg-slate-100 flex items-center text-xs font-semibold text-slate-700 capitalize">
                {roleMeta.title}
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Roles cannot be altered by users (DB trigger protected).
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowProfileModal(false)}
            >
              Close
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Terminal Password"
        description="Update your authenticated account password. All active sessions will require verification."
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-4 pt-1">
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            required
          />
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordModal(false)}
              disabled={isChangingPass}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isChangingPass}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
