import { getDatabase, generateId } from '../database';
import { QueueItem, QueueStatus } from '../../types/queue.types';
import { Patient } from '../../types/patient.types';

export async function addToQueue(
  patientId: string,
  addedBy: string,
  notes = ''
): Promise<QueueItem> {
  const db = await getDatabase();
  const id = generateId();

  // Get next token number for today
  const today = new Date().toISOString().split('T')[0];
  const lastToken = await db.getFirstAsync<{ max_token: number | null }>(
    `SELECT MAX(token_number) as max_token FROM queue WHERE date(added_at) = ?`,
    [today]
  );
  const tokenNumber = (lastToken?.max_token ?? 0) + 1;

  await db.runAsync(
    `INSERT INTO queue (id, patient_id, status, added_by, notes, token_number, added_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    [id, patientId, QueueStatus.WAITING, addedBy, notes, tokenNumber]
  );

  return getQueueItemById(id) as Promise<QueueItem>;
}

export async function getQueueItemById(id: string): Promise<QueueItem | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    `SELECT q.*, p.name as patient_name, p.age as patient_age, p.gender as patient_gender,
            p.phone as patient_phone, p.weight as patient_weight, p.blood_group, p.allergies
     FROM queue q
     LEFT JOIN patients p ON q.patient_id = p.id
     WHERE q.id = ?`,
    [id]
  );
  return row ? mapQueueRow(row) : null;
}

export async function getTodayQueue(): Promise<QueueItem[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT q.*, p.name as patient_name, p.age as patient_age, p.gender as patient_gender,
            p.phone as patient_phone, p.weight as patient_weight, p.blood_group, p.allergies
     FROM queue q
     LEFT JOIN patients p ON q.patient_id = p.id
     WHERE date(q.added_at) = ?
     ORDER BY q.token_number ASC`,
    [today]
  );
  return rows.map(mapQueueRow);
}

export async function getActiveQueue(): Promise<QueueItem[]> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT q.*, p.name as patient_name, p.age as patient_age, p.gender as patient_gender,
            p.phone as patient_phone, p.weight as patient_weight, p.blood_group, p.allergies
     FROM queue q
     LEFT JOIN patients p ON q.patient_id = p.id
     WHERE date(q.added_at) = ? AND q.status IN (?, ?)
     ORDER BY q.token_number ASC`,
    [today, QueueStatus.WAITING, QueueStatus.IN_PROGRESS]
  );
  return rows.map(mapQueueRow);
}

export async function updateQueueStatus(
  id: string,
  status: QueueStatus
): Promise<void> {
  const db = await getDatabase();
  const updates: string[] = ['status = ?'];
  const params: (string | null)[] = [status];

  if (status === QueueStatus.IN_PROGRESS) {
    updates.push("started_at = datetime('now')");
  } else if (status === QueueStatus.COMPLETED || status === QueueStatus.CANCELLED) {
    updates.push("completed_at = datetime('now')");
  }

  params.push(id);
  await db.runAsync(
    `UPDATE queue SET ${updates.join(', ')} WHERE id = ?`,
    params
  );
}

export async function getTodayStats(): Promise<{
  total: number;
  waiting: number;
  inProgress: number;
  completed: number;
}> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const result = await db.getFirstAsync<{
    total: number;
    waiting: number;
    in_progress: number;
    completed: number;
  }>(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
     FROM queue WHERE date(added_at) = ?`,
    [today]
  );
  return {
    total: result?.total ?? 0,
    waiting: result?.waiting ?? 0,
    inProgress: result?.in_progress ?? 0,
    completed: result?.completed ?? 0,
  };
}

export async function removeFromQueue(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM queue WHERE id = ?', [id]);
}

function mapQueueRow(row: Record<string, unknown>): QueueItem {
  const item: QueueItem = {
    id: row.id as string,
    patientId: (row.patient_id ?? row.patientId) as string,
    status: row.status as QueueStatus,
    addedBy: (row.added_by ?? row.addedBy) as string,
    notes: (row.notes ?? '') as string,
    tokenNumber: (row.token_number ?? row.tokenNumber) as number,
    addedAt: (row.added_at ?? row.addedAt) as string,
    startedAt: (row.started_at ?? row.startedAt ?? null) as string | null,
    completedAt: (row.completed_at ?? row.completedAt ?? null) as string | null,
  };

  if (row.patient_name) {
    item.patient = {
      id: item.patientId,
      name: row.patient_name as string,
      age: row.patient_age as number,
      gender: row.patient_gender as Patient['gender'],
      weight: row.patient_weight as number | null,
      phone: (row.patient_phone ?? '') as string,
      address: '',
      bloodGroup: (row.blood_group ?? '') as string,
      allergies: (row.allergies ?? '') as string,
      createdAt: '',
      updatedAt: '',
    };
  }

  return item;
}
