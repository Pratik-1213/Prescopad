import { getDatabase, generateId } from '../database';
import { Medicine, LabTest } from '../../types/medicine.types';

export async function searchMedicines(query: string): Promise<Medicine[]> {
  const db = await getDatabase();
  const search = `%${query}%`;
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM medicines WHERE name LIKE ? ORDER BY usage_count DESC, name ASC LIMIT 30`,
    [search]
  );
  return rows.map(mapMedicineRow);
}

export async function getFrequentMedicines(limit = 20): Promise<Medicine[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM medicines ORDER BY usage_count DESC LIMIT ?',
    [limit]
  );
  return rows.map(mapMedicineRow);
}

export async function addCustomMedicine(
  name: string,
  type: string,
  strength: string
): Promise<Medicine> {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO medicines (id, name, type, strength, manufacturer, is_custom, usage_count, synced, updated_at)
     VALUES (?, ?, ?, ?, '', 1, 1, 0, datetime('now'))`,
    [id, name, type, strength]
  );
  return { id, name, type: type as Medicine['type'], strength, manufacturer: '', isCustom: true, usageCount: 1 };
}

export async function incrementMedicineUsage(name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE medicines SET usage_count = usage_count + 1 WHERE name = ?',
    [name]
  );
}

export async function searchLabTests(query: string): Promise<LabTest[]> {
  const db = await getDatabase();
  const search = `%${query}%`;
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT * FROM lab_tests WHERE name LIKE ? OR category LIKE ? ORDER BY usage_count DESC, name ASC LIMIT 30`,
    [search, search]
  );
  return rows.map(mapLabTestRow);
}

export async function getLabTestsByCategory(category: string): Promise<LabTest[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM lab_tests WHERE category = ? ORDER BY usage_count DESC, name ASC',
    [category]
  );
  return rows.map(mapLabTestRow);
}

export async function getFrequentLabTests(limit = 20): Promise<LabTest[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM lab_tests ORDER BY usage_count DESC LIMIT ?',
    [limit]
  );
  return rows.map(mapLabTestRow);
}

export async function addCustomLabTest(name: string, category: string): Promise<LabTest> {
  const db = await getDatabase();
  const id = generateId();
  await db.runAsync(
    `INSERT INTO lab_tests (id, name, category, is_custom, usage_count, synced, updated_at)
     VALUES (?, ?, ?, 1, 1, 0, datetime('now'))`,
    [id, name, category]
  );
  return { id, name, category, isCustom: true, usageCount: 1 };
}

export async function incrementLabTestUsage(name: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE lab_tests SET usage_count = usage_count + 1 WHERE name = ?',
    [name]
  );
}

function mapMedicineRow(row: Record<string, unknown>): Medicine {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Medicine['type'],
    strength: (row.strength ?? '') as string,
    manufacturer: (row.manufacturer ?? '') as string,
    isCustom: Boolean(row.is_custom ?? row.isCustom),
    usageCount: (row.usage_count ?? row.usageCount ?? 0) as number,
  };
}

function mapLabTestRow(row: Record<string, unknown>): LabTest {
  return {
    id: row.id as string,
    name: row.name as string,
    category: (row.category ?? '') as string,
    isCustom: Boolean(row.is_custom ?? row.isCustom),
    usageCount: (row.usage_count ?? row.usageCount ?? 0) as number,
  };
}
