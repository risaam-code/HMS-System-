import { mockStore } from './mockHospitalStore';
import {
  StaffEmployee,
  AttendanceRecord,
  LeaveRequest,
  EmploymentType,
  EmploymentStatus,
  StaffShift,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
} from '@/types';

export const StaffService = {
  async getStaff(departmentId?: string, currentUserRole?: string): Promise<StaffEmployee[]> {
    const list = mockStore.getStaff(departmentId);
    // Confidentiality guard: Only administrator / HR can view sensitive salary compensation
    if (currentUserRole !== 'administrator') {
      return Promise.resolve(list.map((emp) => ({ ...emp, salary: undefined })));
    }
    return Promise.resolve(list);
  },

  async getStaffById(id: string, currentUserRole?: string): Promise<StaffEmployee | undefined> {
    const emp = mockStore.getStaffById(id);
    if (!emp) return undefined;
    if (currentUserRole !== 'administrator') {
      return Promise.resolve({ ...emp, salary: undefined });
    }
    return Promise.resolve(emp);
  },

  async addStaff(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
    departmentId: string;
    departmentName: string;
    designation: string;
    employmentType: EmploymentType;
    shift: StaffShift;
    hireDate: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    salary?: number;
    notes?: string;
  }): Promise<StaffEmployee> {
    return Promise.resolve(mockStore.addStaff(data));
  },

  async updateStaff(id: string, updates: Partial<StaffEmployee>): Promise<StaffEmployee> {
    return Promise.resolve(mockStore.updateStaff(id, updates));
  },

  async getAttendance(date?: string, employeeId?: string): Promise<AttendanceRecord[]> {
    return Promise.resolve(mockStore.getAttendance(date, employeeId));
  },

  async recordAttendance(data: {
    employeeId: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: AttendanceStatus;
    notes?: string;
  }): Promise<AttendanceRecord> {
    return Promise.resolve(mockStore.recordAttendance(data));
  },

  async getLeaveRequests(employeeId?: string, status?: string): Promise<LeaveRequest[]> {
    return Promise.resolve(mockStore.getLeaveRequests(employeeId, status));
  },

  async submitLeaveRequest(data: {
    employeeId: string;
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<LeaveRequest> {
    return Promise.resolve(mockStore.submitLeaveRequest(data));
  },

  async reviewLeaveRequest(data: {
    leaveId: string;
    status: 'approved' | 'rejected';
    reviewComments?: string;
    reviewedBy: string;
    reviewedByName: string;
  }): Promise<LeaveRequest> {
    return Promise.resolve(mockStore.reviewLeaveRequest(data));
  },

  subscribe(listener: () => void): () => void {
    return mockStore.subscribe(listener);
  },
};
