import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from './Sidebar';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';

import { MobileBottomNav } from '@/components/MobileBottomNav';

export function AppLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(true); // Default collapsed for clean layout
  const [quickActionModal, setQuickActionModal] = useState<'patient' | 'appointment' | null>(null);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const { success } = useToast();

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    success(
      quickActionModal === 'patient'
        ? 'Patient registration recorded successfully with Sri Lankan NIC verification.'
        : 'Appointment scheduled successfully at LankaHealth clinical desk.',
      'Action Completed'
    );
    setQuickActionModal(null);
  };



  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      {/* Floating Modern Navbar with Live Sri Lanka Clock & Role-Specific Navigation */}
      <Navbar
        onOpenEmergency={() => setEmergencyModalOpen(true)}
        isEmergencyOpen={emergencyModalOpen}
        onCloseEmergency={() => setEmergencyModalOpen(false)}
      />

      {/* Main App Body with Top Offset for Floating Navbar */}
      <div className="flex-1 flex pt-16">
        {/* Sidebar Navigation (Collapsible drawer for deep modules) */}
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
          isCollapsed={desktopCollapsed}
          onToggleCollapse={() => setDesktopCollapsed(!desktopCollapsed)}
        />

        {/* Main Content Layout (Clean, simplified, no stacked topbars) */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${desktopCollapsed ? 'lg:pl-20' : 'lg:pl-64'
            }`}
        >
          {/* Dynamic Route Content with pb-24 on mobile for bottom bar */}
          <main className="flex-1 p-3 sm:p-5 lg:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Phones only, md:hidden) */}
      <MobileBottomNav
        onOpenMenu={() => setMobileSidebarOpen(true)}
        onOpenEmergency={() => setEmergencyModalOpen(true)}
      />

      {/* Quick Action Modal (New Appointment / Patient Intake) */}
      <Modal
        isOpen={quickActionModal !== null}
        onClose={() => setQuickActionModal(null)}
        title={
          quickActionModal === 'patient'
            ? 'Quick Patient Registration (Sri Lanka Formats)'
            : 'Schedule Channeling / Specialist Appointment'
        }
        description="Quick intake form for LankaHealth HMS. Full electronic medical records can be managed within clinical modules."
      >
        <form onSubmit={handleQuickSubmit} className="space-y-4 pt-1">
          {quickActionModal === 'patient' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input label="First Name" required placeholder="e.g. Kanthi" />
                <Input label="Last Name" required placeholder="e.g. Jayasuriya" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Sri Lankan NIC (National ID)"
                  required
                  placeholder="e.g. 198261401290 or 826140129V"
                />
                <Input label="Date of Birth" type="date" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Gender"
                  options={[
                    { label: 'Female', value: 'female' },
                    { label: 'Male', value: 'male' },
                    { label: 'Other', value: 'other' },
                  ]}
                />
                <Select
                  label="Blood Group"
                  options={[
                    { label: 'A+ (Positive)', value: 'A+' },
                    { label: 'B+ (Positive)', value: 'B+' },
                    { label: 'O+ (Positive)', value: 'O+' },
                    { label: 'AB+ (Positive)', value: 'AB+' },
                    { label: 'O- (Universal Donor)', value: 'O-' },
                    { label: 'A- (Negative)', value: 'A-' },
                    { label: 'B- (Negative)', value: 'B-' },
                    { label: 'AB- (Negative)', value: 'AB-' },
                  ]}
                />
              </div>
              <Input
                label="Sri Lankan Phone Number"
                required
                placeholder="e.g. 077 123 4567 or +94 77 123 4567"
              />
              <Input
                label="Residential Address"
                required
                placeholder="e.g. 45/2 Galle Road, Colombo 03"
              />
            </>
          ) : (
            <>
              <Input label="Patient Name or MRN" required placeholder="e.g. MRN-2026-00101" />
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Specialist / Channeling Doctor"
                  options={[
                    { label: 'Dr. Janaka Senaratne (Cardiology)', value: 'doc-001' },
                    { label: 'Dr. Shirani Ranasinghe (Paediatrics)', value: 'doc-002' },
                    { label: 'Dr. Harsha Alwis (Orthopaedics)', value: 'doc-003' },
                    { label: 'Dr. Priyantha Jayasuriya (General OPD)', value: 'doc-004' },
                  ]}
                />
                <Input label="Appointment Date" type="date" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Time Slot"
                  options={[
                    { label: '09:00 AM - 09:30 AM', value: '09:00' },
                    { label: '09:30 AM - 10:00 AM', value: '09:30' },
                    { label: '10:00 AM - 10:30 AM', value: '10:00' },
                    { label: '10:30 AM - 11:00 AM', value: '10:30' },
                  ]}
                />
                <Input label="Consultation Fee (Rs.)" defaultValue="3500" disabled />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuickActionModal(null)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" className="bg-[#049bdb] hover:bg-[#0388c1] text-white">
              Save & Print Token Slip
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
export default AppLayout;
