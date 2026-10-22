import { mockStore } from './mockHospitalStore';
import { Ward, Bed, Admission, BedAssignment, NursingObservation, BedTransfer, VitalSigns } from '@/types';

export const InpatientService = {
  async getWards(): Promise<Ward[]> {
    return Promise.resolve(mockStore.getWards());
  },

  async getBeds(wardId?: string): Promise<Bed[]> {
    return Promise.resolve(mockStore.getBeds(wardId));
  },

  async getBedById(id: string): Promise<Bed | undefined> {
    return Promise.resolve(mockStore.getBedById(id));
  },

  async getAdmissions(): Promise<Admission[]> {
    return Promise.resolve(mockStore.getAdmissions());
  },

  async getAdmissionById(id: string): Promise<Admission | undefined> {
    return Promise.resolve(mockStore.getAdmissionById(id));
  },

  async getBedAssignments(admissionId?: string): Promise<BedAssignment[]> {
    return Promise.resolve(mockStore.getBedAssignments(admissionId));
  },

  async getNursingObservations(admissionId: string): Promise<NursingObservation[]> {
    return Promise.resolve(mockStore.getNursingObservations(admissionId));
  },

  async getBedTransfers(admissionId?: string): Promise<BedTransfer[]> {
    return Promise.resolve(mockStore.getBedTransfers(admissionId));
  },

  async admitPatient(data: {
    patientId: string;
    attendingDoctorId: string;
    departmentId: string;
    wardId: string;
    bedId: string;
    admissionDate: string;
    admissionReason: string;
    dailyRate: number;
    expectedDischargeDate?: string;
    diagnosis?: string;
    assignedBy?: string;
  }): Promise<Admission> {
    return Promise.resolve(mockStore.admitPatient(data));
  },

  async transferBed(
    admissionId: string,
    toWardId: string,
    toBedId: string,
    reason: string,
    authorizedBy: string
  ): Promise<BedTransfer> {
    return Promise.resolve(mockStore.transferBed(admissionId, toWardId, toBedId, reason, authorizedBy));
  },

  async addNursingObservation(data: {
    admissionId: string;
    patientId: string;
    nurseId: string;
    nurseName: string;
    vitals: VitalSigns;
    painScore: number;
    consciousness: 'Alert' | 'Verbal' | 'Pain' | 'Unresponsive';
    notes: string;
    fluidsIntakeMl?: number;
    fluidsOutputMl?: number;
  }): Promise<NursingObservation> {
    return Promise.resolve(mockStore.addNursingObservation(data));
  },

  async dischargePatient(data: {
    admissionId: string;
    dischargingDoctorId: string;
    dischargingDoctorName: string;
    conditionAtDischarge: 'recovered' | 'improved' | 'unchanged' | 'critical' | 'transferred_out' | 'deceased';
    dischargeDiagnosis: string;
    dischargeInstructions: string;
    dischargeMedications: string;
    followUpDate?: string;
    followUpInstructions?: string;
  }): Promise<Admission> {
    return Promise.resolve(mockStore.dischargePatient(data));
  },

  subscribe(listener: () => void): () => void {
    return mockStore.subscribe(listener);
  },
};
