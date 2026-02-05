import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, DB_VERSION } from './schema';
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

  if (currentVersion < DB_VERSION) {
    for (const sql of CREATE_TABLES_SQL) {
      await database.execAsync(sql);
    }
    await seedMedicines(database);
    await seedLabTests(database);
    await database.execAsync(`PRAGMA user_version = ${DB_VERSION}`);

    // Initialize wallet cache with zero balance
    await database.runAsync(
      `INSERT OR IGNORE INTO local_wallet_cache (id, balance) VALUES (1, 0)`
    );
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
