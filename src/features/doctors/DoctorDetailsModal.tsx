import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Doctor, Appointment } from '@/types';
import { DoctorService } from '@/services/doctorService';
import { getStatusColor, formatDateTime } from '@/lib/utils';
import {
  Stethoscope,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Phone,
  Mail,
  Award,
  CheckCircle,
  AlertCircle,
  FileBadge,
} from 'lucide-react';

interface DoctorDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctor: Doctor | null;
  onBookAppointment?: (doctor: Doctor) => void;
}

export function DoctorDetailsModal({
  isOpen,
  onClose,
  doctor,
  onBookAppointment,
}: DoctorDetailsModalProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'appointments'>('overview');

  useEffect(() => {
    if (doctor && isOpen) {
      DoctorService.getDoctorAppointments(doctor.id).then(setAppointments);
    }
  }, [doctor, isOpen]);

  if (!doctor) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="-mt-3 space-y-4">
        {/* Physician Header */}
        <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-blue-950 text-white p-5 -mx-6 -mt-6 rounded-t-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-teal-600/70 border-2 border-white/20 flex items-center justify-center text-white text-xl font-bold font-mono">
                {doctor.fullName.replace('Dr. ', '')[0]}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight">{doctor.fullName}</h2>
                  <Badge variant={doctor.status === 'active' ? 'success' : 'neutral'}>
                    {doctor.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-teal-200 mt-1 flex-wrap">
                  <span className="font-semibold text-white">{doctor.specialization}</span>
                  <span>•</span>
                  <span>{doctor.department}</span>
                  <span>•</span>
                  <span className="font-mono text-teal-300">Lic: {doctor.licenseNumber}</span>
                </div>
              </div>
            </div>

            {onBookAppointment && (
              <Button
                size="sm"
                variant="primary"
                className="bg-teal-500 hover:bg-teal-600 text-white text-xs whitespace-nowrap self-start sm:self-center"
                onClick={() => onBookAppointment(doctor)}
              >
                <Calendar className="w-3.5 h-3.5 mr-1" /> Book Consultation
              </Button>
            )}
          </div>

          {/* Quick Metrics Strip */}
          <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-xs text-slate-300">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Consultation Fee</span>
              <span className="font-bold text-white text-sm">${doctor.consultationFee}.00</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Clinical Experience</span>
              <span className="font-bold text-white text-sm">{doctor.experienceYears} Years</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Today's Queue</span>
              <span className="font-bold text-white text-sm">{appointments.length} Consultations</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-teal-600 text-teal-700 font-bold bg-teal-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Credentials
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'schedule'
                ? 'border-teal-600 text-teal-700 font-bold bg-teal-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Consultation Hours ({doctor.availabilitySchedule?.length || 0} Days)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appointments')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'appointments'
                ? 'border-teal-600 text-teal-700 font-bold bg-teal-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Doctor Appointment Roster ({appointments.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4 text-xs">
            {/* Biography */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="font-bold text-slate-800 block mb-1">Clinical Biography</span>
              <p className="text-slate-600 leading-relaxed">
                {doctor.biography || 'Attending medical practitioner registered with MedPulse Hospital Clinical Directorate.'}
              </p>
            </div>

            {/* Qualifications */}
            <div>
              <span className="font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-teal-600" /> Degrees & Qualifications
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {(doctor.qualifications || []).map((q, i) => (
                  <span
                    key={i}
                    className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded text-xs font-semibold"
                  >
                    {q}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-mono">{doctor.contactNumber}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{doctor.email}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEDULE */}
        {activeTab === 'schedule' && (
          <div className="space-y-3 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">
              Consultation Schedule & Patient Quotas
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(doctor.availabilitySchedule || []).map((slot, i) => (
                <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{slot.dayOfWeek}</span>
                    <Badge variant="info">Max {slot.maxPatients || 20} slots</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 font-mono">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    <span>{slot.startTime} - {slot.endTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="space-y-3 text-xs">
            <span className="font-bold text-slate-700 uppercase tracking-wider block">
              Booked Patient Consultations ({appointments.length})
            </span>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {appointments.length === 0 ? (
                <div className="p-6 text-center text-slate-400">No scheduled consultations for this physician.</div>
              ) : (
                appointments.map((apt) => (
                  <div key={apt.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">{apt.appointmentNumber}</span>
                        <span className="font-bold text-slate-800">{apt.patientName}</span>
                        <span className="font-mono text-[10px] text-slate-400">({apt.patientMrn})</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">"{apt.visitReason}"</p>
                      <span className="text-[10px] text-slate-400">
                        {apt.date} • {apt.startTime} - {apt.endTime}
                      </span>
                    </div>
                    <Badge variant={apt.status === 'Completed' ? 'success' : apt.status === 'Cancelled' ? 'danger' : 'info'}>
                      {apt.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
          <span className="text-slate-400">Physician ID: {doctor.id}</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
