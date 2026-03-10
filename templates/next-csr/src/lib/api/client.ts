import axios from 'axios';
import { env } from '@/lib/env';
import { setupInterceptors } from './interceptors';

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

setupInterceptors(apiClient);
