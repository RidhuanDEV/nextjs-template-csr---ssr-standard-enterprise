import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/hooks/useToast';
import { authService } from '../services/auth.service';
import type { LoginPayload, RegisterPayload } from '../types/auth.types';

export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const toast = useToast();

  return useMutation({
    mutationFn: (data: LoginPayload) => authService.login(data),
    onSuccess: (response) => {
      setAuth(response.user, response.token);
      toast.success('Login successful');
      router.push('/dashboard');
    },
    onError: () => {
      toast.error('Invalid email or password');
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: RegisterPayload) => authService.register(data),
    onSuccess: () => {
      toast.success('Registration successful. Please login.');
      router.push('/login');
    },
    onError: () => {
      toast.error('Registration failed');
    },
  });
}

export function useCurrentUser() {
  const token = useAuthStore((s) => s.token);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me(),
    enabled: !!token,
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  return () => {
    clearAuth();
    router.push('/login');
  };
}
