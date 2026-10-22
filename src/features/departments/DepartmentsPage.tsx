import React, { useState, useEffect, useMemo } from 'react';
import { DataTable, TableFilterConfig } from '@/components/common/DataTable';
import { ColumnDef, Department } from '@/types';
import { DepartmentService } from '@/services/departmentService';
import { DepartmentModal } from './DepartmentModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { mockStore } from '@/services/mockHospitalStore';
import { getStatusColor } from '@/lib/utils';
import {
  Building2,
  PlusCircle,
  BedDouble,
  Users,
  ShieldAlert,
  Power,
  Trash2,
  Edit2,
  Phone,
  MapPin,
} from 'lucide-react';

export function DepartmentsPage() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departmentToEdit, setDepartmentToEdit] = useState<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deletionBlockedReason, setDeletionBlockedReason] = useState<string | null>(null);

  const loadDepartments = async () => {
    setIsLoading(true);
    try {
      const data = await DepartmentService.getDepartments();
      setDepartments(data);
    } catch {
      toast({
        title: 'Error Loading Departments',
        message: 'Failed to fetch departments from the database.',
        type: 'danger',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    const unsub = mockStore.subscribe(() => {
      DepartmentService.getDepartments().then(setDepartments);
    });
    return unsub;
  }, []);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = departments.length;
    const active = departments.filter((d) => d.status === 'active').length;
    const totalBeds = departments.reduce((acc, d) => acc + (d.totalBeds || 0), 0);
    const totalDocs = mockStore.getDoctors().length;
    return { total, active, totalBeds, totalDocs };
  }, [departments]);

  const handleToggleStatus = async (dept: Department) => {
    const nextStatus = dept.status === 'active' ? 'inactive' : 'active';
    try {
      await DepartmentService.toggleStatus(dept.id, nextStatus);
      toast({
        title: `Department ${nextStatus === 'active' ? 'Activated' : 'Deactivated'}`,
        message: `${dept.name} is now marked as ${nextStatus}.`,
        type: 'success',
      });
      loadDepartments();
    } catch (err: any) {
      toast({
        title: 'Status Update Failed',
        message: err.message || 'Could not update department status.',
        type: 'danger',
      });
    }
  };

  const handleAttemptDelete = (dept: Department) => {
    // Check constraints before opening confirmation
    const doctorsLinked = mockStore.getDoctors().filter((d) => d.departmentId === dept.id || d.department === dept.name);
    const appointmentsLinked = mockStore.getAppointments().filter((a) => a.departmentId === dept.id || a.department === dept.name);

    if (doctorsLinked.length > 0 || appointmentsLinked.length > 0) {
      setDeletionBlockedReason(
        `Constraint Violation: Cannot delete "${dept.name}". It is linked to ${doctorsLinked.length} physician(s) and ${appointmentsLinked.length} historical appointment(s). You may safely deactivate it instead.`
      );
      setDeleteTarget(dept);
    } else {
      setDeletionBlockedReason(null);
      setDeleteTarget(dept);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    if (deletionBlockedReason) {
      // Offer deactivation instead
      await handleToggleStatus(deleteTarget);
      setDeleteTarget(null);
      setDeletionBlockedReason(null);
      return;
    }

    try {
      await DepartmentService.deleteDepartment(deleteTarget.id);
      toast({
        title: 'Department Deleted',
        message: `Department "${deleteTarget.name}" has been removed.`,
        type: 'success',
      });
      loadDepartments();
    } catch (err: any) {
      toast({
        title: 'Deletion Blocked',
        message: err.message,
        type: 'danger',
      });
    } finally {
      setDeleteTarget(null);
      setDeletionBlockedReason(null);
    }
  };

  const handleSaved = (dept: Department) => {
    toast({
      title: departmentToEdit ? 'Department Updated' : 'Department Created',
      message: `Department "${dept.name}" (${dept.code}) saved successfully.`,
      type: 'success',
    });
    setIsModalOpen(false);
    setDepartmentToEdit(null);
    loadDepartments();
  };

  const columns: ColumnDef<Department>[] = [
    {
      key: 'name',
      header: 'Department & Code',
      sortable: true,
      render: (d) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 text-xs">{d.name}</span>
            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold border border-slate-200">
              {d.code}
            </span>
          </div>
          {d.description && <span className="text-[11px] text-slate-400 block line-clamp-1">{d.description}</span>}
        </div>
      ),
    },
    {
      key: 'departmentHead',
      header: 'Head of Department',
      sortable: true,
      render: (d) => (
        <span className="text-slate-700 font-medium text-xs">
          {d.departmentHead || <span className="text-slate-400 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Location & Wing',
      render: (d) => (
        <div className="text-xs text-slate-600 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{d.buildingWing} (Floor {d.floorNumber})</span>
        </div>
      ),
    },
    {
      key: 'contactNumber',
      header: 'Contact Phone',
      render: (d) => (
        <div className="text-xs text-slate-600 flex items-center gap-1">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="font-mono">{d.contactNumber || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'totalBeds',
      header: 'Bed Capacity',
      sortable: true,
      render: (d) => (
        <span className="text-xs font-semibold text-slate-800">
          {d.totalBeds} Beds
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Operational Status',
      sortable: true,
      render: (d) => {
        const color = getStatusColor(d.status);
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${color.bg} ${color.text} ${color.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${color.dot}`} />
            <span className="capitalize">{d.status}</span>
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (d) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Edit Department"
            onClick={() => {
              setDepartmentToEdit(d);
              setIsModalOpen(true);
            }}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title={d.status === 'active' ? 'Deactivate Department' : 'Activate Department'}
            onClick={() => handleToggleStatus(d)}
            className={`p-1.5 rounded ${
              d.status === 'active'
                ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Delete Department (Guarded)"
            onClick={() => handleAttemptDelete(d)}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const filters: TableFilterConfig[] = [
    {
      key: 'status',
      label: 'Operational Status',
      options: [
        { label: 'Active Operational', value: 'active' },
        { label: 'Inactive / Deactivated', value: 'inactive' },
        { label: 'Under Maintenance', value: 'maintenance' },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Department Management & Facility Units
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure clinical divisions, bed capacities, departmental leadership, and historical integrity protections.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setDepartmentToEdit(null);
            setIsModalOpen(true);
          }}
        >
          <PlusCircle className="w-4 h-4 mr-1.5" /> Add New Department
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Units</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-1">{metrics.total}</div>
          <span className="text-[10px] text-slate-400">Hospital Departments</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Divisions</span>
            <Power className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-1">{metrics.active}</div>
          <span className="text-[10px] text-emerald-600">Operational clinical services</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Bed Census</span>
            <BedDouble className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-700 mt-1">{metrics.totalBeds}</div>
          <span className="text-[10px] text-indigo-600">Inpatient capacity</span>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Attending Physicians</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold text-teal-700 mt-1">{metrics.totalDocs}</div>
          <span className="text-[10px] text-teal-600">On-staff specialists</span>
        </div>
      </div>

      {/* Departments Data Table */}
      <DataTable
        data={departments}
        columns={columns}
        searchPlaceholder="Search departments by name, code, or department head..."
        searchableKeys={['name', 'code', 'departmentHead', 'location', 'buildingWing']}
        filters={filters}
        isLoading={isLoading}
        emptyTitle="No Departments Found"
        emptyDescription="No hospital departments matched your search query."
        emptyActionLabel="Create First Department"
        onEmptyAction={() => {
          setDepartmentToEdit(null);
          setIsModalOpen(true);
        }}
      />

      {/* Creation & Edit Modal */}
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setDepartmentToEdit(null);
        }}
        onSuccess={handleSaved}
        departmentToEdit={departmentToEdit}
      />

      {/* Guarded Deletion / Deactivation Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => {
          setDeleteTarget(null);
          setDeletionBlockedReason(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={deletionBlockedReason ? 'Deletion Prohibited by Hospital Policy' : 'Delete Department'}
        message={
          deletionBlockedReason
            ? `${deletionBlockedReason}\n\nWould you like to DEACTIVATE "${deleteTarget?.name}" instead to preserve record integrity?`
            : `Are you sure you want to permanently delete department "${deleteTarget?.name}"? This action cannot be reversed.`
        }
        confirmLabel={deletionBlockedReason ? 'Deactivate Department Instead' : 'Delete Permanently'}
        variant={deletionBlockedReason ? 'primary' : 'danger'}
      />
    </div>
  );
}
