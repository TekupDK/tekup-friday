/**
 * Test Database Helper
 * Provides in-memory SQLite database for testing (faster than MySQL)
 */

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "../../../drizzle/schema";

let testDb: ReturnType<typeof drizzle> | null = null;
let sqlite: Database.Database | null = null;

/**
 * Create a fresh in-memory database for each test
 */
export function createTestDb() {
  // Create in-memory SQLite database
  sqlite = new Database(":memory:");

  // Create Drizzle instance
  testDb = drizzle(sqlite, { schema });

  // Run migrations to set up schema
  // Note: You may need to adapt MySQL migrations for SQLite
  // For now, we'll create tables manually in setupTestTables()
  setupTestTables();

  return testDb;
}

/**
 * Clean up database after tests
 */
export function closeTestDb() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    testDb = null;
  }
}

/**
 * Clear all tables (useful between tests)
 */
export function clearTestDb() {
  if (!sqlite) return;

  const tables = [
    "users",
    "conversations",
    "messages",
    "leads",
    "tasks",
    "email_threads",
    "email_messages",
    "invoices",
    "calendar_events",
    "customer_profiles",
    "customer_invoices",
    "customer_emails",
    "customer_conversations",
    "analytics_events",
  ];

  for (const table of tables) {
    try {
      sqlite.exec(`DELETE FROM ${table}`);
    } catch (error) {
      // Table might not exist yet, ignore
    }
  }
}

/**
 * Set up test tables (simplified schema for SQLite)
 */
function setupTestTables() {
  if (!sqlite) return;

  // Users table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Conversations table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Messages table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversationId INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversationId) REFERENCES conversations(id)
    )
  `);

  // Leads table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      source TEXT,
      status TEXT DEFAULT 'new',
      score INTEGER DEFAULT 50,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Tasks table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'todo',
      dueDate TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Email threads table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS email_threads (
      id TEXT PRIMARY KEY,
      subject TEXT,
      snippet TEXT,
      fromEmail TEXT,
      fromName TEXT,
      date TEXT,
      labels TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Email messages table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS email_messages (
      id TEXT PRIMARY KEY,
      threadId TEXT NOT NULL,
      fromEmail TEXT,
      fromName TEXT,
      toEmail TEXT,
      subject TEXT,
      body TEXT,
      date TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (threadId) REFERENCES email_threads(id)
    )
  `);

  // Invoices table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      billyId TEXT UNIQUE,
      customerId TEXT,
      customerName TEXT,
      amount REAL,
      status TEXT,
      dueDate TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Calendar events table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      summary TEXT NOT NULL,
      description TEXT,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      location TEXT,
      attendees TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customer profiles table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS customer_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      summary TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Customer invoices junction table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS customer_invoices (
      customerId INTEGER NOT NULL,
      invoiceId TEXT NOT NULL,
      PRIMARY KEY (customerId, invoiceId),
      FOREIGN KEY (customerId) REFERENCES customer_profiles(id),
      FOREIGN KEY (invoiceId) REFERENCES invoices(id)
    )
  `);

  // Customer emails junction table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS customer_emails (
      customerId INTEGER NOT NULL,
      threadId TEXT NOT NULL,
      PRIMARY KEY (customerId, threadId),
      FOREIGN KEY (customerId) REFERENCES customer_profiles(id),
      FOREIGN KEY (threadId) REFERENCES email_threads(id)
    )
  `);

  // Customer conversations table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS customer_conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customerId INTEGER NOT NULL,
      conversationId INTEGER NOT NULL,
      FOREIGN KEY (customerId) REFERENCES customer_profiles(id),
      FOREIGN KEY (conversationId) REFERENCES conversations(id)
    )
  `);

  // Analytics events table
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      eventType TEXT NOT NULL,
      eventData TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
}

/**
 * Get current test database instance
 */
export function getTestDb() {
  if (!testDb) {
    throw new Error("Test database not initialized. Call createTestDb() first.");
  }
  return testDb;
}
