import type { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/toast.store';
import type { ApiErrorResponse } from './types';

export function setupInterceptors(client: AxiosInstance) {
  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorResponse>) => {
      const message = error.response?.data?.message || 'An unexpected error occurred';

      if (error.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else {
        useToastStore.getState().addToast({ type: 'error', message });
      }

      return Promise.reject(error);
    }
  );
}
