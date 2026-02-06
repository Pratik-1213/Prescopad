export const DB_VERSION = 2;

export const CREATE_TABLES_SQL = [
  `CREATE TABLE IF NOT EXISTS doctors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    specialty TEXT DEFAULT '',
    reg_number TEXT DEFAULT '',
    signature_base64 TEXT,
    cloud_id TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS assistants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    cloud_id TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS clinic (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    email TEXT DEFAULT '',
    logo_base64 TEXT,
    doctor_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL DEFAULT 'male',
    weight REAL,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    blood_group TEXT DEFAULT '',
    allergies TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS queue (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting',
    added_by TEXT NOT NULL,
    notes TEXT DEFAULT '',
    token_number INTEGER NOT NULL,
    added_at TEXT DEFAULT (datetime('now')),
    started_at TEXT,
    completed_at TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  )`,

  `CREATE TABLE IF NOT EXISTS prescriptions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    patient_name TEXT NOT NULL,
    patient_age INTEGER NOT NULL,
    patient_gender TEXT NOT NULL,
    patient_phone TEXT DEFAULT '',
    doctor_id TEXT NOT NULL,
    diagnosis TEXT NOT NULL DEFAULT '',
    advice TEXT DEFAULT '',
    follow_up_date TEXT,
    pdf_path TEXT,
    pdf_hash TEXT,
    signature TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    wallet_deducted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
  )`,

  `CREATE TABLE IF NOT EXISTS prescription_medicines (
    id TEXT PRIMARY KEY,
    prescription_id TEXT NOT NULL,
    medicine_name TEXT NOT NULL,
    type TEXT DEFAULT '',
    dosage TEXT DEFAULT '',
    frequency TEXT DEFAULT '',
    duration TEXT DEFAULT '',
    timing TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS prescription_lab_tests (
    id TEXT PRIMARY KEY,
    prescription_id TEXT NOT NULL,
    test_name TEXT NOT NULL,
    category TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'Tablet',
    strength TEXT DEFAULT '',
    manufacturer TEXT DEFAULT '',
    is_custom INTEGER NOT NULL DEFAULT 0,
    usage_count INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS lab_tests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Other',
    is_custom INTEGER NOT NULL DEFAULT 0,
    usage_count INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS local_wallet_cache (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    balance REAL NOT NULL DEFAULT 0,
    last_synced_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS sync_log (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    payload TEXT DEFAULT '{}',
    timestamp TEXT DEFAULT (datetime('now')),
    synced INTEGER NOT NULL DEFAULT 0
  )`,

  // Indexes for performance
  `CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name)`,
  `CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone)`,
  `CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(status)`,
  `CREATE INDEX IF NOT EXISTS idx_queue_added_at ON queue(added_at)`,
  `CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id)`,
  `CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status)`,
  `CREATE INDEX IF NOT EXISTS idx_prescriptions_created ON prescriptions(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name)`,
  `CREATE INDEX IF NOT EXISTS idx_medicines_usage ON medicines(usage_count DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_lab_tests_name ON lab_tests(name)`,
  `CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON sync_log(synced)`,
];

// V2 migration: add synced + updated_at columns for cloud sync
export const MIGRATION_V2_SQL = [
  // Add synced column to tables that need cloud sync
  `ALTER TABLE patients ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE prescriptions ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE prescriptions ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`,
  `ALTER TABLE prescription_medicines ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE prescription_medicines ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`,
  `ALTER TABLE prescription_lab_tests ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE prescription_lab_tests ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`,
  `ALTER TABLE queue ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE queue ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`,
  `ALTER TABLE medicines ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE medicines ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`,
  `ALTER TABLE lab_tests ADD COLUMN synced INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE lab_tests ADD COLUMN updated_at TEXT DEFAULT (datetime('now'))`,

  // Cloud sync metadata table
  `CREATE TABLE IF NOT EXISTS cloud_sync_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_pushed_at TEXT DEFAULT '',
    last_pulled_at TEXT DEFAULT '',
    device_id TEXT DEFAULT ''
  )`,

  // Indexes for synced column
  `CREATE INDEX IF NOT EXISTS idx_patients_synced ON patients(synced)`,
  `CREATE INDEX IF NOT EXISTS idx_prescriptions_synced ON prescriptions(synced)`,
  `CREATE INDEX IF NOT EXISTS idx_rx_meds_synced ON prescription_medicines(synced)`,
  `CREATE INDEX IF NOT EXISTS idx_rx_tests_synced ON prescription_lab_tests(synced)`,
  `CREATE INDEX IF NOT EXISTS idx_queue_synced ON queue(synced)`,
  `CREATE INDEX IF NOT EXISTS idx_medicines_synced ON medicines(synced)`,
  `CREATE INDEX IF NOT EXISTS idx_lab_tests_synced ON lab_tests(synced)`,
];
