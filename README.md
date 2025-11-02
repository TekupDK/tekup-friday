# Friday AI Chat

**Intelligent AI assistant for Rendetalje.dk** - A production-ready chat interface with unified inbox, OpenAI integration, and business automation.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/TekupDK/tekup-friday/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🎯 Overview

Friday is a Shortwave.ai-inspired chat interface built specifically for Rendetalje.dk cleaning business operations. It combines AI-powered conversation with real-time inbox management, calendar bookings, invoice handling, and lead tracking.

**No external dependencies** - Runs entirely on your infrastructure with direct OpenAI API integration.

## ✨ Features

### 🤖 AI Chat Interface
- **OpenAI GPT-4o-mini**: Fast, cost-effective AI responses
- **Conversation Memory**: Full chat history context for better responses
- **Voice Input**: Web Speech API integration (Danish language)
- **Markdown Rendering**: Rich text formatting with syntax highlighting
- **File Attachments**: Support for PDF, CSV, JSON uploads

### 📧 Unified Inbox (Shortwave.ai-inspired)
- **Email Tab**: Gmail integration with time-based grouping (TODAY, YESTERDAY, LAST 7 DAYS)
- **Invoices Tab**: Billy.dk invoice management with AI analysis
- **Calendar Tab**: Google Calendar with hourly grid view (7:00-20:00)
- **Leads Tab**: Pipeline view (new → qualified → won → lost)
- **Tasks Tab**: Priority-based task management

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

### Integrations
- **OpenAI API** - Direct GPT-4o-mini integration
- **Google API** - Gmail + Calendar (domain-wide delegation)
- **Billy.dk** - Invoice management API

## 📦 Installation

### Prerequisites
- Docker & Docker Compose (recommended) OR Node.js 22.x + pnpm
- MySQL/TiDB database (included in Docker Compose or use remote TiDB)
- OpenAI API key ([get one here](https://platform.openai.com/account/api-keys))
- Google Service Account with domain-wide delegation (for Gmail/Calendar)
- Billy.dk API key (for invoice integration)

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

4. **Access the app**
```bash
# App runs on http://localhost:3000
# Visit http://localhost:3000/login to auto-login in dev mode
```

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

- **Development**: Visit `/login` to auto-login with `OWNER_OPEN_ID`
- **Production**: Set `ALLOW_DEV_LOGIN=true` in docker-compose to enable `/login` endpoint
- No external OAuth dependencies - fully self-hosted
- Session cookies expire after 1 year

## 🤖 AI Configuration

Friday uses **OpenAI GPT-4o-mini** directly:

1. Get API key from [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Set `OPENAI_API_KEY` in `.env`
3. Model configured in `server/_core/llm.ts` (currently `gpt-4o-mini`)
4. Change model by editing `payload.model` in `invokeLLM()` function

## 🗄️ Database Schema

9 tables for complete business operations:

- **users** - Local authentication with JWT sessions
- **conversations** - Chat threads
- **messages** - Chat messages with AI responses
- **email_threads** - Gmail integration
- **invoices** - Billy.dk invoices
- **calendar_events** - Google Calendar events
- **leads** - Sales pipeline
- **tasks** - Task management
- **analytics_events** - User tracking

See `drizzle/schema.ts` for full schema.

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

Required:
- `DATABASE_URL` - MySQL/TiDB connection string with URL-encoded SSL
- `OPENAI_API_KEY` - Valid OpenAI API key
- `JWT_SECRET` - Strong random string for session signing
- `VITE_APP_ID` - App identifier (default: friday-ai)
- `OWNER_OPEN_ID` - Admin user identifier
- `ALLOW_DEV_LOGIN=true` - Enable /login endpoint in production

Optional (for full features):
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
│   │   ├── pages/       # Route components
│   │   ├── lib/         # tRPC client
│   │   └── App.tsx      # Main app
├── server/              # Backend Express server
│   ├── routers.ts       # tRPC procedures
│   ├── db.ts            # Database helpers
│   ├── ai-router.ts     # AI routing logic
│   ├── google-api.ts    # Gmail/Calendar
│   ├── billy.ts         # Billy integration
│   └── mcp.ts           # MCP framework
├── drizzle/             # Database schema
└── shared/              # Shared types
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
