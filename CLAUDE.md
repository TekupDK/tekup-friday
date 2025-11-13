# CLAUDE.md - AI Assistant Guide for Friday AI Chat

**Version:** 1.0.0
**Last Updated:** 2025-11-13
**Target:** AI assistants working with the tekup-friday codebase

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack & Architecture](#tech-stack--architecture)
3. [Directory Structure](#directory-structure)
4. [Development Workflows](#development-workflows)
5. [Database Schema](#database-schema)
6. [API Integration Patterns](#api-integration-patterns)
7. [Critical Business Rules](#critical-business-rules)
8. [Code Conventions](#code-conventions)
9. [Common Tasks](#common-tasks)
10. [Deployment Guide](#deployment-guide)
11. [Gotchas & Important Notes](#gotchas--important-notes)

---

## Project Overview

**Friday AI Chat** is a production-ready Shortwave.ai-inspired chat interface built for Rendetalje.dk (Danish cleaning business). It combines AI-powered conversation with unified inbox management, calendar bookings, invoice handling, and lead tracking.

### Key Features
- **AI Chat Interface**: OpenAI GPT-4o-mini with conversation memory
- **Unified Inbox**: Gmail, Billy invoices, Google Calendar, leads, tasks
- **Intent-Based Actions**: 7 automated workflows (lead creation, booking, invoicing, etc.)
- **25 Business Rules**: Embedded MEMORY system for business logic
- **Mobile Responsive**: Desktop split-panel, mobile drawer
- **Self-Hosted**: No external dependencies except APIs (OpenAI, Google, Billy)

### Production Status
- ✅ Live in production for Rendetalje.dk
- ✅ Docker-ready with hot reload for development
- ✅ Full TypeScript type safety
- ⚠️ No automated tests (manual testing via `/login` endpoint)

---

## Tech Stack & Architecture

### Frontend
- **React 19** - Latest features with concurrent rendering
- **TypeScript 5.9** - Strict mode enabled
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **tRPC 11** - End-to-end type-safe API
- **Wouter 3** - Lightweight routing (~1.2KB)
- **Vite 7** - Build tool with HMR

### Backend
- **Express 4** - HTTP server
- **tRPC 11** - Type-safe RPC framework
- **Drizzle ORM** - TypeScript-first MySQL ORM
- **MySQL/TiDB** - Relational database
- **SuperJSON** - Enhanced JSON serialization (handles Date, Map, Set)

### External APIs
- **OpenAI API** - Direct GPT-4o-mini integration (no Manus Forge)
- **Google APIs** - Gmail + Calendar (service account with domain-wide delegation)
- **Billy.dk API** - Invoice management

### Build & Deployment
- **esbuild** - Backend bundling
- **Vite** - Frontend bundling
- **Docker** - Multi-stage production image
- **pnpm** - Package manager

---

## Directory Structure

```
tekup-friday/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/         # UI components
│   │   │   ├── inbox/         # Email, Invoices, Calendar, Leads, Tasks tabs
│   │   │   └── ui/            # Reusable Radix UI components
│   │   ├── contexts/          # React contexts (ThemeContext)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # tRPC client configuration
│   │   ├── pages/             # Page components (ChatInterface, NotFound)
│   │   ├── _core/             # Core frontend utilities (useAuth hook)
│   │   ├── App.tsx            # Main app with routing
│   │   └── main.tsx           # React entry point
│   └── public/                # Static assets
│
├── server/                     # Backend Express + tRPC server
│   ├── _core/                 # Core server infrastructure (rarely changes)
│   │   ├── index.ts          # Express server entry point
│   │   ├── trpc.ts           # tRPC config + middleware (publicProcedure, protectedProcedure)
│   │   ├── context.ts        # Request context creation (auth)
│   │   ├── llm.ts            # OpenAI API integration
│   │   ├── oauth.ts          # OAuth and dev login routes
│   │   ├── env.ts            # Environment variable config
│   │   └── vite.ts           # Vite dev server setup
│   ├── routers.ts             # Main tRPC router (ALL API endpoints)
│   ├── ai-router.ts           # AI routing logic + intent detection
│   ├── intent-actions.ts      # Intent parsing and execution
│   ├── friday-prompts.ts      # System prompts + 25 MEMORY business rules
│   ├── friday-tools.ts        # AI tool definitions (unused - replaced by intents)
│   ├── friday-tool-handlers.ts # Tool execution handlers
│   ├── db.ts                  # Database helper functions
│   ├── google-api.ts          # Gmail + Calendar client
│   ├── billy.ts               # Billy.dk API client
│   ├── billy-sync.ts          # Billy data synchronization
│   ├── customer-db.ts         # Customer profile operations
│   ├── customer-router.ts     # Customer management endpoints
│   ├── title-generator.ts     # AI conversation title generation
│   └── storage.ts             # S3 storage integration
│
├── shared/                     # Shared types and constants
│   ├── types.ts               # Re-exports from Drizzle schema
│   ├── const.ts               # Shared constants (COOKIE_NAME, etc.)
│   └── _core/errors.ts        # Error definitions
│
├── drizzle/                    # Database schema and migrations
│   ├── schema.ts              # 9 table definitions
│   ├── relations.ts           # Table relationships
│   ├── meta/                  # Migration metadata
│   └── migrations/            # SQL migration files
│
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
├── patches/                    # npm package patches (wouter)
├── Dockerfile                  # Production Docker image
├── Dockerfile.dev             # Development image with hot reload
├── docker-compose.yml         # Development environment
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite build config
├── drizzle.config.ts          # Drizzle ORM config
└── package.json               # Dependencies and scripts
```

### Path Aliases
```typescript
"@/*"        → "./client/src/*"
"@shared/*"  → "./shared/*"
```

---

## Development Workflows

### Quick Start (Docker - Recommended)

```bash
# 1. Clone and setup
git clone https://github.com/TekupDK/tekup-friday.git
cd tekup-friday
cp env.template.txt .env  # Edit with your credentials

# 2. Start development environment
docker-compose up -d

# 3. Access application
# Visit http://localhost:3000/login for auto-login in dev mode
```

### Local Development (without Docker)

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp env.template.txt .env  # Edit with your credentials

# 3. Push database schema
pnpm db:push

# 4. Start dev server
pnpm dev
```

### Essential Commands

```bash
pnpm dev          # Start dev server (Vite + Express)
pnpm build        # Build frontend + backend for production
pnpm start        # Start production server
pnpm check        # TypeScript type checking (no emit)
pnpm format       # Format code with Prettier
pnpm db:push      # Generate + run Drizzle migrations
pnpm test         # Run tests (currently no tests)
```

### Environment Variables

**Required:**
```bash
DATABASE_URL=mysql://user:pass@host:port/db?ssl=...
OPENAI_API_KEY=sk-...
JWT_SECRET=<random-32-char-string>
OWNER_OPEN_ID=<your-admin-user-id>
```

**Optional (for full features):**
```bash
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_IMPERSONATED_USER=email@domain.com
GOOGLE_CALENDAR_ID=primary
BILLY_API_KEY=...
BILLY_ORGANIZATION_ID=...
ALLOW_DEV_LOGIN=true  # Enable /login in production
```

### Development Mode Features

- **Auto-login**: Visit `/login` to auto-login as `OWNER_OPEN_ID`
- **Hot Reload**: Frontend (Vite HMR) + Backend (tsx watch)
- **Fallback Auth**: Auto-fallback to owner account if OAuth fails
- **Verbose Logging**: Detailed error messages in console

---

## Database Schema

### Overview: 9 Tables

1. **users** - Authentication and user management
2. **conversations** - Chat threads
3. **messages** - Chat messages with AI responses
4. **emailThreads** - Gmail thread metadata
5. **emailMessages** - Individual Gmail messages
6. **invoices** - Billy invoice references
7. **calendarEvents** - Google Calendar events
8. **leads** - Customer leads pipeline
9. **tasks** - Task management
10. **customerProfiles** - Aggregated customer data
11. **analyticsEvents** - User action tracking

**Additional:** Junction tables for customer relationships (customerInvoices, customerEmails, customerConversations)

### Key Tables Detail

#### users
```typescript
{
  id: int (PK, auto-increment)
  openId: varchar(64) unique       # OAuth identifier
  name: text
  email: varchar(320)
  loginMethod: varchar(64)         # OAuth provider
  role: enum("user", "admin")      # Default: "user"
  createdAt: timestamp
  updatedAt: timestamp
  lastSignedIn: timestamp
}
```

#### conversations
```typescript
{
  id: int (PK)
  userId: int → users.id
  title: varchar(255)              # Auto-generated by AI
  createdAt: timestamp
  updatedAt: timestamp
}
```

#### messages
```typescript
{
  id: int (PK)
  conversationId: int → conversations.id
  role: enum("user", "assistant", "system")
  content: text
  model: varchar(64)               # "gpt-4o-mini", "gemini-2.5-flash", etc.
  attachments: json<{url, name, type}[]>
  metadata: json<Record<string, unknown>>
  createdAt: timestamp
}
```

#### leads
```typescript
{
  id: int (PK)
  userId: int → users.id
  source: varchar(64)              # "gmail", "rengoring.nu", "leadpoint"
  name: varchar(255)
  email: varchar(320)
  phone: varchar(32)
  company: varchar(255)
  score: int                       # 0-100, AI-calculated
  status: enum("new", "contacted", "qualified", "proposal", "won", "lost")
  notes: text
  metadata: json<Record<string, unknown>>
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Database Helper Functions (server/db.ts)

**Pattern:** One function per operation, typed with Drizzle schema

```typescript
// User operations
getUserByOpenId(openId: string): Promise<User | undefined>
upsertUser(user: InsertUser): Promise<void>

// Conversation operations
createConversation(data: InsertConversation): Promise<Conversation>
getUserConversations(userId: number): Promise<Conversation[]>
getConversation(id: number): Promise<Conversation | undefined>
updateConversationTitle(id: number, title: string): Promise<void>

// Message operations
createMessage(data: InsertMessage): Promise<Message>
getConversationMessages(conversationId: number): Promise<Message[]>

// Email operations (instant load pattern)
saveEmailMessages(emails: InsertEmailMessage[]): Promise<void>
getUserEmails(userId: number, limit?: number): Promise<EmailMessage[]>
getEmailByGmailId(gmailMessageId: string): Promise<EmailMessage | null>
markEmailAsRead(gmailMessageId: string, isRead: boolean): Promise<void>

// Invoice, Calendar, Lead, Task operations follow same pattern
```

**Critical:** Database connection is lazy-initialized. If database is unavailable, operations gracefully return `[]` or `null` instead of crashing.

---

## API Integration Patterns

### OpenAI Integration (server/_core/llm.ts)

**Direct API integration** (no Manus Forge):

```typescript
Model: gpt-4o-mini
Endpoint: https://api.openai.com/v1/chat/completions

Function: invokeLLM(params: InvokeParams): Promise<InvokeResult>

Features:
- Message normalization (text, image, file content)
- Tool calling support (currently unused - replaced by intent system)
- Response format control (JSON schema)
- SuperJSON transformer integration
- Error handling with detailed messages
```

**Message Format:**
```typescript
{
  role: "system" | "user" | "assistant" | "tool"
  content: string | Array<TextContent | ImageContent | FileContent>
  name?: string
  tool_call_id?: string
}
```

### Google API Integration (server/google-api.ts)

**Service Account with Domain-Wide Delegation:**

```typescript
Authentication:
- JWT client with service account credentials
- Impersonates GOOGLE_IMPERSONATED_USER
- Scopes: gmail.readonly, gmail.send, gmail.compose, calendar

Gmail Functions:
- searchGmailThreads(query, maxResults)
- searchGmailThreadsByEmail(email)
- getGmailThread(threadId)
- createGmailDraft(to, subject, body)

Calendar Functions:
- listCalendarEvents(timeMin, timeMax, maxResults)
- createCalendarEvent(summary, start, end, description, location)
  ⚠️ CRITICAL: NEVER include attendees parameter (MEMORY_19)
- checkCalendarAvailability(start, end)
- findFreeSlots(startDate, endDate, durationHours)
```

**Email Cache:**
- In-memory cache with 5-minute TTL
- Reduces Gmail API calls
- Falls back to expired cache on rate limits

### Billy.dk Integration (server/billy.ts)

```typescript
Base URL: https://api.billysbilling.com/v2
Authentication: X-Access-Token header

Customer Operations:
- getCustomers()
- getCustomer(contactId)
- createCustomer(name, email, phone)
- searchCustomerByEmail(email)

Invoice Operations:
- getInvoices()
- getInvoicesWithCustomerNames()  # Enriched with customer data
- getInvoice(invoiceId)
- createInvoice(contactId, entryDate, paymentTermsDays, lines)
  ⚠️ CRITICAL: Always creates as "draft" (MEMORY_17)
- updateInvoiceState(invoiceId, state)

Product IDs (Hardcoded):
- REN-001: Fast Rengøring
- REN-002: Hovedrengøring
- REN-003: Flytterengøring
- REN-004: Erhvervsrengøring
- REN-005: Specialopgaver

Pricing: 349 kr/hour/person (MEMORY_17)
```

---

## Critical Business Rules

### The MEMORY System (25 Rules)

**Embedded in system prompts** (server/friday-prompts.ts)

#### Most Critical Memories

**MEMORY_15: Round Hours Only**
```
Calendar bookings ONLY on round hours: 10:00, 10:30, 11:00
NEVER: 10:15, 10:45, etc.
```

**MEMORY_16: Flytterengøring Photos Required**
```
ALWAYS request photos BEFORE sending flytterengøring quote:
1. Kitchen (oven, hood, cabinets)
2. Bathroom (tiles, joints, shower)
3. Problem areas

BLOCK quote sending until photos received.
```

**MEMORY_17: Invoice Drafts Only**
```
NEVER auto-approve invoices - ALWAYS create as "draft"
Pricing: 349 kr/hour/person
User must manually approve in Billy.dk
```

**MEMORY_19: No Calendar Attendees**
```
NEVER add attendees to Google Calendar events
Prevents automatic email invitations to customers
Owner manages invites manually
```

**MEMORY_24: Job Completion Checklist**
```
6-step checklist before marking job complete:
1. Invoice created?
2. Which team (Jonas+Rawan / Jonas+FB)?
3. Payment method (MobilePay 71759 / Bank)?
4. Actual work hours?
5. Update calendar event with details
6. Remove email labels (INBOX, IMPORTANT)
```

### Intent-Based Action System

**7 Intent Types** (server/intent-actions.ts)

Replaces traditional tool calling due to Gemini API limitations:

1. **create_lead** - Extract contact info from messages
2. **create_task** - Parse Danish date/time + priority
3. **book_meeting** - Extract participant, date, time, job type
4. **create_invoice** - Extract customer, hours, job type
5. **search_email** - Extract from, subject, time range
6. **request_flytter_photos** - Trigger MEMORY_16 workflow
7. **job_completion** - Trigger MEMORY_24 checklist

**Flow:**
```typescript
1. parseIntent(message) → { intent, params, confidence }
2. If confidence > 0.7 && requireApproval:
   → Create PendingAction
   → Show ActionApprovalModal (frontend)
   → Wait for user approval
3. If approved:
   → executeAction(intent, userId)
   → Return ActionResult
4. Frontend displays result in chat
```

**Parameter Extraction Patterns:**
- Regex matching for structured data (email, phone, dates)
- Danish weekday mapping (mandag → Monday, tirsdag → Tuesday)
- Time parsing (kl 14:00 → 14:00)
- Round hour enforcement (MEMORY_15)

---

## Code Conventions

### Naming Conventions

- **PascalCase**: React components, TypeScript types
  - `ChatInterface`, `User`, `InvokeParams`
- **camelCase**: Functions, variables, database columns
  - `getUserByOpenId`, `conversationId`, `createdAt`
- **kebab-case**: File names, CSS classes
  - `chat-panel.tsx`, `bg-background`
- **SCREAMING_SNAKE_CASE**: Constants, environment variables
  - `COOKIE_NAME`, `OPENAI_API_KEY`, `MEMORY_17`

### File Organization

- **_core directories**: Framework/infrastructure code (rarely changes)
  - `server/_core/`: Express, tRPC, auth, LLM
  - `client/src/_core/`: Hooks, utilities
- **Feature files**: Business logic (changes frequently)
  - `server/routers.ts`, `server/ai-router.ts`
  - `client/src/components/ChatPanel.tsx`
- **Shared types**: Single source of truth from Drizzle schema
  - `drizzle/schema.ts` → `shared/types.ts` → frontend/backend

### Type Safety Pattern

**End-to-end type safety with tRPC:**

```typescript
// 1. Define schema (drizzle/schema.ts)
export const users = mysqlTable("users", { ... });
export type User = typeof users.$inferSelect;

// 2. Backend router (server/routers.ts)
export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
  }),
});
export type AppRouter = typeof appRouter;

// 3. Frontend client (client/src/main.tsx)
import type { AppRouter } from '../../../server/routers';
export const trpc = createTRPCReact<AppRouter>();

// 4. Usage - fully typed
const { data: user } = trpc.auth.me.useQuery();
// user is inferred as User | null
```

### Error Handling

**Frontend:**
- Global error handler in `main.tsx` (Query/Mutation cache)
- Automatic redirect to login on `UNAUTHED_ERR_MSG`
- Toast notifications for user-facing errors
- Console logging for debugging

**Backend:**
- Try-catch with detailed error messages
- Database unavailable fallbacks (returns `[]`)
- API error wrapping with context
- Console.error for logging

**Database:**
- Lazy connection (only when needed)
- Graceful degradation if unavailable
- Typed errors with Drizzle schema

---

## Common Tasks

### Add a New Intent

1. **Define intent type** (`server/intent-actions.ts`):
   ```typescript
   export type Intent =
     | "create_lead"
     | "your_new_intent"
     | ...;
   ```

2. **Add parsing logic** (`parseIntent()` function):
   ```typescript
   if (message.includes("your trigger phrase")) {
     return {
       intent: "your_new_intent",
       params: { extractedParam: ... },
       confidence: 0.8,
     };
   }
   ```

3. **Add execution logic** (`executeAction()` switch):
   ```typescript
   case "your_new_intent":
     const result = await yourImplementation(params, userId);
     return { success: true, message: result };
   ```

4. **Update PendingAction type** (`server/ai-router.ts`):
   ```typescript
   interface PendingAction {
     type: 'create_lead' | 'your_new_intent' | ...;
     ...
   }
   ```

5. **Update ActionApprovalModal** (`client/src/components/ActionApprovalModal.tsx`):
   - Add icon mapping
   - Add action label

### Add a New tRPC Endpoint

1. **Add procedure** to `appRouter` (`server/routers.ts`):
   ```typescript
   export const appRouter = router({
     yourFeature: router({
       yourProcedure: protectedProcedure
         .input(z.object({ param: z.string() }))
         .query(async ({ input, ctx }) => {
           // Implementation
           return result;
         }),
     }),
   });
   ```

2. **Use in frontend**:
   ```typescript
   const { data } = trpc.yourFeature.yourProcedure.useQuery({ param: "value" });
   ```

Type safety flows automatically via tRPC!

### Add a New Database Table

1. **Define schema** (`drizzle/schema.ts`):
   ```typescript
   export const yourTable = mysqlTable("your_table", {
     id: int("id").primaryKey().autoincrement(),
     userId: int("user_id").notNull().references(() => users.id),
     name: varchar("name", { length: 255 }),
     createdAt: timestamp("created_at").defaultNow(),
   });

   export type YourTable = typeof yourTable.$inferSelect;
   export type InsertYourTable = typeof yourTable.$inferInsert;
   ```

2. **Run migration**:
   ```bash
   pnpm db:push
   ```

3. **Add helper functions** (`server/db.ts`):
   ```typescript
   export async function createYourRecord(data: InsertYourTable) {
     await db.insert(yourTable).values(data);
   }

   export async function getYourRecords(userId: number) {
     return db.select().from(yourTable).where(eq(yourTable.userId, userId));
   }
   ```

4. **Export types** (`shared/types.ts`):
   ```typescript
   export type { YourTable, InsertYourTable } from "../drizzle/schema";
   ```

### Add a New UI Component

1. **Create component** (`client/src/components/YourComponent.tsx`):
   ```typescript
   import { trpc } from "@/lib/trpc";

   export function YourComponent() {
     const { data } = trpc.yourEndpoint.useQuery();
     return <div>{data?.name}</div>;
   }
   ```

2. **Use in page** (`client/src/pages/ChatInterface.tsx`):
   ```typescript
   import { YourComponent } from "@/components/YourComponent";

   <YourComponent />
   ```

### Add a New MEMORY Rule

1. **Add to prompts** (`server/friday-prompts.ts`):
   ```typescript
   export const FRIDAY_MAIN_PROMPT = `
   ...
   MEMORY_26: Your new business rule
   - Detailed explanation
   - Examples
   - Critical warnings
   `;
   ```

2. **Document in README** (`README.md`):
   - Add to "25 MEMORY Business Rules" section

3. **Update intent detection** if rule triggers automated actions
   - Add new intent type if needed
   - Update parsing logic

---

## Deployment Guide

### Pre-Deployment Checklist

```bash
✅ Environment Variables:
  - DATABASE_URL configured and tested
  - OPENAI_API_KEY valid
  - JWT_SECRET generated (openssl rand -base64 32)
  - OWNER_OPEN_ID set
  - BILLY_API_KEY and BILLY_ORGANIZATION_ID (if using Billy)
  - GOOGLE_SERVICE_ACCOUNT_KEY (if using Google APIs)

✅ Database:
  - Schema pushed: pnpm db:push
  - Migrations run successfully
  - Connection tested from production environment

✅ Build:
  - Frontend builds: vite build
  - Backend builds: esbuild
  - No TypeScript errors: pnpm check
  - Production assets in dist/

✅ Docker:
  - Image builds: docker build -t friday-ai .
  - Container starts: docker run
  - Health check passes: curl http://localhost:3000/

✅ Security:
  - JWT_SECRET is strong and unique
  - ALLOW_DEV_LOGIN=false in production
  - Database uses SSL connection
  - Cookies are Secure and HttpOnly
```

### Docker Production Deployment

```bash
# 1. Build image
docker build -t friday-ai .

# 2. Run container
docker run -d \
  -p 3000:3000 \
  --name friday-ai \
  --env-file .env \
  friday-ai

# 3. Check logs
docker logs -f friday-ai

# 4. Health check
curl http://localhost:3000/
```

### Direct Node.js Deployment

```bash
# 1. Build
pnpm build

# 2. Run
NODE_ENV=production PORT=3000 node dist/index.js
```

### Environment-Specific Behavior

**Development (`NODE_ENV=development`):**
- `/login` endpoint enabled by default
- Vite dev server with HMR
- Auto-fallback to owner account if OAuth fails
- Verbose error logging

**Production (`NODE_ENV=production`):**
- `/login` disabled unless `ALLOW_DEV_LOGIN=true`
- Static file serving from `dist/public/`
- Minified assets
- Health check at `/`

---

## Gotchas & Important Notes

### Critical Gotchas

1. **NEVER Add Calendar Attendees (MEMORY_19)**
   ```typescript
   // ❌ WRONG
   createCalendarEvent({ attendees: [...] })

   // ✅ CORRECT
   createCalendarEvent({ /* NO attendees parameter */ })
   ```

2. **Always Create Invoice Drafts (MEMORY_17)**
   ```typescript
   // ❌ WRONG
   createInvoice({ state: "approved" })

   // ✅ CORRECT
   createInvoice({ /* state defaults to "draft" */ })
   ```

3. **Round Calendar Hours (MEMORY_15)**
   ```typescript
   // ❌ WRONG: 10:15, 10:45
   // ✅ CORRECT: 10:00, 10:30, 11:00
   ```

4. **Flytterengøring Photos First (MEMORY_16)**
   - Always request photos before sending quote
   - Block quote sending until photos received

5. **Database Connection is Lazy**
   - Database only connects when first used
   - If unavailable, operations return `[]` or `null`
   - Don't assume database is always available

6. **SuperJSON Transformer**
   - tRPC uses SuperJSON for serialization
   - Handles `Date`, `Map`, `Set`, `undefined`, `BigInt`
   - Frontend automatically deserializes

7. **Path Aliases**
   - Use `@/` for client imports
   - Use `@shared/` for shared types
   - Don't use relative paths like `../../../`

8. **Intent vs. Tool Calling**
   - Project uses **intent-based actions**, NOT tool calling
   - Gemini API limitations led to custom intent system
   - Tools defined in `friday-tools.ts` are unused

9. **Email Instant Load Pattern**
   - Frontend loads from database FIRST (instant)
   - Background sync via manual trigger or scheduled job
   - Never wait for Gmail API on page load

10. **Conversation Title Generation**
    - Automatic after first message
    - Asynchronous (non-blocking)
    - Frontend polls for updates every 3 seconds

### Development Tips

- **Hot Reload**: Docker dev environment preserves `node_modules` in container
- **Auto-Login**: Visit `/login` in dev mode for instant access
- **Type Checking**: Run `pnpm check` before committing
- **Database Schema**: Always run `pnpm db:push` after schema changes
- **Frontend Errors**: Check browser console + Network tab
- **Backend Errors**: Check terminal logs (tsx watch output)

### Testing

**No automated tests currently.** Manual testing via:
1. `/login` endpoint for development access
2. tRPC client in browser console
3. Intent detection validation in chat interface
4. STATUS.md documents tested workflows

**Tested Workflows (3/7):**
- ✅ Lead creation with flytterengøring (MEMORY_16)
- ✅ Task creation with Danish parsing
- ✅ Calendar booking

**Pending Tests:**
- ⏳ Invoice creation via Billy API
- ⏳ Gmail search for duplicate leads
- ⏳ Job completion checklist
- ⏳ Photo request blocking

### Performance Considerations

- **Email Cache**: 5-minute TTL to reduce Gmail API calls
- **Database Query Limits**: `getUserEmails(userId, 50)` limits to 50 recent
- **Conversation Limit**: Frontend shows 50 most recent conversations
- **Message Batch**: tRPC uses batch link for multiple queries
- **Build Optimization**: Vite code-splitting for faster loads

---

## Quick Reference

### Most Important Files

1. **server/routers.ts** - ALL API endpoints
2. **server/ai-router.ts** - AI routing + intent detection
3. **server/intent-actions.ts** - Intent parsing + execution
4. **server/friday-prompts.ts** - 25 MEMORY business rules
5. **drizzle/schema.ts** - Complete database schema
6. **client/src/components/ChatPanel.tsx** - Main chat UI
7. **client/src/components/ActionApprovalModal.tsx** - Action approval
8. **server/google-api.ts** - Gmail + Calendar integration
9. **server/billy.ts** - Billy.dk integration
10. **server/_core/llm.ts** - OpenAI API client

### Key Endpoints (tRPC)

```typescript
// Authentication
trpc.auth.me.useQuery()                    # Get current user
trpc.auth.logout.useMutation()             # Logout

// Chat
trpc.chat.list.useQuery()                  # Get conversations
trpc.chat.get.useQuery({ id })             # Get conversation + messages
trpc.chat.sendMessage.useMutation()        # Send message + AI response
trpc.chat.executeAction.useMutation()      # Execute approved action

// Inbox - Email
trpc.inbox.email.list.useQuery()           # Get emails from DB (instant)
trpc.inbox.email.sync.useMutation()        # Sync from Gmail (background)

// Inbox - Invoices
trpc.inbox.invoices.list.useQuery()        # Get Billy invoices

// Inbox - Calendar
trpc.inbox.calendar.list.useQuery()        # Get calendar events
trpc.inbox.calendar.create.useMutation()   # Create event (NO attendees!)

// Inbox - Leads
trpc.inbox.leads.list.useQuery()           # Get leads
trpc.inbox.leads.create.useMutation()      # Create lead

// Inbox - Tasks
trpc.inbox.tasks.list.useQuery()           # Get tasks
trpc.inbox.tasks.create.useMutation()      # Create task
```

### Environment Variables Quick Reference

```bash
# Required
DATABASE_URL=mysql://...
OPENAI_API_KEY=sk-...
JWT_SECRET=...
OWNER_OPEN_ID=...

# Optional
GOOGLE_SERVICE_ACCOUNT_KEY=...
GOOGLE_IMPERSONATED_USER=...
GOOGLE_CALENDAR_ID=...
BILLY_API_KEY=...
BILLY_ORGANIZATION_ID=...
ALLOW_DEV_LOGIN=true
```

### Common Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm check                  # Type check
pnpm format                 # Format code

# Database
pnpm db:push                # Push schema changes
# pnpm db:studio            # Open Drizzle Studio (if configured)

# Build & Deploy
pnpm build                  # Build for production
pnpm start                  # Start production server
docker-compose up -d        # Start Docker dev environment
docker build -t friday-ai . # Build production image
```

---

## Support & Contributing

**Repository:** https://github.com/TekupDK/tekup-friday
**Issues:** https://github.com/TekupDK/tekup-friday/issues
**License:** MIT
**Owner:** TekupDK (Rendetalje.dk)

**For AI Assistants:**
- Always check this CLAUDE.md before making changes
- Respect the 25 MEMORY business rules
- Use intent-based actions (not tool calling)
- Test manually via `/login` endpoint
- Document new features in README.md
- Update CLAUDE.md when architecture changes

---

**Last Updated:** 2025-11-13
**Document Version:** 1.0.0
**Maintained by:** AI assistants working with tekup-friday
