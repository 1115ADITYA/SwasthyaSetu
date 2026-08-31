import { apiClient } from './client';
import { Visit } from '../types';

export const createVisitApi = async (visitData: {
  patientId: string;
  status: string;
  notes?: string;
  vitals: {
    temperature?: number;
    systolic?: number;
    diastolic?: number;
    heartRate?: number;
    spO2?: number;
    respiratoryRate?: number;
    weight?: number;
  };
  symptoms: Array<{
    name: string;
    severity: string;
    durationDays: number;
    notes?: string;
  }>;
}): Promise<{ message: string; visit?: Visit }> => {
  const response = await apiClient.post('/api/visits', visitData);
  return response.data;
};

export const getPatientVisitHistoryApi = async (patientId: string): Promise<Visit[]> => {
  const response = await apiClient.get<Visit[]>(`/api/visits/patient/${patientId}`);
  return response.data;
};
