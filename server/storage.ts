import {
  type Session,
  type InsertSession,
  type Transaction,
  type InsertTransaction,
  type Product,
  type InsertProduct,
} from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

export interface IStorage {
  // Session methods
  getActiveSession(): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  getSession(id: string): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;

  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsBySession(sessionId: string): Promise<Transaction[]>;
  getAllTransactions(): Promise<Transaction[]>;

  // Product methods
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
}

interface StorageData {
  sessions: Record<string, Session>;
  transactions: Record<string, Transaction>;
  products: Record<string, Product>;
}

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private transactions: Map<string, Transaction>;
  private products: Map<string, Product>;
  private dataFile: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.sessions = new Map();
    this.transactions = new Map();
    this.products = new Map();
    
    // Store data in the server directory
    this.dataFile = path.join(process.cwd(), "streetwise-data.json");
    
    // Load existing data, then initialize products
    this.loadData().then(() => {
      // Only initialize products if none exist
      if (this.products.size === 0) {
        this.initializeProducts();
        this.saveData(); // Save the initial products
      }
    });
  }

  private async loadData(): Promise<void> {
    try {
      const data = await fs.readFile(this.dataFile, "utf-8");
      const parsed: StorageData = JSON.parse(data);
      
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
      
      // Restore products
      Object.entries(parsed.products || {}).forEach(([id, product]) => {
        this.products.set(id, product);
      });
      
      console.log(`Loaded ${this.sessions.size} sessions, ${this.transactions.size} transactions, ${this.products.size} products`);
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
          sessions: Object.fromEntries(this.sessions),
          transactions: Object.fromEntries(this.transactions),
          products: Object.fromEntries(this.products),
        };
        
        await fs.writeFile(this.dataFile, JSON.stringify(data, null, 2), "utf-8");
        console.log("Data saved to disk");
      } catch (error) {
        console.error("Error saving data:", error);
      }
    }, 500); // Wait 500ms before actually saving
  }

  private initializeProducts() {
    const defaultProducts: InsertProduct[] = [
      { name: "Product $1", price: "1.00", isActive: true },
      { name: "Product $5", price: "5.00", isActive: true },
      { name: "Product $10", price: "10.00", isActive: true },
    ];

    defaultProducts.forEach((product) => {
      const id = `product-${product.price.replace(".", "")}`;
      const newProduct: Product = { 
        ...product, 
        id,
        isActive: product.isActive ?? true,
      };
      this.products.set(id, newProduct);
    });
  }

  // Session methods
  async getActiveSession(): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find((session) => session.isActive);
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

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
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

  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter((product) => product.isActive);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { 
      ...insertProduct, 
      id,
      isActive: insertProduct.isActive ?? true,
    };
    this.products.set(id, product);
    await this.saveData();
    return product;
  }
}

export const storage = new MemStorage();