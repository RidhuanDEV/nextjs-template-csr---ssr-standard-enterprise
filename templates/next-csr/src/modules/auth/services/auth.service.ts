import { apiClient } from '@/lib/api/client';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '../types/auth.types';

export const authService = {
  login: async (data: LoginPayload): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterPayload): Promise<void> => {
    await apiClient.post('/auth/register', data);
  },

  me: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
