# Friday Chat Interface - TODO

## Core Features

### Database Schema & Models
- [x] Create conversations table (id, userId, title, createdAt, updatedAt)
- [x] Create messages table (id, conversationId, role, content, attachments, createdAt)
- [x] Create email_threads table (id, userId, gmailThreadId, subject, participants, lastMessageAt)
- [x] Create invoices table (id, userId, billyInvoiceId, customerId, amount, status, createdAt)
- [x] Create calendar_events table (id, userId, googleEventId, title, startTime, endTime, description)
- [x] Create leads table (id, userId, source, name, email, phone, score, status, createdAt)
- [x] Create tasks table (id, userId, title, description, dueDate, status, priority)

### Authentication & User Management
- [x] Configure NextAuth.js with Manus OAuth
- [x] Set up protected routes for authenticated users
- [ ] Add user profile management

### AI Router & Integration
- [x] Create AI router service to switch between models (GPT-4o, Claude, Gemini)
- [x] Implement OpenAI integration with streaming support
- [x] Add model selection logic based on task type
- [x] Implement conversation context management
- [x] Add support for file attachments in chat

### Chat Interface (Main Panel)
- [x] Build main chat UI with message bubbles
- [ ] Implement real-time message streaming
- [x] Add markdown rendering with syntax highlighting
- [x] Create file upload component (PDF, CSV, JSON)
- [x] Add conversation thread management
- [ ] Implement chat history search
- [ ] Add typing indicators
- [x] Create conversation sidebar with thread list

### Inbox Module (Unified Dashboard)
- [x] Create split-panel layout (60% chat, 40% inbox)
- [x] Build Email tab with Gmail integration via MCP
- [x] Build Billy tab for invoices and customers
- [x] Build Calendar tab with Google Calendar integration
- [x] Build Leads tab with pipeline view (Ny → Tilbud → Venter → Afsluttet)
- [x] Build Tasks tab
- [x] Add tab navigation and state management

### Google MCP Integration
- [x] Set up MCP CLI integration for Gmail
- [x] Implement email reading and searching
- [x] Add email drafting functionality
- [x] Set up Google Calendar MCP integration
- [x] Implement calendar event listing
- [x] Add availability checking
- [x] Implement event creation

### Billy API Integration
- [x] Create Billy API client
- [x] Implement invoice listing
- [x] Add invoice creation from chat commands
- [x] Implement customer management
- [x] Add product listing

### Friday AI Capabilities
- [ ] Implement "Find leads from last 7 days" command
- [ ] Add "Create invoice" natural language processing
- [ ] Implement "Check calendar availability" command
- [ ] Add "Draft email response" functionality
- [ ] Create revenue analytics command
- [ ] Implement multi-system workflow orchestration

### Critical Validation Rules (MEMORY)
- [ ] MEMORY_5: Check calendar before date proposals
- [ ] MEMORY_7: Search existing customer emails before quote emails
- [ ] MEMORY_15: Round calendar times (not 1.25h)
- [ ] MEMORY_16: Moving cleaning → Request pictures FIRST
- [ ] MEMORY_19: NEVER add attendees to calendar events
- [ ] MEMORY_25: Verify lead name against actual email

### Voice Input
- [x] Implement Web Speech API integration
- [x] Add voice-to-text button in chat input
- [x] Handle voice input errors gracefully

### Real-time Features
- [ ] Set up WebSocket/SSE for real-time updates
- [ ] Implement live message streaming
- [ ] Add real-time inbox updates
- [ ] Implement presence indicators

### UI/UX Enhancements
- [x] Implement dark mode theme
- [ ] Add command palette (⌘K) for power users
- [x] Create loading skeletons for all components
- [x] Add empty states for inbox modules
- [x] Implement mobile-responsive design
- [x] Add toast notifications for actions
- [x] Create error boundaries

### Testing & Documentation
- [ ] Test AI router with multiple models
- [ ] Test MCP integrations (Gmail, Calendar)
- [ ] Test Billy API integration
- [ ] Test real-time chat functionality
- [ ] Create user guide documentation
- [ ] Test mobile responsiveness
