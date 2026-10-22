import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';
import { Patient, PatientDocument, Appointment, MedicalRecord, OutpatientVisit, Prescription, LabRequest, Admission, Invoice } from '@/types';
import { PatientService, PatientHistoryItem } from '@/services/patientService';
import { AppointmentService } from '@/services/appointmentService';
import { MedicalRecordService } from '@/services/medicalRecordService';
import { OutpatientService } from '@/services/outpatientService';
import { InpatientService } from '@/services/inpatientService';
import { LaboratoryService } from '@/services/laboratoryService';
import { PharmacyService } from '@/services/pharmacyService';
import { BillingService } from '@/services/billingService';
import { getStatusColor, formatDate, formatDateTime, formatCurrency } from '@/lib/utils';
import {
  User,
  Calendar,
  FileText,
  Pill,
  FlaskConical,
  BedDouble,
  DollarSign,
  Files,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Upload,
  CheckCircle,
  Stethoscope,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  PlusCircle,
  FileBadge,
} from 'lucide-react';

export type PatientProfileTab =
  | 'overview'
  | 'personal'
  | 'appointments'
  | 'medical_records'
  | 'prescriptions'
  | 'laboratory'
  | 'admissions'
  | 'billing'
  | 'documents';

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  initialTab?: PatientProfileTab;
  onEditPatient?: (patient: Patient) => void;
  onBookAppointment?: (patient: Patient) => void;
  onStartConsultation?: (patient: Patient) => void;
}

export function PatientProfileModal({
  isOpen,
  onClose,
  patient,
  initialTab = 'overview',
  onEditPatient,
  onBookAppointment,
  onStartConsultation,
}: PatientProfileModalProps) {
  const { hasPermission, role } = useAuth();
  const [activeTab, setActiveTab] = useState<PatientProfileTab>(initialTab);
  const [historyItems, setHistoryItems] = useState<PatientHistoryItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [opdVisits, setOpdVisits] = useState<OutpatientVisit[]>([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState<Prescription[]>([]);
  const [patientLabRequests, setPatientLabRequests] = useState<LabRequest[]>([]);
  const [patientAdmissions, setPatientAdmissions] = useState<Admission[]>([]);
  const [patientInvoices, setPatientInvoices] = useState<Invoice[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<PatientDocument['category']>('ID Card');

  useEffect(() => {
    if (patient && isOpen) {
      setActiveTab(initialTab);
      PatientService.getPatientHistory(patient.id).then(setHistoryItems);
      AppointmentService.getAppointments({ patientId: patient.id }).then(setAppointments);
      MedicalRecordService.getMedicalRecords({ patientId: patient.id }).then(setMedicalRecords);
      OutpatientService.getVisits({ search: patient.medicalRecordNumber }).then(setOpdVisits);
      PharmacyService.getPrescriptions(patient.id).then(setPatientPrescriptions);
      LaboratoryService.getLabRequests().then((reqs) => setPatientLabRequests(reqs.filter((r) => r.patientId === patient.id)));
      InpatientService.getAdmissions().then((adms) => setPatientAdmissions(adms.filter((a) => a.patientId === patient.id)));
      BillingService.getInvoices(patient.id).then(setPatientInvoices);
    }
  }, [patient, isOpen, initialTab]);

  if (!patient) return null;

  const statusColor = getStatusColor(patient.status);

  // Tab permissions definition
  const tabConfigs: { id: PatientProfileTab; label: string; icon: any; permission?: string }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'appointments', label: 'Appointments', icon: Calendar, permission: 'appointments:view' },
    { id: 'medical_records', label: 'Medical Records', icon: FileText, permission: 'medical_records:view' },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill, permission: 'medical_records:view' },
    { id: 'laboratory', label: 'Laboratory Results', icon: FlaskConical, permission: 'laboratory:view' },
    { id: 'admissions', label: 'Admissions', icon: BedDouble, permission: 'inpatient:view' },
    { id: 'billing', label: 'Billing', icon: DollarSign, permission: 'billing:view' },
    { id: 'documents', label: 'Documents', icon: Files },
  ];

  const canAccessTab = (permission?: string) => {
    if (!permission) return true;
    if (role === 'administrator') return true;
    return hasPermission(permission as any);
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    try {
      await PatientService.uploadDocument(patient.id, {
        title: docTitle.trim(),
        fileType: 'PDF',
        fileUrl: `/mock/docs/${Date.now()}.pdf`,
        category: docCategory,
        uploadedBy: 'Current User',
        sizeBytes: 1548000,
      });

      // Refresh patient history and documents
      const updated = await PatientService.getPatientById(patient.id);
      if (updated) {
        patient.documents = updated.documents;
      }
      const hist = await PatientService.getPatientHistory(patient.id);
      setHistoryItems(hist);
      setDocTitle('');
      setIsUploadingDoc(false);
    } catch (err) {
      console.error('Failed to upload document:', err);
    }
  };

  // Collect all prescriptions from all medical records & OPD visits
  const allPrescriptions = [
    ...medicalRecords.flatMap((r) => r.prescriptions || []),
    ...opdVisits.flatMap((v) => v.prescriptions || []),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="-mt-3 space-y-4">
        {/* Patient Master Card Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 -mx-6 -mt-6 rounded-t-lg shadow-inner">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600/60 border-2 border-white/20 flex items-center justify-center text-white text-xl font-bold font-mono shadow-md">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl font-bold tracking-tight">
                    {patient.firstName} {patient.lastName}
                  </h2>
                  <span className="font-mono text-xs bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2 py-0.5 rounded">
                    {patient.medicalRecordNumber}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${statusColor.dot}`} />
                    <span className="capitalize">{patient.status}</span>
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-blue-200/90 mt-1.5 flex-wrap">
                  <span className="capitalize">{patient.gender} • {patient.age} yrs (DOB: {formatDate(patient.dateOfBirth)})</span>
                  {patient.bloodGroup && (
                    <span className="bg-rose-500/20 text-rose-200 border border-rose-400/30 px-2 py-0.5 rounded font-bold">
                      Blood: {patient.bloodGroup}
                    </span>
                  )}
                  <span>Primary: {patient.assignedDoctor || 'Unassigned'}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Shortcuts */}
            <div className="flex items-center gap-2">
              {onBookAppointment && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
                  onClick={() => onBookAppointment(patient)}
                >
                  <Calendar className="w-3.5 h-3.5 mr-1" /> Book Appointment
                </Button>
              )}
              {onStartConsultation && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-teal-500 hover:bg-teal-600 text-white text-xs"
                  onClick={() => onStartConsultation(patient)}
                >
                  <Stethoscope className="w-3.5 h-3.5 mr-1" /> Start OPD Visit
                </Button>
              )}
            </div>
          </div>

          {/* Critical Allergies Alert Banner */}
          {patient.allergies && patient.allergies.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center gap-2 text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> RELEVANT ALLERGIES:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {patient.allergies.map((allergy, i) => (
                  <span key={i} className="bg-amber-400/20 text-amber-200 border border-amber-400/30 px-2 py-0.5 rounded font-medium">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px text-xs font-medium">
          {tabConfigs.map((tab) => {
            const Icon = tab.icon;
            const hasAccess = canAccessTab(tab.permission);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-700 font-bold bg-blue-50/50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {!hasAccess && <ShieldAlert className="w-3 h-3 text-amber-500" />}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="min-h-[360px]">
          {/* Permission Check Fallback */}
          {!canAccessTab(tabConfigs.find((t) => t.id === activeTab)?.permission) ? (
            <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">HIPAA Access Restricted</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Your authorized staff role (<strong>{role}</strong>) does not hold the required permission (
                <code className="text-amber-700">{tabConfigs.find((t) => t.id === activeTab)?.permission}</code>)
                to inspect this clinical category. Contact the Hospital Systems Administrator for credentials.
              </p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Contact Details
                      </span>
                      <div className="mt-2 space-y-1.5 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{patient.phone}</span>
                        </div>
                        {patient.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{patient.email}</span>
                          </div>
                        )}
                        {patient.address && (
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span>{patient.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Emergency Contact
                      </span>
                      <div className="mt-2 text-xs text-slate-700 space-y-1">
                        <span className="font-bold text-slate-900 block">{patient.emergencyContact.name}</span>
                        <span className="text-slate-500 block">Relation: {patient.emergencyContact.relationship}</span>
                        <span className="font-mono text-blue-700 font-semibold block">{patient.emergencyContact.phone}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Care Coordination
                      </span>
                      <div className="mt-2 text-xs text-slate-700 space-y-1">
                        <span className="text-slate-500">Registered: {formatDate(patient.registrationDate)}</span>
                        <span className="block text-slate-500">Last Encounter: {patient.lastVisit || 'N/A'}</span>
                        <span className="block font-medium text-teal-800">
                          Physician: {patient.assignedDoctor || 'None Assigned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Patient History Timeline */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-blue-600" /> Unified Patient History Timeline
                    </h4>
                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {historyItems.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400">No chronological events logged.</div>
                      ) : (
                        historyItems.map((item) => (
                          <div key={item.id} className="p-3 hover:bg-slate-50 flex items-start justify-between gap-3 text-xs">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900">{item.title}</span>
                                <Badge variant={item.badgeVariant || 'default'}>{item.type}</Badge>
                              </div>
                              <p className="text-slate-600 text-[11px]">{item.summary}</p>
                              <span className="text-[10px] text-slate-400">Recorded by: {item.actor}</span>
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 shrink-0">{item.date}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PERSONAL INFORMATION */}
              {activeTab === 'personal' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Master Demographic Record
                    </h4>
                    {onEditPatient && hasPermission('patients:edit') && (
                      <Button size="sm" variant="outline" onClick={() => onEditPatient(patient)}>
                        Edit Demographics
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">First Name</span>
                      <span className="font-semibold text-slate-800 text-sm">{patient.firstName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Last Name</span>
                      <span className="font-semibold text-slate-800 text-sm">{patient.lastName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">MRN</span>
                      <span className="font-mono font-semibold text-blue-700 text-sm">{patient.medicalRecordNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Date of Birth</span>
                      <span className="font-medium text-slate-800">{formatDate(patient.dateOfBirth)} ({patient.age} years)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Sex / Gender</span>
                      <span className="capitalize font-medium text-slate-800">{patient.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Blood Group</span>
                      <span className="font-semibold text-rose-700">{patient.bloodGroup || 'Not Documented'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Primary Phone</span>
                      <span className="font-mono text-slate-800">{patient.phone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Email Address</span>
                      <span className="text-slate-800">{patient.email || 'None on file'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Residential Address</span>
                      <span className="text-slate-800">{patient.address || 'None on file'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Emergency Contact</span>
                      <span className="font-medium text-slate-800">
                        {patient.emergencyContact.name} ({patient.emergencyContact.relationship}) - {patient.emergencyContact.phone}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Registration Date</span>
                      <span className="font-medium text-slate-800">{formatDate(patient.registrationDate)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Current Hospital Status</span>
                      <span className="capitalize font-semibold text-slate-800">{patient.status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: APPOINTMENTS */}
              {activeTab === 'appointments' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Scheduled & Past Appointments ({appointments.length})
                    </span>
                    {onBookAppointment && (
                      <Button size="sm" variant="outline" onClick={() => onBookAppointment(patient)}>
                        <PlusCircle className="w-3.5 h-3.5 mr-1" /> New Booking
                      </Button>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden">
                    {appointments.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">No appointments scheduled for this patient.</div>
                    ) : (
                      appointments.map((apt) => (
                        <div key={apt.id} className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-semibold text-blue-600">{apt.appointmentNumber}</span>
                              <span className="font-semibold text-slate-800">{apt.doctorName}</span>
                              <span className="text-slate-500">({apt.department})</span>
                            </div>
                            <p className="text-slate-600 text-[11px] mt-0.5">Reason: "{apt.visitReason}"</p>
                            <span className="text-[10px] text-slate-400">
                              {apt.date} • {apt.startTime} - {apt.endTime} ({apt.type})
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

              {/* TAB 4: MEDICAL RECORDS */}
              {activeTab === 'medical_records' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Clinical Encounters & SOAP Notes ({medicalRecords.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {medicalRecords.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-lg">
                        No medical record entries filed yet.
                      </div>
                    ) : (
                      medicalRecords.map((rec) => (
                        <div key={rec.id} className="p-4 border border-slate-200 rounded-lg bg-white space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-blue-600">{rec.recordNumber}</span>
                              <span className="font-bold text-slate-900 text-sm">{rec.diagnosisTitle}</span>
                              {rec.diagnosisCode && (
                                <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded">
                                  ICD-10: {rec.diagnosisCode}
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500">{rec.encounterDate}</span>
                          </div>
                          <p className="text-slate-600 text-[11px]"><strong>Chief Complaint:</strong> {rec.chiefComplaint}</p>
                          <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-[11px] text-slate-700 whitespace-pre-wrap font-mono">
                            {rec.clinicalNotes}
                          </div>
                          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-100">
                            <span>Physician: {rec.doctorName}</span>
                            {rec.isSigned ? (
                              <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                <CheckCircle className="w-3.5 h-3.5" /> Digitally Signed ({rec.signedByDoctorName})
                              </span>
                            ) : (
                              <span className="text-amber-600 font-medium">Unsigned Clinical Draft</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: PRESCRIPTIONS */}
              {activeTab === 'prescriptions' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Pharmacy Prescriptions & Regimens ({patientPrescriptions.length + allPrescriptions.length})
                  </span>
                  <div className="space-y-3">
                    {patientPrescriptions.length === 0 && allPrescriptions.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-lg">
                        No active medication orders or prescriptions found.
                      </div>
                    ) : (
                      <>
                        {patientPrescriptions.map((rx) => (
                          <div key={rx.id} className="p-3 border border-slate-200 rounded-lg bg-white space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-teal-700">{rx.prescriptionNumber}</span>
                                <span className="font-medium text-slate-800">Prescribed by {rx.doctorName}</span>
                              </div>
                              <Badge
                                variant={
                                  rx.status === 'dispensed'
                                    ? 'success'
                                    : rx.status === 'partially_dispensed'
                                    ? 'warning'
                                    : 'info'
                                }
                              >
                                {rx.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            {rx.diagnosis && <p className="text-[11px] text-slate-500">Diagnosis: {rx.diagnosis}</p>}
                            <div className="divide-y divide-slate-100 border border-slate-100 rounded-md bg-slate-50/50">
                              {rx.items.map((item, idx) => (
                                <div key={idx} className="p-2 flex justify-between items-center text-[11px]">
                                  <div>
                                    <span className="font-semibold text-slate-900">{item.medicineName}</span>
                                    <span className="text-slate-500 ml-2">
                                      {item.dosage} • {item.frequency} • {item.duration}
                                    </span>
                                  </div>
                                  <span className="text-slate-600 font-mono">
                                    Qty: {item.quantityPrescribed} ({item.quantityDispensed} dispensed)
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}

                        {allPrescriptions.map((rx, idx) => (
                          <div key={`enc-${idx}`} className="p-3 border border-slate-100 rounded-lg bg-slate-50/60 flex items-start justify-between gap-3 text-xs">
                            <div>
                              <span className="font-bold text-slate-900 text-sm block">{rx.medicineName}</span>
                              <span className="text-slate-600 text-[11px]">
                                Dosage: {rx.dosage} • Frequency: {rx.frequency} • Duration: {rx.duration}
                              </span>
                              {rx.instructions && (
                                <p className="text-slate-500 text-[11px] mt-0.5 italic">Instructions: {rx.instructions}</p>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded">
                              Encounter Note
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: LABORATORY RESULTS */}
              {activeTab === 'laboratory' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Diagnostic Pathology & Laboratory Investigations ({patientLabRequests.length})
                  </span>
                  <div className="space-y-3">
                    {patientLabRequests.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-lg">
                        No laboratory diagnostic requests on file for this patient.
                      </div>
                    ) : (
                      patientLabRequests.map((req) => (
                        <div key={req.id} className="p-3.5 border border-slate-200 rounded-lg bg-white space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-teal-700">{req.requestNumber}</span>
                              <span className="font-bold text-slate-900">{req.testName}</span>
                              <span className="text-[11px] text-slate-500">({req.category})</span>
                            </div>
                            <Badge
                              variant={
                                req.status === 'verified'
                                  ? 'success'
                                  : req.status === 'results_entered'
                                  ? 'info'
                                  : 'warning'
                              }
                            >
                              {req.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-[11px] text-slate-500">
                            <span>Doctor: {req.doctorName}</span>
                            <span>Priority: <strong>{req.priority}</strong></span>
                            {req.sampleBarcode && <span>Barcode: <strong className="font-mono">{req.sampleBarcode}</strong></span>}
                            <span>Requested: {new Date(req.createdAt).toLocaleDateString()}</span>
                          </div>

                          {req.resultItems && req.resultItems.length > 0 && (
                            <div className="border border-slate-100 rounded-md overflow-hidden mt-2">
                              <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-50 text-slate-500 uppercase">
                                  <tr>
                                    <th className="p-1.5 pl-2">Analyte</th>
                                    <th className="p-1.5">Result</th>
                                    <th className="p-1.5">Unit</th>
                                    <th className="p-1.5">Reference Range</th>
                                    <th className="p-1.5 pr-2">Flag</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {req.resultItems.map((item, idx) => (
                                    <tr key={idx}>
                                      <td className="p-1.5 pl-2 font-medium text-slate-800">{item.parameter}</td>
                                      <td className="p-1.5 font-bold text-slate-900">{item.value}</td>
                                      <td className="p-1.5 text-slate-500">{item.unit}</td>
                                      <td className="p-1.5 text-slate-500">{item.referenceRange}</td>
                                      <td className="p-1.5 pr-2">
                                        <span className={`font-semibold ${item.flag === 'normal' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {item.flag.toUpperCase()}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {req.verifiedByName && (
                            <p className="text-[11px] text-emerald-700 font-medium">
                              Verified by: {req.verifiedByName} ({req.verifiedAt ? new Date(req.verifiedAt).toLocaleDateString() : ''})
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: ADMISSIONS */}
              {activeTab === 'admissions' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Inpatient Bed Census & Ward Admissions ({patientAdmissions.length})
                  </span>
                  <div className="space-y-3">
                    {patientAdmissions.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 border border-slate-200 rounded-lg">
                        No inpatient admission records found.
                      </div>
                    ) : (
                      patientAdmissions.map((adm) => (
                        <div key={adm.id} className="p-3.5 border border-slate-200 rounded-lg bg-white space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-teal-700">{adm.admissionNumber}</span>
                              <span className="font-bold text-slate-900">Ward: {adm.wardName}</span>
                              <span className="font-semibold text-slate-600">Bed: {adm.bedNumber}</span>
                            </div>
                            <Badge variant={adm.status === 'admitted' ? 'warning' : 'neutral'}>
                              {adm.status.toUpperCase()}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500">
                            <div>
                              <span>Attending Doctor:</span>
                              <p className="font-medium text-slate-800">{adm.attendingDoctorName}</p>
                            </div>
                            <div>
                              <span>Admission Date:</span>
                              <p className="font-medium text-slate-800">{new Date(adm.admissionDate).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <span>Daily Room Rate:</span>
                              <p className="font-medium text-slate-800">{formatCurrency(adm.dailyRate)}/day</p>
                            </div>
                            <div>
                              <span>Discharge Date:</span>
                              <p className="font-medium text-slate-800">
                                {adm.actualDischargeDate ? new Date(adm.actualDischargeDate).toLocaleDateString() : 'Active Inpatient'}
                              </p>
                            </div>
                          </div>

                          {adm.admissionReason && (
                            <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded">
                              <strong>Admission Reason:</strong> {adm.admissionReason}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 8: BILLING */}
              {activeTab === 'billing' && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Financial Invoicing & Outstanding Balances ({patientInvoices.length})
                  </span>
                  {(() => {
                    const totalBilled = patientInvoices.reduce((s, i) => s + i.totalAmount, 0);
                    const totalPaid = patientInvoices.reduce((s, i) => s + i.paidAmount, 0);
                    const balanceDue = patientInvoices.reduce((s, i) => s + i.balanceDue, 0);

                    return (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="text-slate-500 block">Total Lifetime Billed</span>
                            <span className="text-lg font-bold text-blue-900">{formatCurrency(totalBilled)}</span>
                          </div>
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <span className="text-slate-500 block">Paid Collections</span>
                            <span className="text-lg font-bold text-emerald-900">{formatCurrency(totalPaid)}</span>
                          </div>
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                            <span className="text-slate-500 block">Outstanding Balance</span>
                            <span className={`text-lg font-bold ${balanceDue > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                              {formatCurrency(balanceDue)}
                            </span>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          {patientInvoices.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-400">
                              No financial invoices found for this patient.
                            </div>
                          ) : (
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                                <tr>
                                  <th className="p-2.5 pl-3">Invoice #</th>
                                  <th className="p-2.5">Date</th>
                                  <th className="p-2.5">Due Date</th>
                                  <th className="p-2.5 text-right">Total</th>
                                  <th className="p-2.5 text-right">Paid</th>
                                  <th className="p-2.5 text-right">Balance Due</th>
                                  <th className="p-2.5 pr-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {patientInvoices.map((inv) => (
                                  <tr key={inv.id} className="hover:bg-slate-50/50">
                                    <td className="p-2.5 pl-3 font-mono font-bold text-teal-700">{inv.invoiceNumber}</td>
                                    <td className="p-2.5 text-slate-600">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                    <td className="p-2.5 text-slate-600 font-medium">{inv.dueDate}</td>
                                    <td className="p-2.5 text-right font-mono font-semibold">{formatCurrency(inv.totalAmount)}</td>
                                    <td className="p-2.5 text-right font-mono text-emerald-600 font-semibold">{formatCurrency(inv.paidAmount)}</td>
                                    <td className="p-2.5 text-right font-mono font-bold text-rose-600">{formatCurrency(inv.balanceDue)}</td>
                                    <td className="p-2.5 pr-3">
                                      <Badge
                                        variant={
                                          inv.status === 'paid'
                                            ? 'success'
                                            : inv.status === 'partially_paid'
                                            ? 'warning'
                                            : 'danger'
                                        }
                                      >
                                        {inv.status.replace('_', ' ').toUpperCase()}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TAB 9: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Attached Documents ({patient.documents?.length || 0})
                    </span>
                    <Button size="sm" variant="outline" onClick={() => setIsUploadingDoc(!isUploadingDoc)}>
                      <Upload className="w-3.5 h-3.5 mr-1" /> Upload Document
                    </Button>
                  </div>

                  {/* Document Upload Sub-form */}
                  {isUploadingDoc && (
                    <form onSubmit={handleUploadDocument} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
                      <span className="font-bold text-slate-800 block">Upload Patient File / Document</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          label="Document Title"
                          placeholder="e.g. Health Insurance Policy 2026"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          required
                        />
                        <Select
                          label="Document Category"
                          value={docCategory}
                          onChange={(e) => setDocCategory(e.target.value as any)}
                          options={[
                            { value: 'ID Card', label: 'National ID / Passport' },
                            { value: 'Insurance', label: 'Insurance Card / Policy' },
                            { value: 'Previous Discharge', label: 'Previous Discharge Summary' },
                            { value: 'Lab Report', label: 'External Lab Report' },
                            { value: 'Imaging', label: 'Radiology / Imaging CD' },
                            { value: 'Consent Form', label: 'Signed Consent Form' },
                          ]}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => setIsUploadingDoc(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" size="sm" variant="primary">
                          Save Document
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Documents List */}
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {!patient.documents || patient.documents.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">
                        No documents uploaded for this patient. Click "Upload Document" to attach ID or insurance cards.
                      </div>
                    ) : (
                      patient.documents.map((doc) => (
                        <div key={doc.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-[10px]">
                              {doc.fileType}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block">{doc.title}</span>
                              <span className="text-[11px] text-slate-500">
                                Category: {doc.category} • Uploaded by {doc.uploadedBy} on {formatDate(doc.uploadedAt)}
                              </span>
                            </div>
                          </div>
                          <Badge variant="info">{doc.category}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
          <span className="text-slate-400">MRN: {patient.medicalRecordNumber}</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
