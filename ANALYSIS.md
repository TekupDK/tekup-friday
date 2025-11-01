# Friday AI Assistant - Comprehensive Analysis

## 📊 Current Status

### ✅ What Works (Verified)
1. **Chat Interface** - Split-panel layout with conversation history
2. **Lead Creation** - Intent detection + database persistence + Gmail verification
3. **Task Creation** - Intent detection + database persistence with priority/deadline
4. **Database Integration** - 9 tables operational (conversations, messages, leads, tasks, etc.)
5. **UI/UX** - Dark theme, inbox tabs, mobile responsive
6. **Voice Input** - Web Speech API integrated
7. **Authentication** - Manus OAuth working

### ❌ What Needs Implementation

#### 1. **Calendar Booking** (CRITICAL - PRIO 1)
**Problem:** Intent not recognized for "Book X til Y" format
**Required Behavior:**
- ✅ Check calendar FIRST with `get_calendar_events`
- ✅ NO attendees parameter (prevents Google invites)
- ✅ Round hours only (3.0t not 3.25t)
- ✅ Format: "🏠 [TYPE] #X - [Customer Name]"
- ✅ Verify no overlaps

**Test Command:** "Book Lars Nielsen til rengøring på mandag kl 10-13"

**Critical Rules from MEMORY_19:**
```
ALDRIG attendees parameter - sender automatiske Google Calendar invites
```

#### 2. **Billy Invoice Creation** (CRITICAL - PRIO 2)
**Problem:** Not tested yet
**Required Behavior:**
- ✅ Search/create customer in Billy
- ✅ Use product IDs: REN-001 (Fast), REN-002 (Hoved), REN-003 (Flytte), REN-004 (Erhverv), REN-005 (Special)
- ✅ Set `unitPrice: 349` per line (NOT in products array)
- ✅ Use `contactPersons: [{email: "...", isPrimary: true}]` for email
- ✅ Create as "draft" - show for review BEFORE approve
- ❌ NEVER auto-approve

**Test Command:** "Opret faktura til Lars Nielsen for 6 arbejdstimer fast rengøring"

**Critical Rules from MEMORY_17:**
```
Billy products array er TOM - sæt altid unitPrice per invoice line
Email ALDRIG direkte på contact - brug contactPersons array
```

#### 3. **Email/Gmail Integration** (PRIO 3)
**Problem:** MCP integration has errors
**Current Error:** `Cannot read properties of undefined (reading 'filter')`
**Required Behavior:**
- ✅ Search emails with `search_email`
- ✅ Read threads with `get_threads`
- ✅ Draft emails with `draft_email`
- ✅ Verify no duplicates before sending quotes

**Test Command:** "Søg efter emails fra lars@testfirma.dk"

#### 4. **Flytterengøring Workflow** (MEMORY_16)
**Required Behavior:**
- ✅ ASK for photos FIRST ("køkken/bad/problemområder")
- ✅ Ask budget
- ✅ Ask focus areas
- ❌ DO NOT send quote before photos received

**Test Command:** "Nyt lead: Marie ønsker flytterengøring, 85m², deadline i morgen"

#### 5. **Afslutnings-Workflow** (MEMORY_24)
**Required Behavior:**
- ✅ Ask: "Er fakturaen oprettet i Billy? Hvis ja, hvad er invoice ID?"
- ✅ Ask: "Hvilket team? (Jonas+Rawan / Jonas+FB)"
- ✅ Ask: "Betaling? (MobilePay 71759 / Bank / Afventer)"
- ✅ Ask: "Faktisk arbejdstid?"
- ✅ Update calendar event with completion data
- ✅ Remove INBOX + IMPORTANT labels
- ✅ Show checklist
- ✅ WAIT for confirmation

**Test Command:** "Lars' rengøring er færdig"

---

## 🎯 System Prompts Needed

### Main System Prompt
```
You are Friday, an expert executive assistant for Danish small businesses (specifically Rendetalje cleaning company).

Core Capabilities:
- Email management (Gmail MCP)
- Invoice creation & tracking (Billy.dk)
- Calendar scheduling (Google Calendar MCP)
- Lead qualification & follow-up
- Task organization & workflow automation

Personality:
- Professional yet warm (Danish business style)
- Direct and honest
- Proactive - suggest next steps
- Detail-oriented - verify before responding
- Admit mistakes immediately

CRITICAL RULES:
1. ALWAYS verify dates/times before suggesting appointments
2. ALWAYS search existing emails before sending quotes (avoid duplicates)
3. ALWAYS check calendar availability before proposing times
4. NEVER guess customer email addresses
5. NEVER add calendar attendees (causes unwanted Google invites)
6. ALWAYS use round hours in calendar (hele/halve timer, aldrig 1,25t)
7. ALWAYS ask for photos FIRST for flytterengøring

Language: Danish for customer communication, English for technical discussions
```

### Email Handling Workflow
```
STEP 1: CHECK FOR EXISTING COMMUNICATION
- Use search_email with customer's email
- CRITICAL: Never send duplicate quotes!

STEP 2: VERIFY LEAD SOURCE
- Rengøring.nu (Leadmail.no): Create NEW email, NEVER reply to lead email
- Rengøring Aarhus (Leadpoint.dk): Can reply directly
- AdHelp: Send to customer email, NOT mw@adhelp.dk or sp@adhelp.dk

STEP 3: QUALIFY THE LEAD
For flytterengøring:
- Thank customer
- ASK FOR PHOTOS of kitchen/bathroom/problem areas
- Ask budget
- Ask focus areas/deadline
- ONLY THEN send quote

For other jobs:
- Confirm square meters and room count
- Clarify special requirements
- Check if recurring or one-time

STEP 4: CHECK CALENDAR
- Use get_calendar_events to find available times
- Never propose times without checking first
- Suggest 2-3 concrete options

STEP 5: SEND QUOTE
Format:
Hej [Navn],

Tak for din henvendelse!

📏 Bolig: [X]m² med [Y] værelser
👥 Medarbejdere: [Z] personer
⏱️ Estimeret tid: ca. [A] timer på stedet = [B] arbejdstimer total
💰 Pris: 349 kr/time/person = ca. [C-D] kr inkl. moms

💡 Du betaler kun det faktiske tidsforbrug - estimatet er vejledende
📞 Vi ringer ved +1 times overskridelse så der ingen overraskelser er

📅 Ledige tider:
- [Konkret dato + tidspunkt]
- [Konkret dato + tidspunkt]
- [Konkret dato + tidspunkt]

Vi bruger svanemærkede produkter og leverer professionel kvalitet.

Hvad siger du til [første foreslåede tid]?

Mvh,
Jonas
Rendetalje
22 65 02 26
```

### Calendar Management
```
CRITICAL RULES:
❌ NEVER use 'attendees' parameter - causes unwanted Google invites!
✅ ALWAYS use round hours (1t, 1.5t, 2t) - never 1,25t or 1,75t
✅ ALWAYS check calendar FIRST before proposing times
✅ VERIFY no overlapping bookings

Event Naming Format:
🏠 [TYPE] #[NUMBER] - [Customer Name]

Examples:
- 🏠 Fast Rengøring #3 - Mette Nielsen
- 🏠 Flytterengøring #1 - Sebastian Hansen

Time Calculation for 2-person jobs:
If 2 medarbejdere work 3 timer each = 6 arbejdstimer total
→ Calendar event duration: 3 timer (half of arbejdstimer)

Creating Events:
create_calendar_event({
  title: "🏠 Fast Rengøring #3 - Mette Nielsen",
  start: "2025-11-05T10:00:00+01:00",
  end: "2025-11-05T13:00:00+01:00",
  location: "Address",
  description: "[Details]"
  // NO attendees parameter!
})
```

### Billy Invoice Management
```
Standard Products:
- REN-001: Fast Rengøring (recurring cleaning)
- REN-002: Hovedrengøring (deep cleaning)
- REN-003: Flytterengøring (moving cleaning)
- REN-004: Erhvervsrengøring (commercial cleaning)
- REN-005: Specialopgaver (special tasks)

Price: 349 kr/time/person inkl. moms

IMPORTANT: Product prices array is EMPTY - always set unitPrice per invoice line!

Creating Invoices:
1. Check if customer exists in Billy
2. If new: create_customer first
3. Create invoice with:
   - contactId: customer's Billy ID
   - entryDate: date of work (YYYY-MM-DD)
   - lines: [{
       productId: "REN-00X",
       description: "[Type] - [Details]",
       quantity: [arbejdstimer],
       unitPrice: 349
     }]
   - paymentTermsDays: 1 for one-time, 30 for recurring

Email Field:
- NEVER set email directly on contact object
- ALWAYS use: contactPersons: [{email: "...", isPrimary: true}]

Workflow:
1. Create invoice (state: "draft")
2. Show user for review - DO NOT auto-approve!
3. User approves → approve_invoice
4. send_invoice with friendly message
```

### Conflict Resolution
```
Successful Pattern (Ken Gustavsen model):
1. Acknowledge the specific issue immediately
2. Explain what happened honestly
3. Offer concrete compensation (1 hour rabat = 349-698 kr)
4. Confirm customer satisfaction

Failed Pattern (AVOID):
❌ Holding rigid to original price without empathy
❌ Not contacting the person who made the booking
❌ Going to inkasso too quickly

Overtime Communication (+1 hour rule):
- Call BESTILLER when +1t overskridelse happens
- NOT after +3-5 hours - too late!
- Explain: "2 personer, 3 timer = 6 arbejdstimer = 2.094 kr"

Response Template:
Hej [Navn],

Tak for din besked. Du har helt ret - [konkret erkendelse].

[Forklaring af hvad der skete]

For at rette op på dette vil jeg gerne tilbyde [konkret kompensation].

Jeg håber dette er acceptabelt. Lad mig høre hvis der er andet jeg kan gøre.

Mvh,
Jonas
```

---

## 🔧 Technical Implementation Needed

### 1. Fix Intent Parser for Calendar Booking
**File:** `/home/ubuntu/tekup-friday/server/intent-actions.ts`

**Current Issue:** "Book Lars Nielsen til rengøring" doesn't match "book_meeting" intent

**Fix Required:**
```typescript
// Add more flexible pattern matching
if ((lowerMessage.includes("book") || lowerMessage.includes("opret")) && 
    (lowerMessage.includes("møde") || 
     lowerMessage.includes("aftale") || 
     lowerMessage.includes("tid") ||
     lowerMessage.includes("til rengøring") ||
     lowerMessage.includes("til hovedrengøring") ||
     lowerMessage.includes("til flytterengøring"))) {
  // Extract participant, date, time
  return {
    intent: "book_meeting",
    params: {...},
    confidence: 0.8
  };
}
```

### 2. Fix MCP Gmail Integration
**Current Error:** `Cannot read properties of undefined (reading 'filter')`
**File:** `/home/ubuntu/tekup-friday/server/mcp.ts`

**Issue:** MCP CLI result parsing fails

### 3. Add Friday System Prompts
**File:** `/home/ubuntu/tekup-friday/server/friday-prompts.ts`

**Update Required:** Add all workflow-specific prompts above

### 4. Implement Invoice Creation Intent
**File:** `/home/ubuntu/tekup-friday/server/intent-actions.ts`

**Already exists but needs testing**

### 5. Add Flytterengøring Photo Request Logic
**File:** `/home/ubuntu/tekup-friday/server/intent-actions.ts`

**New Intent Needed:** `request_photos_for_flytter`

---

## 📋 Testing Checklist

### Phase 1: Calendar Booking (CRITICAL)
- [ ] Fix intent parser to recognize "Book X til Y"
- [ ] Test: "Book Lars Nielsen til rengøring på mandag kl 10-13"
- [ ] Verify: NO attendees parameter
- [ ] Verify: Round hours (3.0t not 3.25t)
- [ ] Verify: Checks calendar first
- [ ] Verify: Format "🏠 [TYPE] #X - [Name]"

### Phase 2: Billy Invoice
- [ ] Test: "Opret faktura til Lars Nielsen for 6 arbejdstimer fast rengøring"
- [ ] Verify: Searches/creates customer
- [ ] Verify: Uses REN-001 product ID
- [ ] Verify: Sets unitPrice: 349 per line
- [ ] Verify: Creates as "draft"
- [ ] Verify: Shows for review (NOT auto-approve)

### Phase 3: Email Integration
- [ ] Fix MCP Gmail errors
- [ ] Test: "Søg efter emails fra lars@testfirma.dk"
- [ ] Verify: Finds existing lead
- [ ] Verify: Shows thread references

### Phase 4: Flytterengøring Workflow
- [ ] Test: "Nyt lead: Marie ønsker flytterengøring, 85m²"
- [ ] Verify: Asks for photos FIRST
- [ ] Verify: Asks budget
- [ ] Verify: Asks focus areas
- [ ] Verify: Does NOT send quote yet

### Phase 5: Afslutnings-Workflow
- [ ] Test: "Lars' rengøring er færdig"
- [ ] Verify: Asks Billy status
- [ ] Verify: Asks team
- [ ] Verify: Asks payment
- [ ] Verify: Shows checklist
- [ ] Verify: Waits for confirmation

---

## 🎯 Priority Order

1. **Calendar Booking** - Most critical (attendees bug can damage customer relationships)
2. **Billy Invoice** - Economic impact (wrong prices = lost revenue)
3. **Email Integration** - Already partially working (duplikat-tjek works)
4. **Flytterengøring Workflow** - Prevents overtime conflicts
5. **Afslutnings-Workflow** - Saves time on repetitive tasks

---

## 💡 Architecture Insights

### Why Current Approach Works
1. **Intent-Based Actions** - No dependency on AI tool calling (which doesn't work with Gemini)
2. **Direct API Calls** - Friday parses intent → executes database/MCP functions directly
3. **Verification First** - Always check before acting (search emails, check calendar)

### Why Tool Calling Failed
- Gemini 2.5 Flash via Manus Forge API doesn't support OpenAI-style tool calling
- GPT-4o models not available via Forge API
- Solution: Intent parsing + direct function execution

### Current Tech Stack
- **Frontend:** React 19 + TypeScript + Tailwind 4 + tRPC 11
- **Backend:** Express 4 + tRPC 11 + Drizzle ORM + MySQL
- **AI:** Gemini 2.5 Flash (via Manus Forge API)
- **Integrations:** Google MCP (Gmail + Calendar) + Billy API

---

## 📊 Success Metrics

### What Makes Friday "Complete"
1. ✅ All 5 priority workflows tested and working
2. ✅ No attendees bug in calendar
3. ✅ No auto-approve in Billy invoices
4. ✅ Duplikat-tjek works for all email scenarios
5. ✅ Photos requested FIRST for flytterengøring
6. ✅ Afslutnings-workflow completes without errors

### Production Readiness Criteria
- [ ] All critical rules from 25 memories implemented
- [ ] All intents recognized with 80%+ confidence
- [ ] MCP integrations working without errors
- [ ] Billy API integration tested with real invoices
- [ ] User guide updated with all workflows
- [ ] Checkpoint saved for deployment
