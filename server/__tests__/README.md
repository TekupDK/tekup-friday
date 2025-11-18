# 🧪 Test Infrastructure Guide

This directory contains the complete test infrastructure for Friday AI Chat.

## 📁 Directory Structure

```
server/__tests__/
├── setup.ts              # Global test setup (runs before all tests)
├── helpers/              # Test helper functions
│   ├── db.ts            # In-memory SQLite database for tests
│   └── index.ts         # Helper exports
├── mocks/               # API mocks
│   ├── ai.ts           # AI model mocks (Gemini, Claude, GPT-4o)
│   ├── billy.ts        # Billy.dk API mocks
│   ├── google.ts       # Google API mocks (Gmail, Calendar)
│   └── index.ts        # Mock exports
├── fixtures/            # Test data fixtures
│   ├── users.ts        # User test data
│   ├── leads.ts        # Lead test data
│   ├── tasks.ts        # Task test data
│   ├── customers.ts    # Customer test data
│   └── index.ts        # Fixture exports
└── README.md            # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

Required test dependencies:
- `vitest` - Test runner
- `better-sqlite3` - In-memory database for tests
- `@vitest/ui` - Test UI (optional)

### 2. Run Tests

```bash
# Run all tests once
pnpm test

# Watch mode (re-run on changes)
pnpm test:watch

# With coverage report
pnpm test:coverage

# Open test UI
pnpm test:ui
```

## 📝 Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { createTestDb, closeTestDb, clearTestDb } from "@tests/helpers";
import { testUser, testLead } from "@tests/fixtures";

describe("Feature Name", () => {
  beforeEach(() => {
    createTestDb();
    clearTestDb();
  });

  afterAll(() => {
    closeTestDb();
  });

  it("should do something", () => {
    const db = createTestDb();

    // Your test code here
    expect(true).toBe(true);
  });
});
```

### Using Database Helpers

```typescript
import { createTestDb, clearTestDb, closeTestDb } from "@tests/helpers";

// Create fresh database
const db = createTestDb();

// Insert test data
db.run("INSERT INTO users (openId, name, email) VALUES (?, ?, ?)",
  ["test-id", "Test User", "test@example.dk"]);

// Query data
const user = db.prepare("SELECT * FROM users WHERE email = ?").get("test@example.dk");

// Clear all tables (between tests)
clearTestDb();

// Close database (after all tests)
closeTestDb();
```

### Using Fixtures

```typescript
import { testUser, testLead, flytterengøringLead } from "@tests/fixtures";

// Use pre-defined test data
const user = testUser;
expect(user.email).toBe("jonas@rendetalje.dk");

// Use specific fixtures
const lead = flytterengøringLead;
expect(lead.score).toBe(60); // Higher score for flytterengøring
```

### Using Mocks

#### AI Model Mocks

```typescript
import { mockAIChatResponse, mockIntentDetection, mockLLMInvoke } from "@tests/mocks";

// Mock AI response
const mockInvoke = mockLLMInvoke(mockAIChatResponse);
const response = await mockInvoke("Hello!");
expect(response.content).toContain("test AI respons");

// Mock intent detection
const intent = mockIntentDetection.create_lead;
expect(intent.confidence).toBeGreaterThan(0.8);
```

#### Billy API Mocks

```typescript
import { mockBillyAPI, mockBillyInvoice, calculateMockBalance } from "@tests/mocks";

// Mock Billy API
const invoices = await mockBillyAPI.getInvoices();
expect(invoices.invoices).toHaveLength(3);

// Test MEMORY_17: Draft-only invoices
const newInvoice = await mockBillyAPI.createInvoice({
  customerName: "Test Hansen",
  amount: 1047,
});
expect(newInvoice.invoice.state).toBe("draft"); // NEVER approved

// Calculate balance
const balance = calculateMockBalance();
expect(balance).toBe(1745); // Unpaid amount
```

#### Google API Mocks

```typescript
import { mockCalendarAPI, mockGmailAPI, isRoundHour } from "@tests/mocks";

// Mock Calendar event creation
const event = await mockCalendarAPI.events.insert({
  requestBody: {
    summary: "Test Meeting",
    start: { dateTime: "2025-11-20T10:00:00+01:00" },
    end: { dateTime: "2025-11-20T12:00:00+01:00" },
    attendees: [], // MEMORY_19: NO attendees
  },
});

expect(event.data.attendees).toEqual([]); // MEMORY_19 check

// Test MEMORY_15: Round hours only
expect(isRoundHour("2025-11-20T10:00:00+01:00")).toBe(true);
expect(isRoundHour("2025-11-20T10:15:00+01:00")).toBe(false);
```

## 🎯 Testing MEMORY Rules

### MEMORY_2: Gmail Duplicate Check

```typescript
it("should check Gmail for duplicates before creating lead", async () => {
  const searchResult = await mockGmailAPI.users.messages.list({
    userId: "me",
    q: `from:${testLead.email}`,
  });

  expect(searchResult.data.resultSizeEstimate).toBeGreaterThan(0);
});
```

### MEMORY_15: Round Hours Only

```typescript
it("should only allow round hours (00 or 30 minutes)", () => {
  expect(isRoundHour("2025-11-20T10:00:00Z")).toBe(true);
  expect(isRoundHour("2025-11-20T10:30:00Z")).toBe(true);
  expect(isRoundHour("2025-11-20T10:15:00Z")).toBe(false);
});
```

### MEMORY_16: Flytterengøring Photos First

```typescript
it("should request photos FIRST for flytterengøring", () => {
  const lead = flytterengøringLead;

  expect(lead.notes).toContain("billeder først");
  expect(lead.score).toBe(60); // Higher than normal lead
});
```

### MEMORY_17: Billy Draft-Only

```typescript
it("should NEVER auto-approve Billy invoices", async () => {
  const invoice = await mockBillyAPI.createInvoice({
    customerName: "Test",
    amount: 1047,
  });

  expect(invoice.invoice.state).toBe("draft");
  expect(invoice.invoice.state).not.toBe("approved");
});
```

### MEMORY_19: NO Calendar Attendees

```typescript
it("should NEVER add attendees to calendar events", async () => {
  const event = await mockCalendarAPI.events.insert({
    requestBody: {
      summary: "Meeting",
      attendees: [], // MEMORY_19
    },
  });

  expect(event.data.attendees).toEqual([]);

  // Should throw error if attendees provided
  await expect(
    mockCalendarAPI.events.insert({
      requestBody: {
        summary: "Meeting",
        attendees: [{ email: "test@example.dk" }],
      },
    })
  ).rejects.toThrow("MEMORY_19 VIOLATION");
});
```

### MEMORY_24: Job Completion Checklist

```typescript
it("should require 6-step checklist for job completion", () => {
  const intent = mockIntentDetection.job_completion;

  expect(intent.parameters).toHaveProperty("customerName");
  expect(intent.parameters).toHaveProperty("jobType");

  // Checklist items:
  // 1. Faktura oprettet?
  // 2. Hvilket team?
  // 3. Betaling modtaget?
  // 4. Faktisk arbejdstid?
  // 5. Opdater kalender
  // 6. Fjern email labels
});
```

## 🎨 Best Practices

### ✅ DO

- **Use fixtures** for consistent test data
- **Use mocks** for external APIs (never hit real APIs in tests)
- **Clear database** between tests (`clearTestDb()`)
- **Test MEMORY rules** explicitly
- **Test error cases** (not just happy paths)
- **Use descriptive test names** ("should create lead with high score for flytterengøring")

### ❌ DON'T

- Don't hit real APIs (OpenAI, Billy, Google)
- Don't share database state between tests
- Don't forget to call `closeTestDb()` in `afterAll`
- Don't skip MEMORY rule tests
- Don't test implementation details (test behavior)

## 📊 Coverage Goals

Target coverage for critical files:

| File | Target Coverage |
|------|----------------|
| `intent-actions.ts` | 90%+ |
| `db.ts` | 85%+ |
| `routers.ts` | 80%+ |
| `customer-router.ts` | 80%+ |
| `ai-router.ts` | 75%+ |
| `billy-sync.ts` | 75%+ |

Run `pnpm test:coverage` to see current coverage.

## 🐛 Debugging Tests

### VSCode Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test:watch"],
  "console": "integratedTerminal"
}
```

### Console Logging

```typescript
it("should debug something", () => {
  const result = someFunction();
  console.log("Debug:", result); // Will show in test output
  expect(result).toBeDefined();
});
```

### Test Only Specific File

```bash
pnpm test server/db.test.ts
```

### Test Only Specific Test

```typescript
it.only("should run only this test", () => {
  // Only this test will run
});
```

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Friday Architecture](../../docs/ARCHITECTURE.md)

## 🆘 Troubleshooting

### "Test database not initialized"

Make sure to call `createTestDb()` in `beforeEach`:

```typescript
beforeEach(() => {
  createTestDb();
});
```

### "Table does not exist"

Check that table schema is defined in `helpers/db.ts` → `setupTestTables()`

### "Mock not working"

Make sure to import from `@tests/mocks` and call `vi.clearAllMocks()` in `afterEach`

### "Tests slow"

Use in-memory SQLite (already configured) and mock external APIs

---

**Happy Testing! 🎉**
