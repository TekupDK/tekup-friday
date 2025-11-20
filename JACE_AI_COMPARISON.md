# Friday vs Jace AI - Comprehensive Comparison & Enhancement Plan

**Date:** 2025-11-20
**Project:** Friday - Your Next AI Inbox
**Comparison Target:** Jace AI (jace.ai)

---

## Executive Summary

Friday is a **Shortwave.ai-inspired AI inbox** built specifically for Rendetalje.dk's cleaning business operations. This document compares Friday with Jace AI, a leading email assistant, and outlines a strategic enhancement plan to incorporate Jace AI's best features while maintaining Friday's unique business automation capabilities.

**Key Insight:** Friday already has features that Jace AI lacks (invoice management, lead pipeline, Danish business logic), but Jace AI excels at proactive email drafting and intelligent inbox organization. The goal is to merge the best of both worlds.

---

## 1. Feature Comparison Matrix

| Feature | Friday (Current) | Jace AI | Priority to Add |
|---------|------------------|---------|-----------------|
| **Email Management** |
| Gmail Integration | ✅ Full sync & search | ✅ Gmail only | - |
| Proactive Email Drafting | ❌ Manual | ✅ 24/7 background | 🔴 HIGH |
| Smart Auto-Labeling | ⚠️ Manual labels | ✅ AI + custom labels | 🟡 MEDIUM |
| AI Search (Natural Language) | ⚠️ Gmail query syntax | ✅ Context-aware | 🟡 MEDIUM |
| Email Read/Unread Tracking | ✅ Full metadata | ✅ Similar | - |
| Thread Grouping | ✅ By time (TODAY/YESTERDAY/LAST_7_DAYS) | ✅ Smart grouping | 🟢 LOW |
| Attachments Support | ✅ Detection + badge | ✅ Similar | - |
| **Calendar & Scheduling** |
| Google Calendar Integration | ✅ Full CRUD | ✅ Similar | - |
| Smart Meeting Scheduling | ✅ Find free slots | ✅ Similar | - |
| Calendar Event Format | ✅ Custom (🏠 [TYPE] #[NUM] - [Name]) | ⚠️ Generic | ✅ Advantage |
| NO Attendees Rule (MEMORY_19) | ✅ Critical business rule | ❌ Not applicable | ✅ Advantage |
| **Invoice & Financial** |
| Invoice Management | ✅ Billy.dk integration | ❌ None | ✅ Advantage |
| Price Calculation (349 kr/hour) | ✅ Automated | ❌ None | ✅ Advantage |
| Payment Tracking | ✅ MobilePay/Bank | ❌ None | ✅ Advantage |
| Late Payment Fees | ✅ 100 kr/day logic | ❌ None | ✅ Advantage |
| **Lead & Customer Management** |
| Lead Pipeline | ✅ 6-stage (new→won/lost) | ❌ None | ✅ Advantage |
| Lead Scoring | ✅ 0-100 AI score | ❌ None | ✅ Advantage |
| Customer Profiles | ✅ Aggregated (Billy+Gmail) | ❌ None | ✅ Advantage |
| Source Tracking | ✅ Rengøring.nu, Leadpoint, etc. | ❌ None | ✅ Advantage |
| **Task Management** |
| Task Creation | ✅ Manual + AI intent | ❌ None | ✅ Advantage |
| Priority System | ✅ Low/Medium/High/Urgent | ❌ None | ✅ Advantage |
| **AI & Automation** |
| AI Model | ✅ GPT-4o-mini | ⚠️ Proprietary | - |
| Conversation Memory | ✅ Full context | ✅ Similar | - |
| Intent Detection | ✅ 7 action types | ✅ Similar | - |
| Business Rules (MEMORY) | ✅ 25 Danish rules | ❌ Generic | ✅ Advantage |
| Learning Communication Style | ⚠️ No personalization | ✅ Learns your voice | 🔴 HIGH |
| Multi-Model Routing | ✅ GPT/Claude/Gemini logic | ❌ Single model | ✅ Advantage |
| **Integration & Platforms** |
| Multi-Platform (Slack, Notion) | ❌ Gmail/Calendar only | ✅ Multi-platform | 🟢 LOW |
| Billy.dk | ✅ Full integration | ❌ None | ✅ Advantage |
| Danish Language | ✅ Native support | ❌ English-first | ✅ Advantage |
| **UI/UX** |
| Unified Inbox Tabs | ✅ 5 tabs (Email/Invoices/Calendar/Leads/Tasks) | ⚠️ Email-centric | ✅ Advantage |
| Mobile Responsive | ✅ Full mobile support | ✅ Similar | - |
| Dark Theme | ✅ Professional | ✅ Similar | - |
| Real-time Updates | ⚠️ Manual refresh | ✅ Background sync | 🟡 MEDIUM |
| **Pricing** |
| Cost | ✅ Self-hosted (OpenAI API only) | 💰 $17.50-45.50/month/user | ✅ Advantage |
| Multi-Account | ✅ Unlimited | ⚠️ Pro: 8 accounts max | ✅ Advantage |

**Legend:**
- 🔴 HIGH = Critical for competitiveness
- 🟡 MEDIUM = Nice to have
- 🟢 LOW = Future consideration
- ✅ Advantage = Friday's unique strength

---

## 2. Friday's Unique Strengths (Not in Jace AI)

### 2.1 Business Automation
- **Billy.dk Invoice Management**: Full integration with Danish accounting system
- **Lead Pipeline**: 6-stage sales process tracking
- **Customer Profiles**: Unified view of emails, invoices, and interactions
- **25 MEMORY Rules**: Rendetalje-specific business logic (flytterengøring photos, no attendees, 349 kr/hour, etc.)

### 2.2 Multi-Entity Workspace
- **5-Tab Unified Inbox**: Email, Invoices, Calendar, Leads, Tasks in one view
- **Cross-Entity Relations**: Tasks linked to leads, calendar events linked to invoices
- **Analytics**: Track lead conversion, invoice payment rates, etc.

### 2.3 Danish Business Operations
- **Native Danish**: All prompts, UI, and communication in Danish
- **Danish Date/Time Parsing**: "i morgen kl 14" → ISO 8601 conversion
- **Danish Business Culture**: Ærlig kommunikation, no hard selling, focus on kvalitet

### 2.4 Cost Efficiency
- **Self-Hosted**: No per-user subscription fees
- **OpenAI API Direct**: Pay only for actual usage (~$0.05-0.20/day)
- **Unlimited Users**: Scale without licensing costs

---

## 3. Jace AI's Advantages (Missing in Friday)

### 3.1 Proactive Email Drafting ⚠️ HIGH PRIORITY
**What Jace Does:**
- 24/7 background processing of incoming emails
- Automatically drafts responses in your communication style
- Learns from past emails to match tone, structure, and vocabulary
- Drafts are ready when you open inbox (no waiting)

**Why It Matters:**
- Saves 2-3 hours/day on email responses
- Reduces decision fatigue
- Ensures consistent tone across all communication

**How to Implement in Friday:**
1. Add background job system (cron or queue)
2. Detect new emails via webhook or polling
3. Analyze email intent (quote request, complaint, follow-up, etc.)
4. Generate draft using GPT-4o with:
   - Email history for context
   - User's past responses for style learning
   - Business rules (MEMORY) for compliance
5. Store drafts in database
6. Display in Email Tab with "🤖 Draft Ready" badge

**Technical Approach:**
```typescript
// New table: email_drafts
export const emailDrafts = mysqlTable("email_drafts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  threadId: varchar("gmailThreadId", { length: 255 }).notNull(),
  draftBody: text("draftBody").notNull(),
  confidence: int("confidence").notNull(), // 0-100
  status: mysqlEnum("status", ["pending", "approved", "edited", "rejected"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Background job (runs every 5 minutes)
async function processIncomingEmails() {
  const unreadEmails = await getUnreadEmails();
  for (const email of unreadEmails) {
    const draft = await generateDraftResponse(email);
    await saveDraft(draft);
  }
}
```

### 3.2 Smart Auto-Labeling ⚠️ MEDIUM PRIORITY
**What Jace Does:**
- AI automatically categorizes emails (Finance, Travel, Work, Personal, etc.)
- Custom AI labels based on your patterns
- Labels update automatically as context changes

**How to Implement in Friday:**
```typescript
// AI prompt for labeling
const LABELING_PROMPT = `
Analyze this email and assign ONE primary category:
- 🧹 LEAD (new customer inquiries)
- 💰 INVOICE (payment, billing)
- 📅 BOOKING (schedule, appointment)
- ⚠️ COMPLAINT (customer issues)
- 📝 ADMIN (internal, misc)
- ✅ DONE (no action needed)

Return JSON: { "label": "LEAD", "confidence": 95 }
`;
```

### 3.3 AI-Powered Natural Language Search ⚠️ MEDIUM PRIORITY
**What Jace Does:**
- "Show me emails about the Hansen apartment cleaning" (no Gmail syntax needed)
- Context-aware (understands "last week's invoice" without date calculations)
- Searches across attachments and email bodies

**How to Implement in Friday:**
1. Convert natural language query to Gmail query using GPT-4o
2. Example:
   - User: "Find emails from Mette about flytterengøring"
   - AI: `from:mette@email.dk subject:flytterengøring OR body:flytterengøring`
3. Execute search via Gmail API
4. Display results with highlighted context

### 3.4 Communication Style Learning ⚠️ HIGH PRIORITY
**What Jace Does:**
- Analyzes your sent emails
- Learns:
  - Common phrases ("Mvh, Jonas" vs "Best regards")
  - Tone (formal vs casual)
  - Structure (bullet points, paragraphs)
  - Vocabulary (specific terms you use)
- Applies learned style to all drafts

**How to Implement in Friday:**
```typescript
// New table: user_writing_style
export const userWritingStyles = mysqlTable("user_writing_styles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  toneProfile: json("toneProfile").$type<{
    formality: number; // 0-100
    friendliness: number;
    directness: number;
  }>(),
  commonPhrases: json("commonPhrases").$type<string[]>(),
  closingSignature: varchar("closingSignature", { length: 255 }),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Analyze sent emails to build profile
async function buildWritingProfile(userId: number) {
  const sentEmails = await getSentEmails(userId, { limit: 100 });
  const profile = await analyzeTone(sentEmails); // Use GPT-4o
  await updateUserProfile(userId, profile);
}
```

---

## 4. Enhancement Plan - Phase 1 (MVP)

### 4.1 Proactive Email Drafting System

**Objective:** Auto-generate draft responses for common email types

**Components:**
1. **Database Schema** (DONE - already in place via `emailThreads`, `emailMessages`)
   - Add `email_drafts` table

2. **Background Worker**
   ```typescript
   // server/email-draft-worker.ts
   import { createDraft } from './friday-tool-handlers';

   setInterval(async () => {
     const newEmails = await fetchUnreadEmails();
     for (const email of newEmails) {
       const intent = await detectIntent(email);
       if (shouldGenerateDraft(intent)) {
         const draft = await generateDraftResponse(email, intent);
         await saveDraft(draft);
       }
     }
   }, 5 * 60 * 1000); // Every 5 minutes
   ```

3. **Draft Generation Logic**
   ```typescript
   async function generateDraftResponse(email: EmailMessage, intent: string) {
     const context = {
       emailHistory: await getThreadHistory(email.threadId),
       leadInfo: await findRelatedLead(email.from),
       businessRules: MEMORY_RULES,
       userStyle: await getUserWritingStyle(email.userId),
     };

     const prompt = `
     You are drafting a response to this email:
     From: ${email.from}
     Subject: ${email.subject}
     Body: ${email.body}

     Intent: ${intent}
     Previous emails in thread: ${context.emailHistory}

     Write a response following these rules:
     - Use the user's communication style: ${context.userStyle}
     - Follow business rules: ${context.businessRules}
     - Be professional but warm (Danish business culture)
     `;

     const response = await callOpenAI(prompt);
     return response;
   }
   ```

4. **UI Changes (EmailTab.tsx)**
   - Show draft badge on emails with drafts
   - Add "View Draft" button
   - Allow editing/approving drafts
   - One-click send from draft

**Implementation:**
- Add new tRPC procedures: `inbox.email.generateDraft`, `inbox.email.listDrafts`, `inbox.email.approveDraft`
- Add draft UI components
- Add background worker to server

---

### 4.2 Smart Auto-Labeling System

**Objective:** Automatically categorize emails into Friday's business categories

**Categories:**
- 🧹 LEAD (new customer inquiries)
- 💰 INVOICE (payment, billing, accounting)
- 📅 BOOKING (scheduling, appointments)
- ⚠️ COMPLAINT (customer issues, conflicts)
- 📝 ADMIN (internal, miscellaneous)
- ✅ COMPLETED (job done, no action needed)

**Implementation:**
1. **Label Detection**
   ```typescript
   async function detectEmailLabel(email: EmailMessage): Promise<string> {
     const prompt = `
     Analyze this email and assign ONE category:
     - LEAD: New customer inquiry, quote request
     - INVOICE: Payment, billing, accounting
     - BOOKING: Schedule, appointment, calendar
     - COMPLAINT: Customer issue, problem, dissatisfaction
     - ADMIN: Internal, misc, not customer-facing
     - COMPLETED: Job done, no follow-up needed

     Email:
     From: ${email.from}
     Subject: ${email.subject}
     Body: ${email.snippet}

     Return only the category name.
     `;

     return await callOpenAI(prompt, { model: 'gpt-4o-mini', maxTokens: 10 });
   }
   ```

2. **Auto-Labeling on Sync**
   - When syncing emails from Gmail, auto-label each thread
   - Store label in `emailThreads.labels` JSON field
   - Update UI to show color-coded labels

3. **UI Filter**
   - Add label filter buttons in EmailTab
   - Show label badges on email cards

---

### 4.3 Writing Style Learning

**Objective:** Learn user's communication style from sent emails

**Implementation:**
1. **Style Profiling**
   ```typescript
   async function analyzeWritingStyle(userId: number) {
     const sentEmails = await getSentEmails(userId, { limit: 50 });

     const prompt = `
     Analyze these sent emails and describe the writing style:

     ${sentEmails.map(e => e.body).join('\n---\n')}

     Return JSON with:
     {
       "formality": 0-100,
       "friendliness": 0-100,
       "commonPhrases": ["phrase1", "phrase2"],
       "closingSignature": "Mvh, Jonas"
     }
     `;

     const profile = await callOpenAI(prompt, { responseFormat: 'json' });
     await saveUserProfile(userId, profile);
   }
   ```

2. **Apply Style to Drafts**
   - Include user profile in draft generation context
   - Instruct GPT to match tone, phrases, and signature

---

## 5. Database Schema Changes

```sql
-- Email drafts table
CREATE TABLE email_drafts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  gmail_thread_id VARCHAR(255) NOT NULL,
  draft_body TEXT NOT NULL,
  confidence INT NOT NULL, -- 0-100
  status ENUM('pending', 'approved', 'edited', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_thread (user_id, gmail_thread_id),
  INDEX idx_status (status)
);

-- User writing style profiles
CREATE TABLE user_writing_styles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  tone_profile JSON, -- {formality: 75, friendliness: 80, directness: 60}
  common_phrases JSON, -- ["Mvh", "Tak for din henvendelse"]
  closing_signature VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
);

-- Email labels (AI-generated)
ALTER TABLE email_threads ADD COLUMN ai_label VARCHAR(64);
ALTER TABLE email_threads ADD INDEX idx_ai_label (ai_label);
```

---

## 6. Implementation Timeline

### Week 1: Core Infrastructure
- [ ] Add `email_drafts` and `user_writing_styles` tables
- [ ] Create background worker system
- [ ] Add tRPC procedures for drafts

### Week 2: Proactive Drafting MVP
- [ ] Implement draft generation for LEAD emails
- [ ] Build UI for draft viewing/editing
- [ ] Test with 10 real emails

### Week 3: Auto-Labeling
- [ ] Implement label detection
- [ ] Add labels to EmailTab UI
- [ ] Add filter by label

### Week 4: Style Learning
- [ ] Build writing style analyzer
- [ ] Train on sent emails
- [ ] Apply style to drafts

### Week 5: Testing & Refinement
- [ ] User testing with Rendetalje team
- [ ] Fix bugs and improve accuracy
- [ ] Deploy to production

---

## 7. Cost Analysis

### Current Friday Costs
- **OpenAI API**: ~$0.05-0.20/day (GPT-4o-mini)
- **Hosting**: TiDB serverless (free tier) + Docker ($5/month)
- **Total**: ~$5-10/month

### Enhanced Friday Costs (with new features)
- **OpenAI API**: ~$0.20-0.50/day (more draft generation)
- **Background Worker**: Same hosting
- **Total**: ~$10-20/month

### Jace AI Costs (for comparison)
- **Plus Plan**: $17.50/month/user (1 account)
- **Pro Plan**: $45.50/month/user (8 accounts)
- **For Rendetalje (2 users)**: $35-91/month

**Savings with Enhanced Friday: $15-71/month ($180-852/year)**

---

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Draft quality not matching user style | High | Start with high-confidence categories (LEAD), allow editing |
| Background worker consuming too many API calls | Medium | Rate limit, cache results, only process unread emails |
| Auto-labels incorrect | Low | Allow manual override, show confidence score |
| Users prefer Jace AI's UX | Medium | Focus on Friday's unique features (invoices, leads), continuous UX improvement |

---

## 9. Success Metrics

**Phase 1 Goals (3 months):**
- [ ] 80% of LEAD emails have auto-generated drafts
- [ ] 90% draft approval rate (users send with minimal edits)
- [ ] 2 hours/day time savings on email responses
- [ ] 95% auto-labeling accuracy

**Phase 2 Goals (6 months):**
- [ ] Support all 7 intent types for drafting
- [ ] Multi-platform integration (Slack, Notion)
- [ ] 50% reduction in manual email triage time

---

## 10. Conclusion

**Friday's Strategy:**
1. **Keep unique strengths**: Invoice management, lead pipeline, Danish business automation
2. **Add Jace AI's best features**: Proactive drafting, smart labeling, style learning
3. **Maintain cost advantage**: Self-hosted, no per-user fees
4. **Focus on Rendetalje**: Specialized for cleaning business operations

**Result:** A **superior AI inbox** that combines Jace AI's email intelligence with Friday's comprehensive business automation — at a fraction of the cost.

---

**Next Steps:**
1. Review and approve this plan
2. Prioritize Phase 1 features
3. Begin implementation (estimated 4-5 weeks)
4. User testing and refinement
5. Deploy to production

**Questions? Contact Jonas/Rawan for clarification.**
