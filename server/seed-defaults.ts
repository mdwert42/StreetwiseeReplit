/**
 * Seed Default Data
 *
 * Utility functions to seed default work types for new users/orgs.
 * Can be called programmatically or via API endpoint.
 */

import { storage } from "./storage";
import type { InsertWorkType } from "@shared/schema";

/**
 * Default work type templates that can be seeded for new users
 */
const DEFAULT_WORK_TYPES: Omit<InsertWorkType, "userId" | "orgId">[] = [
  {
    name: "Panhandling",
    icon: "💰",
    color: "#10b981", // green
    sortOrder: 0,
    isDefault: true,
  },
  {
    name: "Street Performance",
    icon: "🎵",
    color: "#8b5cf6", // purple
    sortOrder: 1,
    isDefault: false,
  },
  {
    name: "Food Delivery",
    icon: "🚚",
    color: "#3b82f6", // blue
    sortOrder: 2,
    isDefault: false,
  },
  {
    name: "Odd Jobs",
    icon: "🔧",
    color: "#f59e0b", // amber
    sortOrder: 3,
    isDefault: false,
  },
  {
    name: "Other",
    icon: "✨",
    color: "#6b7280", // gray
    sortOrder: 4,
    isDefault: false,
  },
];

/**
 * Seed default work types for a user
 */
export async function seedDefaultWorkTypesForUser(userId: string): Promise<void> {
  console.log(`Seeding default work types for user: ${userId}`);

  for (const template of DEFAULT_WORK_TYPES) {
    await storage.createWorkType({
      ...template,
      userId,
      orgId: null,
    });
  }

  console.log(`✓ Created ${DEFAULT_WORK_TYPES.length} default work types`);
}

/**
 * Seed default work types for an organization
 */
export async function seedDefaultWorkTypesForOrg(orgId: string): Promise<void> {
  console.log(`Seeding default work types for org: ${orgId}`);

  for (const template of DEFAULT_WORK_TYPES) {
    await storage.createWorkType({
      ...template,
      userId: null,
      orgId,
    });
  }

  console.log(`✓ Created ${DEFAULT_WORK_TYPES.length} default work types`);
}

/**
 * Check if user/org already has work types
 */
export async function hasWorkTypes(userId?: string, orgId?: string): Promise<boolean> {
  if (userId) {
    const workTypes = await storage.getWorkTypesByUser(userId);
    return workTypes.length > 0;
  }

  if (orgId) {
    const workTypes = await storage.getWorkTypesByOrg(orgId);
    return workTypes.length > 0;
  }

  return false;
}

/**
 * Automatically seed defaults for new users if they have no work types
 */
export async function autoSeedIfNeeded(userId?: string, orgId?: string): Promise<boolean> {
  const alreadyHasWorkTypes = await hasWorkTypes(userId, orgId);

  if (alreadyHasWorkTypes) {
    return false; // No seeding needed
  }

  if (userId) {
    await seedDefaultWorkTypesForUser(userId);
    return true;
  }

  if (orgId) {
    await seedDefaultWorkTypesForOrg(orgId);
    return true;
  }

  return false;
}
