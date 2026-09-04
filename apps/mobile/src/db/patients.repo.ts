import { getDatabase } from './database';
import { Patient } from '../types';

export const upsertPatient = async (patient: Patient, isLocalOnly: boolean = false): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO patients (id, firstName, lastName, dateOfBirth, gender, abhaId, facilityId, userId, isLocalOnly, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       firstName=excluded.firstName,
       lastName=excluded.lastName,
       dateOfBirth=excluded.dateOfBirth,
       gender=excluded.gender,
       abhaId=excluded.abhaId,
       facilityId=excluded.facilityId,
       userId=excluded.userId,
       isLocalOnly=excluded.isLocalOnly,
       updatedAt=excluded.updatedAt;`,
    [
      patient.id,
      patient.firstName,
      patient.lastName,
      patient.dateOfBirth,
      patient.gender,
      patient.abhaId || null,
      patient.facilityId,
      patient.userId || null,
      isLocalOnly ? 1 : 0,
      patient.createdAt || now,
      patient.updatedAt || now,
    ]
  );
};

export const upsertPatientsBatch = async (patients: Patient[]): Promise<void> => {
  const db = await getDatabase();
  const now = new Date().toISOString();

  for (const p of patients) {
    await db.runAsync(
      `INSERT INTO patients (id, firstName, lastName, dateOfBirth, gender, abhaId, facilityId, userId, isLocalOnly, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         firstName=excluded.firstName,
         lastName=excluded.lastName,
         dateOfBirth=excluded.dateOfBirth,
         gender=excluded.gender,
         abhaId=excluded.abhaId,
         facilityId=excluded.facilityId,
         userId=excluded.userId,
         isLocalOnly=0,
         updatedAt=excluded.updatedAt;`,
      [
        p.id,
        p.firstName,
        p.lastName,
        p.dateOfBirth,
        p.gender,
        p.abhaId || null,
        p.facilityId,
        p.userId || null,
        p.createdAt || now,
        p.updatedAt || now,
      ]
    );
  }
};

export const searchLocalPatients = async (query: string): Promise<Patient[]> => {
  const db = await getDatabase();
  const sanitizedQuery = `%${query.trim()}%`;

  const rows = await db.getAllAsync<any>(
    `SELECT * FROM patients
     WHERE firstName LIKE ? OR lastName LIKE ? OR abhaId LIKE ?
     ORDER BY createdAt DESC;`,
    [sanitizedQuery, sanitizedQuery, sanitizedQuery]
  );

  return rows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    dateOfBirth: r.dateOfBirth,
    gender: r.gender,
    abhaId: r.abhaId || undefined,
    facilityId: r.facilityId,
    userId: r.userId || undefined,
    isLocalOnly: r.isLocalOnly === 1,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
};

export const getAllLocalPatients = async (): Promise<Patient[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(`SELECT * FROM patients ORDER BY createdAt DESC;`);

  return rows.map((r) => ({
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    dateOfBirth: r.dateOfBirth,
    gender: r.gender,
    abhaId: r.abhaId || undefined,
    facilityId: r.facilityId,
    userId: r.userId || undefined,
    isLocalOnly: r.isLocalOnly === 1,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
};

export const getPatientById = async (id: string): Promise<Patient | null> => {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(`SELECT * FROM patients WHERE id = ?;`, [id]);

  if (!row) return null;

  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    dateOfBirth: row.dateOfBirth,
    gender: row.gender,
    abhaId: row.abhaId || undefined,
    facilityId: row.facilityId,
    userId: row.userId || undefined,
    isLocalOnly: row.isLocalOnly === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export const markPatientSynced = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync(`UPDATE patients SET isLocalOnly = 0 WHERE id = ?;`, [id]);
};
