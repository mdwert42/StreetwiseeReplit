import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSessionSchema, insertTransactionSchema, insertWorkTypeSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get active session
  app.get("/api/session/active", async (req, res) => {
    try {
      const activeSession = await storage.getActiveSession();
      res.json(activeSession || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to get active session" });
    }
  });

  // Start a new session
  app.post("/api/session/start", async (req, res) => {
    try {
      // Check if there's already an active session
      const existingActive = await storage.getActiveSession();
      if (existingActive) {
        return res.status(400).json({ error: "A session is already active" });
      }

      // Validate request body
      const validatedData = insertSessionSchema.parse(req.body);

      const session = await storage.createSession(validatedData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ error: "Failed to start session" });
    }
  });

  // Stop the active session
  app.post("/api/session/stop", async (req, res) => {
    try {
      const activeSession = await storage.getActiveSession();
      if (!activeSession) {
        return res.status(404).json({ error: "No active session found" });
      }

      const updatedSession = await storage.updateSession(activeSession.id, {
        isActive: false,
        endTime: new Date(),
      });

      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop session" });
    }
  });

  // Get total collected (excluding test sessions)
  app.get("/api/total", async (req, res) => {
    try {
      const timeframe = req.query.timeframe as string | undefined;
      const sessions = await storage.getAllSessions();
      const transactions = await storage.getAllTransactions();

      // Filter out test sessions
      const testSessionIds = new Set(
        sessions.filter((s) => s.isTest).map((s) => s.id)
      );

      // Filter transactions: include quick donations (no sessionId) and non-test session donations
      let filteredTransactions = transactions.filter((t) =>
        !t.sessionId || !testSessionIds.has(t.sessionId)
      );

      if (timeframe && timeframe !== "all-time") {
        const now = new Date();
        let cutoffDate: Date;

        switch (timeframe) {
          case "today":
            cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "week":
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            cutoffDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            cutoffDate = new Date(0); // Beginning of time
        }

        filteredTransactions = filteredTransactions.filter((t) => 
          new Date(t.timestamp) >= cutoffDate
        );
      }

      // Calculate total from filtered transactions
      const total = filteredTransactions.reduce(
        (sum, t) => sum + parseFloat(t.amount), 
        0
      );

      res.json({ total });
    } catch (error) {
      res.status(500).json({ error: "Failed to calculate total" });
    }
  });

  // Record a donation
  app.post("/api/transaction/donation", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse({
        ...req.body,
        type: "donation",
      });

      // Validate session exists if sessionId is provided
      if (validatedData.sessionId) {
        const session = await storage.getSession(validatedData.sessionId);
        if (!session) {
          return res.status(404).json({ error: "Session not found" });
        }
      }

      const transaction = await storage.createTransaction(validatedData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Failed to record donation" });
    }
  });


  // Get all sessions (for future analytics)
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  // Get transactions for a session (for future analytics)
  app.get("/api/session/:id/transactions", async (req, res) => {
    try {
      const { id } = req.params;
      const transactions = await storage.getTransactionsBySession(id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get transactions" });
    }
  });

  // Work Type endpoints
  // Get all work types for current user
  app.get("/api/work-types", async (req, res) => {
    try {
      const { userId, orgId } = req.query;

      let workTypes;
      if (orgId) {
        workTypes = await storage.getWorkTypesByOrg(orgId as string);
      } else if (userId) {
        workTypes = await storage.getWorkTypesByUser(userId as string);
      } else {
        return res.status(400).json({ error: "userId or orgId required" });
      }

      res.json(workTypes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get work types" });
    }
  });

  // Create a new work type
  app.post("/api/work-types", async (req, res) => {
    try {
      const validatedData = insertWorkTypeSchema.parse(req.body);
      const workType = await storage.createWorkType(validatedData);
      res.json(workType);
    } catch (error) {
      res.status(400).json({ error: "Failed to create work type" });
    }
  });

  // Update a work type
  app.put("/api/work-types/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const workType = await storage.getWorkType(id);

      if (!workType) {
        return res.status(404).json({ error: "Work type not found" });
      }

      const updated = await storage.updateWorkType(id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Failed to update work type" });
    }
  });

  // Delete a work type (soft delete)
  app.delete("/api/work-types/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const workType = await storage.getWorkType(id);

      if (!workType) {
        return res.status(404).json({ error: "Work type not found" });
      }

      await storage.deleteWorkType(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete work type" });
    }
  });

  // Quick donation (without session)
  app.post("/api/transaction/quick-donation", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse({
        ...req.body,
        type: "donation",
        sessionId: null, // Quick donations have no session
      });

      const transaction = await storage.createTransaction(validatedData);
      res.json(transaction);
    } catch (error) {
      res.status(400).json({ error: "Failed to record quick donation" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
