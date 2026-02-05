import { SyncAction, SyncMessage } from '../../types/sync.types';
import { generateId } from '../../database/database';

export function createSyncMessage(
  action: SyncAction,
  payload: unknown,
  senderId: string
): SyncMessage {
  return {
    id: generateId(),
    action,
    payload,
    senderId,
    timestamp: new Date().toISOString(),
  };
}

export function serializeMessage(message: SyncMessage): string {
  return JSON.stringify(message);
}

export function deserializeMessage(data: string): SyncMessage | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed.id && parsed.action && parsed.senderId) {
      return parsed as SyncMessage;
    }
    return null;
  } catch {
    return null;
  }
}

export function createQueueUpdate(queueData: unknown, senderId: string): SyncMessage {
  return createSyncMessage(SyncAction.QUEUE_UPDATE, queueData, senderId);
}

export function createPatientData(patientData: unknown, senderId: string): SyncMessage {
  return createSyncMessage(SyncAction.PATIENT_DATA, patientData, senderId);
}

export function createDoctorStatus(isReady: boolean, senderId: string): SyncMessage {
  return createSyncMessage(SyncAction.DOCTOR_STATUS, { isReady }, senderId);
}

export function createPrescriptionStatus(
  prescriptionId: string,
  status: string,
  senderId: string
): SyncMessage {
  return createSyncMessage(SyncAction.PRESCRIPTION_STATUS, { prescriptionId, status }, senderId);
}

export function createPing(senderId: string): SyncMessage {
  return createSyncMessage(SyncAction.PING, {}, senderId);
}

export function createPong(senderId: string): SyncMessage {
  return createSyncMessage(SyncAction.PONG, {}, senderId);
}
