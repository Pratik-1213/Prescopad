import { getDatabase, generateId, generateRxId } from '../database';
import {
  Prescription,
  PrescriptionMedicine,
  PrescriptionLabTest,
  PrescriptionDraft,
  PrescriptionStatus,
} from '../../types/prescription.types';

export async function createPrescription(
  draft: PrescriptionDraft,
  doctorId: string
): Promise<Prescription> {
  const db = await getDatabase();
  const id = generateRxId();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO prescriptions (id, patient_id, patient_name, patient_age, patient_gender, patient_phone,
     doctor_id, diagnosis, advice, follow_up_date, status, wallet_deducted, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    [
      id,
      draft.patientId,
      draft.patientName,
      parseInt(draft.patientAge, 10),
      draft.patientGender,
      draft.patientPhone,
      doctorId,
      draft.diagnosis,
      draft.advice,
      draft.followUpDate || null,
      PrescriptionStatus.DRAFT,
      now,
    ]
  );

  // Insert medicines
  for (const med of draft.medicines) {
    const medId = generateId();
    await db.runAsync(
      `INSERT INTO prescription_medicines (id, prescription_id, medicine_name, type, dosage, frequency, duration, timing, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [medId, id, med.medicineName, med.type, med.dosage, med.frequency, med.duration, med.timing, med.notes]
    );
  }

  // Insert lab tests
  for (const test of draft.labTests) {
    const testId = generateId();
    await db.runAsync(
      `INSERT INTO prescription_lab_tests (id, prescription_id, test_name, category, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [testId, id, test.testName, test.category, test.notes]
    );
  }

  return getPrescriptionById(id) as Promise<Prescription>;
}

export async function getPrescriptionById(id: string): Promise<Prescription | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Record<string, unknown>>(
    'SELECT * FROM prescriptions WHERE id = ?',
    [id]
  );
  if (!row) return null;

  const medicines = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM prescription_medicines WHERE prescription_id = ?',
    [id]
  );

  const labTests = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM prescription_lab_tests WHERE prescription_id = ?',
    [id]
  );

  return mapPrescriptionRow(row, medicines, labTests);
}

export async function finalizePrescription(
  id: string,
  signature: string,
  pdfPath: string,
  pdfHash: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE prescriptions SET status = ?, signature = ?, pdf_path = ?, pdf_hash = ?, wallet_deducted = 1
     WHERE id = ?`,
    [PrescriptionStatus.FINALIZED, signature, pdfPath, pdfHash, id]
  );
}

export async function getRecentPrescriptions(limit = 20): Promise<Prescription[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM prescriptions WHERE status = ? ORDER BY created_at DESC LIMIT ?',
    [PrescriptionStatus.FINALIZED, limit]
  );

  const prescriptions: Prescription[] = [];
  for (const row of rows) {
    const medicines = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM prescription_medicines WHERE prescription_id = ?',
      [row.id as string]
    );
    const labTests = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM prescription_lab_tests WHERE prescription_id = ?',
      [row.id as string]
    );
    prescriptions.push(mapPrescriptionRow(row, medicines, labTests));
  }

  return prescriptions;
}

export async function getPrescriptionsByPatient(patientId: string): Promise<Prescription[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Record<string, unknown>>(
    'SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY created_at DESC',
    [patientId]
  );

  const prescriptions: Prescription[] = [];
  for (const row of rows) {
    const medicines = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM prescription_medicines WHERE prescription_id = ?',
      [row.id as string]
    );
    const labTests = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM prescription_lab_tests WHERE prescription_id = ?',
      [row.id as string]
    );
    prescriptions.push(mapPrescriptionRow(row, medicines, labTests));
  }

  return prescriptions;
}

export async function getTodayPrescriptionCount(): Promise<number> {
  const db = await getDatabase();
  const today = new Date().toISOString().split('T')[0];
  const result = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM prescriptions WHERE date(created_at) = ? AND status = ?`,
    [today, PrescriptionStatus.FINALIZED]
  );
  return result?.count ?? 0;
}

export async function deletePrescription(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM prescription_medicines WHERE prescription_id = ?', [id]);
  await db.runAsync('DELETE FROM prescription_lab_tests WHERE prescription_id = ?', [id]);
  await db.runAsync('DELETE FROM prescriptions WHERE id = ?', [id]);
}

function mapPrescriptionRow(
  row: Record<string, unknown>,
  medicineRows: Record<string, unknown>[],
  labTestRows: Record<string, unknown>[]
): Prescription {
  return {
    id: row.id as string,
    patientId: (row.patient_id ?? row.patientId) as string,
    patientName: (row.patient_name ?? row.patientName) as string,
    patientAge: (row.patient_age ?? row.patientAge) as number,
    patientGender: (row.patient_gender ?? row.patientGender) as string,
    patientPhone: (row.patient_phone ?? row.patientPhone ?? '') as string,
    doctorId: (row.doctor_id ?? row.doctorId) as string,
    diagnosis: (row.diagnosis ?? '') as string,
    advice: (row.advice ?? '') as string,
    followUpDate: (row.follow_up_date ?? row.followUpDate ?? null) as string | null,
    pdfPath: (row.pdf_path ?? row.pdfPath ?? null) as string | null,
    pdfHash: (row.pdf_hash ?? row.pdfHash ?? null) as string | null,
    signature: (row.signature ?? null) as string | null,
    status: row.status as PrescriptionStatus,
    walletDeducted: Boolean(row.wallet_deducted ?? row.walletDeducted),
    medicines: medicineRows.map(mapMedicineRow),
    labTests: labTestRows.map(mapLabTestRow),
    createdAt: (row.created_at ?? row.createdAt ?? '') as string,
  };
}

function mapMedicineRow(row: Record<string, unknown>): PrescriptionMedicine {
  return {
    id: row.id as string,
    prescriptionId: (row.prescription_id ?? row.prescriptionId) as string,
    medicineName: (row.medicine_name ?? row.medicineName) as string,
    type: (row.type ?? '') as string,
    dosage: (row.dosage ?? '') as string,
    frequency: (row.frequency ?? '') as string,
    duration: (row.duration ?? '') as string,
    timing: (row.timing ?? '') as string,
    notes: (row.notes ?? '') as string,
  };
}

function mapLabTestRow(row: Record<string, unknown>): PrescriptionLabTest {
  return {
    id: row.id as string,
    prescriptionId: (row.prescription_id ?? row.prescriptionId) as string,
    testName: (row.test_name ?? row.testName) as string,
    category: (row.category ?? '') as string,
    notes: (row.notes ?? '') as string,
  };
}
