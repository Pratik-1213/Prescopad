import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { APP_CONFIG } from '../constants/config';

const api: AxiosInstance = axios.create({
  baseURL: APP_CONFIG.api.baseUrl,
  timeout: APP_CONFIG.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(
          `${APP_CONFIG.api.baseUrl}/auth/refresh-token`,
          { refreshToken }
        );

        const { accessToken } = response.data;
        await SecureStore.setItemAsync('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        return api(originalRequest);
      } catch {
        // Refresh failed - user needs to re-login
        await SecureStore.deleteItemAsync('accessToken');
        await SecureStore.deleteItemAsync('refreshToken');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// Check if we're online
export async function isOnline(): Promise<boolean> {
  try {
    await axios.get(`${APP_CONFIG.api.baseUrl}/health`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}
