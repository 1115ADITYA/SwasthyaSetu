export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  contact: string;
  location: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lastVisit: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Vitals {
  temperature: number;
  systolic: number;
  diastolic: number;
  heartRate: number;
  spO2: number;
  respiratoryRate: number;
  weight: number;
}

export interface Symptom {
  name: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  durationDays: number;
  notes?: string;
}

export interface HealthVisit {
  id: string;
  patientId: string;
  patientName?: string; // Denormalized for display
  ashaId: string;
  ashaName?: string; // Denormalized for display
  date: string;
  reason: string;
  status: 'COMPLETED' | 'PENDING_REVIEW';
  vitals: Vitals;
  symptoms: Symptom[];
}

export const MOCK_PATIENTS: Patient[] = [
  { id: 'p1', name: 'Aarav Patel', age: 34, gender: 'Male', contact: '+91 98765 43210', location: 'Block A, Village North', riskLevel: 'LOW', lastVisit: '2026-08-31', status: 'ACTIVE' },
  { id: 'p2', name: 'Diya Sharma', age: 28, gender: 'Female', contact: '+91 98765 43211', location: 'Block B, Village South', riskLevel: 'HIGH', lastVisit: '2026-09-01', status: 'ACTIVE' },
  { id: 'p3', name: 'Kabir Singh', age: 45, gender: 'Male', contact: '+91 98765 43212', location: 'Block A, Village North', riskLevel: 'MEDIUM', lastVisit: '2026-08-30', status: 'ACTIVE' },
  { id: 'p4', name: 'Meera Reddy', age: 62, gender: 'Female', contact: '+91 98765 43213', location: 'Block C, Village East', riskLevel: 'LOW', lastVisit: '2026-08-15', status: 'ACTIVE' },
  { id: 'p5', name: 'Rohan Gupta', age: 50, gender: 'Male', contact: '+91 98765 43214', location: 'Block B, Village South', riskLevel: 'HIGH', lastVisit: '2026-09-01', status: 'ACTIVE' },
  { id: 'p6', name: 'Sneha Verma', age: 31, gender: 'Female', contact: '+91 98765 43215', location: 'Block D, Village West', riskLevel: 'LOW', lastVisit: '2026-07-20', status: 'INACTIVE' },
  { id: 'p7', name: 'Vikram Joshi', age: 71, gender: 'Male', contact: '+91 98765 43216', location: 'Block A, Village North', riskLevel: 'MEDIUM', lastVisit: '2026-08-28', status: 'ACTIVE' },
  { id: 'p8', name: 'Priya Desai', age: 42, gender: 'Female', contact: '+91 98765 43217', location: 'Block C, Village East', riskLevel: 'HIGH', lastVisit: '2026-08-29', status: 'ACTIVE' },
];

export const MOCK_VISITS: HealthVisit[] = [
  {
    id: 'v1',
    patientId: 'p2',
    patientName: 'Diya Sharma',
    ashaId: 'a1',
    ashaName: 'Sunita Devi',
    date: '2026-09-01T10:30:00Z',
    reason: 'High Fever & Cough',
    status: 'PENDING_REVIEW',
    vitals: { temperature: 39.2, systolic: 110, diastolic: 75, heartRate: 98, spO2: 95, respiratoryRate: 20, weight: 58 },
    symptoms: [
      { name: 'Fever', severity: 'SEVERE', durationDays: 3, notes: 'Continuous since yesterday' },
      { name: 'Cough', severity: 'MODERATE', durationDays: 5, notes: 'Dry cough' }
    ]
  },
  {
    id: 'v2',
    patientId: 'p5',
    patientName: 'Rohan Gupta',
    ashaId: 'a2',
    ashaName: 'Kavita Rani',
    date: '2026-09-01T14:15:00Z',
    reason: 'Chest Pain follow-up',
    status: 'PENDING_REVIEW',
    vitals: { temperature: 37.1, systolic: 145, diastolic: 95, heartRate: 88, spO2: 97, respiratoryRate: 18, weight: 78 },
    symptoms: [
      { name: 'Chest Pain', severity: 'MILD', durationDays: 1, notes: 'Occasional mild pain' }
    ]
  },
  {
    id: 'v3',
    patientId: 'p1',
    patientName: 'Aarav Patel',
    ashaId: 'a1',
    ashaName: 'Sunita Devi',
    date: '2026-08-31T09:00:00Z',
    reason: 'Routine Checkup',
    status: 'COMPLETED',
    vitals: { temperature: 36.8, systolic: 120, diastolic: 80, heartRate: 72, spO2: 99, respiratoryRate: 16, weight: 65 },
    symptoms: []
  },
  {
    id: 'v4',
    patientId: 'p3',
    patientName: 'Kabir Singh',
    ashaId: 'a1',
    ashaName: 'Sunita Devi',
    date: '2026-08-30T11:45:00Z',
    reason: 'Blood Pressure Monitoring',
    status: 'COMPLETED',
    vitals: { temperature: 37.0, systolic: 135, diastolic: 88, heartRate: 78, spO2: 98, respiratoryRate: 16, weight: 82 },
    symptoms: [
      { name: 'Headache', severity: 'MILD', durationDays: 2 }
    ]
  },
  {
    id: 'v5',
    patientId: 'p8',
    patientName: 'Priya Desai',
    ashaId: 'a2',
    ashaName: 'Kavita Rani',
    date: '2026-08-29T16:20:00Z',
    reason: 'Diabetes check',
    status: 'COMPLETED',
    vitals: { temperature: 36.9, systolic: 130, diastolic: 85, heartRate: 80, spO2: 98, respiratoryRate: 18, weight: 71 },
    symptoms: [
      { name: 'Fatigue', severity: 'MODERATE', durationDays: 7 }
    ]
  }
];
