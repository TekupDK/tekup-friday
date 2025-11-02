# Cursor AI Rules - Friday AI Chat

This file contains rules and guidelines for Cursor AI to follow when assisting with Friday AI Chat development.

## Project Context

Friday AI Chat is a business automation platform for TekupDK (Rendetalje.dk cleaning company) built with:

- **Frontend:** React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend:** Express 4 + tRPC 11 + Drizzle ORM
- **Database:** MySQL/TiDB
- **AI:** Gemini 2.5 Flash, Claude 3.5 Sonnet, GPT-4o
- **Integrations:** Google Workspace (Gmail, Calendar), Billy.dk (accounting)

## Code Style

### TypeScript

- **Always use TypeScript** - No plain JavaScript files
- **Strict mode enabled** - All types must be explicitly defined
- **Use `type` for simple types, `interface` for objects**
- **Prefer `const` over `let`, never use `var`**
- **Use template literals** for string interpolation

**Example:**

```typescript
// Good
const userName: string = `Hello, ${user.name}`;
type Status = "pending" | "completed";
interface User {
  id: number;
  name: string;
}

// Bad
var userName = "Hello, " + user.name;
let status: any = "pending";
```

### React Components

- **Use functional components** - No class components
- **Use hooks** - `useState`, `useEffect`, `useMemo`, `useCallback`
- **Extract custom hooks** for reusable logic
- **Props interface** - Always define props type

**Example:**

```typescript
// Good
interface Props {
  title: string;
  onSubmit: (value: string) => void;
}

export default function MyComponent({ title, onSubmit }: Props) {
  const [value, setValue] = useState("");
  return <div>{title}</div>;
}

// Bad
export default function MyComponent(props: any) {
  return <div>{props.title}</div>;
}
```

### Naming Conventions

| Type             | Convention                           | Example                               |
| ---------------- | ------------------------------------ | ------------------------------------- |
| Files            | `kebab-case.tsx` or `PascalCase.tsx` | `user-profile.tsx`, `UserProfile.tsx` |
| Components       | `PascalCase`                         | `UserProfile`                         |
| Functions        | `camelCase`                          | `getUserById`                         |
| Variables        | `camelCase`                          | `userName`                            |
| Constants        | `UPPER_SNAKE_CASE`                   | `MAX_RETRIES`                         |
| Types/Interfaces | `PascalCase`                         | `User`, `UserProfile`                 |
| Database columns | `camelCase`                          | `createdAt`, `userId`                 |

### Import Order

```typescript
// 1. External libraries
import { useState } from "react";
import { z } from "zod";

// 2. Internal components
import ChatPanel from "@/components/ChatPanel";

// 3. UI components
import { Button } from "@/components/ui/button";

// 4. Utilities and hooks
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";

// 5. Types and constants
import type { User } from "@/types";
import { APP_TITLE } from "@/const";
```

## File Structure Rules

### DO NOT EDIT

- `client/src/_core/` - Framework code managed by Manus
- `server/_core/` - OAuth, context, server setup

### EDIT FREELY

- `client/src/components/` - UI components
- `client/src/pages/` - Page components
- `server/*.ts` - Business logic and API endpoints
- `drizzle/schema.ts` - Database schema

### File Organization

**Backend:**

- `server/routers.ts` - Main tRPC router (keep under 200 lines)
- `server/db.ts` - Database helpers for core tables
- `server/*-db.ts` - Feature-specific database helpers
- `server/*-router.ts` - Feature-specific tRPC routers
- `server/*-actions.ts` - Business logic and actions

**Frontend:**

- `client/src/pages/*.tsx` - Top-level page components
- `client/src/components/*.tsx` - Shared components
- `client/src/components/inbox/*.tsx` - Inbox tab components
- `client/src/components/ui/*.tsx` - shadcn/ui components (auto-generated)

## Database Schema Rules

### Column Naming

- **Use camelCase** - Matches TypeScript naming
- **Avoid abbreviations** - Use full words
- **Use descriptive names** - `createdAt` not `created`

**Example:**

```typescript
// Good
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Bad
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  last_login: timestamp("last_login").defaultNow().notNull(),
});
```

### Table Design

- **Always include `id` primary key** - Auto-increment integer
- **Always include `createdAt` timestamp** - Track creation time
- **Include `updatedAt` for mutable tables** - Track last update
- **Use `userId` for user-owned data** - Foreign key to users table

### Type Exports

```typescript
export const users = mysqlTable("users", { ... });
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
```

## tRPC API Rules

### Procedure Structure

```typescript
// Query (GET)
procedureName: protectedProcedure
  .input(z.object({ ... }))
  .query(async ({ ctx, input }) => {
    return await getData(ctx.user.id, input);
  }),

// Mutation (POST/PUT/DELETE)
procedureName: protectedProcedure
  .input(z.object({ ... }))
  .mutation(async ({ ctx, input }) => {
    const result = await updateData(ctx.user.id, input);
    return { success: true, data: result };
  }),
```

### Input Validation

- **Always use Zod schemas** for input validation
- **Use `.min()`, `.max()`, `.email()` etc.** for constraints
- **Make optional fields explicit** with `.optional()`

**Example:**

```typescript
const createLeadInput = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().optional(),
  source: z.string(),
});
```

### Error Handling

```typescript
import { TRPCError } from "@trpc/server";

// Throw appropriate error codes
throw new TRPCError({
  code: "UNAUTHORIZED", // 401
  message: "You must be logged in",
});

throw new TRPCError({
  code: "NOT_FOUND", // 404
  message: "Resource not found",
});

throw new TRPCError({
  code: "BAD_REQUEST", // 400
  message: "Invalid input",
});
```

## Frontend Patterns

### tRPC Hooks

```typescript
// Query
const { data, isLoading, error } = trpc.leads.list.useQuery();

// Mutation with invalidation
const createMutation = trpc.leads.create.useMutation({
  onSuccess: () => {
    trpc.useUtils().leads.list.invalidate();
    toast.success("Lead created");
  },
  onError: error => {
    toast.error(error.message);
  },
});

await createMutation.mutateAsync({ name: "John" });
```

### Optimistic Updates

```typescript
const updateMutation = trpc.leads.updateStatus.useMutation({
  onMutate: async newData => {
    await trpc.useUtils().leads.list.cancel();
    const previous = trpc.useUtils().leads.list.getData();

    trpc
      .useUtils()
      .leads.list.setData(undefined, old =>
        old?.map(lead =>
          lead.id === newData.leadId
            ? { ...lead, status: newData.status }
            : lead
        )
      );

    return { previous };
  },
  onError: (err, newData, context) => {
    trpc.useUtils().leads.list.setData(undefined, context?.previous);
  },
  onSettled: () => {
    trpc.useUtils().leads.list.invalidate();
  },
});
```

### Component Structure

```tsx
export default function MyComponent() {
  // 1. Hooks
  const { user } = useAuth();
  const { data, isLoading } = trpc.leads.list.useQuery();
  const createMutation = trpc.leads.create.useMutation();

  // 2. State
  const [isOpen, setIsOpen] = useState(false);

  // 3. Handlers
  const handleCreate = async () => {
    await createMutation.mutateAsync({ ... });
  };

  // 4. Early returns
  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;

  // 5. Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

## Tailwind CSS Rules

### Responsive Design

```tsx
// Mobile-first approach
<div className="p-4 sm:p-6 md:p-8 lg:p-12">
  {/* Padding increases on larger screens */}
</div>

// Grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>

// Hide/show elements
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```

### Dark Mode

```tsx
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  {/* Automatic dark mode support */}
</div>
```

### Custom Classes

- **Avoid inline styles** - Use Tailwind utilities
- **Extract repeated patterns** to components
- **Use CSS variables** for theme colors (defined in `index.css`)

**Example:**

```tsx
// Good
<div className="bg-background text-foreground border-border">

// Bad
<div style={{ backgroundColor: "#fff", color: "#000" }}>
```

## AI Integration Rules

### Tool Definitions

```typescript
const toolSchema = {
  name: "tool_name",
  description: "Clear description of what the tool does",
  parameters: {
    type: "object",
    properties: {
      param1: {
        type: "string",
        description: "Description of param1",
      },
    },
    required: ["param1"],
  },
};
```

### Intent Actions

```typescript
export type Intent =
  | { intent: "action_name"; params: { param1: string } }
  | // ... other intents

export async function executeAction(intent: Intent, userId: number): Promise<ActionResult> {
  switch (intent.intent) {
    case "action_name":
      const result = await handleAction(intent.params, userId);
      return {
        success: true,
        message: "Action completed",
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

## Common Patterns

### Database Helpers

```typescript
// Get single record
export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Get multiple records
export async function getUserLeads(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(leads).where(eq(leads.userId, userId));
}

// Create record
export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(leads).values(data);
  return result;
}

// Update record
export async function updateLeadStatus(leadId: number, status: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(leads).set({ status }).where(eq(leads.id, leadId));
}
```

### Error Handling

```typescript
// Backend
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  console.error("[Error] Operation failed:", error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "Operation failed",
  });
}

// Frontend
const mutation = trpc.operation.useMutation({
  onSuccess: () => {
    toast.success("Operation successful");
  },
  onError: error => {
    toast.error(error.message);
  },
});
```

## Anti-Patterns (AVOID)

### ❌ Direct Database Access in Frontend

```typescript
// Bad
const db = await getDb();
const users = await db.select().from(usersTable);

// Good
const { data: users } = trpc.users.list.useQuery();
```

### ❌ Hardcoded Values

```typescript
// Bad
if (score > 80) { ... }

// Good
const HIGH_SCORE_THRESHOLD = 80;
if (score > HIGH_SCORE_THRESHOLD) { ... }
```

### ❌ Any Type

```typescript
// Bad
const data: any = await fetchData();

// Good
interface Data {
  id: number;
  name: string;
}
const data: Data = await fetchData();
```

### ❌ Inline Styles

```typescript
// Bad
<div style={{ padding: "16px", backgroundColor: "#fff" }}>

// Good
<div className="p-4 bg-white">
```

### ❌ Mutable State

```typescript
// Bad
let users = [];
users.push(newUser);

// Good
const [users, setUsers] = useState<User[]>([]);
setUsers([...users, newUser]);
```

## Testing Guidelines

### Manual Testing Checklist

- [ ] TypeScript compilation: `pnpm tsc --noEmit`
- [ ] Dev server starts: `pnpm dev`
- [ ] No console errors in browser
- [ ] Database changes applied: `pnpm db:push`
- [ ] Feature works as expected
- [ ] Mobile responsive (test at 375px, 768px, 1920px)

### Future Automated Testing

When adding tests, follow these patterns:

**Unit Tests (Vitest):**

```typescript
import { describe, it, expect } from "vitest";

describe("getUserById", () => {
  it("returns user when found", async () => {
    const user = await getUserById(1);
    expect(user).toBeDefined();
    expect(user?.id).toBe(1);
  });

  it("returns undefined when not found", async () => {
    const user = await getUserById(999);
    expect(user).toBeUndefined();
  });
});
```

**Component Tests:**

```typescript
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});
```

## Documentation Rules

### Code Comments

- **Use JSDoc** for function documentation
- **Explain WHY, not WHAT** - Code should be self-explanatory
- **Update comments** when code changes

**Example:**

```typescript
/**
 * Calculates lead score based on engagement metrics.
 * Higher scores indicate more qualified leads.
 *
 * @param lead - Lead object with email, phone, and interaction history
 * @returns Score between 0-100
 */
export function calculateLeadScore(lead: Lead): number {
  // Implementation...
}
```

### TODO Comments

```typescript
// TODO: Add rate limiting to prevent abuse
// FIXME: Handle edge case when user has no email
// NOTE: This is a temporary workaround until API v2 is ready
```

## Git Commit Messages

Follow conventional commit format:

```
feat: Add customer profile modal
fix: Fix email detail view TypeScript errors
docs: Update API reference with customer endpoints
refactor: Extract customer sync logic to separate file
test: Add unit tests for customer-db helpers
chore: Update dependencies
style: Format code with prettier
```

## Performance Guidelines

### Database Queries

- **Use indexes** for frequently queried columns
- **Limit results** with `.limit()`
- **Avoid N+1 queries** - Use joins instead

### Frontend Optimization

- **Debounce user input** to reduce API calls
- **Use `useMemo`** for expensive computations
- **Use `useCallback`** for event handlers passed to children
- **Lazy load components** with `React.lazy()`

**Example:**

```typescript
import { useDebouncedCallback } from "use-debounce";

const debouncedSearch = useDebouncedCallback(query => {
  searchMutation.mutate({ query });
}, 300); // 300ms delay
```

## Security Guidelines

- **Validate all inputs** with Zod schemas
- **Never trust client data** - Validate on server
- **Use environment variables** for secrets
- **Sanitize user content** before rendering (use Streamdown for markdown)
- **Check user permissions** in protected procedures

## Cursor AI Behavior

When assisting with Friday AI Chat development:

1. **Read existing code** before suggesting changes
2. **Follow established patterns** in the codebase
3. **Suggest TypeScript types** for all functions
4. **Provide complete code blocks** - No placeholders like `// ... rest of code`
5. **Explain trade-offs** when multiple approaches exist
6. **Reference documentation** (ARCHITECTURE.md, API_REFERENCE.md, DEVELOPMENT_GUIDE.md)
7. **Check for errors** before suggesting code
8. **Update TODO.md** when adding features
9. **Maintain consistency** with existing code style

---

**Last Updated:** November 1, 2025  
**Maintained by:** TekupDK Development Team
