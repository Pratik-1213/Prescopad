export enum SyncAction {
  QUEUE_UPDATE = 'QUEUE_UPDATE',
  PATIENT_DATA = 'PATIENT_DATA',
  DOCTOR_STATUS = 'DOCTOR_STATUS',
  SYNC_REQUEST = 'SYNC_REQUEST',
  SYNC_RESPONSE = 'SYNC_RESPONSE',
  PRESCRIPTION_STATUS = 'PRESCRIPTION_STATUS',
  PING = 'PING',
  PONG = 'PONG',
}

export interface SyncMessage {
  id: string;
  action: SyncAction;
  payload: unknown;
  senderId: string;
  timestamp: string;
}

export interface PairingData {
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  port: number;
  role: string;
  clinicId: string;
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

export interface SyncLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: string;
  timestamp: string;
  synced: boolean;
}
