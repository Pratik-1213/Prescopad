import api, { isOnline } from './api';
import { getDatabase, generateId } from '../database/database';

interface SyncMeta {
  last_pushed_at: string;
  last_pulled_at: string;
  device_id: string;
}

async function getSyncMeta(): Promise<SyncMeta> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SyncMeta>(
    'SELECT * FROM cloud_sync_meta WHERE id = 1'
  );
  if (!row) {
    const deviceId = generateId();
    await db.runAsync(
      `INSERT OR IGNORE INTO cloud_sync_meta (id, last_pushed_at, last_pulled_at, device_id) VALUES (1, '', '', ?)`,
      [deviceId]
    );
    return { last_pushed_at: '', last_pulled_at: '', device_id: deviceId };
  }
  // Ensure device_id exists
  if (!row.device_id) {
    const deviceId = generateId();
    await db.runAsync(`UPDATE cloud_sync_meta SET device_id = ? WHERE id = 1`, [deviceId]);
    row.device_id = deviceId;
  }
  return row;
}

async function updateSyncMeta(field: 'last_pushed_at' | 'last_pulled_at', value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(`UPDATE cloud_sync_meta SET ${field} = ? WHERE id = 1`, [value]);
}

// Gather all unsynced local rows for push
async function gatherUnsyncedData(): Promise<Record<string, unknown[]>> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  const patients = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM patients WHERE synced = 0'
  );

  const prescriptions = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM prescriptions WHERE synced = 0'
  );

  const rxMeds = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM prescription_medicines WHERE synced = 0'
  );

  const rxTests = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM prescription_lab_tests WHERE synced = 0'
  );

  const queue = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM queue WHERE synced = 0'
  );

  const customMeds = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM medicines WHERE is_custom = 1 AND synced = 0'
  );

  const customTests = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM lab_tests WHERE is_custom = 1 AND synced = 0'
  );

  return {
    patients: patients.map(p => ({
      id: p.id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      weight: p.weight,
      phone: p.phone,
      address: p.address,
      blood_group: p.blood_group,
      allergies: p.allergies,
      is_deleted: false,
      created_at: p.created_at || now,
      updated_at: p.updated_at || now,
    })),
    prescriptions: prescriptions.map(r => ({
      id: r.id,
      patient_id: r.patient_id,
      patient_name: r.patient_name,
      patient_age: r.patient_age,
      patient_gender: r.patient_gender,
      patient_phone: r.patient_phone || '',
      doctor_id: r.doctor_id,
      diagnosis: r.diagnosis || '',
      advice: r.advice || '',
      follow_up_date: r.follow_up_date || null,
      pdf_hash: r.pdf_hash || null,
      signature: r.signature || null,
      status: r.status,
      wallet_deducted: r.wallet_deducted ? 1 : 0,
      is_deleted: false,
      created_at: r.created_at || now,
      updated_at: r.updated_at || now,
    })),
    prescription_medicines: rxMeds.map(m => ({
      id: m.id,
      prescription_id: m.prescription_id,
      medicine_name: m.medicine_name,
      type: m.type || '',
      dosage: m.dosage || '',
      frequency: m.frequency || '',
      duration: m.duration || '',
      timing: m.timing || '',
      notes: m.notes || '',
      is_deleted: false,
      created_at: m.created_at || now,
      updated_at: m.updated_at || now,
    })),
    prescription_lab_tests: rxTests.map(t => ({
      id: t.id,
      prescription_id: t.prescription_id,
      test_name: t.test_name,
      category: t.category || '',
      notes: t.notes || '',
      is_deleted: false,
      created_at: t.created_at || now,
      updated_at: t.updated_at || now,
    })),
    queue: queue.map(q => ({
      id: q.id,
      patient_id: q.patient_id,
      status: q.status,
      added_by: q.added_by,
      notes: q.notes || '',
      token_number: q.token_number,
      added_at: q.added_at || now,
      started_at: q.started_at || null,
      completed_at: q.completed_at || null,
      is_deleted: false,
      updated_at: q.updated_at || now,
    })),
    custom_medicines: customMeds.map(m => ({
      id: m.id,
      name: m.name,
      type: m.type,
      strength: m.strength || '',
      manufacturer: m.manufacturer || '',
      usage_count: m.usage_count || 0,
      is_deleted: false,
      created_at: m.created_at || now,
      updated_at: m.updated_at || now,
    })),
    custom_lab_tests: customTests.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category || '',
      usage_count: t.usage_count || 0,
      is_deleted: false,
      created_at: t.created_at || now,
      updated_at: t.updated_at || now,
    })),
  };
}

// Mark all currently unsynced rows as synced
async function markAllSynced(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('UPDATE patients SET synced = 1 WHERE synced = 0');
  await db.execAsync('UPDATE prescriptions SET synced = 1 WHERE synced = 0');
  await db.execAsync('UPDATE prescription_medicines SET synced = 1 WHERE synced = 0');
  await db.execAsync('UPDATE prescription_lab_tests SET synced = 1 WHERE synced = 0');
  await db.execAsync('UPDATE queue SET synced = 1 WHERE synced = 0');
  await db.execAsync('UPDATE medicines SET synced = 1 WHERE is_custom = 1 AND synced = 0');
  await db.execAsync('UPDATE lab_tests SET synced = 1 WHERE is_custom = 1 AND synced = 0');
}

// SQLite bind value type
type V = string | number | null;
const v = (x: unknown): V => (x == null ? null : x as V);

// Apply pulled cloud data to local SQLite
async function applyPulledData(data: Record<string, unknown[]>): Promise<void> {
  const db = await getDatabase();

  // Apply patients
  for (const p of (data.patients || []) as Record<string, unknown>[]) {
    if (p.is_deleted) {
      await db.runAsync('DELETE FROM patients WHERE id = ?', [v(p.id)]);
      continue;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO patients (id, name, age, gender, weight, phone, address, blood_group, allergies, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [v(p.id), v(p.name), v(p.age), v(p.gender), v(p.weight), v(p.phone), v(p.address), v(p.blood_group), v(p.allergies), v(p.created_at), v(p.updated_at)]
    );
  }

  // Apply prescriptions
  for (const r of (data.prescriptions || []) as Record<string, unknown>[]) {
    if (r.is_deleted) {
      await db.runAsync('DELETE FROM prescription_medicines WHERE prescription_id = ?', [v(r.id)]);
      await db.runAsync('DELETE FROM prescription_lab_tests WHERE prescription_id = ?', [v(r.id)]);
      await db.runAsync('DELETE FROM prescriptions WHERE id = ?', [v(r.id)]);
      continue;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO prescriptions (id, patient_id, patient_name, patient_age, patient_gender, patient_phone,
       doctor_id, diagnosis, advice, follow_up_date, pdf_hash, signature, status, wallet_deducted, created_at, updated_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [v(r.id), v(r.patient_id), v(r.patient_name), v(r.patient_age), v(r.patient_gender), v(r.patient_phone),
       v(r.doctor_id), v(r.diagnosis), v(r.advice), v(r.follow_up_date), v(r.pdf_hash), v(r.signature), v(r.status),
       v(r.wallet_deducted), v(r.created_at), v(r.updated_at)]
    );
  }

  // Apply prescription medicines
  for (const m of (data.prescription_medicines || []) as Record<string, unknown>[]) {
    if (m.is_deleted) {
      await db.runAsync('DELETE FROM prescription_medicines WHERE id = ?', [v(m.id)]);
      continue;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO prescription_medicines (id, prescription_id, medicine_name, type, dosage, frequency, duration, timing, notes, synced, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [v(m.id), v(m.prescription_id), v(m.medicine_name), v(m.type), v(m.dosage), v(m.frequency), v(m.duration), v(m.timing), v(m.notes), v(m.updated_at)]
    );
  }

  // Apply prescription lab tests
  for (const t of (data.prescription_lab_tests || []) as Record<string, unknown>[]) {
    if (t.is_deleted) {
      await db.runAsync('DELETE FROM prescription_lab_tests WHERE id = ?', [v(t.id)]);
      continue;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO prescription_lab_tests (id, prescription_id, test_name, category, notes, synced, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [v(t.id), v(t.prescription_id), v(t.test_name), v(t.category), v(t.notes), v(t.updated_at)]
    );
  }

  // Apply queue
  for (const q of (data.queue || []) as Record<string, unknown>[]) {
    if (q.is_deleted) {
      await db.runAsync('DELETE FROM queue WHERE id = ?', [v(q.id)]);
      continue;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO queue (id, patient_id, status, added_by, notes, token_number, added_at, started_at, completed_at, synced, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [v(q.id), v(q.patient_id), v(q.status), v(q.added_by), v(q.notes), v(q.token_number), v(q.added_at), v(q.started_at), v(q.completed_at), v(q.updated_at)]
    );
  }

  // Apply custom medicines
  for (const m of (data.custom_medicines || []) as Record<string, unknown>[]) {
    if (m.is_deleted) {
      await db.runAsync('DELETE FROM medicines WHERE id = ?', [v(m.id)]);
      continue;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO medicines (id, name, type, strength, manufacturer, is_custom, usage_count, synced, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, 1, ?)`,
      [v(m.id), v(m.name), v(m.type), v(m.strength), v(m.manufacturer), v(m.usage_count), v(m.updated_at)]
    );
  }

  // Apply custom lab tests
  for (const t of (data.custom_lab_tests || []) as Record<string, unknown>[]) {
    if (t.is_deleted) {
      await db.runAsync('DELETE FROM lab_tests WHERE id = ?', [v(t.id)]);
      continue;
    }
    await db.runAsync(
      `INSERT OR REPLACE INTO lab_tests (id, name, category, is_custom, usage_count, synced, updated_at)
       VALUES (?, ?, ?, 1, ?, 1, ?)`,
      [v(t.id), v(t.name), v(t.category), v(t.usage_count), v(t.updated_at)]
    );
  }
}

/**
 * Full sync: push local changes, then pull cloud changes
 */
export async function performSync(): Promise<{ pushed: number; pulled: number }> {
  const online = await isOnline();
  if (!online) {
    throw new Error('Cannot sync while offline');
  }

  const meta = await getSyncMeta();

  // 1. Push unsynced local data
  const unsyncedData = await gatherUnsyncedData();
  const hasData = Object.values(unsyncedData).some(arr => arr.length > 0);

  let pushed = 0;
  if (hasData) {
    const pushResult = await api.post('/sync/push', unsyncedData);
    pushed = pushResult.data.pushed || 0;
    await markAllSynced();
    await updateSyncMeta('last_pushed_at', new Date().toISOString());
  }

  // 2. Pull cloud changes since last pull
  const pullResult = await api.post('/sync/pull', {
    since: meta.last_pulled_at || '1970-01-01T00:00:00Z',
    deviceId: meta.device_id,
  });

  let pulled = 0;
  if (pullResult.data.success) {
    const pullData = pullResult.data;
    await applyPulledData(pullData);
    pulled = (pullData.patients?.length || 0) +
      (pullData.prescriptions?.length || 0) +
      (pullData.prescription_medicines?.length || 0) +
      (pullData.prescription_lab_tests?.length || 0) +
      (pullData.queue?.length || 0) +
      (pullData.custom_medicines?.length || 0) +
      (pullData.custom_lab_tests?.length || 0);
    await updateSyncMeta('last_pulled_at', pullData.server_time || new Date().toISOString());
  }

  return { pushed, pulled };
}

/**
 * Full restore: download all data from cloud
 */
export async function performFullRestore(): Promise<number> {
  const online = await isOnline();
  if (!online) {
    throw new Error('Cannot restore while offline');
  }

  const response = await api.get('/sync/restore');

  if (response.data.success) {
    await applyPulledData(response.data);
    const total = (response.data.patients?.length || 0) +
      (response.data.prescriptions?.length || 0) +
      (response.data.prescription_medicines?.length || 0) +
      (response.data.prescription_lab_tests?.length || 0) +
      (response.data.queue?.length || 0) +
      (response.data.custom_medicines?.length || 0) +
      (response.data.custom_lab_tests?.length || 0);
    await updateSyncMeta('last_pulled_at', response.data.server_time || new Date().toISOString());
    return total;
  }

  return 0;
}

/**
 * Get sync status info
 */
export async function getSyncStatus(): Promise<{
  lastPushedAt: string;
  lastPulledAt: string;
  unsyncedCount: number;
}> {
  const meta = await getSyncMeta();
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT (
      (SELECT COUNT(*) FROM patients WHERE synced = 0) +
      (SELECT COUNT(*) FROM prescriptions WHERE synced = 0) +
      (SELECT COUNT(*) FROM queue WHERE synced = 0) +
      (SELECT COUNT(*) FROM medicines WHERE is_custom = 1 AND synced = 0) +
      (SELECT COUNT(*) FROM lab_tests WHERE is_custom = 1 AND synced = 0)
    ) as count`
  );

  return {
    lastPushedAt: meta.last_pushed_at,
    lastPulledAt: meta.last_pulled_at,
    unsyncedCount: result?.count ?? 0,
  };
}
