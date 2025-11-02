# Friday AI Chat - API Reference

**Author:** Manus AI  
**Last Updated:** November 1, 2025  
**Version:** 1.0.0

## Overview

This document provides a complete reference for all tRPC API endpoints, database schema, and external integrations in the Friday AI Chat system. All endpoints are type-safe and validated using Zod schemas.

## tRPC API Endpoints

### Base URL

**Development:** `http://localhost:3000/api/trpc`  
**Production:** `https://[your-domain].manus.space/api/trpc`

### Authentication

All `protectedProcedure` endpoints require a valid session cookie. The cookie is set automatically after OAuth login.

**Cookie Name:** `friday_session` (defined in `COOKIE_NAME` constant)  
**Cookie Options:** HTTP-only, Secure (production), SameSite=Lax

---

## Auth Router (`auth`)

### `auth.me`

Get current authenticated user information.

**Type:** Query (Public)  
**Input:** None  
**Output:**

```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  createdAt: Date;
  lastSignedIn: Date;
} | undefined
```

**Example:**

```typescript
const { data: user } = trpc.auth.me.useQuery();
if (user) {
  console.log(`Logged in as ${user.name}`);
}
```

### `auth.logout`

Log out current user and clear session cookie.

**Type:** Mutation (Public)  
**Input:** None  
**Output:**

```typescript
{
  success: true;
}
```

**Example:**

```typescript
const logoutMutation = trpc.auth.logout.useMutation();
await logoutMutation.mutateAsync();
```

---

## Chat Router (`chat`)

### `chat.conversations.list`

Get all conversations for current user.

**Type:** Query (Protected)  
**Input:** None  
**Output:**

```typescript
Array<{
  id: number;
  userId: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}>;
```

### `chat.conversations.get`

Get specific conversation with messages.

**Type:** Query (Protected)  
**Input:**

```typescript
{
  conversationId: number;
}
```

**Output:**

```typescript
{
  id: number;
  userId: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### `chat.conversations.create`

Create new conversation.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  title?: string; // Optional, defaults to "New Conversation"
}
```

**Output:**

```typescript
{
  id: number;
  userId: number;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### `chat.messages.list`

Get all messages in a conversation.

**Type:** Query (Protected)  
**Input:**

```typescript
{
  conversationId: number;
}
```

**Output:**

```typescript
Array<{
  id: number;
  conversationId: number;
  role: "user" | "assistant" | "system";
  content: string;
  model: string | null;
  pendingAction: object | null;
  createdAt: Date;
}>;
```

### `chat.sendMessage`

Send message and get AI response.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  conversationId: number;
  content: string;
  model?: "gemini-2.5-flash" | "claude-3-5-sonnet" | "gpt-4o" | "manus-ai";
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
  }>;
}
```

**Output:**

```typescript
{
  userMessage: {
    id: number;
    content: string;
    role: "user";
    createdAt: Date;
  }
  aiMessage: {
    id: number;
    content: string;
    role: "assistant";
    model: string;
    pendingAction: object | null;
    createdAt: Date;
  }
}
```

**Behavior:**

1. Saves user message to database
2. Routes to AI model based on task type
3. Parses intent and executes actions if confidence > 0.7
4. Returns pending action if requireApproval is true
5. Saves AI response to database
6. Auto-generates conversation title if first message

### `chat.analyzeInvoice`

Analyze invoice with AI.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  invoiceId: string;
  invoiceData: {
    invoiceNo: string;
    customer: string;
    amount: number;
    status: string;
    entryDate: string;
    paymentTerms: string;
  }
}
```

**Output:**

```typescript
{
  analysis: string; // AI-generated analysis in markdown
}
```

### `chat.submitAnalysisFeedback`

Submit feedback on AI invoice analysis.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  invoiceId: string;
  rating: "up" | "down";
  analysis: string;
  comment?: string; // Optional detailed feedback
}
```

**Output:**

```typescript
{
  success: true;
}
```

### `chat.executeAction`

Execute a pending action after user approval.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  conversationId: number;
  actionId: string;
  actionType: string;
  actionParams: Record<string, any>;
}
```

**Output:**

```typescript
{
  success: boolean;
  result: ActionResult;
}
```

---

## Inbox Router (`inbox`)

### `inbox.emails.list`

List Gmail threads.

**Type:** Query (Protected)  
**Input:** None  
**Output:**

```typescript
Array<{
  id: string;
  snippet: string;
  messages: Array<{
    id: string;
    threadId: string;
    from: string;
    to: string;
    subject: string;
    body: string;
    date: string;
  }>;
}>;
```

### `inbox.invoices.list`

List Billy.dk invoices.

**Type:** Query (Protected)  
**Input:** None  
**Output:**

```typescript
Array<{
  id: string;
  invoiceNo: string;
  contactId: string;
  contactName: string;
  state: string;
  entryDate: string;
  paymentTermsDate: string;
  totalAmount: number;
  currency: string;
}>;
```

### `inbox.calendar.list`

List Google Calendar events.

**Type:** Query (Protected)  
**Input:** None  
**Output:**

```typescript
Array<{
  id: string;
  summary: string;
  description: string | null;
  start: Date;
  end: Date;
  location: string | null;
  attendees: string[];
}>;
```

### `inbox.calendar.findFreeSlots`

Find free time slots in calendar.

**Type:** Query (Protected)  
**Input:**

```typescript
{
  startDate: string; // ISO date
  endDate: string; // ISO date
  duration: number; // Minutes
}
```

**Output:**

```typescript
Array<{
  start: Date;
  end: Date;
}>;
```

### `inbox.leads.list`

List all leads.

**Type:** Query (Protected)  
**Input:** None  
**Output:**

```typescript
Array<{
  id: number;
  userId: number;
  source: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
  score: number;
  notes: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}>;
```

### `inbox.leads.create`

Create new lead.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  source: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}
```

**Output:**

```typescript
{
  id: number;
  userId: number;
  source: string;
  // ... other lead fields
}
```

### `inbox.leads.updateStatus`

Update lead status.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  leadId: number;
  status: "new" | "contacted" | "qualified" | "proposal" | "won" | "lost";
}
```

**Output:**

```typescript
{
  success: true;
}
```

### `inbox.leads.updateScore`

Update lead score.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  leadId: number;
  score: number; // 0-100
}
```

**Output:**

```typescript
{
  success: true;
}
```

### `inbox.tasks.list`

List all tasks.

**Type:** Query (Protected)  
**Input:** None  
**Output:**

```typescript
Array<{
  id: number;
  userId: number;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "low" | "medium" | "high";
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;
```

### `inbox.tasks.create`

Create new task.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string; // ISO date
}
```

**Output:**

```typescript
{
  id: number;
  userId: number;
  title: string;
  // ... other task fields
}
```

### `inbox.tasks.updateStatus`

Update task status.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  taskId: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
}
```

**Output:**

```typescript
{
  success: true;
}
```

---

## Customer Router (`customer`)

### `customer.getProfileByLeadId`

Get customer profile by lead ID.

**Type:** Query (Protected)  
**Input:**

```typescript
{
  leadId: number;
}
```

**Output:**

```typescript
{
  id: number;
  userId: number;
  leadId: number | null;
  billyCustomerId: string | null;
  billyOrganizationId: string | null;
  email: string;
  name: string | null;
  phone: string | null;
  totalInvoiced: number; // In øre
  totalPaid: number; // In øre
  balance: number; // In øre
  invoiceCount: number;
  emailCount: number;
  aiResume: string | null;
  lastContactDate: Date | null;
  lastSyncDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Behavior:**

- Creates profile from lead if doesn't exist
- Returns existing profile if found

### `customer.getProfileByEmail`

Get customer profile by email.

**Type:** Query (Protected)  
**Input:**

```typescript
{
  email: string;
}
```

**Output:** Same as `getProfileByLeadId`

### `customer.listProfiles`

Get all customer profiles.

**Type:** Query (Protected)  
**Input:** None  
**Output:** Array of customer profiles (same structure as above)

### `customer.getInvoices`

Get all invoices for a customer.

**Type:** Query (Protected)  
**Input:**

```typescript
{
  customerId: number;
}
```

**Output:**

```typescript
Array<{
  id: number;
  customerId: number;
  invoiceId: number | null;
  billyInvoiceId: string;
  invoiceNo: string | null;
  amount: number; // In øre
  paidAmount: number; // In øre
  status: "draft" | "approved" | "sent" | "paid" | "overdue" | "voided";
  entryDate: Date | null;
  dueDate: Date | null;
  paidDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}>;
```

### `customer.getEmails`

Get all email threads for a customer.

**Type:** Query (Protected)  
**Input:**

```typescript
{
  customerId: number;
}
```

**Output:**

```typescript
Array<{
  id: number;
  customerId: number;
  emailThreadId: number | null;
  gmailThreadId: string;
  subject: string | null;
  snippet: string | null;
  lastMessageDate: Date | null;
  isRead: boolean;
  createdAt: Date;
}>;
```

### `customer.getConversation`

Get or create dedicated conversation for customer.

**Type:** Query (Protected)  
**Input:**

```typescript
{
  customerId: number;
}
```

**Output:**

```typescript
{
  id: number;
  customerId: number;
  conversationId: number;
  createdAt: Date;
}
```

**Behavior:**

- Returns existing conversation if found
- Creates new conversation with title "Chat with [customer name]" if not found

### `customer.syncBillyInvoices`

Sync invoices from Billy.dk for customer.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  customerId: number;
}
```

**Output:**

```typescript
{
  success: true;
  invoiceCount: number;
  balance: {
    totalInvoiced: number;
    totalPaid: number;
    balance: number;
    invoiceCount: number;
  }
}
```

**Behavior:**

1. Fetches invoices from Billy API via MCP
2. Filters by customer email/Billy customer ID
3. Adds/updates invoices in `customer_invoices` table
4. Recalculates customer balance
5. Updates `lastSyncDate` timestamp

### `customer.syncGmailEmails`

Sync email threads from Gmail for customer.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  customerId: number;
}
```

**Output:**

```typescript
{
  success: true;
  emailCount: number;
  lastContactDate: Date | null;
}
```

**Behavior:**

1. Searches Gmail for threads with customer email
2. Adds/updates threads in `customer_emails` table
3. Updates `emailCount` and `lastContactDate`

### `customer.generateResume`

Generate AI summary for customer.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  customerId: number;
}
```

**Output:**

```typescript
{
  success: true;
  resume: string; // AI-generated markdown summary
}
```

**Behavior:**

1. Gathers customer data (invoices, emails, balance)
2. Sends to LLM with structured prompt
3. Generates summary covering:
   - Customer relationship status
   - Service history
   - Payment behavior
   - Communication preferences
   - Next recommended actions
4. Saves to `customer_profiles.aiResume`

### `customer.updateProfile`

Update customer profile information.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  customerId: number;
  name?: string;
  phone?: string;
  billyCustomerId?: string;
}
```

**Output:**

```typescript
{
  success: true;
}
```

---

## System Router (`system`)

### `system.notifyOwner`

Send notification to project owner.

**Type:** Mutation (Protected)  
**Input:**

```typescript
{
  title: string;
  content: string;
}
```

**Output:**

```typescript
{
  success: boolean;
}
```

**Use Cases:**

- New form submissions
- Survey feedback
- Workflow completion alerts
- System errors requiring attention

---

## Database Schema

### users

User accounts with OAuth integration.

| Column         | Type         | Constraints                 | Description             |
| -------------- | ------------ | --------------------------- | ----------------------- |
| `id`           | INT          | PRIMARY KEY, AUTO_INCREMENT | User ID                 |
| `openId`       | VARCHAR(64)  | UNIQUE, NOT NULL            | Manus OAuth identifier  |
| `name`         | TEXT         | NULL                        | User full name          |
| `email`        | VARCHAR(320) | NULL                        | Email address           |
| `loginMethod`  | VARCHAR(64)  | NULL                        | OAuth provider          |
| `role`         | ENUM         | NOT NULL, DEFAULT 'user'    | User role (user, admin) |
| `createdAt`    | TIMESTAMP    | NOT NULL, DEFAULT NOW()     | Account creation        |
| `updatedAt`    | TIMESTAMP    | NOT NULL, ON UPDATE NOW()   | Last update             |
| `lastSignedIn` | TIMESTAMP    | NOT NULL, DEFAULT NOW()     | Last login              |

**Indexes:**

- PRIMARY: `id`
- UNIQUE: `openId`

---

### conversations

Chat conversation metadata.

| Column      | Type         | Constraints                 | Description        |
| ----------- | ------------ | --------------------------- | ------------------ |
| `id`        | INT          | PRIMARY KEY, AUTO_INCREMENT | Conversation ID    |
| `userId`    | INT          | NOT NULL                    | Owner user ID      |
| `title`     | VARCHAR(255) | NOT NULL                    | Conversation title |
| `createdAt` | TIMESTAMP    | NOT NULL, DEFAULT NOW()     | Creation time      |
| `updatedAt` | TIMESTAMP    | NOT NULL, ON UPDATE NOW()   | Last update        |

**Indexes:**

- PRIMARY: `id`
- INDEX: `userId`

---

### messages

Individual chat messages.

| Column           | Type        | Constraints                 | Description                            |
| ---------------- | ----------- | --------------------------- | -------------------------------------- |
| `id`             | INT         | PRIMARY KEY, AUTO_INCREMENT | Message ID                             |
| `conversationId` | INT         | NOT NULL                    | Parent conversation                    |
| `role`           | ENUM        | NOT NULL                    | Message role (user, assistant, system) |
| `content`        | TEXT        | NOT NULL                    | Message content                        |
| `model`          | VARCHAR(64) | NULL                        | AI model used                          |
| `attachments`    | JSON        | NULL                        | File attachments                       |
| `pendingAction`  | JSON        | NULL                        | Action awaiting approval               |
| `createdAt`      | TIMESTAMP   | NOT NULL, DEFAULT NOW()     | Message time                           |

**Indexes:**

- PRIMARY: `id`
- INDEX: `conversationId`

---

### email_threads

Gmail thread metadata and content.

| Column          | Type         | Constraints                 | Description       |
| --------------- | ------------ | --------------------------- | ----------------- |
| `id`            | INT          | PRIMARY KEY, AUTO_INCREMENT | Thread ID         |
| `userId`        | INT          | NOT NULL                    | Owner user ID     |
| `threadId`      | VARCHAR(255) | NOT NULL                    | Gmail thread ID   |
| `subject`       | TEXT         | NULL                        | Email subject     |
| `snippet`       | TEXT         | NULL                        | Preview text      |
| `sender`        | VARCHAR(255) | NULL                        | From address      |
| `recipient`     | VARCHAR(255) | NULL                        | To address        |
| `labels`        | JSON         | NULL                        | Gmail labels      |
| `unread`        | BOOLEAN      | NOT NULL, DEFAULT FALSE     | Unread status     |
| `lastMessageAt` | TIMESTAMP    | NULL                        | Last message time |
| `createdAt`     | TIMESTAMP    | NOT NULL, DEFAULT NOW()     | First seen        |

**Indexes:**

- PRIMARY: `id`
- INDEX: `userId`
- INDEX: `threadId`

---

### invoices

Billy.dk invoice data.

| Column             | Type          | Constraints                 | Description      |
| ------------------ | ------------- | --------------------------- | ---------------- |
| `id`               | INT           | PRIMARY KEY, AUTO_INCREMENT | Invoice ID       |
| `userId`           | INT           | NOT NULL                    | Owner user ID    |
| `billyInvoiceId`   | VARCHAR(255)  | NOT NULL                    | Billy invoice ID |
| `invoiceNo`        | VARCHAR(64)   | NULL                        | Invoice number   |
| `contactName`      | VARCHAR(255)  | NULL                        | Customer name    |
| `state`            | VARCHAR(64)   | NULL                        | Invoice status   |
| `entryDate`        | TIMESTAMP     | NULL                        | Invoice date     |
| `paymentTermsDate` | TIMESTAMP     | NULL                        | Due date         |
| `totalAmount`      | DECIMAL(10,2) | NULL                        | Total amount     |
| `currency`         | VARCHAR(3)    | NULL                        | Currency code    |
| `createdAt`        | TIMESTAMP     | NOT NULL, DEFAULT NOW()     | First synced     |

**Indexes:**

- PRIMARY: `id`
- INDEX: `userId`
- INDEX: `billyInvoiceId`

---

### calendar_events

Google Calendar events.

| Column        | Type         | Constraints                 | Description     |
| ------------- | ------------ | --------------------------- | --------------- |
| `id`          | INT          | PRIMARY KEY, AUTO_INCREMENT | Event ID        |
| `userId`      | INT          | NOT NULL                    | Owner user ID   |
| `eventId`     | VARCHAR(255) | NOT NULL                    | Google event ID |
| `summary`     | VARCHAR(255) | NULL                        | Event title     |
| `description` | TEXT         | NULL                        | Event details   |
| `location`    | VARCHAR(255) | NULL                        | Event location  |
| `start`       | TIMESTAMP    | NOT NULL                    | Start time      |
| `end`         | TIMESTAMP    | NOT NULL                    | End time        |
| `attendees`   | JSON         | NULL                        | Attendee list   |
| `status`      | VARCHAR(64)  | NULL                        | Event status    |
| `createdAt`   | TIMESTAMP    | NOT NULL, DEFAULT NOW()     | First synced    |
| `updatedAt`   | TIMESTAMP    | NOT NULL, ON UPDATE NOW()   | Last update     |

**Indexes:**

- PRIMARY: `id`
- INDEX: `userId`
- INDEX: `eventId`
- INDEX: `start`

---

### leads

Sales leads with scoring.

| Column      | Type         | Constraints                 | Description        |
| ----------- | ------------ | --------------------------- | ------------------ |
| `id`        | INT          | PRIMARY KEY, AUTO_INCREMENT | Lead ID            |
| `userId`    | INT          | NOT NULL                    | Owner user ID      |
| `source`    | VARCHAR(255) | NOT NULL                    | Lead source        |
| `name`      | VARCHAR(255) | NULL                        | Contact name       |
| `email`     | VARCHAR(320) | NULL                        | Email address      |
| `phone`     | VARCHAR(32)  | NULL                        | Phone number       |
| `company`   | VARCHAR(255) | NULL                        | Company name       |
| `status`    | ENUM         | NOT NULL, DEFAULT 'new'     | Lead status        |
| `score`     | INT          | NOT NULL, DEFAULT 0         | Lead score (0-100) |
| `notes`     | TEXT         | NULL                        | Additional notes   |
| `metadata`  | JSON         | NULL                        | Custom data        |
| `createdAt` | TIMESTAMP    | NOT NULL, DEFAULT NOW()     | Lead created       |
| `updatedAt` | TIMESTAMP    | NOT NULL, ON UPDATE NOW()   | Last update        |

**Status Values:** `new`, `contacted`, `qualified`, `proposal`, `won`, `lost`

**Indexes:**

- PRIMARY: `id`
- INDEX: `userId`
- INDEX: `email`

---

### tasks

User tasks and reminders.

| Column        | Type         | Constraints                 | Description     |
| ------------- | ------------ | --------------------------- | --------------- |
| `id`          | INT          | PRIMARY KEY, AUTO_INCREMENT | Task ID         |
| `userId`      | INT          | NOT NULL                    | Owner user ID   |
| `title`       | VARCHAR(255) | NOT NULL                    | Task title      |
| `description` | TEXT         | NULL                        | Task details    |
| `status`      | ENUM         | NOT NULL, DEFAULT 'pending' | Task status     |
| `priority`    | ENUM         | NOT NULL, DEFAULT 'medium'  | Priority level  |
| `dueDate`     | TIMESTAMP    | NULL                        | Due date        |
| `completedAt` | TIMESTAMP    | NULL                        | Completion time |
| `createdAt`   | TIMESTAMP    | NOT NULL, DEFAULT NOW()     | Task created    |
| `updatedAt`   | TIMESTAMP    | NOT NULL, ON UPDATE NOW()   | Last update     |

**Status Values:** `pending`, `in_progress`, `completed`, `cancelled`  
**Priority Values:** `low`, `medium`, `high`

**Indexes:**

- PRIMARY: `id`
- INDEX: `userId`
- INDEX: `dueDate`

---

### customer_profiles

Aggregated customer data.

| Column                | Type         | Constraints                 | Description               |
| --------------------- | ------------ | --------------------------- | ------------------------- |
| `id`                  | INT          | PRIMARY KEY, AUTO_INCREMENT | Profile ID                |
| `userId`              | INT          | NOT NULL                    | Owner user ID             |
| `leadId`              | INT          | NULL                        | Reference to leads table  |
| `billyCustomerId`     | VARCHAR(255) | NULL                        | Billy customer ID         |
| `billyOrganizationId` | VARCHAR(255) | NULL                        | Billy org ID              |
| `email`               | VARCHAR(320) | NOT NULL                    | Customer email            |
| `name`                | VARCHAR(255) | NULL                        | Customer name             |
| `phone`               | VARCHAR(32)  | NULL                        | Phone number              |
| `totalInvoiced`       | INT          | NOT NULL, DEFAULT 0         | Total invoiced (øre)      |
| `totalPaid`           | INT          | NOT NULL, DEFAULT 0         | Total paid (øre)          |
| `balance`             | INT          | NOT NULL, DEFAULT 0         | Outstanding balance (øre) |
| `invoiceCount`        | INT          | NOT NULL, DEFAULT 0         | Number of invoices        |
| `emailCount`          | INT          | NOT NULL, DEFAULT 0         | Number of email threads   |
| `aiResume`            | TEXT         | NULL                        | AI-generated summary      |
| `lastContactDate`     | TIMESTAMP    | NULL                        | Last email/call           |
| `lastSyncDate`        | TIMESTAMP    | NULL                        | Last Billy sync           |
| `createdAt`           | TIMESTAMP    | NOT NULL, DEFAULT NOW()     | Profile created           |
| `updatedAt`           | TIMESTAMP    | NOT NULL, ON UPDATE NOW()   | Last update               |

**Indexes:**

- PRIMARY: `id`
- INDEX: `userId`
- INDEX: `email`
- INDEX: `leadId`

---

### customer_invoices

Customer-specific invoice junction table.

| Column           | Type         | Constraints                 | Description                 |
| ---------------- | ------------ | --------------------------- | --------------------------- |
| `id`             | INT          | PRIMARY KEY, AUTO_INCREMENT | Record ID                   |
| `customerId`     | INT          | NOT NULL                    | Customer profile ID         |
| `invoiceId`      | INT          | NULL                        | Reference to invoices table |
| `billyInvoiceId` | VARCHAR(255) | NOT NULL                    | Billy invoice ID            |
| `invoiceNo`      | VARCHAR(64)  | NULL                        | Invoice number              |
| `amount`         | INT          | NOT NULL                    | Invoice amount (øre)        |
| `paidAmount`     | INT          | NOT NULL, DEFAULT 0         | Paid amount (øre)           |
| `status`         | ENUM         | NOT NULL, DEFAULT 'draft'   | Invoice status              |
| `entryDate`      | TIMESTAMP    | NULL                        | Invoice date                |
| `dueDate`        | TIMESTAMP    | NULL                        | Due date                    |
| `paidDate`       | TIMESTAMP    | NULL                        | Payment date                |
| `createdAt`      | TIMESTAMP    | NOT NULL, DEFAULT NOW()     | First synced                |
| `updatedAt`      | TIMESTAMP    | NOT NULL, ON UPDATE NOW()   | Last update                 |

**Status Values:** `draft`, `approved`, `sent`, `paid`, `overdue`, `voided`

**Indexes:**

- PRIMARY: `id`
- INDEX: `customerId`
- INDEX: `billyInvoiceId`

---

### customer_emails

Customer email thread junction table.

| Column            | Type         | Constraints                 | Description                |
| ----------------- | ------------ | --------------------------- | -------------------------- |
| `id`              | INT          | PRIMARY KEY, AUTO_INCREMENT | Record ID                  |
| `customerId`      | INT          | NOT NULL                    | Customer profile ID        |
| `emailThreadId`   | INT          | NULL                        | Reference to email_threads |
| `gmailThreadId`   | VARCHAR(255) | NOT NULL                    | Gmail thread ID            |
| `subject`         | TEXT         | NULL                        | Email subject              |
| `snippet`         | TEXT         | NULL                        | Preview text               |
| `lastMessageDate` | TIMESTAMP    | NULL                        | Last message time          |
| `isRead`          | BOOLEAN      | NOT NULL, DEFAULT FALSE     | Read status                |
| `createdAt`       | TIMESTAMP    | NOT NULL, DEFAULT NOW()     | First synced               |

**Indexes:**

- PRIMARY: `id`
- INDEX: `customerId`
- INDEX: `gmailThreadId`

---

### customer_conversations

Dedicated chat conversations per customer.

| Column           | Type      | Constraints                 | Description         |
| ---------------- | --------- | --------------------------- | ------------------- |
| `id`             | INT       | PRIMARY KEY, AUTO_INCREMENT | Record ID           |
| `customerId`     | INT       | NOT NULL                    | Customer profile ID |
| `conversationId` | INT       | NOT NULL                    | Conversation ID     |
| `createdAt`      | TIMESTAMP | NOT NULL, DEFAULT NOW()     | Created time        |

**Indexes:**

- PRIMARY: `id`
- INDEX: `customerId`
- INDEX: `conversationId`

---

### analytics_events

User interaction tracking.

| Column      | Type        | Constraints                 | Description   |
| ----------- | ----------- | --------------------------- | ------------- |
| `id`        | INT         | PRIMARY KEY, AUTO_INCREMENT | Event ID      |
| `userId`    | INT         | NOT NULL                    | User ID       |
| `eventType` | VARCHAR(64) | NOT NULL                    | Event type    |
| `eventData` | JSON        | NULL                        | Event payload |
| `createdAt` | TIMESTAMP   | NOT NULL, DEFAULT NOW()     | Event time    |

**Common Event Types:**

- `lead_created`
- `task_created`
- `analysis_feedback`

**Indexes:**

- PRIMARY: `id`
- INDEX: `userId`
- INDEX: `eventType`
- INDEX: `createdAt`

---

## External Integrations

### Google Workspace API

**Authentication:** Service Account with Domain-Wide Delegation

**Environment Variables:**

- `GOOGLE_SERVICE_ACCOUNT_KEY`: JSON key file content
- `GOOGLE_IMPERSONATED_USER`: Email to impersonate (e.g., `info@rendetalje.dk`)
- `GOOGLE_CALENDAR_ID`: Calendar ID for events

**Scopes:**

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.compose`
- `https://www.googleapis.com/auth/calendar`
- `https://www.googleapis.com/auth/calendar.events`

**Rate Limits:**

- Gmail API: 250 quota units/user/second
- Calendar API: 500 queries/100 seconds/user

**Helper Functions:**

- `searchGmailThreads(query, maxResults)`
- `getGmailThread(threadId)`
- `createGmailDraft(to, subject, body)`
- `listCalendarEvents(timeMin, timeMax)`
- `createCalendarEvent(summary, start, end, description)`
- `checkCalendarAvailability(date, duration)`
- `findFreeSlots(startDate, endDate, duration)`

---

### Billy.dk API

**Authentication:** MCP Server

**Environment Variables:**

- `BILLY_API_KEY`: Billy API key
- `BILLY_ORGANIZATION_ID`: Organization ID

**MCP Tools:**

- `billy_get_invoices`: Fetch invoices
- `billy_create_invoice`: Create new invoice
- `billy_get_contacts`: Fetch customer contacts

**Helper Functions:**

- `syncBillyInvoicesForCustomer(email, billyCustomerId)`
- `getBillyCustomerIdByEmail(email)`
- `syncAllBillyCustomers(userId)`

**Data Mapping:**

```typescript
Billy State → Database Status
─────────────────────────────
draft       → draft
approved    → approved
sent        → sent
paid        → paid
overdue     → overdue
voided      → voided
cancelled   → voided
```

---

### Manus AI Services

**LLM API:**

**Environment Variables:**

- `BUILT_IN_FORGE_API_URL`: API base URL
- `BUILT_IN_FORGE_API_KEY`: Server-side API key
- `VITE_FRONTEND_FORGE_API_KEY`: Frontend API key

**Helper Function:**

```typescript
invokeLLM({
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  response_format?: {
    type: "json_schema";
    json_schema: object;
  };
  tools?: Tool[];
  tool_choice?: "none" | "auto" | "required";
})
```

**S3 Storage:**

**Helper Function:**

```typescript
storagePut(
  fileKey: string,
  data: Buffer | Uint8Array | string,
  contentType?: string
): Promise<{ key: string; url: string }>
```

**Best Practices:**

- Add random suffix to file keys to prevent enumeration
- Save metadata (URL, mime type, size) in database
- Use S3 only for file bytes, not metadata

---

## Error Codes

### tRPC Error Codes

| Code                    | HTTP Status | Description              |
| ----------------------- | ----------- | ------------------------ |
| `UNAUTHORIZED`          | 401         | No valid session cookie  |
| `FORBIDDEN`             | 403         | Insufficient permissions |
| `NOT_FOUND`             | 404         | Resource not found       |
| `BAD_REQUEST`           | 400         | Invalid input data       |
| `INTERNAL_SERVER_ERROR` | 500         | Server error             |

### Custom Error Messages

**Authentication Errors:**

- "User not authenticated" → No session cookie
- "Invalid session" → Expired or tampered cookie

**Validation Errors:**

- "Invalid email format" → Email validation failed
- "Required field missing" → Missing required input

**Business Logic Errors:**

- "Customer not found" → Invalid customer ID
- "Lead not found or missing email" → Lead lookup failed
- "Database not available" → Database connection error

---

## Rate Limiting

**Current Status:** Not implemented

**Recommended Implementation:**

```typescript
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests, please try again later",
});

app.use("/api/trpc", limiter);
```

---

## Versioning

**Current Version:** 1.0.0

**API Stability:** Unstable (breaking changes expected)

**Deprecation Policy:** Not yet defined

**Future Versioning Strategy:**

- Semantic versioning (MAJOR.MINOR.PATCH)
- Deprecation warnings before breaking changes
- Versioned API endpoints (e.g., `/api/v2/trpc`)

---

## References

This API reference is based on the codebase at https://github.com/TekupDK/tekup-friday, specifically the tRPC router definitions in `server/routers.ts`, `server/customer-router.ts`, and database schema in `drizzle/schema.ts`.

---

**Document Version:** 1.0.0  
**Last Updated:** November 1, 2025  
**Maintained by:** TekupDK Development Team
