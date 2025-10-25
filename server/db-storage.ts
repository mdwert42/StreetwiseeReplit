import { db } from "./db";
import { eq, and, isNull, desc } from "drizzle-orm";
import {
  organizations,
  caseworkers,
  users,
  sessions,
  transactions,
  type Organization,
  type InsertOrganization,
  type Caseworker,
  type InsertCaseworker,
  type User,
  type InsertUser,
  type Session,
  type InsertSession,
  type Transaction,
  type InsertTransaction,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  // Organization methods
  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const [org] = await db.insert(organizations).values(insertOrg).returning();
    return org;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).orderBy(desc(organizations.createdAt));
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const [org] = await db
      .update(organizations)
      .set(updates)
      .where(eq(organizations.id, id))
      .returning();
    return org;
  }

  // Caseworker methods
  async createCaseworker(insertCaseworker: InsertCaseworker): Promise<Caseworker> {
    const [caseworker] = await db.insert(caseworkers).values(insertCaseworker).returning();
    return caseworker;
  }

  async getCaseworker(id: string): Promise<Caseworker | undefined> {
    const [caseworker] = await db.select().from(caseworkers).where(eq(caseworkers.id, id));
    return caseworker;
  }

  async getCaseworkerByEmail(email: string): Promise<Caseworker | undefined> {
    const [caseworker] = await db.select().from(caseworkers).where(eq(caseworkers.email, email));
    return caseworker;
  }

  async getCaseworkersByOrg(orgId: string): Promise<Caseworker[]> {
    return await db
      .select()
      .from(caseworkers)
      .where(eq(caseworkers.orgId, orgId))
      .orderBy(desc(caseworkers.createdAt));
  }

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUsersByOrg(orgId: string | null): Promise<User[]> {
    if (orgId === null) {
      return await db
        .select()
        .from(users)
        .where(isNull(users.orgId))
        .orderBy(desc(users.createdAt));
    }
    return await db
      .select()
      .from(users)
      .where(eq(users.orgId, orgId))
      .orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Session methods
  async getActiveSession(userId?: string, orgId?: string | null): Promise<Session | undefined> {
    let conditions = [eq(sessions.isActive, true)];

    if (userId !== undefined) {
      conditions.push(eq(sessions.userId, userId));
    }

    if (orgId !== undefined) {
      if (orgId === null) {
        conditions.push(isNull(sessions.orgId));
      } else {
        conditions.push(eq(sessions.orgId, orgId));
      }
    }

    const [session] = await db
      .select()
      .from(sessions)
      .where(and(...conditions))
      .orderBy(desc(sessions.startTime))
      .limit(1);

    return session;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(insertSession).returning();
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const [session] = await db
      .update(sessions)
      .set(updates)
      .where(eq(sessions.id, id))
      .returning();
    return session;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session;
  }

  async getAllSessions(orgId?: string | null): Promise<Session[]> {
    if (orgId === undefined) {
      // Get all sessions
      return await db.select().from(sessions).orderBy(desc(sessions.startTime));
    }

    if (orgId === null) {
      // Get free-tier sessions only
      return await db
        .select()
        .from(sessions)
        .where(isNull(sessions.orgId))
        .orderBy(desc(sessions.startTime));
    }

    // Get org-specific sessions
    return await db
      .select()
      .from(sessions)
      .where(eq(sessions.orgId, orgId))
      .orderBy(desc(sessions.startTime));
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async getTransactionsBySession(sessionId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.sessionId, sessionId))
      .orderBy(desc(transactions.timestamp));
  }

  async getAllTransactions(orgId?: string | null): Promise<Transaction[]> {
    if (orgId === undefined) {
      // Get all transactions
      return await db.select().from(transactions).orderBy(desc(transactions.timestamp));
    }

    if (orgId === null) {
      // Get free-tier transactions only
      return await db
        .select()
        .from(transactions)
        .where(isNull(transactions.orgId))
        .orderBy(desc(transactions.timestamp));
    }

    // Get org-specific transactions
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.orgId, orgId))
      .orderBy(desc(transactions.timestamp));
  }
}

export const dbStorage = new DbStorage();
