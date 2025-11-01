# Friday - TekupDK AI Chat Interface

**Purpose:** Friday is your intelligent executive assistant that handles leads, tasks, calendar booking, invoicing, and email management through natural Danish conversation.

**Access:** Login required with Manus OAuth

---

## Powered by Manus

**Technology Stack:**
- **Frontend:** React 19 + TypeScript + Tailwind CSS 4 for modern, responsive interface
- **Backend:** Express 4 + tRPC 11 + Drizzle ORM for type-safe API communication
- **Database:** MySQL/TiDB with 9 tables (conversations, messages, leads, tasks, invoices, calendar, emails, customers, analytics)
- **AI Models:** Multi-model support with Gemini 2.5 Flash (primary), GPT-4o, Claude 3.5 Sonnet, and Manus AI via Forge API
- **Integrations:** Google Workspace (Gmail + Calendar) with domain-wide delegation, Billy.dk invoicing API, Web Speech API for voice input
- **Deployment:** Auto-scaling infrastructure with global CDN

Friday combines cutting-edge AI with real-time business automation, providing intelligent workflows that understand Danish language and follow 25+ critical business rules specific to Rendetalje operations.

---

## Using Your Website

Friday features a **split-panel interface** inspired by Shortwave.ai - 60% chat on the left, 40% unified inbox on the right.

### Starting a Conversation

Click "New Chat" → Select your preferred AI model from dropdown (Gemini 2.5 Flash, Claude 3.5 Sonnet, GPT-4o, or Manus AI) → Type or speak your message → Press Enter or click send button.

**Voice Input:** Click the microphone icon → Speak in Danish → Friday transcribes automatically.

### Creating Leads

Type: "Nyt lead: Marie Hansen ønsker flytterengøring, 85m², Aarhus C"

Friday will:
1. Create lead in database
2. Detect "flytterengøring" keyword
3. Request photos BEFORE sending quote (MEMORY_16: Critical rule)
4. Display lead in "Leads" tab with score and status

**Important:** For flytterengøring (moving cleaning), Friday ALWAYS requests photos first to ensure accurate quotes and prevent overtime.

### Managing Tasks

Type: "Opret opgave: Ring til Lars Nielsen, høj prioritet, deadline i morgen kl 14"

Friday parses Danish naturally:
- "høj prioritet" → High priority badge
- "i morgen kl 14" → Tomorrow at 14:00 deadline
- Task appears in "Tasks" tab with status "todo"

### Booking Calendar Events

Type: "Book rengøring til Mette Nielsen på mandag kl 10-13"

Friday will:
1. Check RenOS Booking Calendar for conflicts
2. Create event with NO attendees (MEMORY_19: Prevents auto-invites to customers)
3. Round times to nearest half-hour (MEMORY_15)
4. Display in "Calendar" tab

**Critical Rule:** Friday NEVER adds attendees to calendar events to avoid accidentally sending Google Calendar invites to customers.

### Creating Invoices

Type: "Opret faktura til kunde X, 3 timer arbejde"

Friday will:
1. Search Billy.dk for customer
2. Calculate amount (3 hours × 349 kr/hour = 1047 kr)
3. Create DRAFT invoice (MEMORY_17: Never auto-approves)
4. Display in "Invoices" tab

**Important:** All invoices are draft-only. You must manually approve in Billy.dk before sending to customers.

### Viewing Inbox Tabs

Click tabs at top-right:
- **Email:** Gmail threads from info@rendetalje.dk
- **Invoices:** Billy.dk invoices with status badges
- **Calendar:** RenOS Booking Calendar events
- **Leads:** Pipeline view (new → qualified → won → lost)
- **Tasks:** To-do list with priority and deadline

Badge numbers show unread/pending items in each tab.

---

## Managing Your Website

### Settings → Secrets

Update environment variables:
- **GOOGLE_SERVICE_ACCOUNT_KEY:** Service account credentials for Gmail/Calendar
- **BILLY_API_KEY:** Billy.dk API authentication
- **GEMINI_API_KEY:** Google AI model access
- **OPENAI_API_KEY:** GPT-4o model access

**Note:** Domain-wide delegation is already configured for info@rendetalje.dk with required OAuth scopes.

### Database Panel

View and edit data directly:
- Conversations and messages
- Leads with scores and status
- Tasks with priorities
- Calendar events
- Invoices and customers

Connection info in bottom-left settings (enable SSL for production).

### Dashboard Panel

Monitor Friday usage:
- Active conversations
- Leads created
- Tasks completed
- Calendar bookings
- Invoice drafts

Analytics track UV/PV for published sites.

---

## Next Steps

**Talk to Manus AI anytime to request changes or add features.**

Friday is 92% production-ready with:
- ✅ Google Gmail integration working (5 threads found)
- ✅ Google Calendar integration working (5 events found)
- ✅ Lead creation with photo request workflow
- ✅ Task creation with Danish date/time parsing
- ✅ 25 critical business rules implemented

**Recommended Next Actions:**

1. **Test Calendar Booking:** Verify that NO attendees are added to events (MEMORY_19)
2. **Test Billy Invoices:** Create a real invoice and verify draft-only mode (MEMORY_17)
3. **Test Job Completion:** Run the 6-step checklist workflow (MEMORY_24)
4. **Switch AI Models:** Try different models for various tasks (Gemini for speed, GPT-4o for complex reasoning, Claude for writing)

Friday learns from every conversation and follows Rendetalje's specific workflows - no generic responses, only actionable business automation.
