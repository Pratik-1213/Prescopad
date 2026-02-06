import { getDatabase, generateId } from '../database';
import { Patient, PatientFormData } from '../../types/patient.types';

export async function createPatient(data: PatientFormData): Promise<Patient> {
  const db = await getDatabase();
  const id = generateId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO patients (id, name, age, gender, weight, phone, address, blood_group, allergies, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
    [
      id,
      data.name.trim(),
      parseInt(data.age, 10),
      data.gender,
      data.weight ? parseFloat(data.weight) : null,
      data.phone.trim(),
      data.address.trim(),
      data.bloodGroup,
      data.allergies.trim(),
      now,
      now,
    ]
  );

  const patient = await getPatientById(id);
  if (!patient) {
    throw new Error('Failed to create patient: record not found after insert');
  }
  return patient;
}

export async function getPatientById(id: string): Promise<Patient | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Patient>(
    'SELECT * FROM patients WHERE id = ?',
    [id]
  );
  return row ? mapPatientRow(row) : null;
}

export async function searchPatients(query: string): Promise<Patient[]> {
  const db = await getDatabase();
  const search = `%${query}%`;
  const rows = await db.getAllAsync<Patient>(
    `SELECT * FROM patients WHERE name LIKE ? OR phone LIKE ? ORDER BY updated_at DESC LIMIT 50`,
    [search, search]
  );
  return rows.map(mapPatientRow);
}

export async function getAllPatients(limit = 100, offset = 0): Promise<Patient[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Patient>(
    'SELECT * FROM patients ORDER BY updated_at DESC LIMIT ? OFFSET ?',
    [limit, offset]
  );
  return rows.map(mapPatientRow);
}

export async function updatePatient(id: string, data: Partial<PatientFormData>): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name.trim()); }
  if (data.age !== undefined) { fields.push('age = ?'); values.push(parseInt(data.age, 10)); }
  if (data.gender !== undefined) { fields.push('gender = ?'); values.push(data.gender); }
  if (data.weight !== undefined) { fields.push('weight = ?'); values.push(data.weight ? parseFloat(data.weight) : null); }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone.trim()); }
  if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address.trim()); }
  if (data.bloodGroup !== undefined) { fields.push('blood_group = ?'); values.push(data.bloodGroup); }
  if (data.allergies !== undefined) { fields.push('allergies = ?'); values.push(data.allergies.trim()); }

  if (fields.length === 0) return;

  fields.push("updated_at = datetime('now')");
  fields.push('synced = 0');
  values.push(id);

  await db.runAsync(
    `UPDATE patients SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
}

export async function getPatientCount(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM patients'
  );
  return result?.count ?? 0;
}

export async function getRecentPatients(limit = 10): Promise<Patient[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Patient>(
    'SELECT * FROM patients ORDER BY updated_at DESC LIMIT ?',
    [limit]
  );
  return rows.map(mapPatientRow);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPatientRow(row: any): Patient {
  return {
    id: row.id as string,
    name: row.name as string,
    age: row.age as number,
    gender: (row.gender as string) as Patient['gender'],
    weight: row.weight as number | null,
    phone: row.phone as string,
    address: row.address as string,
    bloodGroup: (row.blood_group ?? row.bloodGroup ?? '') as string,
    allergies: row.allergies as string,
    createdAt: (row.created_at ?? row.createdAt ?? '') as string,
    updatedAt: (row.updated_at ?? row.updatedAt ?? '') as string,
  };
}
