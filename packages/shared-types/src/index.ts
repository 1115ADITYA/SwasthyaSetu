export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VitalsPayload {
  temperature?: number;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  spO2?: number;
  respiratoryRate?: number;
  weight?: number;
}

export interface SymptomPayload {
  name: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | string;
  durationDays?: number;
  notes?: string;
}

export interface CreateVisitRequest {
  patientId: string;
  status: string;
  notes?: string;
  vitals?: VitalsPayload;
  symptoms?: SymptomPayload[];
}

export interface CreateVisitResponse {
  message: string;
  visitId: string;
}

export interface SyncItem {
  clientSyncId: string;
  operation: string;
  entityType: string;
  entityId?: string;
  payload: any;
}

export interface SyncRequest {
  items: SyncItem[];
}

export interface SyncItemResult {
  clientSyncId: string;
  status: 'success' | 'duplicate' | 'failed';
  error?: string;
  serverEntityId?: string;
}

export interface SyncResponse {
  message: string;
  results: SyncItemResult[];
}
