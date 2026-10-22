import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

// Route Pages
import { LoginPage } from './LoginPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { ResetPasswordPage } from './ResetPasswordPage';
import { NotFoundPage } from './NotFoundPage';
import { UnauthorizedPage } from './UnauthorizedPage';
import { LoadingPage } from './LoadingPage';

// Feature Modules
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { PatientsPage } from '@/features/patients/PatientsPage';
import { DoctorsPage } from '@/features/doctors/DoctorsPage';
import { DepartmentsPage } from '@/features/departments/DepartmentsPage';
import { AppointmentsPage } from '@/features/appointments/AppointmentsPage';
import { MedicalRecordsPage } from '@/features/medical-records/MedicalRecordsPage';
import { OutpatientPage } from '@/features/outpatient/OutpatientPage';
import { InpatientPage } from '@/features/inpatient/InpatientPage';
import { LaboratoryPage } from '@/features/laboratory/LaboratoryPage';
import { PharmacyPage } from '@/features/pharmacy/PharmacyPage';
import { BillingPage } from '@/features/billing/BillingPage';
import { StaffPage } from '@/features/staff/StaffPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { UsersPage } from '@/features/users/UsersPage';
import { AuditLogsPage } from '@/features/audit-logs/AuditLogsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/loading" element={<LoadingPage />} />

      {/* Hospital Protected Application Layout & RBAC Module Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard (All Staff) */}
        <Route
          path="dashboard"
          element={
            <ProtectedRoute requiredPermission="dashboard:view">
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Patients Registry */}
        <Route
          path="patients"
          element={
            <ProtectedRoute requiredPermission="patients:view">
              <PatientsPage />
            </ProtectedRoute>
          }
        />

        {/* Doctors Directory */}
        <Route
          path="doctors"
          element={
            <ProtectedRoute requiredPermission="doctors:view">
              <DoctorsPage />
            </ProtectedRoute>
          }
        />

        {/* Hospital Departments */}
        <Route
          path="departments"
          element={
            <ProtectedRoute requiredPermission="dashboard:view">
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />

        {/* Appointments Queue */}
        <Route
          path="appointments"
          element={
            <ProtectedRoute requiredPermission="appointments:view">
              <AppointmentsPage />
            </ProtectedRoute>
          }
        />

        {/* Electronic Medical Records (EMR/EHR) */}
        <Route
          path="medical-records"
          element={
            <ProtectedRoute requiredPermission="medical_records:view">
              <MedicalRecordsPage />
            </ProtectedRoute>
          }
        />

        {/* Outpatient Management (OPD) */}
        <Route
          path="outpatient"
          element={
            <ProtectedRoute requiredPermission="appointments:view">
              <OutpatientPage />
            </ProtectedRoute>
          }
        />

        {/* Inpatient Management (IPD & Bed Census) */}
        <Route
          path="inpatient"
          element={
            <ProtectedRoute requiredPermission="inpatient:view">
              <InpatientPage />
            </ProtectedRoute>
          }
        />

        {/* Laboratory Information System (LIS) */}
        <Route
          path="laboratory"
          element={
            <ProtectedRoute requiredPermission="laboratory:view">
              <LaboratoryPage />
            </ProtectedRoute>
          }
        />

        {/* Pharmacy & Formulary */}
        <Route
          path="pharmacy"
          element={
            <ProtectedRoute requiredPermission="pharmacy:view">
              <PharmacyPage />
            </ProtectedRoute>
          }
        />

        {/* Billing, Invoices & Claims */}
        <Route
          path="billing"
          element={
            <ProtectedRoute requiredPermission="billing:view">
              <BillingPage />
            </ProtectedRoute>
          }
        />

        {/* Staff & HR Management (Admin only) */}
        <Route
          path="staff"
          element={
            <ProtectedRoute requiredPermission="staff:view">
              <StaffPage />
            </ProtectedRoute>
          }
        />

        {/* Clinical & Financial Reports */}
        <Route
          path="reports"
          element={
            <ProtectedRoute requiredPermission="reports:view">
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Notifications & Broadcast Alerts */}
        <Route
          path="notifications"
          element={
            <ProtectedRoute requiredPermission="dashboard:view">
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* User Management & RBAC Governance (Admin only) */}
        <Route
          path="users"
          element={
            <ProtectedRoute requiredPermission="users:view">
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* HIPAA Immutable Audit Logs (Admin only) */}
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute requiredPermission="audit_logs:view">
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />

        {/* Hospital Entity Settings (Admin only) */}
        <Route
          path="settings"
          element={
            <ProtectedRoute requiredPermission="settings:manage">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
