import { db } from "./db";
import { eq, sql } from "drizzle-orm";
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

export class DatabaseStorage implements IStorage {
  async getQadaProgress(userId: string): Promise<QadaProgress | undefined> {
    const [progress] = await db
      .select()
      .from(qadaProgress)
      .where(eq(qadaProgress.userId, userId));
    return progress;
  }

  async createQadaProgress(progress: InsertQadaProgress): Promise<QadaProgress> {
    const [newProgress] = await db
      .insert(qadaProgress)
      .values(progress)
      .returning();
    return newProgress;
  }

  async updateQadaCount(
    userId: string,
    prayer: string,
    increment: boolean,
  ): Promise<QadaProgress | undefined> {
    // Determine the column to update
    let columnKey: keyof typeof qadaProgress.$inferSelect;
    
    // Map prayer name to completed column key
    switch (prayer) {
      case 'fajr': columnKey = 'fajrCompleted'; break;
      case 'dhuhr': columnKey = 'dhuhrCompleted'; break;
      case 'asr': columnKey = 'asrCompleted'; break;
      case 'maghrib': columnKey = 'maghribCompleted'; break;
      case 'isha': columnKey = 'ishaCompleted'; break;
      case 'witr': columnKey = 'witrCompleted'; break;
      default: throw new Error(`Invalid prayer: ${prayer}`);
    }

    const column = qadaProgress[columnKey];
    const operator = increment ? sql`${column} + 1` : sql`${column} - 1`;

    const [updated] = await db
      .update(qadaProgress)
      .set({ [columnKey]: operator, updatedAt: new Date() })
      .where(eq(qadaProgress.userId, userId))
      .returning();
      
    return updated;
  }
}

export const storage = new DatabaseStorage();
