/**
 * Multi-Tenancy Storage Tests
 *
 * Run with: tsx server/storage.test.ts
 */

import { MemStorage } from "./storage";
import type { InsertOrganization, InsertCaseworker, InsertUser, InsertSession, InsertTransaction } from "@shared/schema";

// Simple test framework
let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    testsPassed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    testsFailed++;
    console.error(`✗ ${name}`);
    console.error(`  ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Run all tests
async function runTests() {
  console.log("\n=== Multi-Tenancy Storage Tests ===\n");

  // Organizations
  await test("should create an organization", async () => {
    const storage = new MemStorage();
    const org = await storage.createOrganization({
      name: "Test Shelter",
      tier: "basic",
    });

    assert(!!org.id, "Organization should have an ID");
    assertEqual(org.name, "Test Shelter", "Organization name should match");
    assertEqual(org.tier, "basic", "Organization tier should match");
    assert(org.isActive === true, "Organization should be active");
  });

  await test("should get organization by id", async () => {
    const storage = new MemStorage();
    const created = await storage.createOrganization({
      name: "Test Shelter",
      tier: "basic",
    });
    const retrieved = await storage.getOrganization(created.id);

    assert(retrieved !== undefined, "Organization should be retrieved");
    assertEqual(retrieved?.id, created.id, "IDs should match");
  });

  await test("should update organization", async () => {
    const storage = new MemStorage();
    const org = await storage.createOrganization({
      name: "Test Shelter",
      tier: "basic",
    });
    const updated = await storage.updateOrganization(org.id, {
      tier: "professional",
      subdomain: "test-shelter",
    });

    assertEqual(updated?.tier, "professional", "Tier should be updated");
    assertEqual(updated?.subdomain, "test-shelter", "Subdomain should be updated");
  });

  // Caseworkers
  await test("should create a caseworker", async () => {
    const storage = new MemStorage();
    const org = await storage.createOrganization({
      name: "Test Org",
      tier: "basic",
    });

    const caseworker = await storage.createCaseworker({
      orgId: org.id,
      email: "caseworker@test.com",
      name: "Jane Doe",
      passwordHash: "hashed_password",
      role: "caseworker",
    });

    assert(!!caseworker.id, "Caseworker should have an ID");
    assertEqual(caseworker.orgId, org.id, "Caseworker org should match");
    assertEqual(caseworker.email, "caseworker@test.com", "Email should match");
  });

  await test("should get caseworker by email", async () => {
    const storage = new MemStorage();
    const org = await storage.createOrganization({
      name: "Test Org",
      tier: "basic",
    });

    await storage.createCaseworker({
      orgId: org.id,
      email: "jane@test.com",
      name: "Jane Doe",
      passwordHash: "hash",
      role: "caseworker",
    });

    const found = await storage.getCaseworkerByEmail("jane@test.com");

    assert(found !== undefined, "Caseworker should be found");
    assertEqual(found?.email, "jane@test.com", "Email should match");
  });

  await test("should get caseworkers by organization", async () => {
    const storage = new MemStorage();
    const org1 = await storage.createOrganization({ name: "Org 1", tier: "basic" });
    const org2 = await storage.createOrganization({ name: "Org 2", tier: "basic" });

    await storage.createCaseworker({
      orgId: org1.id,
      email: "cw1@org1.com",
      name: "CW 1",
      passwordHash: "hash",
      role: "caseworker",
    });

    await storage.createCaseworker({
      orgId: org1.id,
      email: "cw2@org1.com",
      name: "CW 2",
      passwordHash: "hash",
      role: "caseworker",
    });

    await storage.createCaseworker({
      orgId: org2.id,
      email: "cw1@org2.com",
      name: "CW 1",
      passwordHash: "hash",
      role: "caseworker",
    });

    const org1Caseworkers = await storage.getCaseworkersByOrg(org1.id);
    const org2Caseworkers = await storage.getCaseworkersByOrg(org2.id);

    assertEqual(org1Caseworkers.length, 2, "Org 1 should have 2 caseworkers");
    assertEqual(org2Caseworkers.length, 1, "Org 2 should have 1 caseworker");
  });

  // Users
  await test("should create a free-tier user", async () => {
    const storage = new MemStorage();
    const user = await storage.createUser({
      pin: "hashed_1234",
      deviceId: "device123",
    });

    assert(!!user.id, "User should have an ID");
    assertEqual(user.pin, "hashed_1234", "PIN should match");
    assert(user.isActive === true, "User should be active");
  });

  await test("should create an org-affiliated user", async () => {
    const storage = new MemStorage();
    const org = await storage.createOrganization({ name: "Test Org", tier: "basic" });
    const caseworker = await storage.createCaseworker({
      orgId: org.id,
      email: "cw@test.com",
      name: "Caseworker",
      passwordHash: "hash",
      role: "caseworker",
    });

    const user = await storage.createUser({
      orgId: org.id,
      caseworkerId: caseworker.id,
    });

    assertEqual(user.orgId, org.id, "User org should match");
    assertEqual(user.caseworkerId, caseworker.id, "User caseworker should match");
  });

  await test("should get users by organization", async () => {
    const storage = new MemStorage();
    const org = await storage.createOrganization({ name: "Test Org", tier: "basic" });

    await storage.createUser({ pin: "hash1", deviceId: "device1" });
    await storage.createUser({ orgId: org.id });
    await storage.createUser({ orgId: org.id });

    const orgUsers = await storage.getUsersByOrg(org.id);
    const freeUsers = await storage.getUsersByOrg(null);

    assertEqual(orgUsers.length, 2, "Should have 2 org users");
    assertEqual(freeUsers.length, 1, "Should have 1 free user");
  });

  // Sessions - Multi-Tenancy
  await test("should create free-tier session", async () => {
    const storage = new MemStorage();
    const user = await storage.createUser({ pin: "hash", deviceId: "device1" });

    const session = await storage.createSession({
      userId: user.id,
      location: "Street Corner",
      isTest: false,
    });

    assertEqual(session.userId, user.id, "User ID should match");
    assertEqual(session.location, "Street Corner", "Location should match");
  });

  await test("should create org-scoped session", async () => {
    const storage = new MemStorage();
    const org = await storage.createOrganization({ name: "Test Org", tier: "basic" });
    const user = await storage.createUser({ orgId: org.id });

    const session = await storage.createSession({
      userId: user.id,
      orgId: org.id,
      location: "Shelter A",
      isTest: false,
    });

    assertEqual(session.userId, user.id, "User ID should match");
    assertEqual(session.orgId, org.id, "Org ID should match");
  });

  await test("should filter sessions by organization", async () => {
    const storage = new MemStorage();
    const org1 = await storage.createOrganization({ name: "Org 1", tier: "basic" });
    const org2 = await storage.createOrganization({ name: "Org 2", tier: "basic" });

    const user1 = await storage.createUser({ orgId: org1.id });
    const user2 = await storage.createUser({ orgId: org2.id });
    const freeUser = await storage.createUser({ pin: "hash", deviceId: "device" });

    await storage.createSession({ userId: user1.id, orgId: org1.id, location: "Loc 1", isTest: false });
    await storage.createSession({ userId: user1.id, orgId: org1.id, location: "Loc 2", isTest: false });
    await storage.createSession({ userId: user2.id, orgId: org2.id, location: "Loc 3", isTest: false });
    await storage.createSession({ userId: freeUser.id, location: "Street", isTest: false });

    const org1Sessions = await storage.getAllSessions(org1.id);
    const org2Sessions = await storage.getAllSessions(org2.id);
    const freeSessions = await storage.getAllSessions(null);
    const allSessions = await storage.getAllSessions();

    assertEqual(org1Sessions.length, 2, "Org 1 should have 2 sessions");
    assertEqual(org2Sessions.length, 1, "Org 2 should have 1 session");
    assertEqual(freeSessions.length, 1, "Free tier should have 1 session");
    assertEqual(allSessions.length, 4, "Should have 4 total sessions");
  });

  await test("should get active session by user and org", async () => {
    const storage = new MemStorage();
    const org = await storage.createOrganization({ name: "Test Org", tier: "basic" });
    const user1 = await storage.createUser({ orgId: org.id });
    const user2 = await storage.createUser({ orgId: org.id });

    await storage.createSession({
      userId: user1.id,
      orgId: org.id,
      location: "Loc 1",
      isTest: false,
    });

    await storage.createSession({
      userId: user2.id,
      orgId: org.id,
      location: "Loc 2",
      isTest: false,
    });

    const user1Active = await storage.getActiveSession(user1.id, org.id);
    const user2Active = await storage.getActiveSession(user2.id, org.id);

    assertEqual(user1Active?.userId, user1.id, "User 1 active session should match");
    assertEqual(user2Active?.userId, user2.id, "User 2 active session should match");
    assertEqual(user1Active?.location, "Loc 1", "User 1 location should match");
    assertEqual(user2Active?.location, "Loc 2", "User 2 location should match");
  });

  // Transactions - Multi-Tenancy
  await test("should create free-tier transaction", async () => {
    const storage = new MemStorage();
    const user = await storage.createUser({ pin: "hash", deviceId: "device" });
    const session = await storage.createSession({
      userId: user.id,
      location: "Street",
      isTest: false,
    });

    const transaction = await storage.createTransaction({
      sessionId: session.id,
      userId: user.id,
      amount: "5.50",
      type: "donation",
    });

    assertEqual(transaction.userId, user.id, "User ID should match");
    assertEqual(transaction.amount, "5.50", "Amount should match");
  });

  await test("should create org-scoped transaction", async () => {
    const storage = new MemStorage();
    const org = await storage.createOrganization({ name: "Test Org", tier: "basic" });
    const user = await storage.createUser({ orgId: org.id });
    const session = await storage.createSession({
      userId: user.id,
      orgId: org.id,
      location: "Shelter",
      isTest: false,
    });

    const transaction = await storage.createTransaction({
      sessionId: session.id,
      userId: user.id,
      orgId: org.id,
      amount: "10.00",
      type: "donation",
    });

    assertEqual(transaction.orgId, org.id, "Org ID should match");
  });

  await test("should filter transactions by organization", async () => {
    const storage = new MemStorage();
    const org1 = await storage.createOrganization({ name: "Org 1", tier: "basic" });
    const org2 = await storage.createOrganization({ name: "Org 2", tier: "basic" });

    const user1 = await storage.createUser({ orgId: org1.id });
    const user2 = await storage.createUser({ orgId: org2.id });
    const freeUser = await storage.createUser({ pin: "hash", deviceId: "device" });

    const session1 = await storage.createSession({
      userId: user1.id,
      orgId: org1.id,
      location: "Loc 1",
      isTest: false,
    });
    const session2 = await storage.createSession({
      userId: user2.id,
      orgId: org2.id,
      location: "Loc 2",
      isTest: false,
    });
    const freeSession = await storage.createSession({
      userId: freeUser.id,
      location: "Street",
      isTest: false,
    });

    await storage.createTransaction({
      sessionId: session1.id,
      userId: user1.id,
      orgId: org1.id,
      amount: "5.00",
      type: "donation",
    });
    await storage.createTransaction({
      sessionId: session1.id,
      userId: user1.id,
      orgId: org1.id,
      amount: "10.00",
      type: "donation",
    });
    await storage.createTransaction({
      sessionId: session2.id,
      userId: user2.id,
      orgId: org2.id,
      amount: "7.50",
      type: "donation",
    });
    await storage.createTransaction({
      sessionId: freeSession.id,
      userId: freeUser.id,
      amount: "3.25",
      type: "donation",
    });

    const org1Txns = await storage.getAllTransactions(org1.id);
    const org2Txns = await storage.getAllTransactions(org2.id);
    const freeTxns = await storage.getAllTransactions(null);
    const allTxns = await storage.getAllTransactions();

    assertEqual(org1Txns.length, 2, "Org 1 should have 2 transactions");
    assertEqual(org2Txns.length, 1, "Org 2 should have 1 transaction");
    assertEqual(freeTxns.length, 1, "Free tier should have 1 transaction");
    assertEqual(allTxns.length, 4, "Should have 4 total transactions");
  });

  // Data Isolation
  await test("should prevent org1 from accessing org2 data", async () => {
    const storage = new MemStorage();
    const org1 = await storage.createOrganization({ name: "Org 1", tier: "basic" });
    const org2 = await storage.createOrganization({ name: "Org 2", tier: "basic" });

    const user1 = await storage.createUser({ orgId: org1.id });
    const user2 = await storage.createUser({ orgId: org2.id });

    await storage.createSession({
      userId: user1.id,
      orgId: org1.id,
      location: "Private Location Org1",
      isTest: false,
    });

    await storage.createSession({
      userId: user2.id,
      orgId: org2.id,
      location: "Private Location Org2",
      isTest: false,
    });

    const org1Sessions = await storage.getAllSessions(org1.id);
    const org2Sessions = await storage.getAllSessions(org2.id);

    assertEqual(org1Sessions.length, 1, "Org 1 should have 1 session");
    assertEqual(org2Sessions.length, 1, "Org 2 should have 1 session");
    assertEqual(org1Sessions[0].location, "Private Location Org1", "Org 1 location should match");
    assertEqual(org2Sessions[0].location, "Private Location Org2", "Org 2 location should match");

    // Ensure no cross-contamination
    const org1HasOrg2Data = org1Sessions.some(s => s.location === "Private Location Org2");
    const org2HasOrg1Data = org2Sessions.some(s => s.location === "Private Location Org1");

    assert(!org1HasOrg2Data, "Org 1 should not see Org 2 data");
    assert(!org2HasOrg1Data, "Org 2 should not see Org 1 data");
  });

  // Summary
  console.log(`\n=== Test Results ===`);
  console.log(`✓ Passed: ${testsPassed}`);
  console.log(`✗ Failed: ${testsFailed}`);
  console.log(`Total: ${testsPassed + testsFailed}\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Test runner error:", error);
  process.exit(1);
});
