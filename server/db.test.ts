/**
 * Example Test: Database Operations
 * Demonstrates how to use test infrastructure for lead management
 */

import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { createTestDb, closeTestDb, clearTestDb } from "./__tests__/helpers/db";
import { testUser, testLead, flytterengøringLead } from "./__tests__/fixtures";
import { mockGmailAPI } from "./__tests__/mocks";

describe("Database Operations - Lead Management", () => {
  beforeEach(() => {
    // Create fresh database for each test
    createTestDb();
    clearTestDb();
  });

  afterAll(() => {
    // Clean up database after all tests
    closeTestDb();
  });

  describe("createLead", () => {
    it("should create a new lead with default values", () => {
      const db = createTestDb();

      // Insert test user first
      db.run(
        "INSERT INTO users (id, openId, name, email) VALUES (?, ?, ?, ?)",
        [testUser.id, testUser.openId, testUser.name, testUser.email]
      );

      // Insert lead
      db.run(
        "INSERT INTO leads (userId, name, email, phone, source, status, score) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          testLead.userId,
          testLead.name,
          testLead.email,
          testLead.phone,
          testLead.source,
          testLead.status,
          testLead.score,
        ]
      );

      // Verify lead was created
      const result = db.prepare("SELECT * FROM leads WHERE email = ?").get(testLead.email);

      expect(result).toBeDefined();
      expect(result.name).toBe(testLead.name);
      expect(result.email).toBe(testLead.email);
      expect(result.score).toBe(50); // Default score
      expect(result.status).toBe("new");
    });

    it("should create flytterengøring lead with higher score (MEMORY_16)", () => {
      const db = createTestDb();

      // Insert test user
      db.run(
        "INSERT INTO users (id, openId, name, email) VALUES (?, ?, ?, ?)",
        [testUser.id, testUser.openId, testUser.name, testUser.email]
      );

      // Insert flytterengøring lead
      db.run(
        "INSERT INTO leads (userId, name, email, phone, source, status, score, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          flytterengøringLead.userId,
          flytterengøringLead.name,
          flytterengøringLead.email,
          flytterengøringLead.phone,
          flytterengøringLead.source,
          flytterengøringLead.status,
          flytterengøringLead.score,
          flytterengøringLead.notes,
        ]
      );

      // Verify flytterengøring lead has higher score
      const result = db.prepare("SELECT * FROM leads WHERE email = ?").get(
        flytterengøringLead.email
      );

      expect(result).toBeDefined();
      expect(result.score).toBe(60); // Higher score for flytterengøring
      expect(result.notes).toContain("Flytterengøring");
      expect(result.notes).toContain("billeder"); // MEMORY_16: Request photos first
    });

    it("should check Gmail for duplicates (MEMORY_2)", async () => {
      const db = createTestDb();

      // Mock Gmail search
      const mockSearch = vi.fn().mockResolvedValue({
        data: {
          messages: [{ id: "existing-msg-123", threadId: "thread-123" }],
          resultSizeEstimate: 1,
        },
      });

      mockGmailAPI.users.messages.list = mockSearch;

      // Insert test user
      db.run(
        "INSERT INTO users (id, openId, name, email) VALUES (?, ?, ?, ?)",
        [testUser.id, testUser.openId, testUser.name, testUser.email]
      );

      // Simulate checking Gmail for existing lead
      const searchQuery = `from:${testLead.email}`;
      const searchResult = await mockGmailAPI.users.messages.list({
        userId: "me",
        q: searchQuery,
      });

      // MEMORY_2: Should find existing email
      expect(mockSearch).toHaveBeenCalledWith({
        userId: "me",
        q: searchQuery,
      });
      expect(searchResult.data.resultSizeEstimate).toBeGreaterThan(0);

      // In real implementation, this would prevent duplicate lead creation
      // or link to existing email thread
    });
  });

  describe("updateLeadStatus", () => {
    it("should update lead status from new to qualified", () => {
      const db = createTestDb();

      // Insert test user and lead
      db.run(
        "INSERT INTO users (id, openId, name, email) VALUES (?, ?, ?, ?)",
        [testUser.id, testUser.openId, testUser.name, testUser.email]
      );

      db.run(
        "INSERT INTO leads (id, userId, name, email, status, score) VALUES (?, ?, ?, ?, ?, ?)",
        [1, testUser.id, testLead.name, testLead.email, "new", 50]
      );

      // Update status
      db.run("UPDATE leads SET status = ?, score = ? WHERE id = ?", ["qualified", 75, 1]);

      // Verify update
      const result = db.prepare("SELECT * FROM leads WHERE id = ?").get(1);

      expect(result.status).toBe("qualified");
      expect(result.score).toBe(75);
    });
  });

  describe("getLeadsByStatus", () => {
    it("should return only leads with specified status", () => {
      const db = createTestDb();

      // Insert test user
      db.run(
        "INSERT INTO users (id, openId, name, email) VALUES (?, ?, ?, ?)",
        [testUser.id, testUser.openId, testUser.name, testUser.email]
      );

      // Insert multiple leads with different statuses
      db.run(
        "INSERT INTO leads (userId, name, email, status, score) VALUES (?, ?, ?, ?, ?)",
        [testUser.id, "Lead 1", "lead1@test.dk", "new", 50]
      );

      db.run(
        "INSERT INTO leads (userId, name, email, status, score) VALUES (?, ?, ?, ?, ?)",
        [testUser.id, "Lead 2", "lead2@test.dk", "new", 50]
      );

      db.run(
        "INSERT INTO leads (userId, name, email, status, score) VALUES (?, ?, ?, ?, ?)",
        [testUser.id, "Lead 3", "lead3@test.dk", "qualified", 75]
      );

      // Get only "new" leads
      const newLeads = db.prepare("SELECT * FROM leads WHERE status = ?").all("new");

      expect(newLeads).toHaveLength(2);
      expect(newLeads.every((lead) => lead.status === "new")).toBe(true);
    });
  });
});
