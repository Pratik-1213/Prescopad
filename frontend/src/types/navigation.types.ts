import { Patient } from './patient.types';
import { Prescription } from './prescription.types';
import { QueueItem } from './queue.types';

export type AuthStackParamList = {
  Landing: undefined;
  Login: { role: string };
  OTP: { phone: string; role: string };
  Registration: { role: string };
};

export type DoctorTabParamList = {
  DoctorQueue: undefined;
  NewRx: undefined;
  DoctorWallet: undefined;
  DoctorSettings: undefined;
};

export type AssistantTabParamList = {
  AssistantQueue: undefined;
  AddPatient: undefined;
  AssistantSettings: undefined;
};

export type DoctorStackParamList = {
  DoctorDashboard: undefined;
  Consult: { queueItem: QueueItem; patient: Patient };
  MedicinePicker: undefined;
  LabTestPicker: undefined;
  PrescriptionPreview: { prescriptionId: string };
  DigitalSignature: { prescriptionId: string };
  RxSuccess: { prescription: Prescription };
  Connection: undefined;
};

export type AssistantStackParamList = {
  AssistantDashboard: undefined;
  AddPatientForm: undefined;
  PatientSearch: undefined;
  PatientDetail: { patientId: string };
  QueueManagement: undefined;
  Connection: undefined;
};

export type SharedStackParamList = {
  Wallet: undefined;
  Settings: undefined;
  ClinicProfile: undefined;
};
