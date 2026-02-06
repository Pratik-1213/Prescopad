-- PrescoPad Cloud Sync Tables
-- Stores synced patient data, prescriptions, queue, custom medicines/tests
-- All data scoped by clinic_id for multi-device sharing

-- Sync patients
CREATE TABLE IF NOT EXISTS sync_patients (
    id TEXT NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL DEFAULT 'male',
    weight REAL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    blood_group TEXT DEFAULT '',
    allergies TEXT DEFAULT '',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id, clinic_id)
);

-- Sync prescriptions
CREATE TABLE IF NOT EXISTS sync_prescriptions (
    id TEXT NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_age INTEGER NOT NULL,
    patient_gender TEXT NOT NULL,
    patient_phone TEXT DEFAULT '',
    doctor_id TEXT NOT NULL,
    diagnosis TEXT NOT NULL DEFAULT '',
    advice TEXT DEFAULT '',
    follow_up_date TEXT,
    pdf_hash TEXT,
    signature TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    wallet_deducted INTEGER NOT NULL DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id, clinic_id)
);

-- Sync prescription medicines
CREATE TABLE IF NOT EXISTS sync_prescription_medicines (
    id TEXT NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    prescription_id TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    type TEXT DEFAULT '',
    dosage TEXT DEFAULT '',
    frequency TEXT DEFAULT '',
    duration TEXT DEFAULT '',
    timing TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id, clinic_id)
);

-- Sync prescription lab tests
CREATE TABLE IF NOT EXISTS sync_prescription_lab_tests (
    id TEXT NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    prescription_id TEXT NOT NULL,
    test_name TEXT NOT NULL,
    category TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id, clinic_id)
);

-- Sync queue
CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    added_by TEXT NOT NULL,
    notes TEXT DEFAULT '',
    token_number INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id, clinic_id)
);

-- Sync custom medicines (only is_custom=1 records)
CREATE TABLE IF NOT EXISTS sync_custom_medicines (
    id TEXT NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Tablet',
    strength TEXT DEFAULT '',
    manufacturer TEXT DEFAULT '',
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id, clinic_id)
);

-- Sync custom lab tests (only is_custom=1 records)
CREATE TABLE IF NOT EXISTS sync_custom_lab_tests (
    id TEXT NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    usage_count INTEGER NOT NULL DEFAULT 0,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (id, clinic_id)
);

-- Sync cursors: track last sync timestamp per clinic per device
CREATE TABLE IF NOT EXISTS sync_cursors (
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    last_pulled_at TIMESTAMP WITH TIME ZONE DEFAULT '1970-01-01T00:00:00Z',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (clinic_id, device_id)
);

-- Indexes for sync queries
CREATE INDEX IF NOT EXISTS idx_sync_patients_clinic ON sync_patients(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sync_patients_updated ON sync_patients(clinic_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_prescriptions_clinic ON sync_prescriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sync_prescriptions_updated ON sync_prescriptions(clinic_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_rx_meds_clinic ON sync_prescription_medicines(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sync_rx_meds_updated ON sync_prescription_medicines(clinic_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_rx_tests_clinic ON sync_prescription_lab_tests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sync_rx_tests_updated ON sync_prescription_lab_tests(clinic_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_queue_clinic ON sync_queue(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_updated ON sync_queue(clinic_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_custom_meds_clinic ON sync_custom_medicines(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sync_custom_meds_updated ON sync_custom_medicines(clinic_id, updated_at);
CREATE INDEX IF NOT EXISTS idx_sync_custom_tests_clinic ON sync_custom_lab_tests(clinic_id);
CREATE INDEX IF NOT EXISTS idx_sync_custom_tests_updated ON sync_custom_lab_tests(clinic_id, updated_at);

-- Apply updated_at triggers (idempotent, reuses function from 001_initial.sql)
DROP TRIGGER IF EXISTS update_sync_patients_updated_at ON sync_patients;
CREATE TRIGGER update_sync_patients_updated_at BEFORE UPDATE ON sync_patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_prescriptions_updated_at ON sync_prescriptions;
CREATE TRIGGER update_sync_prescriptions_updated_at BEFORE UPDATE ON sync_prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_rx_meds_updated_at ON sync_prescription_medicines;
CREATE TRIGGER update_sync_rx_meds_updated_at BEFORE UPDATE ON sync_prescription_medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_rx_tests_updated_at ON sync_prescription_lab_tests;
CREATE TRIGGER update_sync_rx_tests_updated_at BEFORE UPDATE ON sync_prescription_lab_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_queue_updated_at ON sync_queue;
CREATE TRIGGER update_sync_queue_updated_at BEFORE UPDATE ON sync_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_custom_meds_updated_at ON sync_custom_medicines;
CREATE TRIGGER update_sync_custom_meds_updated_at BEFORE UPDATE ON sync_custom_medicines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_custom_tests_updated_at ON sync_custom_lab_tests;
CREATE TRIGGER update_sync_custom_tests_updated_at BEFORE UPDATE ON sync_custom_lab_tests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sync_cursors_updated_at ON sync_cursors;
CREATE TRIGGER update_sync_cursors_updated_at BEFORE UPDATE ON sync_cursors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
