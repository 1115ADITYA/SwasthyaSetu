import { apiClient } from './client';
import { AuthResponse } from '../types';

export const loginApi = async (phoneNumber: string, password: string): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', {
    phoneNumber,
    password,
  });
  return response.data;
};

export const registerApi = async (data: { phoneNumber: string; password: string; role?: string }) => {
  const response = await apiClient.post('/api/auth/register', data);
  return response.data;
};
