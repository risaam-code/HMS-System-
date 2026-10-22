import { mockStore } from './mockHospitalStore';
import { LabTest, LabRequest, LabResultItem } from '@/types';

export const LaboratoryService = {
  async getLabTests(): Promise<LabTest[]> {
    return Promise.resolve(mockStore.getLabTests());
  },

  async getLabRequests(): Promise<LabRequest[]> {
    return Promise.resolve(mockStore.getLabRequests());
  },

  async getLabRequestById(id: string): Promise<LabRequest | undefined> {
    return Promise.resolve(mockStore.getLabRequestById(id));
  },

  async requestLabTest(data: {
    patientId: string;
    doctorId: string;
    testId: string;
    priority: 'Routine' | 'Urgent' | 'STAT';
    clinicalNotes?: string;
    medicalRecordId?: string;
    visitId?: string;
  }): Promise<LabRequest> {
    return Promise.resolve(mockStore.requestLabTest(data));
  },

  async collectLabSample(
    requestId: string,
    data: { sampleType: string; collectorName: string; collectorNotes?: string }
  ): Promise<LabRequest> {
    return Promise.resolve(mockStore.collectLabSample(requestId, data));
  },

  async enterLabResults(
    requestId: string,
    data: {
      resultItems: LabResultItem[];
      interpretation?: string;
      isPanicValue?: boolean;
      enteredBy: string;
    }
  ): Promise<LabRequest> {
    return Promise.resolve(mockStore.enterLabResults(requestId, data));
  },

  async verifyLabResults(
    requestId: string,
    data: {
      verifiedBy: string;
      verifiedByName: string;
      verifiedByRole: string;
      verificationNotes?: string;
    }
  ): Promise<LabRequest> {
    return Promise.resolve(mockStore.verifyLabResults(requestId, data));
  },

  async getLabReport(requestId: string): Promise<{ request: LabRequest; isPreliminary: boolean }> {
    return Promise.resolve(mockStore.getLabReport(requestId));
  },

  subscribe(listener: () => void): () => void {
    return mockStore.subscribe(listener);
  },
};
