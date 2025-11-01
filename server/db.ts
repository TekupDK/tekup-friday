import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  conversations,
  messages,
  emailThreads,
  invoices,
  calendarEvents,
  leads,
  tasks,
  analyticsEvents,
  type Conversation,
  type Message,
  type EmailThread,
  type Invoice,
  type CalendarEvent,
  type Lead,
  type Task,
  type InsertConversation,
  type InsertMessage,
  type InsertEmailThread,
  type InsertInvoice,
  type InsertCalendarEvent,
  type InsertLead,
  type InsertTask,
  type InsertAnalyticsEvent,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= Conversation Functions =============

export async function createConversation(data: InsertConversation): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(conversations).values(data);
  const id = Number(result[0].insertId);

  const created = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return created[0];
}

export async function getUserConversations(userId: number): Promise<Conversation[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function getConversation(id: number): Promise<Conversation | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
  return result[0];
}

export async function updateConversationTitle(id: number, title: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(conversations).set({ title }).where(eq(conversations.id, id));
}

// ============= Message Functions =============

export async function createMessage(data: InsertMessage): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values(data);
  const id = Number(result[0].insertId);

  const created = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
  return created[0];
}

export async function getConversationMessages(conversationId: number): Promise<Message[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

// ============= Email Thread Functions =============

export async function createEmailThread(data: InsertEmailThread): Promise<EmailThread> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(emailThreads).values(data);
  const id = Number(result[0].insertId);

  const created = await db.select().from(emailThreads).where(eq(emailThreads.id, id)).limit(1);
  return created[0];
}

export async function getUserEmailThreads(userId: number, limit = 50): Promise<EmailThread[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(emailThreads)
    .where(eq(emailThreads.userId, userId))
    .orderBy(desc(emailThreads.lastMessageAt))
    .limit(limit);
}

export async function markEmailThreadRead(id: number, isRead: boolean): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(emailThreads).set({ isRead }).where(eq(emailThreads.id, id));
}

// ============= Invoice Functions =============

export async function createInvoice(data: InsertInvoice): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(invoices).values(data);
  const id = Number(result[0].insertId);

  const created = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  return created[0];
}

export async function getUserInvoices(userId: number): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.createdAt));
}

export async function updateInvoiceStatus(
  id: number,
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(invoices).set({ status }).where(eq(invoices.id, id));
}

// ============= Calendar Event Functions =============

export async function createCalendarEvent(data: InsertCalendarEvent): Promise<CalendarEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(calendarEvents).values(data);
  const id = Number(result[0].insertId);

  const created = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id)).limit(1);
  return created[0];
}

export async function getUserCalendarEvents(
  userId: number,
  startTime?: Date,
  endTime?: Date
): Promise<CalendarEvent[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(calendarEvents.userId, userId)];
  if (startTime && endTime) {
    conditions.push(and(gte(calendarEvents.startTime, startTime), lte(calendarEvents.endTime, endTime))!);
  }

  return db
    .select()
    .from(calendarEvents)
    .where(and(...conditions))
    .orderBy(calendarEvents.startTime);
}

// ============= Lead Functions =============

export async function createLead(data: InsertLead): Promise<Lead> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leads).values(data);
  const id = Number(result[0].insertId);

  const created = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return created[0];
}

export async function getUserLeads(userId: number): Promise<Lead[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt));
}

export async function updateLeadStatus(
  id: number,
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ status }).where(eq(leads.id, id));
}

export async function updateLeadScore(id: number, score: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(leads).set({ score }).where(eq(leads.id, id));
}

// ============= Task Functions =============

export async function createTask(data: InsertTask): Promise<Task> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(tasks).values(data);
  const id = Number(result[0].insertId);

  const created = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return created[0];
}

export async function getUserTasks(userId: number): Promise<Task[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
}

export async function updateTaskStatus(
  id: number,
  status: "todo" | "in_progress" | "done" | "cancelled"
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(tasks).set({ status }).where(eq(tasks.id, id));
}

// ============= Analytics Functions =============

export async function trackEvent(data: InsertAnalyticsEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.insert(analyticsEvents).values(data);
}

export async function getAnalyticsEvents(
  userId: number,
  eventType?: string,
  startDate?: Date,
  endDate?: Date
): Promise<typeof analyticsEvents.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions = [eq(analyticsEvents.userId, userId)];
  if (eventType) {
    conditions.push(eq(analyticsEvents.eventType, eventType));
  }
  if (startDate && endDate) {
    conditions.push(and(gte(analyticsEvents.createdAt, startDate), lte(analyticsEvents.createdAt, endDate))!);
  }

  return db
    .select()
    .from(analyticsEvents)
    .where(and(...conditions))
    .orderBy(desc(analyticsEvents.createdAt));
}
