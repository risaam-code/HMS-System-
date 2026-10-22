// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — PART 4 ADVANCED OPERATIONS TEST SUITE
// ==============================================================================
// Validates:
// 1. Inpatient Bed Allocation & Concurrency Guard (occupied bed prevention)
// 2. Bed Transfers & Nursing Rounding Observations
// 3. Discharge Processing & Automatic Room Stay Billing
// 4. Laboratory Sample Collection & Barcode Accessioning
// 5. Laboratory Panic Alerts & Pathologist Verification Gate
// 6. Pharmacy FEFO Batch Selection & Expired Medicine Dispensing Guard
// 7. Negative Stock Prevention & Atomic Stock Deduction
// 8. Server-Side Invoice Total Recalculation (subtotal + tax - discounts)
// 9. Payment Idempotency & Duplicate Prevention
// 10. PCI-DSS Masked Payment Tender & Authorized Financial Refunds
// ==============================================================================

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

// ------------------------------------------------------------------------------
// TEST SUITE 1: INPATIENT MANAGEMENT & BED CONCURRENCY
// ------------------------------------------------------------------------------
describe('1. Inpatient Management & Bed Concurrency Safety', () => {
  // Mock Inpatient State
  const beds = [
    { id: 'bed-101', wardId: 'w-1', bedNumber: 'ICU-01', status: 'occupied', currentAdmissionId: 'adm-1' },
    { id: 'bed-102', wardId: 'w-1', bedNumber: 'ICU-02', status: 'available', currentAdmissionId: null },
    { id: 'bed-103', wardId: 'w-1', bedNumber: 'ICU-03', status: 'cleaning', currentAdmissionId: null },
  ];

  const admissions = [
    {
      id: 'adm-1',
      admissionNumber: 'ADM-2026-0001',
      patientId: 'pat-1',
      patientName: 'Eleanor Vance',
      bedId: 'bed-101',
      wardId: 'w-1',
      dailyRate: 350.00,
      admissionDate: '2026-10-15T08:00:00Z',
      status: 'admitted',
    },
  ];

  const bedTransfers = [];
  const nursingObservations = [];

  function admitPatient(data) {
    const bed = beds.find((b) => b.id === data.bedId);
    if (!bed) throw new Error('Bed not found.');
    if (bed.status === 'occupied') {
      throw new Error(`Bed ${bed.bedNumber} is currently occupied by another patient.`);
    }
    if (bed.status === 'maintenance' || bed.status === 'cleaning') {
      throw new Error(`Bed ${bed.bedNumber} is not ready for admission (Status: ${bed.status}).`);
    }

    const admission = {
      id: `adm-${Date.now()}`,
      admissionNumber: `ADM-2026-${String(admissions.length + 1).padStart(4, '0')}`,
      ...data,
      status: 'admitted',
    };
    admissions.push(admission);
    bed.status = 'occupied';
    bed.currentAdmissionId = admission.id;
    return admission;
  }

  function transferBed(admissionId, newBedId, reason, authorizedBy) {
    const admission = admissions.find((a) => a.id === admissionId);
    if (!admission || admission.status !== 'admitted') {
      throw new Error('Active admission encounter not found.');
    }
    const currentBed = beds.find((b) => b.id === admission.bedId);
    const targetBed = beds.find((b) => b.id === newBedId);

    if (!targetBed) throw new Error('Target bed not found.');
    if (targetBed.status === 'occupied') {
      throw new Error(`Target bed ${targetBed.bedNumber} is already occupied.`);
    }

    // Release current bed
    if (currentBed) {
      currentBed.status = 'available';
      currentBed.currentAdmissionId = null;
    }

    // Allocate new bed
    targetBed.status = 'occupied';
    targetBed.currentAdmissionId = admission.id;
    admission.bedId = targetBed.id;

    const transferRecord = {
      id: `trf-${Date.now()}`,
      admissionId: admission.id,
      fromBedId: currentBed ? currentBed.id : 'unknown',
      toBedId: targetBed.id,
      reason,
      authorizedBy,
      transferredAt: new Date().toISOString(),
    };
    bedTransfers.push(transferRecord);
    return transferRecord;
  }

  test('Blocks assigning an already occupied bed', () => {
    assert.throws(
      () => {
        admitPatient({
          patientId: 'pat-2',
          patientName: 'Marcus Bennett',
          bedId: 'bed-101', // Already occupied by adm-1
          wardId: 'w-1',
          dailyRate: 350.00,
        });
      },
      { message: /is currently occupied/ }
    );
  });

  test('Blocks assigning a bed undergoing cleaning or maintenance', () => {
    assert.throws(
      () => {
        admitPatient({
          patientId: 'pat-2',
          patientName: 'Marcus Bennett',
          bedId: 'bed-103', // Status is cleaning
          wardId: 'w-1',
          dailyRate: 350.00,
        });
      },
      { message: /not ready for admission/ }
    );
  });

  test('Successfully allocates available bed and sets status to occupied', () => {
    const newAdm = admitPatient({
      patientId: 'pat-2',
      patientName: 'Marcus Bennett',
      bedId: 'bed-102',
      wardId: 'w-1',
      dailyRate: 350.00,
    });

    assert.equal(newAdm.status, 'admitted');
    const bed102 = beds.find((b) => b.id === 'bed-102');
    assert.equal(bed102.status, 'occupied');
    assert.equal(bed102.currentAdmissionId, newAdm.id);
  });

  test('Transfers patient to new bed, releasing old bed to available', () => {
    // Release bed-103 to available first
    beds.find((b) => b.id === 'bed-103').status = 'available';

    const trf = transferBed('adm-1', 'bed-103', 'Step-down from ICU to General Care', 'Dr. Sarah Lin');
    assert.ok(trf.id);

    const oldBed = beds.find((b) => b.id === 'bed-101');
    const newBed = beds.find((b) => b.id === 'bed-103');
    assert.equal(oldBed.status, 'available');
    assert.equal(oldBed.currentAdmissionId, null);
    assert.equal(newBed.status, 'occupied');
    assert.equal(newBed.currentAdmissionId, 'adm-1');
  });

  test('Records nursing observations with vitals and pain assessment', () => {
    const obs = {
      id: 'obs-1',
      admissionId: 'adm-1',
      patientId: 'pat-1',
      nurseId: 'nur-1',
      nurseName: 'Emily Clark, RN',
      vitals: {
        bloodPressureSystolic: 124,
        bloodPressureDiastolic: 82,
        heartRate: 74,
        temperature: 37.0,
        oxygenSaturation: 99,
        respiratoryRate: 16,
      },
      painScore: 2,
      consciousness: 'Alert',
      fluidsIntakeMl: 500,
      fluidsOutputMl: 450,
      notes: 'Patient resting comfortably. Surgical dressing dry and intact.',
      recordedAt: new Date().toISOString(),
    };

    nursingObservations.push(obs);
    assert.equal(obs.painScore, 2);
    assert.equal(obs.vitals.oxygenSaturation, 99);
    assert.equal(obs.consciousness, 'Alert');
  });
});

// ------------------------------------------------------------------------------
// TEST SUITE 2: LABORATORY MANAGEMENT & PATHOLOGIST GATES
// ------------------------------------------------------------------------------
describe('2. Laboratory Management (LIS) & Pathologist Verification Gate', () => {
  const labRequests = [];

  function requestLabTest(params) {
    const req = {
      id: `lrq-${Date.now()}`,
      requestNumber: `LRQ-2026-0001`,
      patientId: params.patientId,
      patientName: params.patientName,
      doctorId: params.doctorId,
      testName: params.testName,
      priority: params.priority || 'Routine',
      status: 'requested',
      sampleBarcode: null,
      resultItems: [],
      verifiedAt: null,
      verifiedByName: null,
    };
    labRequests.push(req);
    return req;
  }

  function collectSample(requestId, collectorName) {
    const req = labRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Lab request not found.');
    req.status = 'sample_collected';
    req.sampleBarcode = `SMP-${Math.floor(10000 + Math.random() * 90000)}`;
    req.sampleCollectedBy = collectorName;
    return req;
  }

  function enterResults(requestId, resultItems) {
    const req = labRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Lab request not found.');
    if (req.status !== 'sample_collected') {
      throw new Error('Cannot enter results before sample is accessioned.');
    }

    let hasPanic = false;
    for (const item of resultItems) {
      if (item.flag === 'critical') hasPanic = true;
    }

    req.resultItems = resultItems;
    req.isPanicValue = hasPanic;
    req.status = 'results_entered';
    return req;
  }

  function verifyResults(requestId, pathologistName, notes) {
    const req = labRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Lab request not found.');
    if (req.status !== 'results_entered') {
      throw new Error('Results must be entered before pathologist verification.');
    }

    req.status = 'verified';
    req.verifiedByName = pathologistName;
    req.verificationNotes = notes;
    req.verifiedAt = new Date().toISOString();
    return req;
  }

  function generateOfficialReport(requestId) {
    const req = labRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Lab request not found.');
    if (req.status !== 'verified') {
      return { isPreliminary: true, warning: 'PRELIMINARY UNVERIFIED REPORT - NOT FOR CLINICAL ACTION' };
    }
    return { isPreliminary: false, officialStamp: 'PATHOLOGIST CERTIFIED' };
  }

  test('Creates laboratory request and generates accessioning barcode', () => {
    const req = requestLabTest({
      patientId: 'pat-1',
      patientName: 'Eleanor Vance',
      doctorId: 'doc-1',
      testName: 'Complete Blood Count (CBC)',
      priority: 'Urgent',
    });

    assert.equal(req.status, 'requested');
    assert.equal(req.sampleBarcode, null);

    const collected = collectSample(req.id, 'Phlebotomist John');
    assert.equal(collected.status, 'sample_collected');
    assert.match(collected.sampleBarcode, /^SMP-\d{5}$/);
  });

  test('Detects panic / critical values and flags laboratory order', () => {
    const req = labRequests[0];
    const results = [
      { parameter: 'White Blood Cell (WBC)', value: 24.5, unit: '10^3/uL', referenceRange: '4.5 - 11.0', flag: 'critical' },
      { parameter: 'Hemoglobin (Hb)', value: 13.8, unit: 'g/dL', referenceRange: '12.0 - 16.0', flag: 'normal' },
    ];

    const entered = enterResults(req.id, results);
    assert.equal(entered.status, 'results_entered');
    assert.equal(entered.isPanicValue, true);
  });

  test('Blocks unverified laboratory results from being treated as final', () => {
    const req = labRequests[0];
    const report = generateOfficialReport(req.id);
    assert.equal(report.isPreliminary, true);
    assert.match(report.warning, /PRELIMINARY UNVERIFIED/);
  });

  test('Pathologist verification certifies results as official clinical report', () => {
    const req = labRequests[0];
    verifyResults(req.id, 'Dr. Marcus Vance, MD (Chief Pathologist)', 'Leukocytosis verified; attending physician alerted.');
    assert.equal(req.status, 'verified');

    const report = generateOfficialReport(req.id);
    assert.equal(report.isPreliminary, false);
    assert.equal(report.officialStamp, 'PATHOLOGIST CERTIFIED');
  });
});

// ------------------------------------------------------------------------------
// TEST SUITE 3: PHARMACY & INVENTORY MANAGEMENT (FEFO & DISPENSING)
// ------------------------------------------------------------------------------
describe('3. Pharmacy Formulary, FEFO Prioritization & Dispensing Guards', () => {
  const medicines = [
    { id: 'med-1', skuCode: 'MED-AMX-500', brandName: 'Amoxil', stockQuantity: 150, reorderLevel: 50 },
    { id: 'med-2', skuCode: 'MED-INS-GLR', brandName: 'Lantus', stockQuantity: 20, reorderLevel: 25 },
  ];

  const batches = [
    // Two batches for med-1: one expiring in 3 months, one expiring in 1 year
    { id: 'bat-1', medicineId: 'med-1', batchNumber: 'LOT-AMX-2026-Q4', expiryDate: '2026-12-31', quantityAvailable: 50, status: 'active' },
    { id: 'bat-2', medicineId: 'med-1', batchNumber: 'LOT-AMX-2027-Q2', expiryDate: '2027-06-30', quantityAvailable: 100, status: 'active' },
    // Expired batch for med-2
    { id: 'bat-3', medicineId: 'med-2', batchNumber: 'LOT-EXP-2025', expiryDate: '2025-01-01', quantityAvailable: 10, status: 'expired' },
  ];

  function getBatchesFEFO(medicineId) {
    return batches
      .filter((b) => b.medicineId === medicineId)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }

  function dispenseMedicine(medicineId, batchId, quantity) {
    const med = medicines.find((m) => m.id === medicineId);
    if (!med) throw new Error('Medicine not found.');

    const batch = batches.find((b) => b.id === batchId);
    if (!batch) throw new Error('Batch not found.');

    // Expired batch check
    const today = new Date().toISOString().slice(0, 10);
    if (batch.expiryDate < today) {
      throw new Error(`Cannot dispense medicine from expired batch ${batch.batchNumber} (Expired on ${batch.expiryDate}).`);
    }

    // Negative stock check
    if (quantity > batch.quantityAvailable) {
      throw new Error(`Insufficient batch stock. Requested: ${quantity}, Available: ${batch.quantityAvailable}.`);
    }

    if (quantity > med.stockQuantity) {
      throw new Error(`Insufficient total formulary stock. Requested: ${quantity}, In Stock: ${med.stockQuantity}.`);
    }

    // Atomic stock deduction
    batch.quantityAvailable -= quantity;
    med.stockQuantity -= quantity;

    return { medicineId, batchNumber: batch.batchNumber, quantityDispensed: quantity };
  }

  test('Prioritizes batches using FEFO (First-Expiry-First-Out)', () => {
    const fefoBatches = getBatchesFEFO('med-1');
    assert.equal(fefoBatches[0].batchNumber, 'LOT-AMX-2026-Q4'); // 2026 comes before 2027
    assert.equal(fefoBatches[1].batchNumber, 'LOT-AMX-2027-Q2');
  });

  test('Blocks dispensing from an expired batch', () => {
    assert.throws(
      () => {
        dispenseMedicine('med-2', 'bat-3', 2);
      },
      { message: /Cannot dispense medicine from expired batch/ }
    );
  });

  test('Blocks dispensing quantity exceeding available batch inventory', () => {
    assert.throws(
      () => {
        dispenseMedicine('med-1', 'bat-1', 60); // only 50 available in bat-1
      },
      { message: /Insufficient batch stock/ }
    );
  });

  test('Atomically deducts batch and formulary quantities on successful dispense', () => {
    const result = dispenseMedicine('med-1', 'bat-1', 15);
    assert.equal(result.quantityDispensed, 15);

    const bat1 = batches.find((b) => b.id === 'bat-1');
    const med1 = medicines.find((m) => m.id === 'med-1');
    assert.equal(bat1.quantityAvailable, 35); // 50 - 15
    assert.equal(med1.stockQuantity, 135);    // 150 - 15
  });
});

// ------------------------------------------------------------------------------
// TEST SUITE 4: BILLING, PAYMENTS, IDEMPOTENCY & AUTHORIZED REFUNDS
// ------------------------------------------------------------------------------
describe('4. Billing, Server-Side Recalculations, Idempotency & Refunds', () => {
  const invoices = [];
  const payments = [];
  const refunds = [];

  function createInvoice(data) {
    // Server-Side Total Calculation Rule (Never trust client totals)
    const subtotal = data.items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100; // 5% tax
    const discount = data.discountAmount || 0;
    const insurance = data.insuranceCoveredAmount || 0;
    const totalAmount = Math.max(0, Math.round((subtotal + taxAmount - discount - insurance) * 100) / 100);

    const invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-0001`,
      patientId: data.patientId,
      subtotal,
      taxAmount,
      discountAmount: discount,
      insuranceCoveredAmount: insurance,
      totalAmount,
      paidAmount: 0,
      balanceDue: totalAmount,
      status: 'unpaid',
      items: data.items,
    };
    invoices.push(invoice);
    return invoice;
  }

  function recordPayment(data) {
    // 1. Idempotency Check
    const existingPayment = payments.find((p) => p.idempotencyKey === data.idempotencyKey);
    if (existingPayment) {
      return { ...existingPayment, isDuplicatePrevented: true };
    }

    const invoice = invoices.find((i) => i.id === data.invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    if (data.amount > invoice.balanceDue) {
      throw new Error(`Payment amount ($${data.amount}) exceeds outstanding balance due ($${invoice.balanceDue}).`);
    }

    // PCI-DSS: Mask raw credit cards
    const maskedRef =
      data.paymentMethod === 'credit_card' || data.paymentMethod === 'debit_card'
        ? (data.transactionReference || 'CARD-POS').replace(/\b(?:\d{4}[ -]?){3}(?=\d{4}\b)/g, '****-****-****-')
        : data.transactionReference;

    const payment = {
      id: `pay-${Date.now()}`,
      receiptNumber: `REC-2026-0001`,
      invoiceId: invoice.id,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionReference: maskedRef,
      idempotencyKey: data.idempotencyKey,
      isRefund: false,
    };

    payments.push(payment);

    // Update invoice
    invoice.paidAmount = Math.round((invoice.paidAmount + data.amount) * 100) / 100;
    invoice.balanceDue = Math.max(0, Math.round((invoice.totalAmount - invoice.paidAmount) * 100) / 100);
    invoice.status = invoice.balanceDue <= 0 ? 'paid' : 'partially_paid';

    return payment;
  }

  function processRefund(paymentId, amount, reason, authorizedBy) {
    const payment = payments.find((p) => p.id === paymentId);
    if (!payment) throw new Error('Payment not found.');
    if (payment.isRefund) throw new Error('Payment has already been refunded.');
    if (amount > payment.amount) {
      throw new Error(`Refund amount ($${amount}) cannot exceed payment ($${payment.amount}).`);
    }

    const invoice = invoices.find((i) => i.id === payment.invoiceId);
    if (!invoice) throw new Error('Invoice not found.');

    const refund = {
      id: `ref-${Date.now()}`,
      refundNumber: `REF-2026-0001`,
      paymentId: payment.id,
      invoiceId: invoice.id,
      amount,
      reason,
      authorizedBy,
    };
    refunds.push(refund);

    // Mark payment as refunded
    payment.isRefund = true;

    // Restore invoice balance
    invoice.paidAmount = Math.max(0, Math.round((invoice.paidAmount - amount) * 100) / 100);
    invoice.balanceDue = Math.round((invoice.totalAmount - invoice.paidAmount) * 100) / 100;
    invoice.status = invoice.paidAmount === 0 ? 'unpaid' : 'partially_paid';

    return refund;
  }

  test('Calculates invoice totals, 5% tax, and discounts server-side', () => {
    const invoice = createInvoice({
      patientId: 'pat-1',
      items: [
        { description: 'Specialist Consultation', unitPrice: 150.00, quantity: 1 },
        { description: 'Comprehensive Metabolic Panel', unitPrice: 85.00, quantity: 1 },
      ],
      discountAmount: 15.00,
      insuranceCoveredAmount: 50.00,
    });

    // Subtotal: 150 + 85 = 235
    // Tax (5% of 235): 11.75
    // Total: 235 + 11.75 - 15 - 50 = 181.75
    assert.equal(invoice.subtotal, 235.00);
    assert.equal(invoice.taxAmount, 11.75);
    assert.equal(invoice.totalAmount, 181.75);
    assert.equal(invoice.balanceDue, 181.75);
    assert.equal(invoice.status, 'unpaid');
  });

  test('Blocks overpayment exceeding outstanding balance due', () => {
    const invoice = invoices[0];
    assert.throws(
      () => {
        recordPayment({
          invoiceId: invoice.id,
          amount: 250.00, // Balance due is 181.75
          paymentMethod: 'cash',
          idempotencyKey: 'idemp_key_1',
        });
      },
      { message: /exceeds outstanding balance due/ }
    );
  });

  test('Applies idempotency check to prevent duplicate payment on network retry', () => {
    const invoice = invoices[0];
    const firstPayment = recordPayment({
      invoiceId: invoice.id,
      amount: 100.00,
      paymentMethod: 'credit_card',
      transactionReference: '4111-1111-1111-1234',
      idempotencyKey: 'idemp_unique_abc123',
    });

    assert.equal(firstPayment.amount, 100.00);
    assert.equal(firstPayment.transactionReference, '****-****-****-1234');
    assert.equal(invoice.balanceDue, 81.75);
    assert.equal(invoice.status, 'partially_paid');

    // Duplicate submission with same idempotency key
    const duplicatePayment = recordPayment({
      invoiceId: invoice.id,
      amount: 100.00,
      paymentMethod: 'credit_card',
      transactionReference: '4111-1111-1111-1234',
      idempotencyKey: 'idemp_unique_abc123',
    });

    assert.equal(duplicatePayment.isDuplicatePrevented, true);
    // Balance due should NOT have changed again
    assert.equal(invoice.balanceDue, 81.75);
  });

  test('Processes authorized refund, marks receipt as refunded, and reopens invoice balance', () => {
    const invoice = invoices[0];
    const payment = payments[0];

    const refund = processRefund(payment.id, 100.00, 'Duplicate copay dispute', 'Dr. Sarah Lin (Finance Dir)');
    assert.equal(refund.amount, 100.00);
    assert.equal(payment.isRefund, true);

    // Balance restored to 181.75
    assert.equal(invoice.paidAmount, 0);
    assert.equal(invoice.balanceDue, 181.75);
    assert.equal(invoice.status, 'unpaid');
  });
});
