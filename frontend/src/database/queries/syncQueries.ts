import { getDatabase, generateId } from '../database';
import { SyncLogEntry } from '../../types/sync.types';

export async function addSyncLog(
  action: string,
  entityType: string,
  entityId: string,
  payload: unknown
): Promise<void> {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO sync_log (id, action, entity_type, entity_id, payload, timestamp, synced)
     VALUES (?, ?, ?, ?, ?, datetime('now'), 0)`,
    [id, action, entityType, entityId, JSON.stringify(payload)]
  );
}

export async function getUnsyncedLogs(): Promise<SyncLogEntry[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM sync_log WHERE synced = 0 ORDER BY timestamp ASC'
  );
  return rows.map(mapSyncLogRow);
}

export async function markLogSynced(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE sync_log SET synced = 1 WHERE id = ?', [id]);
}

export async function markAllLogsSynced(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE sync_log SET synced = 1 WHERE synced = 0');
}

export async function clearSyncedLogs(olderThanDays = 7): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `DELETE FROM sync_log WHERE synced = 1 AND datetime(timestamp) < datetime('now', ?)`,
    [`-${olderThanDays} days`]
  );
}

function mapSyncLogRow(row: Record<string, unknown>): SyncLogEntry {
  return {
    id: row.id as string,
    action: row.action as string,
    entityType: (row.entity_type ?? row.entityType) as string,
    entityId: (row.entity_id ?? row.entityId) as string,
    payload: (row.payload ?? '{}') as string,
    timestamp: row.timestamp as string,
    synced: Boolean(row.synced),
  };
}
