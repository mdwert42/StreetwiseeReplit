import {
  type Session,
  type InsertSession,
  type Transaction,
  type InsertTransaction,
  type Organization,
  type InsertOrganization,
  type Caseworker,
  type InsertCaseworker,
  type User,
  type InsertUser,
} from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export interface IStorage {
  // Organization methods
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;
  getAllOrganizations(): Promise<Organization[]>;
  updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined>;

  // Caseworker methods
  createCaseworker(caseworker: InsertCaseworker): Promise<Caseworker>;
  getCaseworker(id: string): Promise<Caseworker | undefined>;
  getCaseworkerByEmail(email: string): Promise<Caseworker | undefined>;
  getCaseworkersByOrg(orgId: string): Promise<Caseworker[]>;

  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  getUsersByOrg(orgId: string | null): Promise<User[]>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Session methods (updated for multi-tenancy)
  getActiveSession(userId?: string, orgId?: string | null): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(orgId?: string | null): Promise<Session[]>;

  // Transaction methods (updated for multi-tenancy)
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsBySession(sessionId: string): Promise<Transaction[]>;
  getAllTransactions(orgId?: string | null): Promise<Transaction[]>;
}

interface StorageData {
  organizations: Record<string, Organization>;
  caseworkers: Record<string, Caseworker>;
  users: Record<string, User>;
  sessions: Record<string, Session>;
  transactions: Record<string, Transaction>;
}

export class MemStorage implements IStorage {
  private organizations: Map<string, Organization>;
  private caseworkers: Map<string, Caseworker>;
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private transactions: Map<string, Transaction>;
  private dataFile: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.organizations = new Map();
    this.caseworkers = new Map();
    this.users = new Map();
    this.sessions = new Map();
    this.transactions = new Map();

    // Store data in the server directory
    this.dataFile = path.join(process.cwd(), "streetwise-data.json");

    // Load existing data
    this.loadData();
  }

  private async loadData(): Promise<void> {
    try {
      const data = await fs.readFile(this.dataFile, "utf-8");
      const parsed: StorageData = JSON.parse(data);

      // Restore organizations
      Object.entries(parsed.organizations || {}).forEach(([id, org]) => {
        this.organizations.set(id, {
          ...org,
          createdAt: new Date(org.createdAt),
        });
      });

      // Restore caseworkers
      Object.entries(parsed.caseworkers || {}).forEach(([id, caseworker]) => {
        this.caseworkers.set(id, {
          ...caseworker,
          createdAt: new Date(caseworker.createdAt),
        });
      });

      // Restore users
      Object.entries(parsed.users || {}).forEach(([id, user]) => {
        this.users.set(id, {
          ...user,
          createdAt: new Date(user.createdAt),
        });
      });

      // Restore sessions with Date objects
      Object.entries(parsed.sessions || {}).forEach(([id, session]) => {
        this.sessions.set(id, {
          ...session,
          startTime: new Date(session.startTime),
          endTime: session.endTime ? new Date(session.endTime) : null,
        });
      });

      // Restore transactions with Date objects
      Object.entries(parsed.transactions || {}).forEach(([id, transaction]) => {
        this.transactions.set(id, {
          ...transaction,
          timestamp: new Date(transaction.timestamp),
        });
      });

      console.log(
        `Loaded ${this.organizations.size} orgs, ${this.caseworkers.size} caseworkers, ` +
        `${this.users.size} users, ${this.sessions.size} sessions, ${this.transactions.size} transactions`
      );
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.log("No existing data file, starting fresh");
      } else {
        console.error("Error loading data:", error);
      }
    }
  }

  private async saveData(): Promise<void> {
    // Debounce saves to avoid hammering the disk
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      try {
        const data: StorageData = {
          organizations: Object.fromEntries(this.organizations),
          caseworkers: Object.fromEntries(this.caseworkers),
          users: Object.fromEntries(this.users),
          sessions: Object.fromEntries(this.sessions),
          transactions: Object.fromEntries(this.transactions),
        };

        await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2), "utf-8");
        console.log("Data saved to disk");
      } catch (error) {
        console.error("Error saving data:", error);
      }
    }, 500); // Wait 500ms before actually saving
  }


  // Organization methods
  async createOrganization(insertOrg: InsertOrganization): Promise<Organization> {
    const id = randomUUID();
    const org: Organization = {
      ...insertOrg,
      id,
      createdAt: new Date(),
      isActive: insertOrg.isActive ?? true,
      tier: insertOrg.tier ?? "free",
      features: insertOrg.features ?? {},
      branding: insertOrg.branding ?? {},
    };
    this.organizations.set(id, org);
    await this.saveData();
    return org;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    return this.organizations.get(id);
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return Array.from(this.organizations.values());
  }

  async updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization | undefined> {
    const org = this.organizations.get(id);
    if (!org) return undefined;

    const updatedOrg = { ...org, ...updates };
    this.organizations.set(id, updatedOrg);
    await this.saveData();
    return updatedOrg;
  }

  // Caseworker methods
  async createCaseworker(insertCaseworker: InsertCaseworker): Promise<Caseworker> {
    const id = randomUUID();
    const caseworker: Caseworker = {
      ...insertCaseworker,
      id,
      createdAt: new Date(),
      isActive: insertCaseworker.isActive ?? true,
      role: insertCaseworker.role ?? "caseworker",
    };
    this.caseworkers.set(id, caseworker);
    await this.saveData();
    return caseworker;
  }

  async getCaseworker(id: string): Promise<Caseworker | undefined> {
    return this.caseworkers.get(id);
  }

  async getCaseworkerByEmail(email: string): Promise<Caseworker | undefined> {
    return Array.from(this.caseworkers.values()).find((cw) => cw.email === email);
  }

  async getCaseworkersByOrg(orgId: string): Promise<Caseworker[]> {
    return Array.from(this.caseworkers.values()).filter((cw) => cw.orgId === orgId);
  }

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
      isActive: insertUser.isActive ?? true,
    };
    this.users.set(id, user);
    await this.saveData();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsersByOrg(orgId: string | null): Promise<User[]> {
    return Array.from(this.users.values()).filter((user) => user.orgId === orgId);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    await this.saveData();
    return updatedUser;
  }

  // Session methods
  async getActiveSession(userId?: string, orgId?: string | null): Promise<Session | undefined> {
    let sessions = Array.from(this.sessions.values()).filter((session) => session.isActive);

    // Filter by userId if provided
    if (userId !== undefined) {
      sessions = sessions.filter((s) => s.userId === userId);
    }

    // Filter by orgId if provided (null means free tier)
    if (orgId !== undefined) {
      sessions = sessions.filter((s) => s.orgId === orgId);
    }

    return sessions[0];
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      ...insertSession,
      id,
      startTime: new Date(),
      endTime: null,
      isActive: true,
      isTest: insertSession.isTest ?? false,
    };
    this.sessions.set(id, session);
    await this.saveData();
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    await this.saveData();
    return updatedSession;
  }

  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async getAllSessions(orgId?: string | null): Promise<Session[]> {
    let sessions = Array.from(this.sessions.values());

    // Filter by orgId if provided (null means free tier, undefined means all)
    if (orgId !== undefined) {
      sessions = sessions.filter((s) => s.orgId === orgId);
    }

    return sessions;
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      timestamp: new Date(),
      pennies: insertTransaction.pennies ?? 0,
      productId: insertTransaction.productId ?? null,
      userId: insertTransaction.userId ?? null,
      orgId: insertTransaction.orgId ?? null,
    };
    this.transactions.set(id, transaction);
    await this.saveData();
    return transaction;
  }

  async getTransactionsBySession(sessionId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.sessionId === sessionId
    );
  }

  async getAllTransactions(orgId?: string | null): Promise<Transaction[]> {
    let transactions = Array.from(this.transactions.values());

    // Filter by orgId if provided (null means free tier, undefined means all)
    if (orgId !== undefined) {
      transactions = transactions.filter((t) => t.orgId === orgId);
    }

    return transactions;
  }

}

export const storage = new MemStorage();