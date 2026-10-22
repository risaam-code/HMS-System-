# MedPulse Hospital Management System (HMS)
## Comprehensive Backup, Disaster Recovery & Business Continuity Plan

This document establishes the official operational standard for PostgreSQL database backups, disaster recovery (DR), uploaded document restoration, and weekly integrity verification for the MedPulse HMS infrastructure.

---

## 1. Executive Metrics & Objectives

| Objective Metric | Standard Target | Rationale |
| :--- | :--- | :--- |
| **Recovery Point Objective (RPO)** | **< 5 minutes** (with PITR) / **< 24 hours** (Daily Snapshot) | Maximum acceptable clinical data loss in an unrecoverable failure. |
| **Recovery Time Objective (RTO)** | **< 60 minutes** | Maximum allowable downtime before full hospital operations are restored. |
| **Integrity Verification Cadence** | **Weekly (Every Sunday 02:00 UTC)** | Mandatory automated restoration drill into an isolated staging sandbox. |
| **Authorized Recovery Personnel** | **Lead DBA & CTO (Dual-Key Authorization)** | Restricts write and restoration access to audited senior custodians. |

---

## 2. Supabase PostgreSQL Backup Architecture

MedPulse utilizes the real tiered capabilities of Supabase and PostgreSQL WAL (Write-Ahead Logging):

### 2.1 Daily Automated Physical Backups
- **Execution**: Managed automatically by the PostgreSQL cloud engine daily at `00:00 UTC`.
- **Retention**: 7 days on standard Pro tier, 30 days on Enterprise tier.
- **Storage**: Backups are encrypted at rest with AES-256 and stored off-site across multiple availability zones.

### 2.2 Point-In-Time Recovery (PITR)
- **Engine**: Continuous WAL archiving using `pgBackRest` or Supabase PITR.
- **Granularity**: Allows restoration to any specified second within the retention window (e.g., reverting an erroneous bulk update to `2026-10-21 14:22:15 UTC`).

### 2.3 On-Demand Logical Database Dumps
The operations team executes scheduled logical exports using `pg_dump` for offline cold storage:

```bash
# Full schema and data export with role preservation
pg_dump \
  -h db.<PROJECT_REF>.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --format=custom \
  --file="medpulse_backup_$(date +%Y%m%d_%H%M%S).dump"
```

---

## 3. Uploaded Medical Document & Storage Recovery

Medical records, laboratory requisition scans, and DICOM attachments reside in private Supabase Storage buckets:
- `medical-documents` (Confidential EMR PDFs, physician signatures)
- `lab-attachments` (Pathology analyzer raw printouts, histology images)
- `patient-photos` (Patient profile identification photos)

### 3.1 Object Storage Versioning & Replication
1. **Object Versioning**: Enabled on all private storage buckets to prevent accidental deletion or overwriting.
2. **Cross-Region Mirroring**: Bucket contents are mirrored every 6 hours to an encrypted secondary AWS S3 / Cloudflare R2 bucket.

### 3.2 Document Disaster Recovery Script
```bash
# Sync primary storage bucket to disaster recovery backup target
supabase storage download-all medical-documents ./backup_storage/medical-documents/
aws s3 sync ./backup_storage/medical-documents/ s3://medpulse-dr-cold-storage/medical-documents/ --sse aws:kms
```

---

## 4. Disaster Recovery & Restoration Procedures

### Step 1: Incident Assessment & Declaration
1. Lead DBA and Incident Commander verify database corruption, ransomware, or cloud zone failure.
2. Hospital Chief Medical Officer (CMO) notified; hospital shifts to downtime paper forms if RTO exceeds 15 minutes.

### Step 2: Provision Staging or Target Database
Ensure target Supabase instance or PostgreSQL 15+ server is initialized with `pgcrypto` and `uuid-ossp` extensions:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

### Step 3: Execute Restoration from Custom Dump
```bash
# Restore schema and data with concurrency
pg_restore \
  -h db.<NEW_PROJECT_REF>.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  --clean \
  --if-exists \
  --no-owner \
  --jobs=4 \
  --verbose "medpulse_backup_20261021_000000.dump"
```

### Step 4: Execute Schema Migrations Verification
Verify all 6 database migrations apply cleanly without breaking foreign keys or RLS:
```bash
supabase db push
```

### Step 5: Post-Restoration Data Integrity Audit
Run the automated verification script to validate record counts across critical clinical tables:
```sql
SELECT 
  (SELECT count(*) FROM public.patients) as total_patients,
  (SELECT count(*) FROM public.medical_records) as total_records,
  (SELECT count(*) FROM public.admissions WHERE status = 'admitted') as active_admissions,
  (SELECT count(*) FROM public.beds WHERE status = 'occupied') as occupied_beds,
  (SELECT count(*) FROM public.invoices) as total_invoices,
  (SELECT sum(paid_amount) FROM public.invoices) as total_collected_cash;
```

---

## 5. Weekly Restoration Drill Protocol

To ensure backups are not merely generated but proven recoverable:
1. **Schedule**: Executed every Sunday at `02:00 UTC` by the automated CI/CD pipeline.
2. **Procedure**:
   - The latest nightly backup dump is downloaded.
   - Restored into an isolated ephemeral PostgreSQL container.
   - Automated end-to-end test suite (`npm test`) runs against the restored database.
   - The test must pass 100% of the 60 test suites.
   - Container is destroyed, and a signed compliance report is logged into the audit ledger.

---

## 6. Access Control & Security Governance

- **Backup Encryption**: All backup files are encrypted with AES-256 before transit and at rest.
- **Secret Isolation**: Backup encryption keys and database master passwords are stored in HashiCorp Vault / AWS Secrets Manager; never committed to git repositories.
- **HIPAA Compliance**: Backup archives are subject to the same PHI confidentiality policies as the live electronic health record.
