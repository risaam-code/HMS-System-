# MedPulse Hospital Management System (HMS) — Entity-Relationship Diagram

This document illustrates the complete relational database architecture of the MedPulse HMS platform implemented in PostgreSQL / Supabase.

```mermaid
erDiagram
  ROLES ||--o{ ROLE_PERMISSIONS : defines
  PERMISSIONS ||--o{ ROLE_PERMISSIONS : assigned_to

  ROLES ||--o{ PROFILES : categorizes
  DEPARTMENTS ||--o{ EMPLOYEES : employs
  PROFILES ||--|| EMPLOYEES : identifies
  PROFILES ||--|| DOCTORS : credentials
  DEPARTMENTS ||--o{ DOCTORS : belongs_to

  DOCTORS ||--o{ PATIENTS : primary_physician
  PATIENTS ||--o{ APPOINTMENTS : books
  DOCTORS ||--o{ APPOINTMENTS : conducts
  DEPARTMENTS ||--o{ APPOINTMENTS : hosts

  PATIENTS ||--o{ MEDICAL_RECORDS : owns
  DOCTORS ||--o{ MEDICAL_RECORDS : authors
  APPOINTMENTS ||--o| MEDICAL_RECORDS : results_in

  PATIENTS ||--o{ ADMISSIONS : admitted
  DOCTORS ||--o{ ADMISSIONS : oversees
  DEPARTMENTS ||--o{ ADMISSIONS : houses

  PATIENTS ||--o{ LABORATORY_REQUESTS : tested
  DOCTORS ||--o{ LABORATORY_REQUESTS : orders
  LABORATORY_TESTS ||--o{ LABORATORY_REQUESTS : specifies
  EMPLOYEES ||--o{ LABORATORY_REQUESTS : processes

  PATIENTS ||--o{ INVOICES : billed_to
  ADMISSIONS ||--o| INVOICES : bills
  INVOICES ||--o{ PAYMENTS : settled_by
  PROFILES ||--o{ PAYMENTS : received_by

  PROFILES ||--o{ NOTIFICATIONS : receives
  ROLES ||--o{ NOTIFICATIONS : broadcasts_to

  PROFILES ||--o{ AUDIT_LOGS : performs

  ROLES {
    text id PK
    text name
    text description
    timestamptz created_at
  }

  PERMISSIONS {
    text id PK
    text module
    text description
    timestamptz created_at
  }

  ROLE_PERMISSIONS {
    text role_id PK, FK
    text permission_id PK, FK
  }

  DEPARTMENTS {
    uuid id PK
    text name UK
    text code UK
    text building_wing
    int floor_number
    int total_beds
    text status
    timestamptz created_at
  }

  PROFILES {
    uuid id PK, FK
    text email UK
    text full_name
    text role_id FK
    text phone
    text avatar_url
    text status
    timestamptz updated_at
  }

  EMPLOYEES {
    uuid id PK
    uuid profile_id FK, UK
    text employee_number UK
    uuid department_id FK
    text job_title
    text shift
    date hire_date
    numeric salary
    text status
  }

  DOCTORS {
    uuid id PK
    uuid profile_id FK, UK
    text license_number UK
    text specialization
    uuid department_id FK
    numeric consultation_fee
    int experience_years
    text availability_status
  }

  PATIENTS {
    uuid id PK
    text medical_record_number UK
    text first_name
    text last_name
    text gender
    date date_of_birth
    text blood_group
    text phone
    text emergency_contact_name
    text emergency_contact_phone
    uuid assigned_doctor_id FK
    text status
  }

  APPOINTMENTS {
    uuid id PK
    text appointment_number UK
    uuid patient_id FK
    uuid doctor_id FK
    uuid department_id FK
    timestamptz scheduled_at
    text type
    text priority
    text status
  }

  MEDICAL_RECORDS {
    uuid id PK
    text record_number UK
    uuid patient_id FK
    uuid doctor_id FK
    uuid appointment_id FK
    text diagnosis_code
    text diagnosis_title
    text treatment_plan
    jsonb prescription
    boolean is_confidential
  }

  ADMISSIONS {
    uuid id PK
    text admission_number UK
    uuid patient_id FK
    uuid attending_doctor_id FK
    uuid department_id FK
    text ward_name
    text bed_code
    timestamptz admitted_at
    timestamptz discharged_at
    text status
  }

  LABORATORY_TESTS {
    uuid id PK
    text test_code UK
    text name
    text category
    numeric price
    text normal_range
    int turnaround_hours
  }

  LABORATORY_REQUESTS {
    uuid id PK
    text request_number UK
    uuid patient_id FK
    uuid doctor_id FK
    uuid test_id FK
    uuid technician_id FK
    text priority
    text status
    text result_value
    boolean is_panic_value
  }

  MEDICINES {
    uuid id PK
    text sku_code UK
    text generic_name
    text brand_name
    text dosage_form
    text strength
    numeric unit_price
    int stock_quantity
    int reorder_level
    date expiry_date
  }

  INVOICES {
    uuid id PK
    text invoice_number UK
    uuid patient_id FK
    uuid admission_id FK
    numeric total_amount
    numeric paid_amount
    numeric balance_due
    text status
    date due_date
  }

  PAYMENTS {
    uuid id PK
    text receipt_number UK
    uuid invoice_id FK
    numeric amount
    text payment_method
    uuid received_by FK
    boolean is_refund
    timestamptz payment_date
  }

  NOTIFICATIONS {
    uuid id PK
    uuid recipient_id FK
    text target_role FK
    text title
    text message
    text severity
    boolean is_read
  }

  AUDIT_LOGS {
    uuid id PK
    uuid actor_id FK
    text actor_email
    text actor_role
    text action
    text target_table
    text record_id
    text ip_address
    jsonb old_values
    jsonb new_values
    timestamptz created_at
  }
```
