export type Role = 'PATIENT' | 'ASHA' | 'DOCTOR' | 'ADMIN';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD or ISO string
  gender: 'MALE' | 'FEMALE' | 'OTHER' | string;
  abhaId?: string;
  facilityId: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  isLocalOnly?: boolean; // True if created offline and pending remote sync
}

export interface Vitals {
  temperature?: number; // in °F or °C (e.g. 98.6)
  systolic?: number;    // mmHg (e.g. 120)
  diastolic?: number;   // mmHg (e.g. 80)
  heartRate?: number;   // bpm (e.g. 72)
  spO2?: number;        // % (e.g. 98)
  respiratoryRate?: number; // breaths/min (e.g. 18)
  weight?: number;      // kg (e.g. 65)
}

export interface Symptom {
  name: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE' | string;
  durationDays: number;
  notes?: string;
}

export interface Visit {
  id: string; // Local UUID or Server ID
  patientId: string;
  ashaId?: string;
  facilityId?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'REFERRED' | string;
  notes?: string;
  vitals: Vitals;
  symptoms: Symptom[];
  createdAt: string;
  isLocalOnly?: boolean;
}

export type SyncOperation = 'CREATE_VISIT' | 'REGISTER_PATIENT';
export type SyncStatus = 'PENDING' | 'SYNCING' | 'FAILED' | 'SYNCED';

export interface SyncQueueItem {
  id: string;               // Local DB primary key / clientSyncId
  clientSyncId: string;     // Unique UUID for idempotency
  operation: SyncOperation;
  entityType: 'HealthVisit' | 'PatientProfile' | string;
  entityId?: string;
  payload: any;             // JSON object
  status: SyncStatus;
  retryCount: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncItemResult {
  clientSyncId: string;
  status: 'success' | 'duplicate' | 'failed';
  message?: string;
}

export interface SyncBatchResponse {
  message?: string;
  results: SyncItemResult[];
}

export interface AuthResponse {
  token: string;
  role: Role;
  userId?: string;
}
