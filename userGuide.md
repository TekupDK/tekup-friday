# Friday - TekupDK AI Chat Interface

**Website URL:** https://3000-ijhgukurr5hhbd1h5s5sk-e0f84be7.manusvm.computer

**Purpose:** Friday is your intelligent AI assistant that unifies chat, email, invoices, calendar, leads, and tasks into one powerful interface for TekupDK operations.

**Access:** Login required with Manus OAuth authentication

---

## Powered by Manus

Friday is built with cutting-edge technology on the Manus platform:

**Frontend:** React 19 + TypeScript + Tailwind CSS 4 + tRPC 11 for type-safe end-to-end APIs

**Backend:** Express 4 + tRPC 11 + Drizzle ORM with MySQL/TiDB database for scalable data management

**AI Integration:** Multi-model AI router supporting OpenAI GPT-4o, Claude, and Google Gemini with intelligent task-based routing

**External Integrations:** Google MCP for Gmail and Calendar, Tekup-Billy API for invoicing and customer management

**Deployment:** Auto-scaling infrastructure with global CDN, OAuth 2.0 authentication, and real-time WebSocket support

---

## Using Your Website

### Chat with Friday

Click "New Chat" in the left sidebar to start a conversation. Type your message in the input box at the bottom and click "Send" or press Enter. Friday responds using advanced AI models, automatically routing your request to the best model for the task. You can also click the microphone icon to use voice input instead of typing.

### Unified Inbox

The right panel provides five tabs for managing your business operations. Click "Email" to view Gmail messages, "Invoices" to see Billy invoices, "Calendar" to check Google Calendar events, "Leads" to track sales pipeline, or "Tasks" to manage your to-do list. Each tab refreshes automatically to show the latest data.

### Voice Commands

Click the microphone button in the chat input to speak your message instead of typing. Friday will transcribe your speech and process it just like a text message. This works best in Chrome and Edge browsers.

---

## Managing Your Website

### Settings Panel

Access the Settings panel from the Management UI to configure your website name, logo, and visibility. Update environment variables like API keys in the Secrets section.

### Database Panel

View and manage all your data (conversations, messages, leads, tasks) directly in the Database panel. You can add, edit, or delete records as needed.

### Dashboard Panel

Monitor your website's performance, view analytics, and check visitor statistics in the Dashboard panel. For published sites, you can also configure custom domains here.

---

## Next Steps

Talk to Manus AI anytime to request changes or add features. Try asking Friday to "Find leads from last 7 days" or "Create an invoice for a customer" to see the AI-powered automation in action.

### Production Readiness

Before going live, update these API keys in Settings → Secrets:

- **GEMINI_API_KEY**: Get your production key from Google AI Studio
- **Billy API credentials**: Ensure you're using production Billy API keys, not test/sandbox keys

Get production keys from the respective service websites before publishing your site.
