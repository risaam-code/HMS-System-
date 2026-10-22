import React, { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { StaffService } from '@/services/staffService';
import { DepartmentService } from '@/services/departmentService';
import {
  StaffEmployee,
  AttendanceRecord,
  LeaveRequest,
  Department,
  StaffShift,
  AttendanceStatus,
} from '@/types';
import { EmployeeModal } from './EmployeeModal';
import { AttendanceModal } from './AttendanceModal';
import { LeaveRequestModal } from './LeaveRequestModal';
import { LeaveApprovalModal } from './LeaveApprovalModal';
import {
  Users,
  CalendarCheck,
  CalendarDays,
  UserPlus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  Building,
  Briefcase,
  AlertTriangle,
  FileCheck2,
  Phone,
  Mail,
  Shield,
  BarChart3,
  CalendarRange,
} from 'lucide-react';

export function StaffPage() {
  const { role, user, profile } = useAuth();
  const isAdmin = role === 'administrator';

  const [activeTab, setActiveTab] = useState<'directory' | 'attendance' | 'leaves' | 'analytics'>('directory');
  const [staff, setStaff] = useState<StaffEmployee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<StaffEmployee | null>(null);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedStaffForAttendance, setSelectedStaffForAttendance] = useState<string | undefined>();
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaveApprovalModalOpen, setIsLeaveApprovalModalOpen] = useState(false);
  const [selectedLeaveForApproval, setSelectedLeaveForApproval] = useState<LeaveRequest | null>(null);

  // Directory Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');

  // Attendance Filters
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Leave Filters
  const [leaveStatusFilter, setLeaveStatusFilter] = useState('all');

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [staffList, deptList, attList, leaveList] = await Promise.all([
        StaffService.getStaff(undefined, role),
        DepartmentService.getDepartments(),
        StaffService.getAttendance(),
        StaffService.getLeaveRequests(),
      ]);
      setStaff(staffList);
      setDepartments(deptList);
      setAttendance(attList);
      setLeaves(leaveList);
    } catch (err) {
      console.error('Failed to load staff management data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
    const unsubscribe = StaffService.subscribe(() => {
      loadAllData();
    });
    return unsubscribe;
  }, [role]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staff.filter((emp) => {
      if (selectedDept !== 'all' && emp.departmentId !== selectedDept) return false;
      if (selectedRole !== 'all' && emp.role !== selectedRole) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.fullName.toLowerCase().includes(q);
        const matchEmpNum = emp.employeeNumber.toLowerCase().includes(q);
        const matchEmail = emp.email.toLowerCase().includes(q);
        const matchDesig = emp.designation.toLowerCase().includes(q);
        if (!matchName && !matchEmpNum && !matchEmail && !matchDesig) return false;
      }
      return true;
    });
  }, [staff, selectedDept, selectedRole, searchQuery]);

  // Filtered attendance for selected date
  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => a.date === attendanceDate);
  }, [attendance, attendanceDate]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((l) => {
      if (leaveStatusFilter !== 'all' && l.status !== leaveStatusFilter) return false;
      return true;
    });
  }, [leaves, leaveStatusFilter]);

  // Metrics
  const totalEmployees = staff.length;
  const onDutyToday = attendance.filter((a) => a.date === attendanceDate && (a.status === 'present' || a.status === 'late')).length;
  const pendingLeavesCount = leaves.filter((l) => l.status === 'pending').length;
  const activeDepartmentsCount = new Set(staff.map((s) => s.departmentId)).size;

  const handleOpenAddEmployee = () => {
    setEmployeeToEdit(null);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenEditEmployee = (emp: StaffEmployee) => {
    setEmployeeToEdit(emp);
    setIsEmployeeModalOpen(true);
  };

  const handleOpenAttendanceForStaff = (empId?: string) => {
    setSelectedStaffForAttendance(empId);
    setIsAttendanceModalOpen(true);
  };

  const handleOpenReviewLeave = (leave: LeaveRequest) => {
    setSelectedLeaveForApproval(leave);
    setIsLeaveApprovalModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Staff & Human Resources Management"
        subtitle="Employee Directory, Daily Shift Attendance, Leave Administration, and Department Assignments."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenAttendanceForStaff()}
              className="flex items-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              Record Attendance
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeaveModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <CalendarRange className="w-4 h-4 text-indigo-600" />
              Apply for Leave
            </Button>
            {isAdmin && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenAddEmployee}
                className="flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                Register Employee
              </Button>
            )}
          </div>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Staff</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalEmployees}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Active Registered Personnel</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">On Duty Today</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{onDutyToday}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Checked In ({attendanceDate})</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Leaves</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingLeavesCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting Review</p>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <CalendarDays className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Departments Covered</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{activeDepartmentsCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Clinical & Administrative</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
            <Building className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 pt-3 flex items-center gap-6">
        <button
          onClick={() => setActiveTab('directory')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'directory'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          Staff Directory ({staff.length})
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'attendance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          Daily Attendance ({filteredAttendance.length})
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'leaves'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Leave Requests
          {pendingLeavesCount > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingLeavesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Department Breakdown & Reports
        </button>
      </div>

      {/* Tab 1: Staff Directory */}
      {activeTab === 'directory' && (
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm p-4 space-y-4 -mt-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex-1 w-full md:w-auto relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search staff by name, employee ID, title, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <Select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-44 text-xs"
                options={[
                  { value: 'all', label: 'All Departments' },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
              />
              <Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-44 text-xs"
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'doctor', label: 'Doctors' },
                  { value: 'nurse', label: 'Nurses' },
                  { value: 'pharmacist', label: 'Pharmacists' },
                  { value: 'laboratory_technician', label: 'Lab Techs' },
                  { value: 'accountant', label: 'Accountants' },
                  { value: 'receptionist', label: 'Receptionists' },
                  { value: 'administrator', label: 'Administrators' },
                ]}
              />
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-3">Role & Dept</th>
                  <th className="py-3 px-3">Shift & Type</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Status</th>
                  {isAdmin && (
                    <th className="py-3 px-3">
                      <span className="flex items-center gap-1 text-amber-900 font-bold">
                        <Lock className="w-3 h-3 text-amber-700" />
                        Salary (Confidential)
                      </span>
                    </th>
                  )}
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-slate-400">
                      No staff members match the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{emp.fullName}</div>
                        <div className="font-mono text-[11px] text-blue-600 font-medium">
                          {emp.employeeNumber}
                        </div>
                        <div className="text-[11px] text-slate-500">{emp.designation}</div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            emp.role === 'doctor'
                              ? 'info'
                              : emp.role === 'nurse'
                              ? 'success'
                              : emp.role === 'pharmacist'
                              ? 'warning'
                              : emp.role === 'laboratory_technician'
                              ? 'secondary'
                              : emp.role === 'administrator'
                              ? 'destructive'
                              : 'default'
                          }
                          size="sm"
                          className="capitalize mb-1"
                        >
                          {emp.role.replace('_', ' ')}
                        </Badge>
                        <div className="text-slate-700 font-medium">{emp.departmentName}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800">{emp.shift} Shift</div>
                        <div className="text-[11px] text-slate-500 capitalize">
                          {emp.employmentType.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {emp.phone}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate max-w-[160px]">
                          <Mail className="w-3 h-3 text-slate-400" />
                          {emp.email}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            emp.status === 'active'
                              ? 'success'
                              : emp.status === 'on_leave'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {emp.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-3">
                          {emp.salary != null ? (
                            <span className="font-mono font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              ${emp.salary.toLocaleString()}/yr
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not set</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenAttendanceForStaff(emp.id)}
                            title="Mark Attendance"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Punch
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditEmployee(emp)}
                            >
                              Edit
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Attendance Roster */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm p-4 space-y-4 -mt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-semibold text-slate-900 text-sm">Shift Attendance Log</span>
                <p className="text-[11px] text-slate-500">
                  Showing recorded shifts and biometric punches for {attendanceDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-slate-700">Filter Date:</label>
              <Input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="w-40 text-xs"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenAttendanceForStaff()}
                className="flex items-center gap-1.5"
              >
                <Clock className="w-4 h-4" />
                Add Record
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Assigned Shift</th>
                  <th className="py-3 px-3">Check In</th>
                  <th className="py-3 px-3">Check Out</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4">Notes / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No attendance entries recorded for {attendanceDate}. Click "Add Record" to check in staff.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block">{rec.employeeName}</span>
                        <span className="font-mono text-[11px] text-slate-500">{rec.employeeNumber}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">{rec.departmentName}</td>
                      <td className="py-3 px-3 text-slate-700">{rec.shift || 'Morning'} Shift</td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">
                        {rec.checkInTime || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">
                        {rec.checkOutTime || '—'}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            rec.status === 'present'
                              ? 'success'
                              : rec.status === 'late'
                              ? 'warning'
                              : rec.status === 'on_leave'
                              ? 'info'
                              : 'danger'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {rec.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{rec.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Leave Requests */}
      {activeTab === 'leaves' && (
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm p-4 space-y-4 -mt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <div>
                <span className="font-semibold text-slate-900 text-sm">Personnel Leave Requests</span>
                <p className="text-[11px] text-slate-500">
                  Track employee vacation, sick time, and administrative leaves
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={leaveStatusFilter}
                onChange={(e) => setLeaveStatusFilter(e.target.value)}
                className="w-36 text-xs"
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsLeaveModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <CalendarRange className="w-4 h-4" />
                Apply for Leave
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Leave #</th>
                  <th className="py-3 px-3">Applicant</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Leave Type</th>
                  <th className="py-3 px-3">Date Range</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No leave records match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredLeaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-indigo-600">
                        {leave.leaveNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{leave.employeeName}</td>
                      <td className="py-3 px-3 text-slate-700">{leave.departmentName}</td>
                      <td className="py-3 px-3 capitalize font-medium text-slate-800">
                        {leave.leaveType}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {leave.startDate} to {leave.endDate}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {leave.daysCount} day{leave.daysCount !== 1 ? 's' : ''}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={leave.reason}>
                        {leave.reason}
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            leave.status === 'approved'
                              ? 'success'
                              : leave.status === 'rejected'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                          className="capitalize"
                        >
                          {leave.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isAdmin && leave.status === 'pending' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenReviewLeave(leave)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs py-1 px-2.5"
                          >
                            Review
                          </Button>
                        ) : leave.reviewedByName ? (
                          <span className="text-[11px] text-slate-400">
                            By {leave.reviewedByName}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Analytics & Department Breakdown */}
      {activeTab === 'analytics' && (
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-sm p-5 space-y-6 -mt-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Staff Distribution by Department</h3>
            <p className="text-xs text-slate-500">Personnel allocation across clinical wings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const deptStaff = staff.filter((s) => s.departmentId === dept.id);
              return (
                <div key={dept.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <span className="font-semibold text-slate-800 text-sm">{dept.name}</span>
                    <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {dept.code}
                    </span>
                  </div>
                  <div className="pt-3 flex justify-between items-center text-xs">
                    <span className="text-slate-500">Active Staff:</span>
                    <span className="font-bold text-slate-900 text-base">{deptStaff.length}</span>
                  </div>
                  <div className="pt-2 text-[11px] text-slate-500">
                    {deptStaff.map((s) => s.fullName).slice(0, 3).join(', ')}
                    {deptStaff.length > 3 ? ` + ${deptStaff.length - 3} more` : ''}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-slate-200 pt-5">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Shift Coverage Matrix</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {(['Morning', 'Evening', 'Night', 'Rotating'] as StaffShift[]).map((sh) => {
                const count = staff.filter((s) => s.shift === sh).length;
                return (
                  <div key={sh} className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                    <p className="text-xs text-slate-500 font-medium">{sh} Shift</p>
                    <p className="text-xl font-bold text-slate-900 mt-1">{count}</p>
                    <p className="text-[11px] text-slate-400">Personnel</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSuccess={loadAllData}
        employeeToEdit={employeeToEdit}
        currentUserRole={role}
      />

      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        onSuccess={loadAllData}
        initialEmployeeId={selectedStaffForAttendance}
        initialDate={attendanceDate}
      />

      <LeaveRequestModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onSuccess={loadAllData}
      />

      <LeaveApprovalModal
        isOpen={isLeaveApprovalModalOpen}
        onClose={() => setIsLeaveApprovalModalOpen(false)}
        onSuccess={loadAllData}
        leaveRequest={selectedLeaveForApproval}
        reviewerId={user?.id || 'admin-1'}
        reviewerName={profile?.fullName || 'Hospital Administrator'}
      />
    </div>
  );
}
