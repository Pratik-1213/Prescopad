import { PairingData } from '../../types/sync.types';
import { APP_CONFIG } from '../../constants/config';
import { generateId } from '../../database/database';

// Generate pairing data for QR code display (Doctor device)
export function generatePairingQR(
  deviceName: string,
  role: string,
  clinicId: string,
  ipAddress: string
): PairingData {
  return {
    deviceId: generateId(),
    deviceName,
    ipAddress,
    port: APP_CONFIG.sync.port,
    role,
    clinicId,
  };
}

// Parse scanned QR code data (Assistant device)
export function parsePairingQR(qrData: string): PairingData | null {
  try {
    const data = JSON.parse(qrData);
    if (data.deviceId && data.ipAddress && data.port) {
      return data as PairingData;
    }
    return null;
  } catch {
    return null;
  }
}

// Serialize pairing data to QR string
export function serializePairingData(data: PairingData): string {
  return JSON.stringify(data);
}

// Get device's local IP address (simplified for React Native)
// In production, use react-native-network-info or similar
export function getLocalIPAddress(): string {
  // Placeholder - in production, detect actual local IP
  return '192.168.1.100';
}
