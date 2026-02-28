import { openDB } from 'idb';

const DB_NAME = 'qada_db';
const STORE_NAME = 'progress';

export interface QadaRange {
  missedStartDate: string;
  missedEndDate: string;
  excludeJomaa?: boolean;
  excludePeriod?: boolean;
  periodDays?: number;
  fajrCount: number;
  dhuhrCount: number;
  asrCount: number;
  maghribCount: number;
  ishaCount: number;
  fajrCompleted: number;
  dhuhrCompleted: number;
  asrCompleted: number;
  maghribCompleted: number;
  ishaCompleted: number;
}

export interface QadaStore {
  id: number; // always 1
  ranges: QadaRange[];
  updatedAt: string;
}

/** @deprecated — kept for backward compat with old single-range imports/migration */
export interface QadaData {
  id: number;
  missedStartDate: string;
  missedEndDate: string;
  fajrCount: number;
  dhuhrCount: number;
  asrCount: number;
  maghribCount: number;
  ishaCount: number;
  fajrCompleted: number;
  dhuhrCompleted: number;
  asrCompleted: number;
  maghribCompleted: number;
  ishaCompleted: number;
  updatedAt: string;
}

/** Convert old single-range QadaData to QadaRange */
export function legacyToRange(data: QadaData): QadaRange {
  return {
    missedStartDate: data.missedStartDate,
    missedEndDate: data.missedEndDate,
    fajrCount: data.fajrCount,
    dhuhrCount: data.dhuhrCount,
    asrCount: data.asrCount,
    maghribCount: data.maghribCount,
    ishaCount: data.ishaCount,
    fajrCompleted: data.fajrCompleted,
    dhuhrCompleted: data.dhuhrCompleted,
    asrCompleted: data.asrCompleted,
    maghribCompleted: data.maghribCompleted,
    ishaCompleted: data.ishaCompleted,
  };
}

export async function initDB() {
  return openDB(DB_NAME, 2, {
    async upgrade(db, oldVersion, _newVersion, tx) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }

      // Migrate v1 → v2: wrap single record into ranges[]
      // We use await to ensure migration completes before version is committed
      if (oldVersion === 1) {
        const store = tx.objectStore(STORE_NAME);
        const oldData = await store.get(1);
        if (oldData && oldData.missedStartDate && !oldData.ranges) {
          const migrated: QadaStore = {
            id: 1,
            ranges: [legacyToRange(oldData as QadaData)],
            updatedAt: oldData.updatedAt || new Date().toISOString(),
          };
          await store.put(migrated);
        }
      }
    },
  });
}

export async function getProgress(): Promise<QadaStore | undefined> {
  const db = await initDB();
  return db.get(STORE_NAME, 1);
}

export async function saveProgress(data: QadaStore) {
  const db = await initDB();
  return db.put(STORE_NAME, { ...data, id: 1 });
}

export async function clearProgress() {
  const db = await initDB();
  return db.clear(STORE_NAME);
}
