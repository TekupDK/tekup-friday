# Friday AI Inbox - NYT PROJEKT (v3.0)

**Project Goal:** Build a COMPLETELY NEW Jace AI-inspired inbox application that solves all tekup-ai-v2 issues from scratch.

**Date:** 2025-11-20

---

## 🎯 Vision: "Your Next AI Inbox"

Et helt nyt standalone projekt der kombinerer:
- ✅ Jace AI's proactive email drafting
- ✅ Clean architecture (lessons learned fra v2)
- ✅ Email-first design (ikke chat-first)
- ✅ Zero configuration pain (fix alle v2's MCP problemer)

---

## ❌ Problemer Fra tekup-ai-v2 Vi Skal Løse

### 1. MCP OAuth Helvede
**Problem:** MCP Gmail/Calendar integration krævede kompleks OAuth setup og fejlede konstant
**Solution i v3:**
- Brug **direct Google API** med service account (allerede working in Friday)
- No MCP dependency - just googleapis NPM package
- Domain-wide delegation pre-configured

### 2. Intent Recognition Fejl
**Problem:** "Book Lars Nielsen til rengøring" blev ikke genkendt
**Solution i v3:**
- Smarter regex patterns
- Multiple trigger words per intent
- Confidence threshold: 70%+

### 3. Calendar Attendees Bug (MEMORY_19)
**Problem:** Sendte automatisk Google Calendar invites til kunder
**Solution i v3:**
- **Hard-coded check:** Hvis `attendees` parameter eksisterer → REJECT request
- Unit tests for dette
- Warning i UI hvis user prøver at tilføje attendees

### 4. Billy Invoice Auto-Approve (MEMORY_17)
**Problem:** Invoices blev approved automatisk uden review
**Solution i v3:**
- **Forced draft status** - kan ikke ændres
- Separate "Approve & Send" button med confirmation dialog
- Audit log for alle invoice actions

### 5. Chat-First Design Problem
**Problem:** v2 var chat-focused, men 80% af workload er emails
**Solution i v3:**
- **Email-first design** som Jace AI
- Inbox er hovedvinduet
- Chat er sekundært tool

---

## 🏗️ Ny Arkitektur (Ground Up)

### Core Principle: "Simplicity & Reliability"

```
┌─────────────────────────────────────────────────────┐
│              FRIDAY INBOX (Main View)                │
│  ┌─────────────────────────────────────────────┐   │
│  │  📧 Inbox (Emails with AI drafts)            │   │
│  │                                              │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │ [🤖 Draft Ready] From: kunde@...     │  │   │
│  │  │ "Flytterengøring tilbud"              │  │   │
│  │  │ Confidence: 85%                       │  │   │
│  │  │ [View Draft] [Edit] [Send]           │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  │                                              │   │
│  │  ┌──────────────────────────────────────┐  │   │
│  │  │ From: lars@firma.dk                   │  │   │
│  │  │ "Re: Rengøring aftale"                │  │   │
│  │  │ [Generate Draft]                      │  │   │
│  │  └──────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Tabs: [📧 Inbox] [📅 Calendar] [💰 Invoices]     │
│        [📋 Leads] [✅ Tasks]                        │
└─────────────────────────────────────────────────────┘
```

### Tech Stack (Simplified)

**Frontend:**
- React 19 + TypeScript
- TailwindCSS 4
- tRPC 11 (type-safe API)
- NO complex state management (just React Query)

**Backend:**
- Express + tRPC
- Drizzle ORM + MySQL
- Direct Google API (NO MCP)
- Billy API (direct HTTP calls)

**AI:**
- OpenAI GPT-4o-mini (primary)
- Fallback: Claude 3.5 Sonnet
- NO Gemini (tool calling issues)

---

## 📦 Ny Folder Structure

```
friday-v3/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Inbox.tsx          # Main inbox view (email-first)
│   │   │   ├── DraftModal.tsx     # AI draft preview/edit
│   │   │   ├── Calendar.tsx       # Calendar tab
│   │   │   ├── Invoices.tsx       # Billy invoices tab
│   │   │   ├── Leads.tsx          # Lead pipeline
│   │   │   └── Tasks.tsx          # Task management
│   │   ├── components/
│   │   │   ├── EmailCard.tsx      # Email list item
│   │   │   ├── DraftBadge.tsx     # "🤖 Draft Ready" indicator
│   │   │   └── ApprovalDialog.tsx # Confirm actions
│   │   └── lib/
│   │       └── trpc.ts            # tRPC client
├── server/
│   ├── api/
│   │   ├── inbox.ts               # Email operations
│   │   ├── drafts.ts              # Draft generation
│   │   ├── calendar.ts            # Google Calendar
│   │   ├── invoices.ts            # Billy integration
│   │   └── leads.ts               # Lead management
│   ├── services/
│   │   ├── google.ts              # Direct Google API (NO MCP)
│   │   ├── billy.ts               # Billy API client
│   │   ├── ai.ts                  # OpenAI/Claude integration
│   │   └── drafts.ts              # Draft generation logic
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema
│   │   └── migrations/            # SQL migrations
│   └── utils/
│       ├── intent.ts              # Intent detection (improved)
│       └── validation.ts          # Input validation
├── shared/
│   └── types.ts                   # Shared TypeScript types
└── tests/
    ├── intent.test.ts             # Intent recognition tests
    ├── calendar.test.ts           # Calendar attendees test
    └── drafts.test.ts             # Draft generation tests
```

---

## 🎯 MVP Features (Build This First)

### Phase 1: Email Inbox (2-3 days)
1. **Gmail Sync**
   - Fetch emails via Google API
   - Store in database (email_messages table)
   - Display in inbox list
   - Email detail view

2. **Draft Generation**
   - Detect new unread emails
   - Generate draft response (GPT-4o-mini)
   - Save to drafts table
   - Show "🤖 Draft Ready" badge

3. **Draft Preview & Edit**
   - Modal to view draft
   - Edit textarea
   - Confidence score display
   - Approve → Send to Gmail

### Phase 2: Business Logic (2-3 days)
4. **Intent Detection (Fixed)**
   - Improved patterns for all 7 intents
   - Unit tests for each intent
   - 80%+ accuracy target

5. **Calendar Integration**
   - Direct Google API (no MCP)
   - Create events WITHOUT attendees
   - Round hours validation
   - Conflict checking

6. **Billy Invoices**
   - Draft-only creation
   - Manual approval required
   - 349 kr/hour validation
   - Customer search/create

### Phase 3: MEMORY Rules (1-2 days)
7. **Flytterengøring Workflow (MEMORY_16)**
   - Detect flytterengøring intent
   - Block draft until photos requested
   - Photo request template

8. **Job Completion (MEMORY_24)**
   - 6-step checklist
   - Calendar update
   - Email label removal

---

## 📋 Database Schema (Simplified)

```sql
-- Users (unchanged)
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Emails (new approach)
CREATE TABLE emails (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  gmail_message_id VARCHAR(255) UNIQUE NOT NULL,
  gmail_thread_id VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject TEXT,
  body TEXT,
  snippet TEXT,
  received_at TIMESTAMP NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  has_draft BOOLEAN DEFAULT FALSE, -- Quick lookup
  labels JSON, -- ["INBOX", "UNREAD", etc.]
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_thread (gmail_thread_id),
  INDEX idx_has_draft (has_draft)
);

-- Drafts (core feature)
CREATE TABLE email_drafts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  email_id INT NOT NULL, -- FK to emails.id
  draft_body TEXT NOT NULL,
  confidence INT NOT NULL, -- 0-100
  intent VARCHAR(50), -- quote_request, complaint, etc.
  status ENUM('pending', 'approved', 'edited', 'rejected', 'sent') DEFAULT 'pending',
  metadata JSON, -- Extra context
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (email_id) REFERENCES emails(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_email (email_id)
);

-- Calendar events
CREATE TABLE calendar_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  google_event_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  location TEXT,
  description TEXT,
  attendees JSON DEFAULT '[]', -- Should ALWAYS be empty (MEMORY_19)
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (JSON_LENGTH(attendees) = 0) -- HARD CONSTRAINT
);

-- Invoices (Billy)
CREATE TABLE invoices (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  billy_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  customer_name VARCHAR(255),
  amount_dkk INT NOT NULL, -- In øre
  status ENUM('draft', 'approved', 'sent', 'paid') DEFAULT 'draft',
  is_auto_approved BOOLEAN DEFAULT FALSE, -- Should ALWAYS be FALSE (MEMORY_17)
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (is_auto_approved = FALSE) -- HARD CONSTRAINT
);

-- Leads (simplified)
CREATE TABLE leads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  source VARCHAR(100), -- rengoring_nu, website, etc.
  status ENUM('new', 'contacted', 'quoted', 'won', 'lost') DEFAULT 'new',
  score INT DEFAULT 50, -- 0-100
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Key Improvements:**
- `CHECK` constraints for critical rules (attendees, auto-approve)
- Simpler relationships (no over-normalization)
- Fast indexes for common queries
- `has_draft` flag for quick inbox filtering

---

## 🧪 Testing Strategy (Test-Driven)

### Unit Tests (Required Before Merge)

```typescript
// tests/intent.test.ts
describe('Intent Detection', () => {
  test('recognizes "Book Lars til rengøring"', () => {
    const result = detectIntent('Book Lars Nielsen til rengøring på mandag kl 10');
    expect(result.intent).toBe('book_meeting');
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.params.participant).toBe('Lars Nielsen');
  });

  test('recognizes flytterengøring request', () => {
    const result = detectIntent('Tilbud på flytterengøring, 80m²');
    expect(result.intent).toBe('request_flytter_photos');
    expect(result.params.sqm).toBe(80);
  });
});

// tests/calendar.test.ts
describe('Calendar Attendees Protection', () => {
  test('rejects event with attendees', () => {
    expect(() => {
      createCalendarEvent({
        title: 'Rengøring',
        start: '2025-11-21T10:00:00Z',
        end: '2025-11-21T13:00:00Z',
        attendees: ['kunde@email.dk'] // Should be rejected!
      });
    }).toThrow('MEMORY_19: Attendees not allowed');
  });

  test('accepts event without attendees', () => {
    const event = createCalendarEvent({
      title: 'Rengøring',
      start: '2025-11-21T10:00:00Z',
      end: '2025-11-21T13:00:00Z'
    });
    expect(event.attendees).toEqual([]);
  });
});

// tests/drafts.test.ts
describe('Draft Generation', () => {
  test('generates draft for quote request', async () => {
    const email = {
      from: 'kunde@email.dk',
      subject: 'Tilbud på flytterengøring',
      body: 'Jeg skal flytte og har brug for rengøring'
    };
    const draft = await generateDraft(email);
    expect(draft.confidence).toBeGreaterThan(70);
    expect(draft.intent).toBe('quote_request');
    expect(draft.body).toContain('349 kr');
  });
});
```

---

## 🚀 Implementation Roadmap

### Week 1: Foundation
- [x] Project setup (folder structure)
- [ ] Database schema + migrations
- [ ] Google API integration (direct)
- [ ] Basic inbox UI (email list)

### Week 2: AI Features
- [ ] Draft generation backend
- [ ] Intent detection (improved)
- [ ] Draft preview UI
- [ ] Writing style learning

### Week 3: Business Logic
- [ ] Calendar integration (no MCP)
- [ ] Billy invoices (draft-only)
- [ ] MEMORY rules implementation
- [ ] Flytterengøring workflow

### Week 4: Testing & Polish
- [ ] Unit tests (80%+ coverage)
- [ ] E2E tests for critical flows
- [ ] UI polish
- [ ] Documentation

---

## 💰 Cost Estimate

**Development Time:**
- MVP (Phase 1-3): 6-8 days
- Testing & Polish: 2-3 days
- **Total:** 8-11 days (~50-70 hours)

**Monthly Operating Cost:**
- OpenAI API: $10-20/month
- Database (MySQL): $5-10/month (eller free TiDB)
- Hosting: $0 (self-hosted)
- **Total:** $15-30/month

**Value:**
- Time saved: 27 hours/month = 9.400 kr/month
- ROI: 30,000%+ (300x return)

---

## ✅ Success Criteria

**MVP is complete when:**
1. Inbox displays emails from Gmail
2. AI drafts are generated automatically
3. Drafts can be viewed, edited, and sent
4. Calendar events can be created (no attendees)
5. Invoices can be created as drafts (no auto-approve)
6. All 7 intents recognized with 80%+ accuracy
7. Unit tests pass (80%+ coverage)
8. MEMORY_16, 17, 19, 24 implemented

**Production ready when:**
- All MVP features working
- 10+ real emails tested
- Zero critical bugs
- Documentation complete
- User guide written

---

## 🎯 Next Steps

**Decision Point:** Skal vi:
A) Bygge dette som HELT nyt projekt (friday-v3/) fra scratch?
B) Refactor eksisterende Friday til denne arkitektur?

**Anbefaling:** **A) Nyt projekt**

**Hvorfor:**
- Clean slate - ingen legacy code
- Kan teste parallelt med v2
- Mindre risiko for at bryde eksisterende features
- Lettere at documentere og maintain

**Hvordan:**
```bash
mkdir friday-v3
cd friday-v3
npm init -y
# Start fresh med vite + react + trpc template
```

---

**Hvad siger du? Skal vi bygge et helt nyt projekt fra bunden? 🚀**
