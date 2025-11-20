# Friday AI Inbox - Setup Guide

## 🚀 Quick Start

### Forudsætninger
- Node.js 18+ installeret
- MySQL database adgang
- OpenAI API nøgle
- Google Service Account med Gmail API adgang

---

## 📦 Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd tekup-friday
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Opret `.env` fil i root directory:

```bash
# Database
DATABASE_URL=mysql://user:password@host:port/database

# OpenAI
OPENAI_API_KEY=sk-...

# Google
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
GOOGLE_IMPERSONATED_USER=info@domain.dk
GOOGLE_CALENDAR_ID=primary

# App
JWT_SECRET=your-secure-jwt-secret
VITE_APP_ID=friday-ai
OWNER_OPEN_ID=owner-dev-open-id
NODE_ENV=development
PORT=3000
```

---

## 🗄️ Database Setup

### Run Migrations

```bash
# Generate og kør migrations
npm run db:push
```

Dette opretter:
- 9 nye tabeller (email_categories, email_labels, etc.)
- 2 nye kolonner i email_threads (isStarred, isArchived)

### Initialize Default Data

Start applikationen og kør:

```typescript
// Via tRPC endpoint
await trpc.inbox.categories.init.mutate();
```

Dette opretter 6 default kategorier:
- Main (blå)
- Updates (grøn)
- Promotions (gul)
- Calendar (lilla)
- Social (pink)
- Forums (indigo)

---

## 🎯 Funktionalitets Test

### 1. Test AI Kategorisering

```bash
# Start dev server
npm run dev
```

Åbn Settings → AI → Test kategorisering

### 2. Opret Email Label

Settings → Labels → New Label
- Navn: "Important"
- Farve: Rød
- Gem

### 3. Opret Email Rule

Settings → Rules → New Rule (eller brug template)
- Navn: "Auto-categorize newsletters"
- Condition: body contains "unsubscribe"
- Action: Add category "promotions"
- Gem

### 4. Opret Email Template

Settings → Templates → New Template
- Navn: "Meeting Follow-up"
- Category: Follow-up
- Subject: "Re: Meeting"
- Body: "Thank you for the meeting..."
- Gem

---

## 🧪 Test Suite

### Kør Unit Tests

```bash
npm test
```

94 tests fordelt på:
- email-ai-service.test.ts (25 tests)
- email-db.test.ts (37 tests)
- email-rules-engine.test.ts (32 tests)

### Test Coverage

Alle core services er 100% testet:
- AI kategorisering og caching
- Database operationer
- Rules engine logik

---

## 🎨 Frontend Komponenter

### Settings Dialog

Tilgængelig via Settings ikon i UI.

**5 Tabs:**
1. **Inbox** - Layout preferences, AI toggles
2. **Labels** - Opret/slet custom labels
3. **Rules** - Automation rules med templates
4. **Templates** - Email skabeloner
5. **AI** - Model selection, confidence threshold

### Action Modals

**Smart Reply Modal:**
- Åbn via "Smart Reply" knap på email
- Genererer 3 AI-forslag i forskellige toner
- Rediger før afsendelse

**Snooze Picker Modal:**
- Åbn via "Snooze" knap
- 5 hurtige valgmuligheder + custom
- Reminder toggle

**Template Selector Modal:**
- Åbn via "Use Template" knap
- Søg og filtrer templates
- Rediger før brug

---

## 🔧 Configuration

### AI Model Selection

Settings → AI → Model Selection

**Valgmuligheder:**
- GPT-4o Mini (hurtig, billig)
- GPT-4o (balanceret)
- GPT-4 Turbo (mest præcis)

### Confidence Threshold

Settings → AI → Confidence Threshold

**Slider: 0-100%**
- 0-50%: Aggressive (kategorisér alt)
- 50-75%: Balanced (anbefalede)
- 75-100%: Conservative (kun high-confidence)

### Inbox Layout

Settings → Inbox → Layout

**3 Layouts:**
1. **Gmail Categories** - Main, Updates, Promotions, etc.
2. **Priority Inbox** - Important first, derefter resten
3. **Simple List** - Traditionel inbox liste

---

## 📊 API Usage

### tRPC Endpoints

Alle API endpoints er tilgængelige via tRPC client:

```typescript
import { trpc } from '@/lib/trpc';

// AI kategorisering
const result = await trpc.inbox.ai.categorize.mutate({
  from: "john@example.com",
  subject: "Meeting",
  body: "Let's meet tomorrow",
  snippet: "Let's meet...",
  threadId: 123,
  gmailThreadId: "gmail123",
  useCache: true
});

// Opret label
const label = await trpc.inbox.labels.create.mutate({
  name: "Important",
  color: "#FF0000"
});

// Opret regel
await trpc.inbox.rules.create.mutate({
  name: "My Rule",
  conditions: { type: "all", rules: [...] },
  actions: [{ type: "addLabel", params: { labelId: label.id } }],
  priority: 10,
  isEnabled: true
});
```

### Alle 29 Endpoints

**Categories (2):**
- `inbox.categories.list`
- `inbox.categories.init`

**Labels (5):**
- `inbox.labels.create`
- `inbox.labels.list`
- `inbox.labels.delete`
- `inbox.labels.assign`
- `inbox.labels.remove`

**Rules (6):**
- `inbox.rules.create`
- `inbox.rules.list`
- `inbox.rules.update`
- `inbox.rules.delete`
- `inbox.rules.toggleEnabled`
- `inbox.rules.test`

**Preferences (2):**
- `inbox.preferences.get`
- `inbox.preferences.update`

**Templates (5):**
- `inbox.templates.create`
- `inbox.templates.list`
- `inbox.templates.getByCategory`
- `inbox.templates.update`
- `inbox.templates.delete`

**Snooze (3):**
- `inbox.snooze.snooze`
- `inbox.snooze.unsnooze`
- `inbox.snooze.list`

**AI (6):**
- `inbox.ai.categorize`
- `inbox.ai.smartReplies`
- `inbox.ai.extractActions`
- `inbox.ai.sentiment`
- `inbox.ai.summarize`
- `inbox.ai.priority`

---

## 🐛 Troubleshooting

### Database Connection Fejl

**Problem:** `getaddrinfo EAI_AGAIN`
```
Løsning: Tjek DATABASE_URL og netværksforbindelse
```

**Problem:** `DATABASE_URL is required`
```
Løsning: Opret .env fil med DATABASE_URL
```

### AI Features Virker Ikke

**Problem:** AI returner kun fallback kategorier
```
Løsning:
1. Tjek OPENAI_API_KEY er sat
2. Tjek API key er gyldig
3. Tjek OpenAI account har kredit
```

**Problem:** Lave confidence scores
```
Løsning:
1. Sænk confidence threshold i AI Settings
2. Brug mere præcis AI model (GPT-4 Turbo)
```

### Frontend Build Fejl

**Problem:** Missing UI components
```
Løsning: Install shadcn components:
npx shadcn-ui@latest add dialog tabs card button input textarea switch slider select
```

**Problem:** TypeScript errors
```
Løsning:
1. npm install
2. npm run check
```

### Migration Fejler

**Problem:** Migrations fejler
```
Løsning:
1. Tjek database er MySQL (ikke PostgreSQL)
2. Kør manual SQL fra drizzle/*.sql filer
3. Tjek database user har CREATE TABLE permissions
```

---

## 🚀 Production Deployment

### 1. Build Application

```bash
npm run build
```

Dette bygger:
- Frontend: Vite build → `dist/`
- Backend: esbuild bundle → `dist/index.js`

### 2. Set Production Environment

```bash
export NODE_ENV=production
export DATABASE_URL=mysql://...
export OPENAI_API_KEY=sk-...
```

### 3. Run Migrations

```bash
npm run db:push
```

### 4. Start Server

```bash
npm start
# Eller
node dist/index.js
```

Server starter på port 3000 (eller PORT env var).

### 5. Health Check

```bash
curl http://localhost:3000/health
```

---

## 📈 Monitoring

### Logs

Tjek console for:
- `[Email DB]` - Database operationer
- `[Email AI]` - AI calls og cache hits/misses
- `[Rules Engine]` - Regel matches og actions

### Performance Metrics

**AI Caching:**
- Cache hit rate: Log `[Email AI] Cache hit for thread X`
- Cache save: Log `[Email AI] Cached result for thread X`

**Database:**
- Query performance: Brug MySQL slow query log
- Connection pool: Monitor drizzle connection stats

---

## 🔐 Security

### API Keys

**ALDRIG commit API keys til git!**

Brug environment variables eller secrets management.

### Database

**Production checklist:**
- [ ] SSL/TLS forbindelse til database
- [ ] Database user har minimale permissions
- [ ] Backup strategi på plads
- [ ] Regular security updates

### JWT

**Brug stærk JWT_SECRET:**
```bash
# Generate random secret
openssl rand -base64 32
```

---

## 📚 Yderligere Ressourcer

### Documentation
- `FRIDAY_AI_INBOX_COMPLETE.md` - Komplet implementation guide
- `FRIDAY_AI_INBOX.md` - Feature dokumentation
- `IMPLEMENTATION_REPORT.md` - Teknisk rapport

### Code Examples
- Test files for usage examples
- `server/routers.ts` for API implementation
- Frontend components for UI patterns

### External Docs
- [Drizzle ORM](https://orm.drizzle.team/)
- [tRPC](https://trpc.io/)
- [OpenAI API](https://platform.openai.com/docs)

---

## ✅ Post-Setup Checklist

- [ ] Database migrations kørt
- [ ] Default categories initialized
- [ ] OpenAI API key valideret
- [ ] Test AI kategorisering virker
- [ ] Opret test label
- [ ] Opret test regel
- [ ] Opret test template
- [ ] Test smart replies
- [ ] Test snooze functionality
- [ ] Run unit tests
- [ ] Deploy til staging
- [ ] Deploy til production

---

## 🎉 Success!

Når alle steps er gennemført, har du:
- ✅ Fuldt fungerende Friday AI Inbox
- ✅ AI-powered email management
- ✅ Automation rules og templates
- ✅ Custom labels og kategorisering
- ✅ Smart replies og snooze
- ✅ Comprehensive testing

**Velkommen til fremtidens email management!** 🚀
