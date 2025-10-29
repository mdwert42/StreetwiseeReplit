import { defineConfig } from "drizzle-kit";

// Only require DATABASE_URL if running drizzle-kit commands
// This allows the app to run with in-memory storage without DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set - drizzle-kit commands will not work");
  console.warn("   The app will use in-memory JSON storage instead.");
  console.warn("   To use PostgreSQL, set DATABASE_URL in your .env file");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://placeholder",
  },
});
