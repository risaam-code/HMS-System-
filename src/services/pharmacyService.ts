import { mockStore } from './mockHospitalStore';
import {
  Medicine,
  MedicineBatch,
  InventoryTransaction,
  Prescription,
  PrescriptionItemDetail,
  DispensingRecord,
} from '@/types';

export const PharmacyService = {
  async getMedicines(): Promise<Medicine[]> {
    return Promise.resolve(mockStore.getMedicines());
  },

  async getMedicineBatches(medicineId?: string): Promise<MedicineBatch[]> {
    return Promise.resolve(mockStore.getMedicineBatches(medicineId));
  },

  async getInventoryTransactions(): Promise<InventoryTransaction[]> {
    return Promise.resolve(mockStore.getInventoryTransactions());
  },

  async getPrescriptions(patientId?: string): Promise<Prescription[]> {
    return Promise.resolve(mockStore.getPrescriptions(patientId));
  },

  async getPrescriptionById(id: string): Promise<Prescription | undefined> {
    return Promise.resolve(mockStore.getPrescriptionById(id));
  },

  async getDispensingRecords(): Promise<DispensingRecord[]> {
    return Promise.resolve(mockStore.getDispensingRecords());
  },

  async addMedicine(data: Omit<Medicine, 'id'>): Promise<Medicine> {
    return Promise.resolve(mockStore.addMedicine(data));
  },

  async updateMedicine(id: string, updates: Partial<Medicine>): Promise<Medicine> {
    return Promise.resolve(mockStore.updateMedicine(id, updates));
  },

  async receiveMedicineBatch(data: {
    medicineId: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    unitCost: number;
    supplier: string;
    receivedBy: string;
    receivedByName: string;
  }): Promise<MedicineBatch> {
    return Promise.resolve(mockStore.receiveMedicineBatch(data));
  },

  async adjustMedicineStock(data: {
    medicineId: string;
    batchId?: string;
    adjustmentType: 'adjustment' | 'return' | 'disposal';
    quantity: number;
    reason: string;
    performedBy: string;
    performedByName: string;
  }): Promise<InventoryTransaction> {
    return Promise.resolve(mockStore.adjustMedicineStock(data));
  },

  async createPrescription(data: {
    patientId: string;
    doctorId: string;
    diagnosis?: string;
    validUntil: string;
    notes?: string;
    items: Omit<PrescriptionItemDetail, 'quantityDispensed'>[];
    medicalRecordId?: string;
    visitId?: string;
  }): Promise<Prescription> {
    return Promise.resolve(mockStore.createPrescription(data));
  },

  async dispensePrescription(data: {
    prescriptionId: string;
    pharmacistId: string;
    pharmacistName: string;
    items: {
      medicineId: string;
      batchId: string;
      quantity: number;
      unitPrice: number;
    }[];
    notes?: string;
  }): Promise<DispensingRecord> {
    return Promise.resolve(mockStore.dispensePrescription(data));
  },

  subscribe(listener: () => void): () => void {
    return mockStore.subscribe(listener);
  },
};
