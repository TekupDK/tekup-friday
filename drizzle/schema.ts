import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Conversations table - stores chat conversation threads
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table - stores individual chat messages
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  model: varchar("model", { length: 64 }), // e.g., "gpt-4o", "claude-3.5", "gemini-2.0"
  attachments: json("attachments").$type<Array<{ url: string; name: string; type: string }>>(),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Email threads table - stores Gmail thread information
 */
export const emailThreads = mysqlTable("email_threads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gmailThreadId: varchar("gmailThreadId", { length: 255 }).notNull(),
  subject: text("subject"),
  participants: json("participants").$type<Array<{ name: string; email: string }>>(),
  snippet: text("snippet"),
  labels: json("labels").$type<string[]>(),
  lastMessageAt: timestamp("lastMessageAt"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailThread = typeof emailThreads.$inferSelect;
export type InsertEmailThread = typeof emailThreads.$inferInsert;

/**
 * Email messages table - stores individual Gmail messages within threads
 */
export const emailMessages = mysqlTable("email_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  threadId: int("threadId").notNull(), // FK to emailThreads.id
  gmailMessageId: varchar("gmailMessageId", { length: 255 }).notNull().unique(),
  gmailThreadId: varchar("gmailThreadId", { length: 255 }).notNull(),
  from: varchar("from", { length: 500 }).notNull(),
  to: text("to").notNull(),
  cc: text("cc"),
  bcc: text("bcc"),
  subject: text("subject"),
  bodyText: text("bodyText"),
  bodyHtml: text("bodyHtml"),
  snippet: text("snippet"),
  date: timestamp("date").notNull(),
  labels: json("labels").$type<string[]>(),
  hasAttachment: boolean("hasAttachment").default(false).notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  isStarred: boolean("isStarred").default(false).notNull(),
  internalDate: timestamp("internalDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailMessage = typeof emailMessages.$inferSelect;
export type InsertEmailMessage = typeof emailMessages.$inferInsert;

/**
 * Invoices table - stores Billy invoice references
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  billyInvoiceId: varchar("billyInvoiceId", { length: 255 }).notNull(),
  customerId: varchar("customerId", { length: 255 }),
  customerName: varchar("customerName", { length: 255 }),
  amount: int("amount").notNull(), // stored in cents/øre
  currency: varchar("currency", { length: 3 }).default("DKK").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  dueDate: timestamp("dueDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Calendar events table - stores Google Calendar event references
 */
export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  googleEventId: varchar("googleEventId", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  location: text("location"),
  status: mysqlEnum("status", ["confirmed", "tentative", "cancelled"]).default("confirmed").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

/**
 * Leads table - stores customer leads from various sources
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  source: varchar("source", { length: 64 }).notNull(), // e.g., "gmail", "rengoring.nu", "leadpoint"
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  company: varchar("company", { length: 255 }),
  score: int("score").default(0).notNull(), // AI-calculated lead score (0-100)
  status: mysqlEnum("status", ["new", "contacted", "qualified", "proposal", "won", "lost"]).default("new").notNull(),
  notes: text("notes"),
  metadata: json("metadata").$type<Record<string, unknown>>(), // flexible field for source-specific data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Customer profiles table - aggregated customer data from leads, invoices, emails
 */
export const customerProfiles = mysqlTable("customer_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  leadId: int("leadId"), // reference to leads table
  billyCustomerId: varchar("billyCustomerId", { length: 255 }), // Billy customer ID
  billyOrganizationId: varchar("billyOrganizationId", { length: 255 }), // Billy organization ID
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 32 }),
  totalInvoiced: int("totalInvoiced").default(0).notNull(), // in øre
  totalPaid: int("totalPaid").default(0).notNull(), // in øre
  balance: int("balance").default(0).notNull(), // in øre (totalInvoiced - totalPaid)
  invoiceCount: int("invoiceCount").default(0).notNull(),
  emailCount: int("emailCount").default(0).notNull(),
  aiResume: text("aiResume"), // AI-generated customer summary
  lastContactDate: timestamp("lastContactDate"),
  lastSyncDate: timestamp("lastSyncDate"), // last Billy sync
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = typeof customerProfiles.$inferInsert;

/**
 * Customer invoices junction table - links customers to their invoices
 */
export const customerInvoices = mysqlTable("customer_invoices", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(), // reference to customer_profiles
  invoiceId: int("invoiceId"), // reference to invoices table (optional)
  billyInvoiceId: varchar("billyInvoiceId", { length: 255 }).notNull(),
  invoiceNo: varchar("invoiceNo", { length: 64 }),
  amount: int("amount").notNull(), // in øre
  paidAmount: int("paidAmount").default(0).notNull(), // in øre
  status: mysqlEnum("status", ["draft", "approved", "sent", "paid", "overdue", "voided"]).default("draft").notNull(),
  entryDate: timestamp("entryDate"),
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomerInvoice = typeof customerInvoices.$inferSelect;
export type InsertCustomerInvoice = typeof customerInvoices.$inferInsert;

/**
 * Customer emails junction table - links customers to their email threads
 */
export const customerEmails = mysqlTable("customer_emails", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(), // reference to customer_profiles
  emailThreadId: int("emailThreadId"), // reference to email_threads (optional)
  gmailThreadId: varchar("gmailThreadId", { length: 255 }).notNull(),
  subject: text("subject"),
  snippet: text("snippet"),
  lastMessageDate: timestamp("lastMessageDate"),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerEmail = typeof customerEmails.$inferSelect;
export type InsertCustomerEmail = typeof customerEmails.$inferInsert;

/**
 * Customer conversations table - dedicated chat conversations per customer
 */
export const customerConversations = mysqlTable("customer_conversations", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(), // reference to customer_profiles
  conversationId: int("conversationId").notNull(), // reference to conversations
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CustomerConversation = typeof customerConversations.$inferSelect;
export type InsertCustomerConversation = typeof customerConversations.$inferInsert;

/**
 * Tasks table - stores user tasks and reminders
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["todo", "in_progress", "done", "cancelled"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  relatedTo: varchar("relatedTo", { length: 64 }), // e.g., "lead:123", "invoice:456"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Analytics events table - stores user actions for analytics
 */
export const analyticsEvents = mysqlTable("analytics_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  eventType: varchar("eventType", { length: 64 }).notNull(), // e.g., "lead_created", "invoice_sent"
  eventData: json("eventData").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Email categories table - stores AI-powered categorization (Main, Updates, Promotions, Calendar, etc.)
 */
export const emailCategories = mysqlTable("email_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull(), // "Main", "Updates", "Promotions", "Calendar", "Social", "Forums"
  displayName: varchar("displayName", { length: 64 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 32 }), // hex color code
  icon: varchar("icon", { length: 64 }), // icon name
  sortOrder: int("sortOrder").default(0).notNull(),
  isSystem: boolean("isSystem").default(false).notNull(), // true for built-in categories
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailCategory = typeof emailCategories.$inferSelect;
export type InsertEmailCategory = typeof emailCategories.$inferInsert;

/**
 * Email labels table - custom labels with colors (like Gmail labels)
 */
export const emailLabels = mysqlTable("email_labels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  color: varchar("color", { length: 32 }).notNull(), // hex color code or predefined color name
  icon: varchar("icon", { length: 64 }), // optional icon
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailLabel = typeof emailLabels.$inferSelect;
export type InsertEmailLabel = typeof emailLabels.$inferInsert;

/**
 * Email thread labels junction table - links email threads to custom labels
 */
export const emailThreadLabels = mysqlTable("email_thread_labels", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(), // FK to emailThreads.id
  labelId: int("labelId").notNull(), // FK to emailLabels.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailThreadLabel = typeof emailThreadLabels.$inferSelect;
export type InsertEmailThreadLabel = typeof emailThreadLabels.$inferInsert;

/**
 * Email thread categories junction table - links email threads to categories
 */
export const emailThreadCategories = mysqlTable("email_thread_categories", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(), // FK to emailThreads.id
  categoryId: int("categoryId").notNull(), // FK to emailCategories.id
  confidence: int("confidence").default(100).notNull(), // AI confidence score (0-100)
  isManual: boolean("isManual").default(false).notNull(), // true if manually assigned by user
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailThreadCategory = typeof emailThreadCategories.$inferSelect;
export type InsertEmailThreadCategory = typeof emailThreadCategories.$inferInsert;

/**
 * Email rules table - automation rules for email processing
 */
export const emailRules = mysqlTable("email_rules", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  priority: int("priority").default(0).notNull(), // higher number = higher priority
  conditions: json("conditions").$type<{
    type: 'all' | 'any'; // match all conditions or any condition
    rules: Array<{
      field: 'from' | 'to' | 'subject' | 'body' | 'hasAttachment' | 'label';
      operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'matches';
      value: string;
    }>;
  }>().notNull(),
  actions: json("actions").$type<Array<{
    type: 'addLabel' | 'addCategory' | 'markRead' | 'markStarred' | 'archive' | 'delete' | 'forward' | 'snooze';
    params: Record<string, any>;
  }>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailRule = typeof emailRules.$inferSelect;
export type InsertEmailRule = typeof emailRules.$inferInsert;

/**
 * User preferences table - inbox layout, settings, etc.
 */
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  inboxLayout: mysqlEnum("inboxLayout", ["gmail_categories", "important_other", "basic"]).default("gmail_categories").notNull(),
  defaultView: varchar("defaultView", { length: 64 }).default("all"), // "all", "unread", "starred", etc.
  emailsPerPage: int("emailsPerPage").default(50).notNull(),
  theme: varchar("theme", { length: 32 }).default("system"), // "light", "dark", "system"
  enableAISummarization: boolean("enableAISummarization").default(true).notNull(),
  enableSmartReplies: boolean("enableSmartReplies").default(true).notNull(),
  enablePriorityScoring: boolean("enablePriorityScoring").default(true).notNull(),
  settings: json("settings").$type<Record<string, unknown>>(), // flexible field for additional settings
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

/**
 * Snoozed emails table - emails that are temporarily hidden until a specific time
 */
export const snoozedEmails = mysqlTable("snoozed_emails", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  threadId: int("threadId").notNull(), // FK to emailThreads.id
  gmailThreadId: varchar("gmailThreadId", { length: 255 }).notNull(),
  snoozeUntil: timestamp("snoozeUntil").notNull(),
  reminder: boolean("reminder").default(false).notNull(), // show notification when unsnoozed
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SnoozedEmail = typeof snoozedEmails.$inferSelect;
export type InsertSnoozedEmail = typeof snoozedEmails.$inferInsert;

/**
 * Email templates table - reusable email templates
 */
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  category: varchar("category", { length: 64 }), // "customer_service", "sales", "follow_up", etc.
  variables: json("variables").$type<Array<{ name: string; description: string; defaultValue?: string }>>(), // template variables like {name}, {company}
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Email AI metadata table - stores AI-generated insights for emails
 */
export const emailAIMetadata = mysqlTable("email_ai_metadata", {
  id: int("id").autoincrement().primaryKey(),
  threadId: int("threadId").notNull(), // FK to emailThreads.id
  gmailThreadId: varchar("gmailThreadId", { length: 255 }).notNull(),
  summary: text("summary"), // AI-generated one-line summary
  priorityScore: int("priorityScore").default(0).notNull(), // 0-100
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative", "urgent"]),
  actionItems: json("actionItems").$type<Array<{ text: string; deadline?: string }>>(), // extracted action items
  keyTopics: json("keyTopics").$type<string[]>(), // main topics discussed
  suggestedReplies: json("suggestedReplies").$type<Array<{ text: string; tone: string }>>(), // AI-generated reply suggestions
  lastAnalyzedAt: timestamp("lastAnalyzedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailAIMetadata = typeof emailAIMetadata.$inferSelect;
export type InsertEmailAIMetadata = typeof emailAIMetadata.$inferInsert;