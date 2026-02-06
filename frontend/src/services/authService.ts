import api, { isOnline } from './api';
import { UserRole, AuthResponse } from '../types/auth.types';

// Offline demo OTP (only used when backend is unreachable)
const OFFLINE_DEMO_OTP = '123456';

export async function sendOTP(phone: string, role: UserRole): Promise<{ success: boolean; otp?: string }> {
  const online = await isOnline();

  if (!online) {
    // Offline demo mode
    return { success: true, otp: OFFLINE_DEMO_OTP };
  }

  const response = await api.post('/auth/send-otp', { phone, role });
  return response.data;
}

export async function verifyOTP(
  phone: string,
  otp: string,
  role: UserRole
): Promise<AuthResponse> {
  const online = await isOnline();

  if (!online) {
    // Offline demo mode - return mock auth response
    if (otp === OFFLINE_DEMO_OTP) {
      return {
        user: {
          id: `offline-${role}-${Date.now()}`,
          phone,
          name: role === UserRole.DOCTOR ? 'Doctor' : 'Assistant',
          role,
          clinicId: '',
          createdAt: new Date().toISOString(),
        },
        accessToken: 'offline-token',
        refreshToken: 'offline-refresh-token',
      };
    }
    throw new Error('Invalid OTP');
  }

  const response = await api.post('/auth/verify-otp', { phone, otp, role });
  return response.data;
}

export async function loginWithPassword(
  phone: string,
  password: string,
  role: UserRole
): Promise<AuthResponse> {
  const response = await api.post('/auth/login', { phone, password, role });
  return response.data;
}

export async function getMe(): Promise<AuthResponse['user']> {
  const response = await api.get('/auth/me');
  return response.data.user;
}

export async function updateProfile(data: { name?: string; phone?: string }): Promise<void> {
  await api.put('/auth/profile', data);
}
