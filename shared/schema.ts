import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Organizations table - for white-label deployments
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tier: text("tier").notNull().default("free"), // 'free' | 'basic' | 'professional' | 'enterprise'
  features: jsonb("features").default(sql`'{}'::jsonb`), // Feature flags
  subdomain: text("subdomain"), // Optional subdomain for white-label
  branding: jsonb("branding").default(sql`'{}'::jsonb`), // Logo, colors, custom name
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  isActive: boolean("is_active").notNull().default(true),
});

// Caseworkers table - staff who manage clients in organizations
export const caseworkers = pgTable("caseworkers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("caseworker"), // 'admin' | 'caseworker' | 'readonly'
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  isActive: boolean("is_active").notNull().default(true),
});

// Users table - individuals using the app (clients)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orgId: varchar("org_id").references(() => organizations.id, { onDelete: "set null" }), // Nullable - free tier users have no org
  caseworkerId: varchar("caseworker_id").references(() => caseworkers.id, { onDelete: "set null" }), // Assigned caseworker
  pin: text("pin"), // Hashed PIN for simple auth (free tier)
  deviceId: text("device_id"), // For PIN collision prevention
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  isActive: boolean("is_active").notNull().default(true),
});

// Sessions table - tracks collection periods with location and test flag
export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Nullable for backward compatibility
  orgId: varchar("org_id").references(() => organizations.id, { onDelete: "cascade" }), // Nullable - free tier sessions have no org
  location: text("location").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  isTest: boolean("is_test").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
});

// Transactions table - records all donations and product sales with timestamps
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Nullable for backward compatibility
  orgId: varchar("org_id").references(() => organizations.id, { onDelete: "cascade" }), // Nullable - free tier has no org
  timestamp: timestamp("timestamp").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'donation' or 'product'
  productId: varchar("product_id"), // nullable, only for product sales
  pennies: integer("pennies").default(0), // count of pennies, optional
});


// Insert schemas - omit all server-managed fields
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertCaseworkerSchema = createInsertSchema(caseworkers).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  startTime: true,
  endTime: true,
  isActive: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
});

// Types
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;

export type InsertCaseworker = z.infer<typeof insertCaseworkerSchema>;
export type Caseworker = typeof caseworkers.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;
