import {
  qadaProgress,
  type QadaProgress,
  type InsertQadaProgress,
} from "@shared/schema";

export interface IStorage {
  getQadaProgress(userId: string): Promise<QadaProgress | undefined>;
  createQadaProgress(progress: InsertQadaProgress): Promise<QadaProgress>;
  updateQadaCount(userId: string, prayer: string, increment: boolean): Promise<QadaProgress | undefined>;
}

export class MemStorage implements IStorage {
  private progress: Map<string, QadaProgress>;
  private currentId: number;

  constructor() {
    this.progress = new Map();
    this.currentId = 1;
  }

  async getQadaProgress(userId: string): Promise<QadaProgress | undefined> {
    return this.progress.get(userId);
  }

  async createQadaProgress(progress: InsertQadaProgress): Promise<QadaProgress> {
    const id = this.currentId++;
    const newProgress: QadaProgress = {
      ...progress,
      id,
      fajrCompleted: 0,
      dhuhrCompleted: 0,
      asrCompleted: 0,
      maghribCompleted: 0,
      ishaCompleted: 0,
      updatedAt: new Date(),
    };
    this.progress.set(progress.userId, newProgress);
    return newProgress;
  }

  async updateQadaCount(
    userId: string,
    prayer: string,
    increment: boolean,
  ): Promise<QadaProgress | undefined> {
    const progress = this.progress.get(userId);
    if (!progress) return undefined;

    let columnKey: keyof QadaProgress;
    switch (prayer) {
      case 'fajr': columnKey = 'fajrCompleted'; break;
      case 'dhuhr': columnKey = 'dhuhrCompleted'; break;
      case 'asr': columnKey = 'asrCompleted'; break;
      case 'maghrib': columnKey = 'maghribCompleted'; break;
      case 'isha': columnKey = 'ishaCompleted'; break;
      default: throw new Error(`Invalid prayer: ${prayer}`);
    }

    const value = progress[columnKey] as number;
    const updated = {
      ...progress,
      [columnKey]: increment ? value + 1 : value - 1,
      updatedAt: new Date(),
    };
    this.progress.set(userId, updated);
    return updated;
  }
}

export const storage = new MemStorage();
