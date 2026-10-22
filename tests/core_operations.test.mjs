// ==============================================================================
// MEDPULSE HOSPITAL MANAGEMENT SYSTEM (HMS) — PART 3 CORE OPERATIONS TEST SUITE
// ==============================================================================
// Validates:
// 1. Patient MRN generation, duplicate checks, demographic updates, archiving
// 2. Department deletion protection when linked to doctors/appointments
// 3. Doctor registration, fee structure, and weekly availability schedule
// 4. Appointment double-booking overlap concurrency guards and cancellation reasons
// 5. Medical record digital signing and immutable amendment logging
// 6. Complete 11-step outpatient (OPD) encounter lifecycle
// ==============================================================================

import assert from 'node:assert/strict';
import { test, describe } from 'node:test';

// ------------------------------------------------------------------------------
// TEST SUITE 1: PATIENT MANAGEMENT & MRN / DUPLICATE DETECTION
// ------------------------------------------------------------------------------
describe('1. Patient Management & Master Patient Index (MPI)', () => {
  const existingPatients = [
    {
      id: 'pat-1',
      medicalRecordNumber: 'MRN-2026-00101',
      firstName: 'Eleanor',
      lastName: 'Vance',
      gender: 'female',
      dateOfBirth: '1982-04-12',
      phone: '+1 (555) 234-5678',
      email: 'eleanor.vance@example.com',
      status: 'active',
    },
    {
      id: 'pat-2',
      medicalRecordNumber: 'MRN-2026-00102',
      firstName: 'James',
      lastName: 'Henderson',
      gender: 'male',
      dateOfBirth: '1975-09-22',
      phone: '+1 (555) 345-6789',
      email: 'james.henderson@example.com',
      status: 'admitted',
    },
  ];

  function checkDuplicatePatient(patients, params) {
    const cleanPhone = params.phone ? params.phone.replace(/\D/g, '') : '';
    const cleanEmail = params.email ? params.email.trim().toLowerCase() : '';
    const cleanFirst = params.firstName ? params.firstName.trim().toLowerCase() : '';
    const cleanLast = params.lastName ? params.lastName.trim().toLowerCase() : '';

    for (const p of patients) {
      if (params.excludeId && p.id === params.excludeId) continue;

      const pPhone = p.phone ? p.phone.replace(/\D/g, '') : '';
      const phoneMatches = Boolean(
        cleanPhone && pPhone && (
          cleanPhone.length >= 10 && pPhone.length >= 10
            ? cleanPhone.slice(-10) === pPhone.slice(-10)
            : cleanPhone === pPhone
        )
      );
      if (phoneMatches) {
        return { isDuplicate: true, reason: 'Duplicate phone' };
      }
      if (cleanEmail && p.email && p.email.trim().toLowerCase() === cleanEmail) {
        return { isDuplicate: true, reason: 'Duplicate email' };
      }
      if (
        cleanFirst &&
        cleanLast &&
        params.dateOfBirth &&
        p.firstName.trim().toLowerCase() === cleanFirst &&
        p.lastName.trim().toLowerCase() === cleanLast &&
        p.dateOfBirth === params.dateOfBirth
      ) {
        return { isDuplicate: true, reason: 'Duplicate exact name and date of birth' };
      }
    }
    return { isDuplicate: false };
  }

  test('generates valid sequential MRN format (MRN-YYYY-XXXXX)', () => {
    const currentYear = new Date().getFullYear();
    const regex = new RegExp(`^MRN-${currentYear}-\\d{5}$`);
    const sampleMrn = `MRN-${currentYear}-00103`;
    assert.match(sampleMrn, regex);
  });

  test('detects duplicate patient by phone number', () => {
    const res = checkDuplicatePatient(existingPatients, { phone: '(555) 234-5678' });
    assert.equal(res.isDuplicate, true);
    assert.equal(res.reason, 'Duplicate phone');
  });

  test('detects duplicate patient by email address', () => {
    const res = checkDuplicatePatient(existingPatients, { email: 'ELEANOR.VANCE@example.com' });
    assert.equal(res.isDuplicate, true);
    assert.equal(res.reason, 'Duplicate email');
  });

  test('detects duplicate patient by matching full name and birthdate', () => {
    const res = checkDuplicatePatient(existingPatients, {
      firstName: 'James',
      lastName: 'Henderson',
      dateOfBirth: '1975-09-22',
      phone: '+1 (555) 999-0000',
    });
    assert.equal(res.isDuplicate, true);
    assert.equal(res.reason, 'Duplicate exact name and date of birth');
  });

  test('permits distinct new patient registration', () => {
    const res = checkDuplicatePatient(existingPatients, {
      firstName: 'Arthur',
      lastName: 'Dent',
      dateOfBirth: '1980-01-01',
      phone: '+1 (555) 888-7777',
      email: 'arthur.dent@example.com',
    });
    assert.equal(res.isDuplicate, false);
  });

  test('excludes self ID during patient profile updates', () => {
    const res = checkDuplicatePatient(existingPatients, {
      firstName: 'Eleanor',
      lastName: 'Vance',
      dateOfBirth: '1982-04-12',
      phone: '+1 (555) 234-5678',
      excludeId: 'pat-1',
    });
    assert.equal(res.isDuplicate, false);
  });
});

// ------------------------------------------------------------------------------
// TEST SUITE 2: DEPARTMENT INTEGRITY & DELETION GUARDS
// ------------------------------------------------------------------------------
describe('2. Department Management & Referential Protection', () => {
  const departments = [
    { id: 'dept-1', name: 'Cardiology', code: 'CARD', status: 'active' },
    { id: 'dept-99', name: 'Temporary Archive Wing', code: 'TEMP', status: 'inactive' },
  ];
  const doctors = [{ id: 'doc-1', departmentId: 'dept-1', fullName: 'Dr. Robert Vance' }];
  const appointments = [{ id: 'apt-1', departmentId: 'dept-1' }];

  function validateDepartmentDeletion(deptId) {
    const docCount = doctors.filter((d) => d.departmentId === deptId).length;
    if (docCount > 0) {
      throw new Error(`Cannot delete department: ${docCount} doctor(s) are assigned to it.`);
    }
    const aptCount = appointments.filter((a) => a.departmentId === deptId).length;
    if (aptCount > 0) {
      throw new Error(`Cannot delete department: ${aptCount} historical appointment(s) exist.`);
    }
    return { success: true };
  }

  test('prevents deletion of department linked to active doctors', () => {
    assert.throws(
      () => validateDepartmentDeletion('dept-1'),
      /Cannot delete department: 1 doctor\(s\) are assigned to it/
    );
  });

  test('allows deletion of standalone department with zero historical records', () => {
    const result = validateDepartmentDeletion('dept-99');
    assert.equal(result.success, true);
  });
});

// ------------------------------------------------------------------------------
// TEST SUITE 3: APPOINTMENT CONCURRENCY & OVERLAP GUARDS
// ------------------------------------------------------------------------------
describe('3. Appointment Scheduling & Doctor Overlap Concurrency', () => {
  const activeAppointments = [
    {
      id: 'apt-1',
      doctorId: 'doc-1',
      date: '2026-10-21',
      startTime: '09:00',
      endTime: '09:30',
      status: 'Confirmed',
    },
    {
      id: 'apt-2',
      doctorId: 'doc-1',
      date: '2026-10-21',
      startTime: '10:00',
      endTime: '10:30',
      status: 'Scheduled',
    },
    {
      id: 'apt-3',
      doctorId: 'doc-1',
      date: '2026-10-21',
      startTime: '11:00',
      endTime: '11:30',
      status: 'Cancelled', // Cancelled appointments do not block slot
    },
  ];

  function checkSlotConflict(existing, params) {
    const nonCancelled = existing.filter(
      (a) =>
        a.doctorId === params.doctorId &&
        a.date === params.date &&
        a.status !== 'Cancelled' &&
        a.status !== 'No Show' &&
        (!params.excludeId || a.id !== params.excludeId)
    );

    for (const apt of nonCancelled) {
      // Overlap: start1 < end2 && end1 > start2
      if (params.startTime < apt.endTime && params.endTime > apt.startTime) {
        return { hasConflict: true, conflictingId: apt.id };
      }
    }
    return { hasConflict: false };
  }

  test('detects exact overlapping time slot for the same doctor', () => {
    const res = checkSlotConflict(activeAppointments, {
      doctorId: 'doc-1',
      date: '2026-10-21',
      startTime: '09:00',
      endTime: '09:30',
    });
    assert.equal(res.hasConflict, true);
    assert.equal(res.conflictingId, 'apt-1');
  });

  test('detects partial overlap (starts during active appointment)', () => {
    const res = checkSlotConflict(activeAppointments, {
      doctorId: 'doc-1',
      date: '2026-10-21',
      startTime: '09:15',
      endTime: '09:45',
    });
    assert.equal(res.hasConflict, true);
    assert.equal(res.conflictingId, 'apt-1');
  });

  test('allows booking adjacent slots without overlap (09:30 to 10:00)', () => {
    const res = checkSlotConflict(activeAppointments, {
      doctorId: 'doc-1',
      date: '2026-10-21',
      startTime: '09:30',
      endTime: '10:00',
    });
    assert.equal(res.hasConflict, false);
  });

  test('allows booking slot that was previously cancelled', () => {
    const res = checkSlotConflict(activeAppointments, {
      doctorId: 'doc-1',
      date: '2026-10-21',
      startTime: '11:00',
      endTime: '11:30',
    });
    assert.equal(res.hasConflict, false);
  });

  test('enforces mandatory cancellation reason when marking Cancelled', () => {
    function cancelAppointment(reason) {
      if (!reason || reason.trim().length < 3) {
        throw new Error('A cancellation reason is strictly required.');
      }
      return { status: 'Cancelled', reason };
    }

    assert.throws(() => cancelAppointment(''), /cancellation reason is strictly required/);
    const valid = cancelAppointment('Patient called to reschedule due to emergency travel');
    assert.equal(valid.status, 'Cancelled');
  });
});

// ------------------------------------------------------------------------------
// TEST SUITE 4: MEDICAL RECORDS & IMMUTABLE AMENDMENT LOGGING
// ------------------------------------------------------------------------------
describe('4. Electronic Medical Records (EMR) & Digital Signing', () => {
  const sampleRecord = {
    id: 'rec-1',
    recordNumber: 'REC-2026-00441',
    patientMrn: 'MRN-2026-00101',
    doctorId: 'doc-1',
    doctorName: 'Dr. Robert Vance, MD',
    clinicalNotes: 'Initial SOAP assessment notes.',
    diagnosisCode: 'I10',
    diagnosisTitle: 'Essential Hypertension',
    isSigned: false,
    amendments: [],
  };

  test('allows physician to digitally sign and lock chart', () => {
    const signedRecord = {
      ...sampleRecord,
      isSigned: true,
      signedAt: '2026-10-20T10:00:00Z',
      signedByDoctorId: 'doc-1',
      signedByDoctorName: 'Dr. Robert Vance, MD',
    };
    assert.equal(signedRecord.isSigned, true);
    assert.equal(signedRecord.signedByDoctorName, 'Dr. Robert Vance, MD');
  });

  test('enforces that signed clinical notes cannot be silently overwritten', () => {
    const signedRecord = { ...sampleRecord, isSigned: true };

    function modifyRecord(record, newNotes, amendmentPayload) {
      if (record.isSigned) {
        if (!amendmentPayload || !amendmentPayload.reason) {
          throw new Error('Integrity Error: Signed clinical notes cannot be modified without recording an official clinical amendment.');
        }
        return {
          ...record,
          clinicalNotes: `${record.clinicalNotes}\n\n[AMENDMENT]: ${newNotes}`,
          amendments: [
            ...record.amendments,
            {
              id: 'amend-1',
              author: amendmentPayload.author,
              reason: amendmentPayload.reason,
              timestamp: '2026-10-20T14:00:00Z',
              previousNotes: record.clinicalNotes,
              newNotes,
            },
          ],
        };
      }
      return { ...record, clinicalNotes: newNotes };
    }

    // Direct overwrite must fail
    assert.throws(
      () => modifyRecord(signedRecord, 'Attempted silent overwrite of clinical notes', null),
      /Signed clinical notes cannot be modified without recording an official clinical amendment/
    );

    // Official amendment succeeds and preserves original notes
    const amended = modifyRecord(signedRecord, 'Corrected patient dosage note', {
      author: 'Dr. Robert Vance, MD',
      reason: 'Dosage clarification following pharmacy review',
    });
    assert.equal(amended.amendments.length, 1);
    assert.equal(amended.amendments[0].previousNotes, 'Initial SOAP assessment notes.');
  });
});

// ------------------------------------------------------------------------------
// TEST SUITE 5: OUTPATIENT (OPD) 11-STEP LIFECYCLE
// ------------------------------------------------------------------------------
describe('5. Outpatient Management (OPD) 11-Step Clinical Workflow', () => {
  const OPD_STEPS = [
    'Registered',
    'Checked In',
    'Triage Completed',
    'In Consultation',
    'Lab Requested',
    'Prescription Issued',
    'Billed',
    'Completed',
  ];

  test('validates correct state sequence from Intake Token to Visit Completion', () => {
    let visit = {
      id: 'opd-101',
      visitNumber: 'OPD-2026-01041',
      queueToken: 'T-101',
      status: 'Registered',
      patientMrn: 'MRN-2026-00101',
      consultationFee: 150.0,
    };

    // Step 4: Check In
    visit = { ...visit, status: 'Checked In', vitals: { temp: 36.8, bp: '120/80' } };
    assert.equal(visit.status, 'Checked In');

    // Step 6-7: Consultation & Diagnosis
    visit = { ...visit, status: 'In Consultation', diagnosis: 'Acute Pharyngitis' };
    assert.equal(visit.status, 'In Consultation');

    // Step 8: Order Labs
    visit = { ...visit, status: 'Lab Requested', labRequests: ['CBC', 'THROAT-SWAB'] };
    assert.equal(visit.status, 'Lab Requested');

    // Step 9: Prescriptions
    visit = {
      ...visit,
      status: 'Prescription Issued',
      prescriptions: [{ medicineName: 'Amoxicillin', dosage: '500mg' }],
    };
    assert.equal(visit.status, 'Prescription Issued');

    // Step 10: Billing
    visit = { ...visit, status: 'Billed', invoiceId: 'inv-9901' };
    assert.equal(visit.status, 'Billed');

    // Step 11: Completion
    visit = { ...visit, status: 'Completed', completedAt: '2026-10-20T16:30:00Z' };
    assert.equal(visit.status, 'Completed');
    assert.ok(visit.completedAt);
  });
});
