import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, DB_VERSION, MIGRATION_V2_SQL } from './schema';
import { seedMedicines, seedLabTests } from './seed';

const DB_NAME = 'prescopad.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  const versionResult = await database.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = versionResult?.user_version ?? 0;

  if (currentVersion < 1) {
    // Fresh install - create all tables
    for (const sql of CREATE_TABLES_SQL) {
      await database.execAsync(sql);
    }
    await seedMedicines(database);
    await seedLabTests(database);

    // Initialize wallet cache with zero balance
    await database.runAsync(
      `INSERT OR IGNORE INTO local_wallet_cache (id, balance) VALUES (1, 0)`
    );
  }

  if (currentVersion < 2) {
    // V2 migration: add synced columns for cloud sync
    for (const sql of MIGRATION_V2_SQL) {
      try {
        await database.execAsync(sql);
      } catch {
        // Column may already exist on fresh install - ignore
      }
    }

    // Initialize cloud sync meta
    await database.runAsync(
      `INSERT OR IGNORE INTO cloud_sync_meta (id, last_pushed_at, last_pulled_at, device_id) VALUES (1, '', '', '')`,
    );
  }

  if (currentVersion < DB_VERSION) {
    await database.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}

export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

export function generateRxId(): string {
  const num = Date.now().toString().slice(-6);
  return `RX-${num}`;
}
