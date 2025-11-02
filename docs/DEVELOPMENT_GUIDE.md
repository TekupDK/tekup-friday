# Friday AI Chat - Development Guide for Cursor IDE

**Author:** Manus AI  
**Last Updated:** November 1, 2025  
**Version:** 1.0.0

## Overview

This guide provides comprehensive instructions for continuing development of Friday AI Chat in Cursor IDE. It covers local setup, development workflow, testing strategies, deployment procedures, and best practices specific to this codebase.

## Prerequisites

Before starting development, ensure you have the following installed on your local machine:

**Required Software:**
- Node.js 22.13.0 or later (LTS recommended)
- pnpm 9.x or later (package manager)
- Git 2.x or later
- MySQL 8.0 or compatible database (TiDB Cloud recommended)
- Cursor IDE (latest version)

**Optional Tools:**
- GitHub CLI (`gh`) for repository management
- Drizzle Kit for database migrations
- Postman or similar for API testing

## Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/TekupDK/tekup-friday.git
cd tekup-friday
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all frontend and backend dependencies defined in `package.json`.

### 3. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# Manus OAuth
JWT_SECRET=your-jwt-secret-here
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
OWNER_OPEN_ID=your-owner-openid
OWNER_NAME=Your Name

# Google Workspace
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GOOGLE_IMPERSONATED_USER=info@rendetalje.dk
GOOGLE_CALENDAR_ID=primary

# Billy.dk
BILLY_API_KEY=your-billy-api-key
BILLY_ORGANIZATION_ID=your-org-id

# Manus AI Services
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im

# Gemini API (optional, for local testing)
GEMINI_API_KEY=your-gemini-api-key

# OpenAI API (optional, for local testing)
OPENAI_API_KEY=your-openai-api-key

# App Branding
VITE_APP_TITLE=Friday
VITE_APP_LOGO=https://your-logo-url.com/logo.png

# Analytics (optional)
VITE_ANALYTICS_WEBSITE_ID=your-website-id
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
```

**Important Notes:**
- Never commit `.env` file to version control
- Use `.env.example` as a template for team members
- Production environment variables are managed by Manus platform

### 4. Initialize Database

Run database migrations to create all tables:

```bash
pnpm db:push
```

This command executes two steps:
1. `drizzle-kit generate` - Generates SQL migration files
2. `drizzle-kit migrate` - Applies migrations to database

**Expected Output:**
```
13 tables
analytics_events 5 columns 0 indexes 0 fks
calendar_events 11 columns 0 indexes 0 fks
conversations 5 columns 0 indexes 0 fks
customer_conversations 4 columns 0 indexes 0 fks
customer_emails 9 columns 0 indexes 0 fks
customer_invoices 13 columns 0 indexes 0 fks
customer_profiles 18 columns 0 indexes 0 fks
email_threads 11 columns 0 indexes 0 fks
invoices 11 columns 0 indexes 0 fks
leads 13 columns 0 indexes 0 fks
messages 8 columns 0 indexes 0 fks
tasks 10 columns 0 indexes 0 fks
users 9 columns 0 indexes 0 fks
[✓] migrations applied successfully!
```

### 5. Start Development Server

```bash
pnpm dev
```

The server will start on `http://localhost:3000` with hot-reload enabled.

**Expected Console Output:**
```
[11:54:48] > tekup-friday@1.0.0 dev
[11:54:48] > NODE_ENV=development tsx watch server/_core/index.ts
[11:54:50] [OAuth] Initialized with baseURL: https://api.manus.im
[11:54:52] Server running on http://localhost:3000/
```

## Project Structure

Understanding the codebase organization is crucial for efficient development:

```
tekup-friday/
├── client/                    # Frontend React application
│   ├── public/                # Static assets (served at root)
│   ├── src/
│   │   ├── _core/             # Core utilities (do not edit)
│   │   ├── components/        # React components
│   │   │   ├── inbox/         # Inbox tab components
│   │   │   └── ui/            # shadcn/ui components
│   │   ├── contexts/          # React contexts
│   │   ├── hooks/             # Custom hooks
│   │   ├── lib/               # Client libraries
│   │   │   └── trpc.ts        # tRPC client setup
│   │   ├── pages/             # Page components
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # React entry point
│   │   └── index.css          # Global styles
│   ├── index.html             # HTML template
│   └── vite.config.ts         # Vite configuration
├── server/                    # Backend Express application
│   ├── _core/                 # Core framework (do not edit)
│   ├── ai-router.ts           # AI model routing
│   ├── billy-sync.ts          # Billy.dk synchronization
│   ├── customer-db.ts         # Customer database helpers
│   ├── customer-router.ts     # Customer API endpoints
│   ├── db.ts                  # Database helpers
│   ├── friday-tool-handlers.ts # Tool implementations
│   ├── google-api.ts          # Google Workspace integration
│   ├── intent-actions.ts      # Intent parsing and execution
│   ├── mcp.ts                 # MCP client utilities
│   └── routers.ts             # Main tRPC router
├── drizzle/                   # Database schema and migrations
│   ├── schema.ts              # Table definitions
│   └── migrations/            # Generated SQL migrations
├── shared/                    # Shared constants and types
│   └── const.ts               # Shared constants
├── storage/                   # S3 storage helpers
│   └── index.ts               # Storage utilities
├── docs/                      # Documentation (this folder)
│   ├── ARCHITECTURE.md        # System architecture
│   ├── API_REFERENCE.md       # API documentation
│   ├── DEVELOPMENT_GUIDE.md   # This file
│   └── CURSOR_RULES.md        # Cursor AI rules
├── drizzle.config.ts          # Drizzle ORM configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── vite.config.ts             # Vite build configuration
└── README.md                  # Project overview
```

**Key Directories:**

**DO NOT EDIT:**
- `client/src/_core/` - Framework-level code managed by Manus
- `server/_core/` - OAuth, context, and server setup

**EDIT FREELY:**
- `client/src/components/` - UI components
- `client/src/pages/` - Page-level components
- `server/*.ts` - Business logic and API endpoints
- `drizzle/schema.ts` - Database schema

## Development Workflow

### Feature Development Process

The recommended workflow for adding new features follows these steps:

**1. Update TODO List**

Before implementing any feature, add it to `todo.md`:

```markdown
## 🆕 NEW FEATURE NAME

### Description
Brief description of the feature

### Tasks
- [ ] Update database schema if needed
- [ ] Create backend endpoints
- [ ] Build frontend UI
- [ ] Test integration
- [ ] Update documentation
```

**2. Database Schema Changes**

If the feature requires new tables or columns:

```bash
# Edit drizzle/schema.ts
# Add new table or modify existing table

# Generate and apply migration
pnpm db:push
```

**Example: Adding a new table**

```typescript
// drizzle/schema.ts
export const newTable = mysqlTable("new_table", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NewTable = typeof newTable.$inferSelect;
export type InsertNewTable = typeof newTable.$inferInsert;
```

**3. Backend Implementation**

Create database helpers in `server/db.ts` or dedicated file:

```typescript
// server/db.ts
export async function createNewRecord(data: InsertNewTable) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(newTable).values(data);
  return result;
}

export async function getNewRecords(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(newTable).where(eq(newTable.userId, userId));
}
```

Add tRPC procedures in `server/routers.ts`:

```typescript
// server/routers.ts
export const appRouter = router({
  // ... existing routers
  
  newFeature: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getNewRecords(ctx.user.id);
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return await createNewRecord({
          userId: ctx.user.id,
          name: input.name,
        });
      }),
  }),
});
```

**4. Frontend Implementation**

Create UI component in `client/src/components/`:

```tsx
// client/src/components/NewFeature.tsx
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";

export default function NewFeature() {
  const { data, isLoading } = trpc.newFeature.list.useQuery();
  const createMutation = trpc.newFeature.create.useMutation();
  
  const handleCreate = async () => {
    await createMutation.mutateAsync({ name: "Test" });
    // Invalidate query to refresh list
    trpc.useUtils().newFeature.list.invalidate();
  };
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <Button onClick={handleCreate}>Create New</Button>
      {data?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
}
```

**5. Testing**

Test the feature manually:

```bash
# Start dev server
pnpm dev

# Open http://localhost:3000
# Test feature functionality
# Check browser console for errors
# Verify database updates
```

**6. Mark Complete**

Update `todo.md` to mark tasks as complete:

```markdown
- [x] Update database schema if needed
- [x] Create backend endpoints
- [x] Build frontend UI
- [x] Test integration
- [ ] Update documentation
```

### TypeScript Compilation

Always check for TypeScript errors before committing:

```bash
pnpm tsc --noEmit
```

**Expected Output (no errors):**
```
(No output means success)
```

**If errors exist:**
```
client/src/components/Example.tsx(10,5): error TS2339: Property 'foo' does not exist on type 'Bar'.
```

Fix all errors before proceeding.

### Code Style

The project uses TypeScript strict mode and follows these conventions:

**Naming Conventions:**
- Files: `kebab-case.tsx` or `PascalCase.tsx` for components
- Variables: `camelCase`
- Types/Interfaces: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Database columns: `camelCase` (matches TypeScript)

**Import Order:**
1. External libraries (React, tRPC, etc.)
2. Internal components
3. UI components (`@/components/ui/*`)
4. Utilities and hooks
5. Types and constants

**Example:**
```typescript
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";
```

## Invoices Tab — UX & Observability Patterns

This section documents the conventions and a small, incremental improvement plan for `InvoicesTab` to align with the patterns used across Inbox modules (Leads, Calendar).

### Goals
- Improve scannability and prioritization (color accents, compact stats)
- Enhance filtering and sorting to handle larger lists efficiently
- Provide export and quick navigation to customer context
- Maintain robust logging for debugging and operations

### Logging Conventions
- Always log a high-level summary when data loads:
  - `[InvoicesTab] Total invoices: <n>`
  - `[InvoicesTab] Invoices with customer names: <m>/<n>`
- When filters or sorting change, log:
  - `[InvoicesTab] Filters active: { status, amount, dateRange, sortBy }`
  - `[InvoicesTab] Filtered result: <n>`

### UI Conventions
- Border-left 4px accent on cards based on `state`:
  - `paid`: green, `sent`: blue, `approved`: amber, `draft`: gray, `overdue`: red
- Compact stats header at the top with key KPIs:
  - Total, Paid, Sent, Draft, Overdue counts
  - Total Amount Due (sum of unpaid), Overdue Amount
- Use `ScrollArea` around long lists for smoother scrolling
- Keep actions visible: Analyze (AI), Export CSV, Open Customer Profile (if resolvable)

### Small Tasks (Incremental Plan)
1) Stats summary header
  - Add cards for: Total, Paid, Sent, Draft, Overdue, Amount Due, Overdue Amount
  - Acceptance: Stats reflect total dataset by default (can add toggle to show filtered later)

2) Border-left accent by state
  - 4px left border colored by invoice state for quick scanning
  - Acceptance: Colors match the palette used elsewhere (Leads/Calendar)

3) ScrollArea for long lists
  - Wrap invoice list in `ScrollArea` with responsive height
  - Acceptance: No layout shift; scroll behaves smoothly on long lists

4) Sort dropdown
  - Options: Entry Date (desc default), Amount, Status, Customer Name
  - Acceptance: Visible active sort; stable ordering changes with selection

5) Amount and date filters
  - Min/Max amount inputs and a date range picker for Entry Date
  - Acceptance: Filters compose with search and status; logs reflect active filters

6) Export filtered CSV
  - Export current filtered set (not just individual invoice) to CSV
  - Acceptance: File contains headers and one row per invoice with key fields

7) Link to Customer Profile
  - Add a button on each invoice row to open customer context (if resolvable)
  - Strategy: resolve by `customerName`/`contactId` -> profile; fallback: search dialog
  - Acceptance: Opens profile modal or provides a clear fallback

### Acceptance Criteria (Global)
- No TypeScript errors; UI behaves responsively
- Logs are concise and informative; no spam
- Filters, search, and sorting compose without surprises
- Exported data matches current list view when applicable

### Rollout Notes
- Prefer phased PRs (one or two tasks per PR) to minimize conflicts
- Keep styles consistent with shadcn/ui and existing components
- Avoid backend changes unless strictly necessary; compute KPIs client-side first


## Database Management

### Schema Modifications

When modifying the database schema, follow this workflow:

**1. Edit Schema File**

```typescript
// drizzle/schema.ts
export const users = mysqlTable("users", {
  // ... existing columns
  newColumn: varchar("newColumn", { length: 255 }), // Add new column
});
```

**2. Generate Migration**

```bash
pnpm db:push
```

This generates a migration file in `drizzle/migrations/` and applies it immediately.

**3. Verify Changes**

Check the database to ensure the migration was applied:

```sql
DESCRIBE users;
```

### Data Seeding

For development, you may need to seed the database with test data:

```typescript
// scripts/seed.ts
import { getDb } from "../server/db";
import { users, leads } from "../drizzle/schema";

async function seed() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Insert test users
  await db.insert(users).values([
    { openId: "test1", name: "Test User 1", email: "test1@example.com" },
    { openId: "test2", name: "Test User 2", email: "test2@example.com" },
  ]);
  
  // Insert test leads
  await db.insert(leads).values([
    { userId: 1, source: "website", name: "John Doe", email: "john@example.com" },
    { userId: 1, source: "referral", name: "Jane Smith", email: "jane@example.com" },
  ]);
  
  console.log("Database seeded successfully");
}

seed().catch(console.error);
```

Run the seed script:

```bash
tsx scripts/seed.ts
```

### Database Queries

Use Drizzle ORM for all database operations:

**Select:**
```typescript
const users = await db.select().from(usersTable);
const user = await db.select().from(usersTable).where(eq(usersTable.id, 1));
```

**Insert:**
```typescript
await db.insert(usersTable).values({ openId: "123", name: "John" });
```

**Update:**
```typescript
await db.update(usersTable).set({ name: "Jane" }).where(eq(usersTable.id, 1));
```

**Delete:**
```typescript
await db.delete(usersTable).where(eq(usersTable.id, 1));
```

**Joins:**
```typescript
const result = await db
  .select()
  .from(conversations)
  .leftJoin(messages, eq(conversations.id, messages.conversationId));
```

## API Development

### Creating New Endpoints

Follow this pattern for adding new tRPC endpoints:

**1. Define Input Schema**

```typescript
import { z } from "zod";

const createLeadInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string(),
});
```

**2. Create Procedure**

```typescript
export const appRouter = router({
  leads: router({
    create: protectedProcedure
      .input(createLeadInput)
      .mutation(async ({ ctx, input }) => {
        // Validate business logic
        if (!input.email && !input.phone) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Either email or phone is required",
          });
        }
        
        // Execute database operation
        const lead = await createLead({
          userId: ctx.user.id,
          ...input,
        });
        
        // Track analytics
        await trackEvent({
          userId: ctx.user.id,
          eventType: "lead_created",
          eventData: { leadId: lead.id },
        });
        
        return lead;
      }),
  }),
});
```

**3. Use in Frontend**

```typescript
const createLeadMutation = trpc.leads.create.useMutation({
  onSuccess: () => {
    // Invalidate leads list to refresh
    trpc.useUtils().leads.list.invalidate();
    toast.success("Lead created successfully");
  },
  onError: (error) => {
    toast.error(error.message);
  },
});

await createLeadMutation.mutateAsync({
  name: "John Doe",
  email: "john@example.com",
  source: "website",
});
```

### Error Handling

Use appropriate tRPC error codes:

```typescript
import { TRPCError } from "@trpc/server";

// Unauthorized (401)
throw new TRPCError({
  code: "UNAUTHORIZED",
  message: "You must be logged in",
});

// Forbidden (403)
throw new TRPCError({
  code: "FORBIDDEN",
  message: "You don't have permission",
});

// Not Found (404)
throw new TRPCError({
  code: "NOT_FOUND",
  message: "Resource not found",
});

// Bad Request (400)
throw new TRPCError({
  code: "BAD_REQUEST",
  message: "Invalid input data",
});

// Internal Server Error (500)
throw new TRPCError({
  code: "INTERNAL_SERVER_ERROR",
  message: "Something went wrong",
});
```

## Frontend Development

### Component Guidelines

Follow these patterns for React components:

**Functional Components:**
```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  onSubmit: (value: string) => void;
}

export default function MyComponent({ title, onSubmit }: Props) {
  const [value, setValue] = useState("");
  
  return (
    <div>
      <h2>{title}</h2>
      <input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button onClick={() => onSubmit(value)}>Submit</Button>
    </div>
  );
}
```

**tRPC Hooks:**
```tsx
// Query (GET)
const { data, isLoading, error } = trpc.leads.list.useQuery();

// Mutation (POST/PUT/DELETE)
const createMutation = trpc.leads.create.useMutation({
  onSuccess: () => {
    trpc.useUtils().leads.list.invalidate();
  },
});

await createMutation.mutateAsync({ name: "John" });
```

**Optimistic Updates:**
```tsx
const updateMutation = trpc.leads.updateStatus.useMutation({
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await trpc.useUtils().leads.list.cancel();
    
    // Snapshot current value
    const previous = trpc.useUtils().leads.list.getData();
    
    // Optimistically update
    trpc.useUtils().leads.list.setData(undefined, (old) =>
      old?.map(lead =>
        lead.id === newData.leadId
          ? { ...lead, status: newData.status }
          : lead
      )
    );
    
    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    trpc.useUtils().leads.list.setData(undefined, context?.previous);
  },
  onSettled: () => {
    // Refetch after mutation
    trpc.useUtils().leads.list.invalidate();
  },
});
```

### Styling with Tailwind

Use Tailwind utility classes for styling:

**Responsive Design:**
```tsx
<div className="p-4 sm:p-6 md:p-8 lg:p-12">
  {/* Padding increases on larger screens */}
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

**Dark Mode:**
```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  {/* Automatic dark mode support */}
</div>
```

**Custom Classes:**

Edit `client/src/index.css` for global styles:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other CSS variables */
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... other CSS variables */
  }
}
```

### shadcn/ui Components

The project uses shadcn/ui for UI components. To add new components:

```bash
npx shadcn-ui@latest add dialog
```

This adds the component to `client/src/components/ui/dialog.tsx`.

**Usage:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content here</p>
  </DialogContent>
</Dialog>
```

## AI Integration

### Adding New Tools

To add a new tool for the AI to use:

**1. Define Tool Schema**

```typescript
// server/friday-tool-handlers.ts
const newToolSchema = {
  name: "new_tool",
  description: "Description of what the tool does",
  parameters: {
    type: "object",
    properties: {
      param1: {
        type: "string",
        description: "Description of param1",
      },
      param2: {
        type: "number",
        description: "Description of param2",
      },
    },
    required: ["param1"],
  },
};
```

**2. Implement Tool Handler**

```typescript
// server/friday-tool-handlers.ts
export async function handleNewTool(args: { param1: string; param2?: number }) {
  // Implement tool logic
  const result = await someOperation(args.param1, args.param2);
  
  return {
    success: true,
    data: result,
  };
}
```

**3. Register Tool**

```typescript
// server/friday-tool-handlers.ts
export const FRIDAY_TOOLS = [
  // ... existing tools
  newToolSchema,
];

export async function executeFridayTool(toolName: string, args: any) {
  switch (toolName) {
    // ... existing cases
    case "new_tool":
      return await handleNewTool(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

### Adding New Intents

To add a new intent for the AI to recognize:

**1. Define Intent Type**

```typescript
// server/intent-actions.ts
export type Intent =
  | { intent: "search_gmail"; params: { query: string } }
  | { intent: "new_intent"; params: { param1: string } } // Add new intent
  | // ... other intents
```

**2. Implement Intent Action**

```typescript
// server/intent-actions.ts
export async function executeAction(intent: Intent, userId: number): Promise<ActionResult> {
  switch (intent.intent) {
    // ... existing cases
    
    case "new_intent":
      const result = await handleNewIntent(intent.params, userId);
      return {
        success: true,
        message: "Intent executed successfully",
        data: result,
      };
    
    default:
      return {
        success: false,
        message: `Unknown intent: ${intent.intent}`,
      };
  }
}
```

**3. Update Intent Parser**

The AI will automatically recognize the new intent if you update the system prompt in `ai-router.ts` to include examples of the new intent.

## Testing

### Manual Testing

**1. Start Development Server**

```bash
pnpm dev
```

**2. Test in Browser**

Open `http://localhost:3000` and test features manually.

**3. Check Browser Console**

Open DevTools (F12) and check for errors in the Console tab.

**4. Verify Database**

Connect to your database and verify data changes:

```sql
SELECT * FROM leads ORDER BY createdAt DESC LIMIT 10;
```

### Automated Testing (Future)

The project does not currently have automated tests. Recommended setup:

**Unit Tests (Vitest):**

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

**Example Test:**
```typescript
// client/src/components/__tests__/Button.test.tsx
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});
```

**Integration Tests (Playwright):**

```bash
pnpm add -D @playwright/test
```

**Example Test:**
```typescript
// e2e/login.spec.ts
import { test, expect } from "@playwright/test";

test("user can log in", async ({ page }) => {
  await page.goto("http://localhost:3000");
  await page.click("text=Login");
  await expect(page).toHaveURL(/auth\.manus\.im/);
});
```

## Debugging

### Backend Debugging

**Console Logging:**
```typescript
console.log("[Debug] User ID:", userId);
console.error("[Error] Failed to create lead:", error);
```

**Cursor Debugger:**

1. Open Cursor IDE
2. Set breakpoint in `server/*.ts` file
3. Press F5 to start debugging
4. Debugger will pause at breakpoints

**Database Queries:**

Enable Drizzle query logging:

```typescript
// drizzle.config.ts
export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  driver: "mysql2",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true, // Enable query logging
};
```

### Frontend Debugging

**React DevTools:**

Install React DevTools browser extension for component inspection.

**tRPC DevTools:**

Add tRPC DevTools for query inspection:

```bash
pnpm add @trpc/react-query-devtools
```

```tsx
// client/src/main.tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Network Tab:**

Open DevTools → Network tab to inspect tRPC requests:
- Filter by "trpc" to see API calls
- Check request/response payloads
- Verify status codes

## Deployment

### Local Production Build

Test production build locally:

```bash
pnpm build
pnpm start
```

This builds the frontend and backend, then starts the production server.

### Manus Platform Deployment

**1. Save Checkpoint**

In Manus IDE, create a checkpoint:

```
Checkpoint description: "Feature XYZ complete"
```

**2. Click Publish**

In the Management UI, click the "Publish" button in the header.

**3. Verify Deployment**

Visit your deployed URL: `https://[your-domain].manus.space`

### Custom Domain

To use a custom domain:

1. Open Management UI → Settings → Domains
2. Enter your custom domain (e.g., `friday.rendetalje.dk`)
3. Add CNAME record in your DNS:
   ```
   friday.rendetalje.dk → [your-app-id].manus.space
   ```
4. Wait for DNS propagation (up to 48 hours)

### Environment Variables

Production environment variables are managed in Management UI:

1. Open Management UI → Settings → Secrets
2. View/edit existing secrets
3. **Do not** add new secrets here - use `webdev_request_secrets` tool in Manus IDE

## Git Workflow

### Branching Strategy

Use feature branches for development:

```bash
# Create feature branch
git checkout -b feature/customer-profiles

# Make changes
git add .
git commit -m "Add customer profile system"

# Push to GitHub
git push origin feature/customer-profiles

# Create pull request on GitHub
# Merge after review
```

### Commit Messages

Follow conventional commit format:

```
feat: Add customer profile modal
fix: Fix email detail view TypeScript errors
docs: Update API reference with customer endpoints
refactor: Extract customer sync logic to separate file
test: Add unit tests for customer-db helpers
```

### GitHub Integration

The project is hosted at https://github.com/TekupDK/tekup-friday

**Clone:**
```bash
git clone https://github.com/TekupDK/tekup-friday.git
```

**Add Remote:**
```bash
git remote add github https://github.com/TekupDK/tekup-friday.git
```

**Push:**
```bash
git push github main
```

## Common Issues

### Database Connection Errors

**Error:** "Database not available"

**Solution:**
1. Verify `DATABASE_URL` in `.env`
2. Check database server is running
3. Test connection with MySQL client:
   ```bash
   mysql -h host -u user -p database
   ```

### TypeScript Errors

**Error:** "Property does not exist on type"

**Solution:**
1. Check type definitions in `drizzle/schema.ts`
2. Regenerate types: `pnpm db:push`
3. Restart TypeScript server in Cursor: Cmd+Shift+P → "TypeScript: Restart TS Server"

### tRPC Errors

**Error:** "No such procedure"

**Solution:**
1. Verify procedure exists in `server/routers.ts`
2. Check import in `client/src/lib/trpc.ts`
3. Restart dev server: `pnpm dev`

### OAuth Errors

**Error:** "Invalid session"

**Solution:**
1. Clear browser cookies
2. Verify `JWT_SECRET` in `.env`
3. Check `OAUTH_SERVER_URL` is correct

## Best Practices

### Code Organization

**Keep files focused:** Each file should have a single responsibility.

**Use TypeScript:** Always define types for function parameters and return values.

**Avoid magic numbers:** Use named constants instead of hardcoded values.

**Example:**
```typescript
// Bad
if (score > 80) { ... }

// Good
const HIGH_SCORE_THRESHOLD = 80;
if (score > HIGH_SCORE_THRESHOLD) { ... }
```

### Performance

**Optimize queries:** Use indexes and limit results.

**Lazy load components:** Split large components into separate chunks.

**Debounce user input:** Prevent excessive API calls.

**Example:**
```typescript
import { useDebouncedCallback } from "use-debounce";

const debouncedSearch = useDebouncedCallback((query) => {
  searchMutation.mutate({ query });
}, 300);
```

### Security

**Validate all inputs:** Use Zod schemas for validation.

**Sanitize user content:** Prevent XSS attacks.

**Use environment variables:** Never hardcode secrets.

**Implement rate limiting:** Prevent abuse (not yet implemented).

## Cursor AI Rules

For Cursor AI assistance, refer to `docs/CURSOR_RULES.md` which contains:

- Code style preferences
- Common patterns to follow
- Anti-patterns to avoid
- Project-specific conventions

## Additional Resources

**Documentation:**
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [API_REFERENCE.md](./API_REFERENCE.md) - Complete API documentation
- [README.md](../README.md) - Project overview

**External Documentation:**
- [tRPC Docs](https://trpc.io/docs)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Docs](https://ui.shadcn.com)

**GitHub Repository:**
- https://github.com/TekupDK/tekup-friday

---

**Document Version:** 1.0.0  
**Last Updated:** November 1, 2025  
**Maintained by:** TekupDK Development Team
