export interface ConnectionRequest {
  id: string;
  doctorId: string;
  assistantId: string;
  initiatedBy: 'doctor' | 'assistant';
  status: 'pending' | 'accepted' | 'rejected';
  doctorName?: string;
  assistantName?: string;
  clinicName?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  phone: string;
  role: 'doctor' | 'assistant';
  lastActiveAt?: string;
  qualification?: string;
  experienceYears?: number;
  profileAddress?: string;
  city?: string;
  specialty?: string;
  regNumber?: string;
}

export interface ClinicListItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  doctorName: string;
  doctorSpecialty: string;
  ownerId: string;
}
