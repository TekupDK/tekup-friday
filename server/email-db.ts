/**
 * Database operations for Friday AI Inbox email features
 */

import { db } from "./db";
import {
  emailCategories,
  emailLabels,
  emailThreadLabels,
  emailThreadCategories,
  emailRules,
  userPreferences,
  snoozedEmails,
  emailTemplates,
  emailAIMetadata,
  emailThreads,
  type InsertEmailCategory,
  type InsertEmailLabel,
  type InsertEmailThreadLabel,
  type InsertEmailThreadCategory,
  type InsertEmailRule,
  type InsertUserPreference,
  type InsertSnoozedEmail,
  type InsertEmailTemplate,
  type InsertEmailAIMetadata,
} from "../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";

// ============================================================================
// EMAIL CATEGORIES
// ============================================================================

/**
 * Initialize default email categories (run once on first setup)
 */
export async function initializeDefaultCategories() {
  const defaultCategories: InsertEmailCategory[] = [
    {
      name: "main",
      displayName: "Main",
      description: "Personal emails and important conversations",
      color: "#3B82F6", // blue
      icon: "mail",
      sortOrder: 1,
      isSystem: true,
    },
    {
      name: "updates",
      displayName: "Updates",
      description: "Notifications, confirmations, and receipts",
      color: "#10B981", // green
      icon: "bell",
      sortOrder: 2,
      isSystem: true,
    },
    {
      name: "promotions",
      displayName: "Promotions",
      description: "Marketing emails and offers",
      color: "#F59E0B", // amber
      icon: "tag",
      sortOrder: 3,
      isSystem: true,
    },
    {
      name: "calendar",
      displayName: "Calendar",
      description: "Meeting invites and events",
      color: "#8B5CF6", // purple
      icon: "calendar",
      sortOrder: 4,
      isSystem: true,
    },
    {
      name: "social",
      displayName: "Social",
      description: "Social media notifications",
      color: "#EC4899", // pink
      icon: "users",
      sortOrder: 5,
      isSystem: true,
    },
    {
      name: "forums",
      displayName: "Forums",
      description: "Mailing lists and discussions",
      color: "#6366F1", // indigo
      icon: "message-square",
      sortOrder: 6,
      isSystem: true,
    },
  ];

  try {
    // Check if categories already exist
    const existing = await db.select().from(emailCategories).limit(1);

    if (existing.length === 0) {
      await db.insert(emailCategories).values(defaultCategories);
      console.log('✅ [Email DB] Initialized default categories');
    }

    return defaultCategories;
  } catch (error) {
    console.error('[Email DB] Error initializing categories:', error);
    throw error;
  }
}

export async function getAllCategories() {
  return db.select().from(emailCategories).orderBy(emailCategories.sortOrder);
}

export async function getCategoryByName(name: string) {
  const result = await db.select().from(emailCategories).where(eq(emailCategories.name, name)).limit(1);
  return result[0] || null;
}

// ============================================================================
// EMAIL LABELS
// ============================================================================

export async function createLabel(data: InsertEmailLabel) {
  const result = await db.insert(emailLabels).values(data);
  return { id: Number(result.insertId), ...data };
}

export async function getUserLabels(userId: number) {
  return db.select().from(emailLabels).where(eq(emailLabels.userId, userId));
}

export async function deleteLabel(labelId: number) {
  await db.delete(emailLabels).where(eq(emailLabels.id, labelId));
}

export async function assignLabelToThread(threadId: number, labelId: number) {
  await db.insert(emailThreadLabels).values({ threadId, labelId });
}

export async function removeLabelFromThread(threadId: number, labelId: number) {
  await db.delete(emailThreadLabels).where(
    and(
      eq(emailThreadLabels.threadId, threadId),
      eq(emailThreadLabels.labelId, labelId)
    )
  );
}

export async function getThreadLabels(threadId: number) {
  const result = await db
    .select({
      label: emailLabels,
    })
    .from(emailThreadLabels)
    .innerJoin(emailLabels, eq(emailThreadLabels.labelId, emailLabels.id))
    .where(eq(emailThreadLabels.threadId, threadId));

  return result.map(r => r.label);
}

// ============================================================================
// EMAIL THREAD CATEGORIES
// ============================================================================

export async function assignCategoryToThread(data: InsertEmailThreadCategory) {
  await db.insert(emailThreadCategories).values(data);
}

export async function getThreadCategory(threadId: number) {
  const result = await db
    .select({
      category: emailCategories,
      confidence: emailThreadCategories.confidence,
      isManual: emailThreadCategories.isManual,
    })
    .from(emailThreadCategories)
    .innerJoin(emailCategories, eq(emailThreadCategories.categoryId, emailCategories.id))
    .where(eq(emailThreadCategories.threadId, threadId))
    .limit(1);

  return result[0] || null;
}

// ============================================================================
// EMAIL RULES
// ============================================================================

export async function createRule(data: InsertEmailRule) {
  const result = await db.insert(emailRules).values(data);
  return { id: Number(result.insertId), ...data };
}

export async function getUserRules(userId: number) {
  return db
    .select()
    .from(emailRules)
    .where(eq(emailRules.userId, userId))
    .orderBy(desc(emailRules.priority));
}

export async function updateRule(ruleId: number, data: Partial<InsertEmailRule>) {
  await db.update(emailRules).set(data).where(eq(emailRules.id, ruleId));
}

export async function deleteRule(ruleId: number) {
  await db.delete(emailRules).where(eq(emailRules.id, ruleId));
}

export async function toggleRuleEnabled(ruleId: number, isEnabled: boolean) {
  await db.update(emailRules).set({ isEnabled }).where(eq(emailRules.id, ruleId));
}

// ============================================================================
// USER PREFERENCES
// ============================================================================

export async function getUserPreferences(userId: number) {
  const result = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);

  // Create default preferences if none exist
  if (result.length === 0) {
    const defaultPrefs: InsertUserPreference = {
      userId,
      inboxLayout: 'gmail_categories',
      defaultView: 'all',
      emailsPerPage: 50,
      theme: 'system',
      enableAISummarization: true,
      enableSmartReplies: true,
      enablePriorityScoring: true,
    };
    await db.insert(userPreferences).values(defaultPrefs);
    return defaultPrefs;
  }

  return result[0];
}

export async function updateUserPreferences(userId: number, data: Partial<InsertUserPreference>) {
  await db.update(userPreferences).set(data).where(eq(userPreferences.userId, userId));
}

// ============================================================================
// SNOOZED EMAILS
// ============================================================================

export async function snoozeEmail(data: InsertSnoozedEmail) {
  await db.insert(snoozedEmails).values(data);
}

export async function unsnoozeEmail(threadId: number) {
  await db.delete(snoozedEmails).where(eq(snoozedEmails.threadId, threadId));
}

export async function getSnoozedEmails(userId: number) {
  return db.select().from(snoozedEmails).where(eq(snoozedEmails.userId, userId));
}

export async function getUnsnoozedEmails(userId: number) {
  const now = new Date();
  return db
    .select()
    .from(snoozedEmails)
    .where(
      and(
        eq(snoozedEmails.userId, userId),
        gte(now, snoozedEmails.snoozeUntil)
      )
    );
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

export async function createTemplate(data: InsertEmailTemplate) {
  const result = await db.insert(emailTemplates).values(data);
  return { id: Number(result.insertId), ...data };
}

export async function getUserTemplates(userId: number) {
  return db.select().from(emailTemplates).where(eq(emailTemplates.userId, userId));
}

export async function getTemplatesByCategory(userId: number, category: string) {
  return db
    .select()
    .from(emailTemplates)
    .where(
      and(
        eq(emailTemplates.userId, userId),
        eq(emailTemplates.category, category)
      )
    );
}

export async function updateTemplate(templateId: number, data: Partial<InsertEmailTemplate>) {
  await db.update(emailTemplates).set(data).where(eq(emailTemplates.id, templateId));
}

export async function deleteTemplate(templateId: number) {
  await db.delete(emailTemplates).where(eq(emailTemplates.id, templateId));
}

// ============================================================================
// EMAIL AI METADATA
// ============================================================================

export async function saveEmailAIMetadata(data: InsertEmailAIMetadata) {
  // Check if metadata already exists for this thread
  const existing = await db
    .select()
    .from(emailAIMetadata)
    .where(eq(emailAIMetadata.threadId, data.threadId))
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(emailAIMetadata)
      .set({ ...data, lastAnalyzedAt: new Date() })
      .where(eq(emailAIMetadata.threadId, data.threadId));
    return { id: existing[0].id, ...data };
  } else {
    // Insert new
    const result = await db.insert(emailAIMetadata).values(data);
    return { id: Number(result.insertId), ...data };
  }
}

export async function getEmailAIMetadata(threadId: number) {
  const result = await db
    .select()
    .from(emailAIMetadata)
    .where(eq(emailAIMetadata.threadId, threadId))
    .limit(1);

  return result[0] || null;
}

export async function getEmailAIMetadataByGmailId(gmailThreadId: string) {
  const result = await db
    .select()
    .from(emailAIMetadata)
    .where(eq(emailAIMetadata.gmailThreadId, gmailThreadId))
    .limit(1);

  return result[0] || null;
}

// ============================================================================
// EMAIL THREAD OPERATIONS
// ============================================================================

/**
 * Mark an email thread as read or unread
 */
export async function markThreadAsRead(threadId: number, isRead: boolean = true) {
  await db.update(emailThreads).set({ isRead }).where(eq(emailThreads.id, threadId));
}

/**
 * Mark an email thread as starred or unstarred
 */
export async function markThreadAsStarred(threadId: number, isStarred: boolean = true) {
  await db.update(emailThreads).set({ isStarred }).where(eq(emailThreads.id, threadId));
}

/**
 * Archive an email thread
 */
export async function archiveThread(threadId: number, isArchived: boolean = true) {
  await db.update(emailThreads).set({ isArchived }).where(eq(emailThreads.id, threadId));
}

/**
 * Delete an email thread (soft delete by archiving)
 */
export async function deleteThread(threadId: number) {
  await db.delete(emailThreads).where(eq(emailThreads.id, threadId));
}
