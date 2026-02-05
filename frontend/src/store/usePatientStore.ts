import { create } from 'zustand';
import { Patient, PatientFormData } from '../types/patient.types';
import * as PatientDB from '../database/queries/patientQueries';

interface PatientStore {
  patients: Patient[];
  searchResults: Patient[];
  selectedPatient: Patient | null;
  isLoading: boolean;

  loadPatients: () => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  createPatient: (data: PatientFormData) => Promise<Patient>;
  updatePatient: (id: string, data: Partial<PatientFormData>) => Promise<void>;
  selectPatient: (patient: Patient | null) => void;
  getPatientById: (id: string) => Promise<Patient | null>;
  clearSearch: () => void;
}

export const usePatientStore = create<PatientStore>((set, get) => ({
  patients: [],
  searchResults: [],
  selectedPatient: null,
  isLoading: false,

  loadPatients: async () => {
    set({ isLoading: true });
    const patients = await PatientDB.getAllPatients();
    set({ patients, isLoading: false });
  },

  searchPatients: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }
    const searchResults = await PatientDB.searchPatients(query);
    set({ searchResults });
  },

  createPatient: async (data: PatientFormData) => {
    const patient = await PatientDB.createPatient(data);
    set((state) => ({ patients: [patient, ...state.patients] }));
    return patient;
  },

  updatePatient: async (id: string, data: Partial<PatientFormData>) => {
    await PatientDB.updatePatient(id, data);
    const updated = await PatientDB.getPatientById(id);
    if (updated) {
      set((state) => ({
        patients: state.patients.map((p) => (p.id === id ? updated : p)),
        selectedPatient: state.selectedPatient?.id === id ? updated : state.selectedPatient,
      }));
    }
  },

  selectPatient: (patient) => set({ selectedPatient: patient }),

  getPatientById: async (id: string) => {
    return PatientDB.getPatientById(id);
  },

  clearSearch: () => set({ searchResults: [] }),
}));
