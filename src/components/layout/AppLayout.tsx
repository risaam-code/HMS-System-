import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

export function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [quickActionModal, setQuickActionModal] = useState<'patient' | 'appointment' | null>(null);
  const { success } = useToast();

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    success(
      quickActionModal === 'patient'
        ? 'Patient registration submitted successfully.'
        : 'Appointment scheduled successfully.',
      'Action Completed'
    );
    setQuickActionModal(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        isCollapsed={desktopCollapsed}
        onToggleCollapse={() => setDesktopCollapsed(!desktopCollapsed)}
      />

      {/* Main Content Layout */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          desktopCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Sticky Topbar */}
        <Topbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onQuickAction={(action) => setQuickActionModal(action)}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Quick Action Modal (New Appointment / Patient) */}
      <Modal
        isOpen={quickActionModal !== null}
        onClose={() => setQuickActionModal(null)}
        title={
          quickActionModal === 'patient'
            ? 'Quick Patient Registration'
            : 'Schedule New Appointment'
        }
        description="Quick intake form. Detailed records can be managed within the respective clinical modules."
      >
        <form onSubmit={handleQuickSubmit} className="space-y-4 pt-1">
          {quickActionModal === 'patient' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" required placeholder="e.g. Eleanor" />
                <Input label="Last Name" required placeholder="e.g. Vance" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date of Birth" type="date" required />
                <Select
                  label="Gender"
                  options={[
                    { label: 'Female', value: 'female' },
                    { label: 'Male', value: 'male' },
                    { label: 'Other', value: 'other' },
                  ]}
                />
              </div>
              <Input label="Contact Phone" type="tel" required placeholder="+1 (555) 000-0000" />
            </>
          ) : (
            <>
              <Input label="Patient Name or MRN" required placeholder="Search patient..." />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Department"
                  options={[
                    { label: 'Cardiology', value: 'cardiology' },
                    { label: 'Neurology', value: 'neurology' },
                    { label: 'Orthopedics', value: 'orthopedics' },
                    { label: 'Pediatrics', value: 'pediatrics' },
                    { label: 'General Surgery', value: 'surgery' },
                  ]}
                />
                <Select
                  label="Attending Doctor"
                  options={[
                    { label: 'Dr. Robert Vance (Cardio)', value: 'doc-1' },
                    { label: 'Dr. Elena Rostova (Neuro)', value: 'doc-2' },
                    { label: 'Dr. Marcus Brody (Ortho)', value: 'doc-3' },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Appointment Date" type="date" required />
                <Input label="Time Slot" type="time" required />
              </div>
            </>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuickActionModal(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Confirm & Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
