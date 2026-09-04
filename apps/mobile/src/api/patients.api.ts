import { apiClient } from './client';
import { Patient } from '../types';

export const getPatientsApi = async (): Promise<Patient[]> => {
  const response = await apiClient.get<Patient[]>('/api/patients');
  return response.data;
};

export const searchPatientsApi = async (query: string): Promise<Patient[]> => {
  const response = await apiClient.get<Patient[]>('/api/patients/search', {
    params: { q: query },
  });
  return response.data;
};

export const createPatientApi = async (data: {
  id?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  facilityId: string;
  abhaId?: string;
  userId?: string;
}): Promise<{ message: string; patient: Patient }> => {
  const response = await apiClient.post<{ message: string; patient: Patient }>('/api/patients', data);
  return response.data;
};

export const updatePatientApi = async (
  id: string,
  data: Partial<{
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    facilityId: string;
    abhaId?: string;
  }>
): Promise<{ message: string; patient: Patient }> => {
  const response = await apiClient.put<{ message: string; patient: Patient }>(`/api/patients/${id}`, data);
  return response.data;
};
