import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import {
  customerProfiles,
  customerInvoices,
  customerEmails,
  customerConversations,
  leads,
  InsertCustomerProfile,
  InsertCustomerInvoice,
  InsertCustomerEmail,
  InsertCustomerConversation,
} from "../drizzle/schema";

/**
 * Customer Profile Database Helpers
 * Handles customer data aggregation from leads, invoices, and emails
 */

export async function getCustomerProfileByEmail(email: string, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customerProfiles)
    .where(
      and(
        eq(customerProfiles.email, email),
        eq(customerProfiles.userId, userId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getCustomerProfileByLeadId(
  leadId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customerProfiles)
    .where(
      and(
        eq(customerProfiles.leadId, leadId),
        eq(customerProfiles.userId, userId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getCustomerProfileById(
  customerId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(customerProfiles)
    .where(
      and(
        eq(customerProfiles.id, customerId),
        eq(customerProfiles.userId, userId)
      )
    )
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateCustomerProfile(
  data: InsertCustomerProfile
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if profile exists
  const existing = await getCustomerProfileByEmail(data.email, data.userId);

  if (existing) {
    // Update existing profile
    await db
      .update(customerProfiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customerProfiles.id, existing.id));
    return existing.id;
  } else {
    // Create new profile
    const result = await db.insert(customerProfiles).values(data);
    return Number((result as any).insertId);
  }
}

export async function getCustomerInvoices(customerId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Verify customer belongs to user
  const customer = await getCustomerProfileById(customerId, userId);
  if (!customer) return [];

  const result = await db
    .select()
    .from(customerInvoices)
    .where(eq(customerInvoices.customerId, customerId))
    .orderBy(desc(customerInvoices.entryDate));

  return result;
}

export async function addCustomerInvoice(data: InsertCustomerInvoice) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if invoice already exists
  const existing = await db
    .select()
    .from(customerInvoices)
    .where(
      and(
        eq(customerInvoices.customerId, data.customerId),
        eq(customerInvoices.billyInvoiceId, data.billyInvoiceId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing invoice
    await db
      .update(customerInvoices)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(customerInvoices.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new invoice
    const result = await db.insert(customerInvoices).values(data);
    return Number((result as any).insertId);
  }
}

export async function getCustomerEmails(customerId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Verify customer belongs to user
  const customer = await getCustomerProfileById(customerId, userId);
  if (!customer) return [];

  const result = await db
    .select()
    .from(customerEmails)
    .where(eq(customerEmails.customerId, customerId))
    .orderBy(desc(customerEmails.lastMessageDate));

  return result;
}

export async function addCustomerEmail(data: InsertCustomerEmail) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if email thread already exists
  const existing = await db
    .select()
    .from(customerEmails)
    .where(
      and(
        eq(customerEmails.customerId, data.customerId),
        eq(customerEmails.gmailThreadId, data.gmailThreadId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing email thread
    await db
      .update(customerEmails)
      .set({
        subject: data.subject,
        snippet: data.snippet,
        lastMessageDate: data.lastMessageDate,
        isRead: data.isRead,
      })
      .where(eq(customerEmails.id, existing[0].id));
    return existing[0].id;
  } else {
    // Insert new email thread
    const result = await db.insert(customerEmails).values(data);
    return Number((result as any).insertId);
  }
}

export async function getCustomerConversation(
  customerId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return undefined;

  // Verify customer belongs to user
  const customer = await getCustomerProfileById(customerId, userId);
  if (!customer) return undefined;

  const result = await db
    .select()
    .from(customerConversations)
    .where(eq(customerConversations.customerId, customerId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createCustomerConversation(
  data: InsertCustomerConversation
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(customerConversations).values(data);
  return Number((result as any).insertId);
}

export async function updateCustomerBalance(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Calculate totals from invoices
  const invoices = await db
    .select()
    .from(customerInvoices)
    .where(eq(customerInvoices.customerId, customerId));

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const balance = totalInvoiced - totalPaid;
  const invoiceCount = invoices.length;

  // Update customer profile
  await db
    .update(customerProfiles)
    .set({
      totalInvoiced,
      totalPaid,
      balance,
      invoiceCount,
      updatedAt: new Date(),
    })
    .where(eq(customerProfiles.id, customerId));

  return { totalInvoiced, totalPaid, balance, invoiceCount };
}

export async function updateCustomerEmailCount(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Count email threads
  const emails = await db
    .select()
    .from(customerEmails)
    .where(eq(customerEmails.customerId, customerId));

  const emailCount = emails.length;
  const lastContactDate =
    emails.length > 0 && emails[0].lastMessageDate
      ? emails[0].lastMessageDate
      : undefined;

  // Update customer profile
  await db
    .update(customerProfiles)
    .set({
      emailCount,
      lastContactDate,
      updatedAt: new Date(),
    })
    .where(eq(customerProfiles.id, customerId));

  return { emailCount, lastContactDate };
}

export async function getAllCustomerProfiles(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, userId))
    .orderBy(desc(customerProfiles.lastContactDate));

  return result;
}
