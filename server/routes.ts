import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertQadaProgressSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // --- Qada API ---

  // Get Progress
  app.get(api.qada.get.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = (req.user as any).claims.sub;
    const progress = await storage.getQadaProgress(userId);
    
    // If no progress found, return null (200 OK with null body or 404, let's follow schema: 404 null)
    if (!progress) {
       return res.json(null);
    }
    res.json(progress);
  });

  // Setup Progress (Create)
  app.post(api.qada.setup.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const input = api.qada.setup.input.parse(req.body);
      const userId = (req.user as any).claims.sub;

      // Calculate days difference
      const start = new Date(input.missedStartDate);
      const end = new Date(input.missedEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      // Default calculation: 1 prayer per day for each type
      // + 1 for start date inclusive if needed, but let's stick to simple diff for now.
      
      // Format dates to YYYY-MM-DD
      const formatDate = (date: Date) => date.toISOString().split('T')[0];
      
      const progressData = {
        userId,
        missedStartDate: formatDate(start),
        missedEndDate: formatDate(end),
        fajrCount: diffDays,
        dhuhrCount: diffDays,
        asrCount: diffDays,
        maghribCount: diffDays,
        ishaCount: diffDays,
        // Completed counts default to 0 in schema
      };

      const newProgress = await storage.createQadaProgress(progressData);
      res.status(201).json(newProgress);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Update Counts (Increment/Decrement)
  app.patch(api.qada.updateCounts.path, async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const input = api.qada.updateCounts.input.parse(req.body);
      const userId = (req.user as any).claims.sub;

      const updated = await storage.updateQadaCount(
        userId, 
        input.prayer, 
        input.action === 'increment'
      );

      if (!updated) {
        return res.status(404).json({ message: "Progress not found" });
      }

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.message });
      }
      console.error(err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  return httpServer;
}
