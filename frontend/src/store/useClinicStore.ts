import { create } from 'zustand';
import { Clinic, DoctorProfile } from '../types/clinic.types';
import { getDatabase } from '../database/database';

interface ClinicStore {
  clinic: Clinic | null;
  doctorProfile: DoctorProfile | null;
  isLoading: boolean;

  loadClinic: () => Promise<void>;
  loadDoctorProfile: () => Promise<void>;
  updateClinic: (data: Partial<Clinic>) => Promise<void>;
  updateDoctorProfile: (data: Partial<DoctorProfile>) => Promise<void>;
  saveSignature: (signatureBase64: string) => Promise<void>;
  setClinic: (clinic: Clinic) => void;
  setDoctorProfile: (profile: DoctorProfile) => void;
}

export const useClinicStore = create<ClinicStore>((set, get) => ({
  clinic: null,
  doctorProfile: null,
  isLoading: false,

  loadClinic: async () => {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM clinic LIMIT 1');
    if (row) {
      set({
        clinic: {
          id: row.id as string,
          name: row.name as string,
          address: (row.address ?? '') as string,
          phone: (row.phone ?? '') as string,
          email: (row.email ?? '') as string,
          logoBase64: (row.logo_base64 ?? null) as string | null,
          ownerId: (row.doctor_id ?? '') as string,
        },
      });
    }
  },

  loadDoctorProfile: async () => {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM doctors LIMIT 1');
    if (row) {
      set({
        doctorProfile: {
          id: row.id as string,
          name: row.name as string,
          phone: (row.phone ?? '') as string,
          specialty: (row.specialty ?? '') as string,
          regNumber: (row.reg_number ?? '') as string,
          signatureBase64: (row.signature_base64 ?? null) as string | null,
          cloudId: (row.cloud_id ?? '') as string,
        },
      });
    }
  },

  updateClinic: async (data) => {
    const db = await getDatabase();
    const current = get().clinic;
    if (!current) return;

    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.address !== undefined) { fields.push('address = ?'); values.push(data.address); }
    if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone); }
    if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email); }
    if (data.logoBase64 !== undefined) { fields.push('logo_base64 = ?'); values.push(data.logoBase64); }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    values.push(current.id);

    await db.runAsync(`UPDATE clinic SET ${fields.join(', ')} WHERE id = ?`, values);
    set({ clinic: { ...current, ...data } });
  },

  updateDoctorProfile: async (data) => {
    const db = await getDatabase();
    const current = get().doctorProfile;
    if (!current) return;

    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.specialty !== undefined) { fields.push('specialty = ?'); values.push(data.specialty); }
    if (data.regNumber !== undefined) { fields.push('reg_number = ?'); values.push(data.regNumber); }
    if (data.signatureBase64 !== undefined) { fields.push('signature_base64 = ?'); values.push(data.signatureBase64); }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    values.push(current.id);

    await db.runAsync(`UPDATE doctors SET ${fields.join(', ')} WHERE id = ?`, values);
    set({ doctorProfile: { ...current, ...data } });
  },

  saveSignature: async (signatureBase64: string) => {
    const current = get().doctorProfile;
    if (!current) return;
    await get().updateDoctorProfile({ signatureBase64 });
  },

  setClinic: (clinic) => set({ clinic }),
  setDoctorProfile: (profile) => set({ doctorProfile: profile }),
}));
