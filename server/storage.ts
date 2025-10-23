import {
  type Session,
  type InsertSession,
  type Transaction,
  type InsertTransaction,
  type Product,
  type InsertProduct,
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private sessions: Map<string, Session>;
  private transactions: Map<string, Transaction>;
  private products: Map<string, Product>;

  constructor() {
    this.sessions = new Map();
    this.transactions = new Map();
    this.products = new Map();

    // Initialize default products
    this.initializeProducts();
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
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
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
    return product;
  }
}

export const storage = new MemStorage();
