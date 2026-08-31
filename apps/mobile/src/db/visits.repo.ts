import { getDatabase } from './database';
import { Visit } from '../types';

export const insertLocalVisit = async (visit: Visit): Promise<void> => {
  const db = await getDatabase();

  await db.runAsync(
    `INSERT INTO visits (id, patientId, ashaId, facilityId, status, notes, vitalsJson, symptomsJson, isLocalOnly, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      visit.id,
      visit.patientId,
      visit.ashaId || null,
      visit.facilityId || null,
      visit.status,
      visit.notes || null,
      JSON.stringify(visit.vitals || {}),
      JSON.stringify(visit.symptoms || []),
      visit.isLocalOnly ? 1 : 0,
      visit.createdAt,
    ]
  );
};

export const getVisitsByPatientId = async (patientId: string): Promise<Visit[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM visits WHERE patientId = ? ORDER BY createdAt DESC;`,
    [patientId]
  );

  return rows.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    ashaId: r.ashaId || undefined,
    facilityId: r.facilityId || undefined,
    status: r.status,
    notes: r.notes || undefined,
    vitals: JSON.parse(r.vitalsJson || '{}'),
    symptoms: JSON.parse(r.symptomsJson || '[]'),
    isLocalOnly: r.isLocalOnly === 1,
    createdAt: r.createdAt,
  }));
};

export const getTodayVisitsCount = async (): Promise<number> => {
  const db = await getDatabase();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM visits WHERE createdAt >= ?;`,
    [startOfDay.toISOString()]
  );

  return row?.count || 0;
};
