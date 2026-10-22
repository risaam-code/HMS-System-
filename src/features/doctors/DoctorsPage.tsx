import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, TableFilterConfig } from '@/components/common/DataTable';
import { ColumnDef, Doctor, Department } from '@/types';
import { DoctorService } from '@/services/doctorService';
import { DepartmentService } from '@/services/departmentService';
import { DoctorRegistrationModal } from './DoctorRegistrationModal';
import { DoctorDetailsModal } from './DoctorDetailsModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { mockStore } from '@/services/mockHospitalStore';
import { getStatusColor } from '@/lib/utils';
import {
  Stethoscope,
  UserPlus,
  Building2,
  Calendar,
  Clock,
  Eye,
  Edit2,
  Power,
  Users,
  Award,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DoctorsPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [docList, deptList] = await Promise.all([
        DoctorService.getDoctors(),
        DepartmentService.getDepartments({ status: 'active' }),
      ]);
      setDoctors(docList);
      setDepartments(deptList);
    } catch {
      toast({
        title: 'Error Loading Physicians',
        message: 'Failed to load doctors roster from the database.',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = mockStore.subscribe(() => {
      DoctorService.getDoctors().then(setDoctors);
    });
    return unsub;
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = doctors.length;
    const active = doctors.filter((d) => d.status === 'active').length;
    const inConsult = doctors.filter((d) => d.availabilityStatus === 'in_consultation').length;
    const depts = new Set(doctors.map((d) => d.department)).size;
    return { total, active, inConsult, depts };
  }, [doctors]);

  const handleToggleStatus = async (doc: Doctor) => {
    const nextStatus = doc.status === 'active' ? 'inactive' : 'active';
    try {
      await DoctorService.toggleStatus(doc.id, nextStatus);
      toast({
        title: `Physician ${nextStatus === 'active' ? 'Activated' : 'Deactivated'}`,
        message: `${doc.fullName} status updated to ${nextStatus}.`,
        type: 'success',
      });
      loadData();
    } catch (err: any) {
      toast({
        title: 'Status Update Failed',
        message: err.message,
        type: 'danger',
      });
    }
  };

  const handleDoctorSaved = (doc: Doctor) => {
    toast({
      title: doctorToEdit ? 'Doctor Profile Updated' : 'Physician Registered',
      message: `${doc.fullName} has been saved to the hospital physician registry.`,
      type: 'success',
    });
    setIsRegisterOpen(false);
    setDoctorToEdit(null);
    loadData();
  };

  const columns: ColumnDef<Doctor>[] = [
    {
      key: 'fullName',
      header: 'Physician Name',
      sortable: true,
      render: (doc) => (
        <div>
          <span className="font-bold text-slate-900 block text-xs">{doc.fullName}</span>
          <span className="text-[11px] text-teal-700 font-medium">{doc.specialization}</span>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Department',
      sortable: true,
      render: (doc) => (
        <span className="font-medium text-slate-800 text-xs">
          {doc.department}
        </span>
      ),
    },
    {
      key: 'licenseNumber',
      header: 'License #',
      render: (doc) => (
        <span className="font-mono text-xs text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
          {doc.licenseNumber}
        </span>
      ),
    },
    {
      key: 'consultationFee',
      header: 'Fee & Experience',
      sortable: true,
      render: (doc) => (
        <div className="text-xs">
          <span className="font-bold text-emerald-800 block">${doc.consultationFee}.00</span>
          <span className="text-[10px] text-slate-400">{doc.experienceYears} yrs experience</span>
        </div>
      ),
    },
    {
      key: 'contactNumber',
      header: 'Contact',
      render: (doc) => (
        <div className="text-xs text-slate-600">
          <span className="font-mono block">{doc.contactNumber}</span>
          <span className="text-[10px] text-slate-400 truncate block max-w-[130px]">{doc.email}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (doc) => {
        const color = getStatusColor(doc.status);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${color.bg} ${color.text} ${color.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
            <span className="capitalize">{doc.status}</span>
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (doc) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="View Full Profile & Schedule"
            onClick={() => setSelectedDoctor(doc)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {hasPermission('doctors:manage') && (
            <>
              <button
                type="button"
                title="Edit Doctor Profile"
                onClick={() => {
                  setDoctorToEdit(doc);
                  setIsRegisterOpen(true);
                }}
                className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                title={doc.status === 'active' ? 'Deactivate Doctor' : 'Activate Doctor'}
                onClick={() => handleToggleStatus(doc)}
                className={`p-1.5 rounded ${
                  doc.status === 'active'
                    ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                    : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filters: TableFilterConfig[] = [
    {
      key: 'department',
      label: 'Department',
      options: departments.map((d) => ({ label: d.name, value: d.name })),
    },
    {
      key: 'status',
      label: 'Staff Status',
      options: [
        { label: 'Active Staff', value: 'active' },
        { label: 'Inactive / On Leave', value: 'inactive' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Doctor Directory & Medical Staff Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage attending physicians, specializations, consultation fee structures, and multi-day availability slots.
          </p>
        </div>

        {hasPermission('doctors:manage') && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setDoctorToEdit(null);
              setIsRegisterOpen(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Register Doctor
          </Button>
        )}
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Physicians</span>
            <Stethoscope className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{metrics.total}</div>
          <span className="text-[10px] text-slate-400">Credentialed specialists</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active on Duty</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{metrics.active}</div>
          <span className="text-[10px] text-emerald-600">Available for bookings</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Specialties Covered</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-blue-700 mt-1">{metrics.depts}</div>
          <span className="text-[10px] text-blue-600">Clinical departments</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>In Consultation</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-700 mt-1">{metrics.inConsult}</div>
          <span className="text-[10px] text-amber-600">Active encounters</span>
        </div>
      </div>

      {/* Doctor DataTable */}
      <DataTable
        data={doctors}
        columns={columns}
        searchPlaceholder="Search by physician name, license, specialization, or department..."
        searchableKeys={['fullName', 'specialization', 'department', 'licenseNumber', 'email']}
        filters={filters}
        isLoading={isLoading}
        onRowClick={(doc) => setSelectedDoctor(doc)}
        emptyTitle="No Physicians Found"
        emptyDescription="No doctor records matched your search criteria."
        emptyActionLabel="Register First Doctor"
        onEmptyAction={() => {
          setDoctorToEdit(null);
          setIsRegisterOpen(true);
        }}
      />

      {/* Doctor Registration / Edit Modal */}
      <DoctorRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => {
          setIsRegisterOpen(false);
          setDoctorToEdit(null);
        }}
        onSuccess={handleDoctorSaved}
        doctorToEdit={doctorToEdit}
      />

      {/* Doctor Details Modal */}
      <DoctorDetailsModal
        isOpen={Boolean(selectedDoctor)}
        onClose={() => setSelectedDoctor(null)}
        doctor={selectedDoctor}
        onBookAppointment={(doc) => {
          setSelectedDoctor(null);
          navigate('/appointments', { state: { preselectedDoctorId: doc.id } });
        }}
      />
    </div>
  );
}
