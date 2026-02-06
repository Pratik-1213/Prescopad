import { PoolClient } from 'pg';
import { transaction } from '../config/database';

// Types for sync payloads
interface SyncPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  weight: number | null;
  phone: string;
  address: string;
  blood_group: string;
  allergies: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface SyncPrescription {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_age: number;
  patient_gender: string;
  patient_phone: string;
  doctor_id: string;
  diagnosis: string;
  advice: string;
  follow_up_date: string | null;
  pdf_hash: string | null;
  signature: string | null;
  status: string;
  wallet_deducted: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface SyncPrescriptionMedicine {
  id: string;
  prescription_id: string;
  medicine_name: string;
  type: string;
  dosage: string;
  frequency: string;
  duration: string;
  timing: string;
  notes: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface SyncPrescriptionLabTest {
  id: string;
  prescription_id: string;
  test_name: string;
  category: string;
  notes: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface SyncQueueItem {
  id: string;
  patient_id: string;
  status: string;
  added_by: string;
  notes: string;
  token_number: number;
  added_at: string;
  started_at: string | null;
  completed_at: string | null;
  is_deleted: boolean;
  updated_at: string;
}

interface SyncCustomMedicine {
  id: string;
  name: string;
  type: string;
  strength: string;
  manufacturer: string;
  usage_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

interface SyncCustomLabTest {
  id: string;
  name: string;
  category: string;
  usage_count: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushPayload {
  patients?: SyncPatient[];
  prescriptions?: SyncPrescription[];
  prescription_medicines?: SyncPrescriptionMedicine[];
  prescription_lab_tests?: SyncPrescriptionLabTest[];
  queue?: SyncQueueItem[];
  custom_medicines?: SyncCustomMedicine[];
  custom_lab_tests?: SyncCustomLabTest[];
}

export interface PullResult {
  patients: SyncPatient[];
  prescriptions: SyncPrescription[];
  prescription_medicines: SyncPrescriptionMedicine[];
  prescription_lab_tests: SyncPrescriptionLabTest[];
  queue: SyncQueueItem[];
  custom_medicines: SyncCustomMedicine[];
  custom_lab_tests: SyncCustomLabTest[];
  server_time: string;
}

async function upsertBatch(
  client: PoolClient,
  table: string,
  rows: unknown[],
  clinicId: string,
  columns: string[]
): Promise<void> {
  if (!rows.length) return;

  for (const item of rows) {
    const row = item as Record<string, unknown>;
    const colsWithClinic = ['clinic_id', ...columns];
    const values = [clinicId, ...columns.map(c => row[c] ?? null)];
    const placeholders = colsWithClinic.map((_, i) => `$${i + 1}`).join(', ');
    const updateCols = columns
      .filter(c => c !== 'id')
      .map(c => `${c} = EXCLUDED.${c}`)
      .join(', ');

    await client.query(
      `INSERT INTO ${table} (${colsWithClinic.join(', ')})
       VALUES (${placeholders})
       ON CONFLICT (id, clinic_id) DO UPDATE SET ${updateCols}
       WHERE ${table}.updated_at < EXCLUDED.updated_at`,
      values
    );
  }
}

export async function pushChanges(clinicId: string, data: PushPayload): Promise<{ pushed: number }> {
  let count = 0;

  await transaction(async (client) => {
    if (data.patients?.length) {
      await upsertBatch(client, 'sync_patients', data.patients, clinicId, [
        'id', 'name', 'age', 'gender', 'weight', 'phone', 'address',
        'blood_group', 'allergies', 'is_deleted', 'created_at', 'updated_at',
      ]);
      count += data.patients.length;
    }

    if (data.prescriptions?.length) {
      await upsertBatch(client, 'sync_prescriptions', data.prescriptions, clinicId, [
        'id', 'patient_id', 'patient_name', 'patient_age', 'patient_gender',
        'patient_phone', 'doctor_id', 'diagnosis', 'advice', 'follow_up_date',
        'pdf_hash', 'signature', 'status', 'wallet_deducted', 'is_deleted',
        'created_at', 'updated_at',
      ]);
      count += data.prescriptions.length;
    }

    if (data.prescription_medicines?.length) {
      await upsertBatch(client, 'sync_prescription_medicines', data.prescription_medicines, clinicId, [
        'id', 'prescription_id', 'medicine_name', 'type', 'dosage', 'frequency',
        'duration', 'timing', 'notes', 'is_deleted', 'created_at', 'updated_at',
      ]);
      count += data.prescription_medicines.length;
    }

    if (data.prescription_lab_tests?.length) {
      await upsertBatch(client, 'sync_prescription_lab_tests', data.prescription_lab_tests, clinicId, [
        'id', 'prescription_id', 'test_name', 'category', 'notes',
        'is_deleted', 'created_at', 'updated_at',
      ]);
      count += data.prescription_lab_tests.length;
    }

    if (data.queue?.length) {
      await upsertBatch(client, 'sync_queue', data.queue, clinicId, [
        'id', 'patient_id', 'status', 'added_by', 'notes', 'token_number',
        'added_at', 'started_at', 'completed_at', 'is_deleted', 'updated_at',
      ]);
      count += data.queue.length;
    }

    if (data.custom_medicines?.length) {
      await upsertBatch(client, 'sync_custom_medicines', data.custom_medicines, clinicId, [
        'id', 'name', 'type', 'strength', 'manufacturer', 'usage_count',
        'is_deleted', 'created_at', 'updated_at',
      ]);
      count += data.custom_medicines.length;
    }

    if (data.custom_lab_tests?.length) {
      await upsertBatch(client, 'sync_custom_lab_tests', data.custom_lab_tests, clinicId, [
        'id', 'name', 'category', 'usage_count', 'is_deleted', 'created_at', 'updated_at',
      ]);
      count += data.custom_lab_tests.length;
    }
  });

  return { pushed: count };
}

export async function pullChanges(
  clinicId: string,
  since: string,
  deviceId: string
): Promise<PullResult> {
  const serverTime = new Date().toISOString();
  const sinceTs = since || '1970-01-01T00:00:00Z';

  return await transaction(async (client) => {
    const fetchTable = async <T>(table: string): Promise<T[]> => {
      const result = await client.query(
        `SELECT * FROM ${table} WHERE clinic_id = $1 AND updated_at > $2 ORDER BY updated_at ASC`,
        [clinicId, sinceTs]
      );
      return result.rows as T[];
    };

    const [patients, prescriptions, prescription_medicines, prescription_lab_tests, queue, custom_medicines, custom_lab_tests] = await Promise.all([
      fetchTable<SyncPatient>('sync_patients'),
      fetchTable<SyncPrescription>('sync_prescriptions'),
      fetchTable<SyncPrescriptionMedicine>('sync_prescription_medicines'),
      fetchTable<SyncPrescriptionLabTest>('sync_prescription_lab_tests'),
      fetchTable<SyncQueueItem>('sync_queue'),
      fetchTable<SyncCustomMedicine>('sync_custom_medicines'),
      fetchTable<SyncCustomLabTest>('sync_custom_lab_tests'),
    ]);

    // Update sync cursor
    await client.query(
      `INSERT INTO sync_cursors (clinic_id, device_id, last_pulled_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (clinic_id, device_id) DO UPDATE SET last_pulled_at = $3`,
      [clinicId, deviceId, serverTime]
    );

    return {
      patients,
      prescriptions,
      prescription_medicines,
      prescription_lab_tests,
      queue,
      custom_medicines,
      custom_lab_tests,
      server_time: serverTime,
    };
  });
}

export async function fullRestore(clinicId: string): Promise<PullResult> {
  return pullChanges(clinicId, '1970-01-01T00:00:00Z', 'restore');
}
