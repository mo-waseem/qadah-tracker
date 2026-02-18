import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'qada_db';
const STORE_NAME = 'progress';

export interface QadaData {
  id: number;
  missedStartDate: string;
  missedEndDate: string;
  fajrCount: number;
  dhuhrCount: number;
  asrCount: number;
  maghribCount: number;
  ishaCount: number;
  witrCount: number;
  fajrCompleted: number;
  dhuhrCompleted: number;
  asrCompleted: number;
  maghribCompleted: number;
  ishaCompleted: number;
  witrCompleted: number;
  updatedAt: string;
}

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function getProgress(): Promise<QadaData | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, 1);
}

export async function saveProgress(data: QadaData) {
  const db = await initDB();
  return db.put(STORE_NAME, { ...data, id: 1 });
}
