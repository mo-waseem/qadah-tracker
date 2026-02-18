import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const qadaProgress = pgTable("qada_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  missedStartDate: varchar("missed_start_date").notNull(),
  missedEndDate: varchar("missed_end_date").notNull(),
  
  // Total counts to complete
  fajrCount: integer("fajr_count").notNull().default(0),
  dhuhrCount: integer("dhuhr_count").notNull().default(0),
  asrCount: integer("asr_count").notNull().default(0),
  maghribCount: integer("maghrib_count").notNull().default(0),
  ishaCount: integer("isha_count").notNull().default(0),

  // Completed counts
  fajrCompleted: integer("fajr_completed").notNull().default(0),
  dhuhrCompleted: integer("dhuhr_completed").notNull().default(0),
  asrCompleted: integer("asr_completed").notNull().default(0),
  maghribCompleted: integer("maghrib_completed").notNull().default(0),
  ishaCompleted: integer("isha_completed").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQadaProgressSchema = createInsertSchema(qadaProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQadaProgress = z.infer<typeof insertQadaProgressSchema>;
export type QadaProgress = typeof qadaProgress.$inferSelect;
