import type { AuthResponse, AuthUser } from '../types/auth';
import { apiRequest } from './api';

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function getCurrentUser(): Promise<AuthUser> {
  return (await apiRequest<AuthResponse>('/api/auth/me')).user;
}

export function logout() {
  return apiRequest<{ success: boolean; message: string }>('/api/auth/logout', { method: 'POST' });
}
