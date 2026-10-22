import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { departmentFormSchema, DepartmentFormData } from '@/schemas/department';
import { DepartmentService } from '@/services/departmentService';
import { DoctorService } from '@/services/doctorService';
import { Department, Doctor } from '@/types';
import { Building2 } from 'lucide-react';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (dept: Department) => void;
  departmentToEdit?: Department | null;
}

export function DepartmentModal({
  isOpen,
  onClose,
  onSuccess,
  departmentToEdit,
}: DepartmentModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const isEditing = Boolean(departmentToEdit);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      location: '',
      buildingWing: '',
      floorNumber: 1,
      contactNumber: '',
      departmentHead: '',
      headDoctorId: '',
      totalBeds: 20,
      status: 'active',
    },
  });

  useEffect(() => {
    if (isOpen) {
      DoctorService.getDoctors({ status: 'active' }).then(setDoctors);
      if (departmentToEdit) {
        reset({
          name: departmentToEdit.name,
          code: departmentToEdit.code,
          description: departmentToEdit.description || '',
          location: departmentToEdit.location,
          buildingWing: departmentToEdit.buildingWing,
          floorNumber: departmentToEdit.floorNumber,
          contactNumber: departmentToEdit.contactNumber || '',
          departmentHead: departmentToEdit.departmentHead || '',
          headDoctorId: departmentToEdit.headDoctorId || '',
          totalBeds: departmentToEdit.totalBeds,
          status: departmentToEdit.status,
        });
      } else {
        reset({
          name: '',
          code: '',
          description: '',
          location: '',
          buildingWing: 'Tower A',
          floorNumber: 1,
          contactNumber: '',
          departmentHead: '',
          headDoctorId: '',
          totalBeds: 20,
          status: 'active',
        });
      }
    }
  }, [isOpen, departmentToEdit, reset]);

  const onSubmit = async (data: DepartmentFormData) => {
    setIsSubmitting(true);
    try {
      const selectedHead = doctors.find((d) => d.id === data.headDoctorId);
      const headName = selectedHead ? selectedHead.fullName : data.departmentHead;

      const payload = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim(),
        location: data.location.trim(),
        buildingWing: data.buildingWing.trim(),
        floorNumber: Number(data.floorNumber),
        contactNumber: data.contactNumber.trim(),
        departmentHead: headName || undefined,
        headDoctorId: data.headDoctorId || undefined,
        totalBeds: Number(data.totalBeds),
        status: data.status,
      };

      let result: Department;
      if (isEditing && departmentToEdit) {
        result = await DepartmentService.updateDepartment(departmentToEdit.id, payload);
      } else {
        result = await DepartmentService.createDepartment(payload);
      }

      onSuccess(result);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save department.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Clinical Department' : 'Create Hospital Department'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Department Name"
            placeholder="e.g. Cardiology"
            error={errors.name?.message}
            {...register('name')}
            required
          />
          <Input
            label="Department Code (e.g. CARD)"
            placeholder="CARD"
            error={errors.code?.message}
            {...register('code')}
            required
            disabled={isEditing}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Building Wing"
            placeholder="e.g. Tower A"
            error={errors.buildingWing?.message}
            {...register('buildingWing')}
            required
          />
          <Input
            label="Floor Number"
            type="number"
            min="0"
            error={errors.floorNumber?.message}
            {...register('floorNumber')}
            required
          />
          <Input
            label="Bed Capacity"
            type="number"
            min="0"
            error={errors.totalBeds?.message}
            {...register('totalBeds')}
            required
          />
        </div>

        <Input
          label="Location Description"
          placeholder="e.g. Tower A, 4th Floor, Room 400-430"
          error={errors.location?.message}
          {...register('location')}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Contact Phone"
            placeholder="+1 (555) 011-4001"
            error={errors.contactNumber?.message}
            {...register('contactNumber')}
            required
          />
          <Select
            label="Department Head (Physician)"
            error={errors.headDoctorId?.message}
            {...register('headDoctorId')}
            options={[
              { value: '', label: '-- Select Department Head --' },
              ...doctors.map((d) => ({
                value: d.id,
                label: `${d.fullName} (${d.specialization})`,
              })),
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Operational Status"
            error={errors.status?.message}
            {...register('status')}
            options={[
              { value: 'active', label: 'Active Operational' },
              { value: 'inactive', label: 'Inactive / Deactivated' },
              { value: 'maintenance', label: 'Under Renovation / Maintenance' },
            ]}
          />
          <div className="md:col-span-1">
            <Input
              label="Overview / Scope of Service"
              placeholder="Brief description of clinical specialty"
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Create Department'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
