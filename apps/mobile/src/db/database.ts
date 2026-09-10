import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }

  // Open or create the local SwasthyaSetu SQLite database
  const db = await SQLite.openDatabaseAsync('swasthyasetu.db');

  // Initialize Schema
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      dateOfBirth TEXT NOT NULL,
      gender TEXT NOT NULL,
      abhaId TEXT,
      facilityId TEXT NOT NULL,
      userId TEXT,
      isLocalOnly INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL,
      ashaId TEXT,
      facilityId TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      vitalsJson TEXT NOT NULL,
      symptomsJson TEXT NOT NULL,
      isLocalOnly INTEGER DEFAULT 1,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      clientSyncId TEXT UNIQUE NOT NULL,
      operation TEXT NOT NULL,
      entityType TEXT NOT NULL,
      entityId TEXT,
      payloadJson TEXT NOT NULL,
      status TEXT NOT NULL,
      retryCount INTEGER DEFAULT 0,
      errorMessage TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  dbInstance = db;
  return db;
};
