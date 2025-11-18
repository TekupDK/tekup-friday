# Friday AI Chat

**Intelligent AI assistant for Rendetalje.dk** - A production-ready chat interface with unified inbox, OpenAI integration, and business automation.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/TekupDK/tekup-friday/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🎯 Overview

Friday is a Shortwave.ai-inspired chat interface built specifically for Rendetalje.dk cleaning business operations. It combines AI-powered conversation with real-time inbox management, calendar bookings, invoice handling, and lead tracking.

**No external dependencies** - Runs entirely on your infrastructure with direct AI API integration.

## 🆕 What's New (Recent Updates)

- ✨ **Customer Profile System** - Unified customer view with 4 tabs (Overview, Invoices, Emails, Chat)
- ✨ **Email Instant Loading** - Database storage with 5-minute browser cache for fast email access
- ✨ **Action Approval Workflow** - Review and approve AI-triggered actions before execution
- ✨ **Multi-Model AI** - Choose between Gemini 2.5 Flash, Claude 3.5 Sonnet, GPT-4o per message
- ✨ **Docker Development Environment** - Complete dev stack with hot reload (MySQL, Redis, Adminer)
- ✨ **Development Auto-Login** - `/login` endpoint for fast testing without OAuth
- 🐛 **All TypeScript Errors Fixed** - Clean compilation with zero errors

## ✨ Features

### 🤖 AI Chat Interface
- **Multi-Model AI**: Gemini 2.5 Flash (primary), Claude 3.5 Sonnet, GPT-4o, Manus AI
- **User Model Selection**: Choose AI model per message
- **Conversation Memory**: Full chat history context for better responses
- **Action Approval Workflow**: Review and approve AI-triggered actions with risk levels
- **Voice Input**: Web Speech API integration (Danish language)
- **Markdown Rendering**: Rich text formatting with syntax highlighting
- **File Attachments**: Support for PDF, CSV, JSON uploads

### 📧 Unified Inbox (Shortwave.ai-inspired)
- **Email Tab**: Gmail integration with instant database loading and 5-minute browser cache
- **Invoices Tab**: Billy.dk invoice management with AI analysis
- **Calendar Tab**: Google Calendar with hourly grid view (7:00-20:00)
- **Leads Tab**: Pipeline view (new → qualified → won → lost)
- **Tasks Tab**: Priority-based task management

### 👤 Customer Profile System (NEW!)
- **Unified Customer View**: Aggregates all customer data in one place
- **4-Tab Interface**: Overview, Invoices, Emails, Chat
- **AI-Generated Summaries**: Danish language customer profile summaries
- **Balance Tracking**: Automatic calculation from Billy invoices
- **Email History**: All emails to/from customer with threading
- **Dedicated Customer Chat**: 1-to-1 conversation per customer

### 🔄 Intent-Based Actions
Friday automatically detects and executes 7 types of actions:

1. **Create Lead** - Extracts contact info from messages
2. **Create Task** - Parses Danish date/time and priority
3. **Book Meeting** - Google Calendar integration (NO attendees - MEMORY_19)
4. **Create Invoice** - Billy API draft-only (349 kr/hour - MEMORY_17)
5. **Search Email** - Gmail API for duplicate detection
6. **Request Photos** - Flytterengøring workflow (MEMORY_16)
7. **Job Completion** - 6-step checklist automation (MEMORY_24)

### 🧠 25 MEMORY Business Rules
Critical business logic embedded in AI system prompt:
- **MEMORY_16**: Always request photos for flytterengøring before sending quotes
- **MEMORY_17**: Invoice drafts only, never auto-approve (349 kr/hour)
- **MEMORY_19**: NEVER add attendees to calendar events (prevents auto-invites)
- **MEMORY_24**: Job completion requires 6-step checklist
- **MEMORY_15**: Calendar bookings only on round hours (10:00, 10:30, 11:00)
- [See full list in `server/ai-router.ts`]

### 📱 Mobile Responsive
- **Desktop**: Split-panel layout (60% chat, 40% inbox)
- **Mobile**: Single column with drawer navigation
- **Touch-Friendly**: 44px minimum touch targets
- **Responsive Breakpoints**: sm (640px), md (768px), lg (1024px)

### 🎨 Modern UI/UX
- **Dark Theme**: Professional color palette
- **Smooth Animations**: Fade-in, slide-in transitions
- **Loading States**: Skeletons and spinners
- **Empty States**: Helpful placeholders
- **Toast Notifications**: User feedback

## 🏗️ Tech Stack

### Frontend
- **React 19** - Latest React features
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first styling
- **Radix UI** - Accessible components
- **tRPC** - End-to-end type-safe API
- **Streamdown** - Markdown rendering

### Backend
- **Express 4** - Node.js server
- **tRPC 11** - Type-safe procedures
- **Drizzle ORM** - Database management
- **MySQL/TiDB** - Relational database
- **Redis** - Caching layer

### Integrations
- **Google Gemini** - 2.5 Flash (primary AI model)
- **Anthropic Claude** - 3.5 Sonnet (email drafts, lead analysis)
- **OpenAI API** - GPT-4o (invoice creation, fallback)
- **Google API** - Gmail + Calendar (domain-wide delegation)
- **Billy.dk** - Invoice management API
- **AWS S3** - File storage and attachments
- **Manus Platform** - OAuth, LLM proxy, deployment

## 📦 Installation

### Prerequisites
- Docker & Docker Compose (recommended) OR Node.js 22.x + pnpm
- MySQL/TiDB database (included in Docker Compose or use remote TiDB)
- Redis (included in Docker Compose, optional for local dev)
- Google Gemini API key (primary AI model) OR OpenAI/Claude API keys
- Google Service Account with domain-wide delegation (for Gmail/Calendar)
- Billy.dk API key (for invoice integration)
- AWS S3 credentials (optional, for file storage)

### Quick Start with Docker (Recommended)

1. **Clone repository**
```bash
git clone https://github.com/TekupDK/tekup-friday.git
cd tekup-friday
```

2. **Configure environment**
```bash
cp env.template.txt .env
# Edit .env and set:
# - DATABASE_URL (use provided TiDB or local MySQL)
# - OPENAI_API_KEY (get from OpenAI platform)
# - JWT_SECRET (any secure random string)
# - OWNER_OPEN_ID (any stable string for admin user ID)
# - Google and Billy credentials if using those features
```

3. **Build and run**
```bash
docker-compose build
docker-compose up -d
```

4. **Access the services**
```bash
# App runs on http://localhost:3000
# Visit http://localhost:3000/login to auto-login in dev mode
# Database GUI: http://localhost:8080 (Adminer)
# Redis: localhost:6379
# MySQL: localhost:3306
```

**Docker Services:**
- `friday-ai` - Main application (port 3000)
- `db` - MySQL 8.0 database (port 3306)
- `redis` - Redis cache (port 6379)
- `adminer` - Database web GUI (port 8080)

### Local Development (without Docker)

1. **Clone repository**
```bash
git clone https://github.com/TekupDK/tekup-friday.git
cd tekup-friday
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Configure environment**
```bash
cp env.template.txt .env
# Edit .env with your credentials (same as Docker setup above)
```

4. **Push database schema**
```bash
pnpm db:push
```

5. **Start development server**
```bash
pnpm dev
```

Server runs on `http://localhost:3000`

## 🔐 Authentication

Friday uses **local session-based authentication** with JWT tokens:

- **Development Mode**: Visit `/login` to auto-login with `OWNER_OPEN_ID` (added in recent commit)
- **Production**: Set `ALLOW_DEV_LOGIN=true` in environment to enable `/login` endpoint
- **Manus OAuth**: Full OAuth integration via Manus platform (production)
- **Session Management**: HTTP-only cookies with 1-year expiration
- No external OAuth dependencies for development - fully self-hosted

## 🤖 AI Configuration

Friday uses **multi-model AI** with **Gemini 2.5 Flash** as the primary model:

**Available Models:**
- 🚀 **Gemini 2.5 Flash** (primary) - Fast, cost-effective, good Danish support
- 🧠 **Claude 3.5 Sonnet** - Email drafts, lead analysis, complex reasoning
- 💬 **GPT-4o** - Invoice creation, fallback for specialized tasks
- ⚡ **Manus AI** - Platform-integrated model

**Configuration:**
1. Set API keys in `.env`: `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`
2. Model routing configured in `server/ai-router.ts`
3. Users can select model per message in UI
4. Action Approval System validates AI-triggered actions before execution

**Model Selection Strategy:**
- Chat responses → Gemini 2.5 Flash
- Email drafts → Claude 3.5 Sonnet
- Invoice creation → GPT-4o
- Calendar/data → Gemini 2.5 Flash

## 🗄️ Database Schema

14 tables for complete business operations:

**Core System:**
- **users** - Local authentication with JWT sessions
- **conversations** - Chat threads
- **messages** - Chat messages with AI responses
- **analytics_events** - User tracking

**Email Management:**
- **email_threads** - Gmail thread metadata
- **email_messages** - Individual email message storage (NEW)

**Customer Management (NEW):**
- **customer_profiles** - Aggregated customer data with AI summaries
- **customer_invoices** - Customer-invoice junction table
- **customer_emails** - Customer-email relationship mapping
- **customer_conversations** - Dedicated customer chat threads

**Business Operations:**
- **invoices** - Billy.dk invoice tracking
- **calendar_events** - Google Calendar event sync
- **leads** - Sales pipeline management
- **tasks** - Task tracking with priority

See `drizzle/schema.ts` for full schema details.

## 🚀 Deployment

### Docker Production

```bash
# Build production image
docker-compose build

# Run with production settings
docker-compose up -d

# Check logs
docker logs -f friday-ai

# Check health
curl http://localhost:3000/
```

### Environment Variables for Production

**Required:**
- `DATABASE_URL` - MySQL/TiDB connection string with URL-encoded SSL
- `JWT_SECRET` - Strong random string for session signing
- `OWNER_OPEN_ID` - Admin user identifier
- `VITE_APP_ID` - App identifier (default: friday-ai)
- `ALLOW_DEV_LOGIN=true` - Enable /login endpoint in production

**AI Models (at least one):**
- `GEMINI_API_KEY` - Google Gemini API key (recommended primary)
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic Claude API key
- `BUILT_IN_FORGE_API_KEY` - Manus AI platform key

**Optional (for full features):**
- `REDIS_URL` - Redis connection string (for caching)
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - S3 file storage
- `GOOGLE_SERVICE_ACCOUNT_KEY` - JSON for Gmail/Calendar
- `GOOGLE_IMPERSONATED_USER` - Email to impersonate
- `GOOGLE_CALENDAR_ID` - Calendar to use
- `BILLY_API_KEY` - Billy.dk integration
- `BILLY_ORGANIZATION_ID` - Billy organization

## 🔧 Development

### Project Structure
```
tekup-friday/
├── client/               # Frontend React app
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   │   ├── ChatPanel.tsx           # Chat interface
│   │   │   ├── InboxPanel.tsx          # Inbox tabs
│   │   │   ├── CustomerProfile.tsx     # Customer modal (NEW)
│   │   │   ├── ActionApprovalModal.tsx # Action approval (NEW)
│   │   │   └── inbox/                  # Inbox tab components
│   │   ├── pages/       # Route components
│   │   ├── lib/         # tRPC client
│   │   └── App.tsx      # Main app
├── server/              # Backend Express server
│   ├── routers.ts       # Main tRPC router (32 endpoints)
│   ├── db.ts            # Database helpers
│   ├── customer-db.ts   # Customer data access (NEW)
│   ├── customer-router.ts # Customer endpoints (NEW)
│   ├── ai-router.ts     # AI routing & model selection
│   ├── google-api.ts    # Gmail/Calendar integration
│   ├── billy.ts         # Billy API client
│   ├── billy-sync.ts    # Billy invoice sync (NEW)
│   └── _core/           # Core server setup
│       ├── index.ts     # Express server
│       ├── oauth.ts     # Auth with /login endpoint (NEW)
│       └── llm.ts       # LLM abstraction
├── drizzle/             # Database schema (14 tables)
├── shared/              # Shared types
├── docs/                # Documentation (NEW)
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT_GUIDE.md
│   └── API_REFERENCE.md
├── Dockerfile.dev       # Dev container (NEW)
└── docker-compose.yml   # Full stack setup (NEW)
```

### Key Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm db:push      # Push schema changes
pnpm db:studio    # Open Drizzle Studio
```

## 🚀 Deployment

### Manus Platform (Recommended)
1. Save checkpoint in Manus UI
2. Click "Publish" button
3. Auto-deployed with global CDN

### Manual Deployment
```bash
pnpm build
# Deploy dist/ folder to your hosting
```

## 📖 Usage Guide

### Creating a Lead
```
User: "Ny lead fra Rengøring.nu: Hans Jensen, hans@email.dk, 12345678"
Friday: [Creates lead in database] "Lead oprettet! Skal jeg sende en tilbudsmail?"
```

### Viewing Customer Profile (NEW!)
```
User: Clicks "View Profile" button on lead/email
Friday: Opens customer profile modal with:
  - Tab 1 (Overview): AI-generated summary, contact info, balance
  - Tab 2 (Invoices): All Billy invoices with total balance
  - Tab 3 (Emails): Email thread history with customer
  - Tab 4 (Chat): Dedicated 1-to-1 conversation
```

### Action Approval Workflow (NEW!)
```
User: "Send faktura til Hans Jensen"
Friday: [Shows approval modal] "Review Action: Create Invoice"
  Risk: Medium | Customer: Hans Jensen | Amount: 1047 kr
  [Approve] [Reject] [Always approve low-risk actions]
User: Clicks Approve
Friday: [Executes action] "Faktura-udkast oprettet i Billy ✓"
```

### Booking Calendar
```
User: "Book møde med kunde i morgen kl 14"
Friday: [Checks calendar, creates event] "Møde booket 14:00 i morgen ✓"
```

### Invoice Creation
```
User: "Lav faktura til Hans Jensen for 3 timer rengøring"
Friday: [Creates Billy draft at 349 kr/hour] "Faktura-udkast oprettet i Billy (1047 kr)"
```

### Flytterengøring Workflow
```
User: "Kunde vil have tilbud på flytterengøring"
Friday: "Jeg skal bruge billeder først (MEMORY_16). Kan du sende fotos af lejligheden?"
[Blocks quote sending until photos received]
```

## 🧪 Testing

### Tested Workflows (3/7)
✅ Lead creation with flytterengøring (MEMORY_16 working)  
✅ Task creation with Danish parsing  
✅ Calendar booking (Intent sent successfully)  

### Pending Tests
⏳ Invoice creation via Billy API  
⏳ Gmail search for duplicate leads  
⏳ Job completion 6-step checklist  
⏳ Photo request blocking quote sending  

## 📝 License

MIT License - see [LICENSE](LICENSE) file

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Complete system architecture overview
- **[DEVELOPMENT_GUIDE.md](docs/DEVELOPMENT_GUIDE.md)** - Developer setup and workflows
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - tRPC endpoint documentation
- **[CURSOR_RULES.md](docs/CURSOR_RULES.md)** - Coding standards and best practices

Additional documentation files:
- **[DOCKER_SETUP.md](DOCKER_SETUP.md)** - Detailed Docker deployment guide
- **[STATUS.md](STATUS.md)** - Current project status and testing results
- **[BILLY_INTEGRATION.md](BILLY_INTEGRATION.md)** - Billy.dk integration details

## 🤝 Contributing

This is a private project for Rendetalje.dk. For questions or issues, contact TekupDK.

## 🔗 Related Projects

- **[TekupDK/tekup](https://github.com/TekupDK/tekup)** - Original monorepo (archived)
- **[TekupDK/tekup-billy](https://github.com/TekupDK/tekup-billy)** - Billy MCP server
- **[TekupDK/tekup-secrets](https://github.com/TekupDK/tekup-secrets)** - Secrets management
- **[TekupDK/tekup-vault](https://github.com/TekupDK/tekup-vault)** - Vault integration

## 📧 Support

For technical support or feature requests, open an issue on GitHub.

---

**Built with ❤️ by TekupDK for Rendetalje.dk**
