import { mockStore } from './mockHospitalStore';
import { Invoice, InvoiceItem, Payment, PaymentMethod, RefundRecord } from '@/types';

export const BillingService = {
  async getInvoices(patientId?: string): Promise<Invoice[]> {
    return Promise.resolve(mockStore.getInvoices(patientId));
  },

  async getInvoiceById(id: string): Promise<Invoice | undefined> {
    return Promise.resolve(mockStore.getInvoiceById(id));
  },

  async getPayments(invoiceId?: string): Promise<Payment[]> {
    return Promise.resolve(mockStore.getPayments(invoiceId));
  },

  async getRefunds(): Promise<RefundRecord[]> {
    return Promise.resolve(mockStore.getRefunds());
  },

  async createInvoice(data: {
    patientId: string;
    dueDate: string;
    notes?: string;
    items: Omit<InvoiceItem, 'id' | 'totalPrice'>[];
    admissionId?: string;
    discountAmount?: number;
    insuranceCoveredAmount?: number;
    createdBy: string;
    createdByName: string;
  }): Promise<Invoice> {
    return Promise.resolve(mockStore.createInvoice(data));
  },

  async addInvoiceItem(invoiceId: string, item: Omit<InvoiceItem, 'id' | 'totalPrice'>): Promise<Invoice> {
    return Promise.resolve(mockStore.addInvoiceItem(invoiceId, item));
  },

  async recordPayment(data: {
    invoiceId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    transactionReference?: string;
    idempotencyKey: string;
    receivedBy: string;
    receivedByName: string;
    notes?: string;
  }): Promise<Payment> {
    return Promise.resolve(mockStore.recordPayment(data));
  },

  async processRefund(data: {
    paymentId: string;
    invoiceId: string;
    amount: number;
    reason: string;
    authorizedBy: string;
    authorizedByName: string;
  }): Promise<RefundRecord> {
    return Promise.resolve(mockStore.processRefund(data));
  },

  subscribe(listener: () => void): () => void {
    return mockStore.subscribe(listener);
  },
};
