import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  createConversation,
  getUserConversations,
  getConversation,
  createMessage,
  getConversationMessages,
  updateConversationTitle,
  getUserLeads,
  getUserTasks,
  createLead,
  updateLeadStatus,
  updateLeadScore,
  createTask,
  updateTaskStatus,
  trackEvent,
} from "./db";
import { routeAI, type PendingAction } from "./ai-router";
import { parseIntent, executeAction } from "./intent-actions";
import { generateConversationTitle } from "./title-generator";
import {
  searchGmailThreads,
  getGmailThread,
  createGmailDraft,
  listCalendarEvents,
  createCalendarEvent,
  checkCalendarAvailability,
  findFreeSlots,
} from "./google-api";
import {
  getCustomers as getBillyCustomers,
  getInvoices as getBillyInvoices,
  getInvoicesWithCustomerNames,
  createInvoice as createBillyInvoice,
  searchCustomerByEmail,
} from "./billy";
import { getAllCustomerProfiles } from "./customer-db";
import { customerRouter } from "./customer-router";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  customer: customerRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Chat interface
  chat: router({
    list: protectedProcedure.query(async ({ ctx }) => getUserConversations(ctx.user.id)),
    get: protectedProcedure.input(z.object({ conversationId: z.number() })).query(async ({ input }) => {
      const conversation = await getConversation(input.conversationId);
      if (!conversation) return null;
      const messages = await getConversationMessages(input.conversationId);
      return { conversation, messages };
    }),
    create: protectedProcedure.input(z.object({ title: z.string().optional() })).mutation(async ({ ctx, input }) => {
      return createConversation({ userId: ctx.user.id, title: input.title || "New Conversation" });
    }),
    sendMessage: protectedProcedure.input(z.object({ conversationId: z.number(), content: z.string(), model: z.enum(["gemini-2.5-flash", "claude-3-5-sonnet", "gpt-4o", "manus-ai"]).optional(), attachments: z.array(z.object({ url: z.string(), name: z.string(), type: z.string() })).optional() })).mutation(async ({ ctx, input }) => {
      const userMessage = await createMessage({ conversationId: input.conversationId, role: "user", content: input.content, attachments: input.attachments });
      const messages = await getConversationMessages(input.conversationId);
      
      // Check if this is the first message and conversation has no title
      const conversation = await getConversation(input.conversationId);
      if (conversation && messages.length === 1 && (!conversation.title || conversation.title === "New Conversation")) {
        // Generate title asynchronously (non-blocking)
        generateConversationTitle(input.content, input.model).then(async (title) => {
          await updateConversationTitle(input.conversationId, title);
          console.log(`[Chat] Auto-generated title for conversation ${input.conversationId}: ${title}`);
        }).catch((error) => {
          console.error(`[Chat] Title generation failed for conversation ${input.conversationId}:`, error);
        });
      }
      
      const aiMessages = messages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content }));
      const aiResponse = await routeAI({ messages: aiMessages, taskType: "chat", userId: ctx.user.id, preferredModel: input.model, requireApproval: true });
      const assistantMessage = await createMessage({ conversationId: input.conversationId, role: "assistant", content: aiResponse.content, model: aiResponse.model });
      await trackEvent({ userId: ctx.user.id, eventType: "message_sent", eventData: { conversationId: input.conversationId } });
      return { userMessage, assistantMessage, pendingAction: aiResponse.pendingAction };
    }),
    updateTitle: protectedProcedure.input(z.object({ conversationId: z.number(), title: z.string() })).mutation(async ({ input }) => {
      await updateConversationTitle(input.conversationId, input.title);
      return { success: true };
    }),
    analyzeInvoice: protectedProcedure.input(z.object({ invoiceData: z.string() })).mutation(async ({ input }) => {
      // Use AI to analyze the invoice
      const aiResponse = await routeAI({
        messages: [
          { role: "system", content: "You are a financial analyst expert. Analyze invoices and provide insights about payment status, completeness, anomalies, and recommendations." },
          { role: "user", content: input.invoiceData },
        ],
        taskType: "data-analysis",
        preferredModel: "gemini-2.5-flash",
      });
      return { analysis: aiResponse.content };
    }),
    submitAnalysisFeedback: protectedProcedure.input(z.object({ invoiceId: z.string(), rating: z.enum(["up", "down"]), analysis: z.string() })).mutation(async ({ ctx, input }) => {
      // Store feedback in database for analytics
      // For now, just log it (can be extended to save to DB later)
      console.log(`[Feedback] User ${ctx.user.id} rated invoice ${input.invoiceId} analysis as ${input.rating}`);
      await trackEvent({ userId: ctx.user.id, eventType: "analysis_feedback", eventData: { invoiceId: input.invoiceId, rating: input.rating } });
      return { success: true };
    }),
    executeAction: protectedProcedure.input(z.object({ conversationId: z.number(), actionId: z.string(), actionType: z.string(), actionParams: z.record(z.string(), z.any()) })).mutation(async ({ ctx, input }) => {
      // Execute the approved action
      const intent = { intent: input.actionType as any, params: input.actionParams, confidence: 1.0 };
      const actionResult = await executeAction(intent, ctx.user.id);
      
      // Create system message with action result
      const resultMessage = await createMessage({
        conversationId: input.conversationId,
        role: "system",
        content: `[Action Executed] ${actionResult.success ? "Success" : "Failed"}: ${actionResult.message}${actionResult.data ? "\nData: " + JSON.stringify(actionResult.data, null, 2) : ""}${actionResult.error ? "\nError: " + actionResult.error : ""}`,
      });
      
      // Get AI response acknowledging the action
      const messages = await getConversationMessages(input.conversationId);
      const aiMessages = messages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content }));
      const aiResponse = await routeAI({ messages: aiMessages, taskType: "chat", userId: ctx.user.id, requireApproval: false });
      
      const assistantMessage = await createMessage({
        conversationId: input.conversationId,
        role: "assistant",
        content: aiResponse.content,
        model: aiResponse.model,
      });
      
      return { actionResult, assistantMessage };
    }),
  }),

  // Inbox modules
  inbox: router({
    email: router({
      // Sync emails from Gmail to database
      sync: protectedProcedure.mutation(async ({ ctx }) => {
        if (!ctx.user) throw new Error('Not authenticated');

        try {
          console.log('[Email Sync] Starting sync...');
          // Sync inbox, sent, and important emails
          const queries = ['in:inbox', 'in:sent', 'is:important'];
          const allThreads = new Map<string, any>(); // Deduplicate by thread ID

          for (const query of queries) {
            const threads = await searchGmailThreads({ query, maxResults: 50 });
            for (const thread of threads) {
              allThreads.set(thread.id, thread);
            }
          }

          const { createEmailThread, getEmailThreadByGmailId, saveEmailMessages } = await import('./db');
          let syncedEmails = 0;

          // Process each thread
          for (const gmailThread of Array.from(allThreads.values())) {
            // 1. Create or get email thread
            let dbThread = await getEmailThreadByGmailId(ctx.user.id, gmailThread.id);

            if (!dbThread) {
              // Extract participants from messages
              const participants = new Set<string>();
              for (const msg of gmailThread.messages) {
                if (msg.from) participants.add(msg.from);
                if (msg.to) participants.add(msg.to);
              }

              const lastMessage = gmailThread.messages[gmailThread.messages.length - 1];

              dbThread = await createEmailThread({
                userId: ctx.user.id,
                gmailThreadId: gmailThread.id,
                subject: lastMessage?.subject || '(No subject)',
                participants: Array.from(participants).map(email => ({
                  name: email.split('<')[0].trim(),
                  email: email.match(/<(.+)>/)?.[1] || email
                })),
                snippet: gmailThread.snippet,
                labels: [], // Labels are per-message, not per-thread
                lastMessageAt: lastMessage ? new Date(lastMessage.date) : new Date(),
                isRead: false, // Will be updated based on messages
              });
            }

            // 2. Save all messages in thread
            const emailsToSave = gmailThread.messages.map((msg: any) => ({
              userId: ctx.user.id,
              threadId: dbThread!.id, // Link to database thread
              gmailMessageId: msg.id,
              gmailThreadId: msg.threadId,
              from: msg.from,
              to: msg.to,
              cc: null,
              bcc: null,
              subject: msg.subject,
              bodyText: msg.body,
              bodyHtml: null,
              snippet: gmailThread.snippet,
              date: new Date(msg.date),
              labels: msg.labels || [], // Parsed from Gmail API
              hasAttachment: msg.hasAttachment || false, // Parsed from Gmail API
              isRead: !msg.isUnread, // Inverse of isUnread
              isStarred: msg.isStarred || false, // Parsed from Gmail API
              internalDate: new Date(msg.date),
            }));

            await saveEmailMessages(emailsToSave);
            syncedEmails += emailsToSave.length;
          }

          console.log(`[Email Sync] Synced ${syncedEmails} emails across ${allThreads.size} threads`);
          return { success: true, synced: syncedEmails, threads: allThreads.size };
        } catch (error: any) {
          console.error('[Email Sync] Error:', error);
          throw new Error(`Email sync failed: ${error.message}`);
        }
      }),
      
      list: protectedProcedure.input(z.object({ maxResults: z.number().optional(), query: z.string().optional() })).query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error('Not authenticated');

        try {
          // INSTANT LOAD: Read from database first
          const { getUserEmails } = await import('./db');
          const dbEmails = await getUserEmails(ctx.user.id, input.maxResults || 50);

          console.log(`[Email List] Loaded ${dbEmails.length} emails from database`);

          // Transform database emails to Gmail thread format for frontend compatibility
          if (dbEmails.length > 0) {
            // Group by threadId
            const threadMap = new Map<string, any>();

            for (const email of dbEmails) {
              if (!threadMap.has(email.gmailThreadId)) {
                threadMap.set(email.gmailThreadId, {
                  id: email.gmailThreadId,
                  snippet: email.snippet || '',
                  messages: []
                });
              }

              const thread = threadMap.get(email.gmailThreadId);
              thread.messages.push({
                id: email.gmailMessageId,
                threadId: email.gmailThreadId,
                from: email.from,
                to: email.to,
                subject: email.subject || '',
                body: email.bodyText || '',
                date: email.date.toISOString(),
                labels: email.labels || [],
                hasAttachment: email.hasAttachment || false,
                isUnread: !email.isRead, // Convert isRead to isUnread for frontend
                isStarred: email.isStarred || false,
              });
            }

            return Array.from(threadMap.values());
          }

          // No emails in database - return empty array (user needs to sync)
          console.log('[Email List] No emails in database. User should click sync.');
          return [];
        } catch (error: any) {
          console.error('[Email List] Database error:', error);
          throw new Error(`Failed to load emails: ${error.message}`);
        }
      }),
      get: protectedProcedure.input(z.object({ threadId: z.string() })).query(async ({ input }) => getGmailThread(input.threadId)),
      search: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => searchGmailThreads({ query: input.query, maxResults: 50 })),
      createDraft: protectedProcedure.input(z.object({ to: z.string(), subject: z.string(), body: z.string(), cc: z.string().optional(), bcc: z.string().optional() })).mutation(async ({ input }) => createGmailDraft(input)),
    }),
    invoices: router({
      list: protectedProcedure.query(async () => {
        console.log('💰 [Router] Fetching invoices with customer names from Billy...');
        return getInvoicesWithCustomerNames();
      }),
      create: protectedProcedure.input(z.object({ contactId: z.string(), entryDate: z.string(), paymentTermsDays: z.number().optional(), lines: z.array(z.object({ description: z.string(), quantity: z.number(), unitPrice: z.number(), productId: z.string().optional() })) })).mutation(async ({ input }) => createBillyInvoice(input)),
    }),
    calendar: router({
      list: protectedProcedure.input(z.object({ timeMin: z.string().optional(), timeMax: z.string().optional(), maxResults: z.number().optional() })).query(async ({ input }) => listCalendarEvents(input)),
      create: protectedProcedure.input(z.object({ summary: z.string(), description: z.string().optional(), start: z.string(), end: z.string(), location: z.string().optional() })).mutation(async ({ input }) => createCalendarEvent(input)),
      checkAvailability: protectedProcedure.input(z.object({ start: z.string(), end: z.string() })).query(async ({ input }) => checkCalendarAvailability(input)),
      findFreeSlots: protectedProcedure.input(z.object({ startDate: z.string(), endDate: z.string(), durationHours: z.number() })).query(async ({ input }) => findFreeSlots(input)),
    }),
    leads: router({
      list: protectedProcedure.query(async ({ ctx }) => getUserLeads(ctx.user.id)),
      create: protectedProcedure.input(z.object({ source: z.string(), name: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), company: z.string().optional(), notes: z.string().optional(), metadata: z.record(z.string(), z.unknown()).optional() })).mutation(async ({ ctx, input }) => {
        const lead = await createLead({ userId: ctx.user.id, source: input.source, name: input.name, email: input.email, phone: input.phone, company: input.company, notes: input.notes, metadata: input.metadata });
        await trackEvent({ userId: ctx.user.id, eventType: "lead_created", eventData: { leadId: lead.id, source: input.source } });
        return lead;
      }),
      updateStatus: protectedProcedure.input(z.object({ leadId: z.number(), status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]) })).mutation(async ({ input }) => {
        await updateLeadStatus(input.leadId, input.status);
        return { success: true };
      }),
      updateScore: protectedProcedure.input(z.object({ leadId: z.number(), score: z.number() })).mutation(async ({ input }) => {
        await updateLeadScore(input.leadId, input.score);
        return { success: true };
      }),
    }),
    tasks: router({
      list: protectedProcedure.query(async ({ ctx }) => getUserTasks(ctx.user.id)),
      create: protectedProcedure.input(z.object({ title: z.string(), description: z.string().optional(), dueDate: z.string().optional(), priority: z.enum(["low", "medium", "high", "urgent"]).optional(), relatedTo: z.string().optional() })).mutation(async ({ ctx, input }) => {
        return createTask({ userId: ctx.user.id, title: input.title, description: input.description, dueDate: input.dueDate ? new Date(input.dueDate) : undefined, priority: input.priority, relatedTo: input.relatedTo });
      }),
      updateStatus: protectedProcedure.input(z.object({ taskId: z.number(), status: z.enum(["todo", "in_progress", "done", "cancelled"]) })).mutation(async ({ input }) => {
        await updateTaskStatus(input.taskId, input.status);
        return { success: true };
      }),
    }),
  }),

  // Friday AI commands
  friday: router({
    findRecentLeads: protectedProcedure.input(z.object({ days: z.number().default(7) })).query(async ({ input }) => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - input.days);
      const query = `after:${daysAgo.toISOString().split("T")[0]}`;
      return searchGmailThreads({ query, maxResults: 100 });
    }),
    getCustomers: protectedProcedure.query(async ({ ctx }) => {
      // Return customer profiles from database (created from leads)
      const profiles = await getAllCustomerProfiles(ctx.user.id);
      console.log('👥 [Router] getCustomers returned', profiles.length, 'customer profiles');
      return profiles;
    }),
    searchCustomer: protectedProcedure.input(z.object({ email: z.string() })).query(async ({ input }) => searchCustomerByEmail(input.email)),

    // Email Categories
    categories: router({
      list: protectedProcedure.query(async () => {
        const { getAllCategories } = await import('./email-db');
        return getAllCategories();
      }),
      init: protectedProcedure.mutation(async () => {
        const { initializeDefaultCategories } = await import('./email-db');
        return initializeDefaultCategories();
      }),
    }),

    // Email Labels
    labels: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const { getUserLabels } = await import('./email-db');
        return getUserLabels(ctx.user.id);
      }),
      create: protectedProcedure.input(z.object({ name: z.string(), color: z.string(), icon: z.string().optional() })).mutation(async ({ ctx, input }) => {
        const { createLabel } = await import('./email-db');
        return createLabel({ userId: ctx.user.id, ...input });
      }),
      delete: protectedProcedure.input(z.object({ labelId: z.number() })).mutation(async ({ input }) => {
        const { deleteLabel } = await import('./email-db');
        await deleteLabel(input.labelId);
        return { success: true };
      }),
      assignToThread: protectedProcedure.input(z.object({ threadId: z.number(), labelId: z.number() })).mutation(async ({ input }) => {
        const { assignLabelToThread } = await import('./email-db');
        await assignLabelToThread(input.threadId, input.labelId);
        return { success: true };
      }),
      removeFromThread: protectedProcedure.input(z.object({ threadId: z.number(), labelId: z.number() })).mutation(async ({ input }) => {
        const { removeLabelFromThread } = await import('./email-db');
        await removeLabelFromThread(input.threadId, input.labelId);
        return { success: true };
      }),
    }),

    // Email Rules
    rules: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const { getUserRules } = await import('./email-db');
        return getUserRules(ctx.user.id);
      }),
      create: protectedProcedure.input(z.object({ name: z.string(), description: z.string().optional(), priority: z.number().optional(), conditions: z.any(), actions: z.any() })).mutation(async ({ ctx, input }) => {
        const { createRule } = await import('./email-db');
        return createRule({ userId: ctx.user.id, ...input });
      }),
      update: protectedProcedure.input(z.object({ ruleId: z.number(), name: z.string().optional(), description: z.string().optional(), priority: z.number().optional(), conditions: z.any().optional(), actions: z.any().optional(), isEnabled: z.boolean().optional() })).mutation(async ({ input }) => {
        const { updateRule } = await import('./email-db');
        const { ruleId, ...data } = input;
        await updateRule(ruleId, data);
        return { success: true };
      }),
      delete: protectedProcedure.input(z.object({ ruleId: z.number() })).mutation(async ({ input }) => {
        const { deleteRule } = await import('./email-db');
        await deleteRule(input.ruleId);
        return { success: true };
      }),
      toggle: protectedProcedure.input(z.object({ ruleId: z.number(), isEnabled: z.boolean() })).mutation(async ({ input }) => {
        const { toggleRuleEnabled } = await import('./email-db');
        await toggleRuleEnabled(input.ruleId, input.isEnabled);
        return { success: true };
      }),
      templates: protectedProcedure.query(() => {
        const { RULE_TEMPLATES } = require('./email-rules-engine');
        return RULE_TEMPLATES;
      }),
    }),

    // User Preferences
    preferences: router({
      get: protectedProcedure.query(async ({ ctx }) => {
        const { getUserPreferences } = await import('./email-db');
        return getUserPreferences(ctx.user.id);
      }),
      update: protectedProcedure.input(z.object({ inboxLayout: z.enum(["gmail_categories", "important_other", "basic"]).optional(), defaultView: z.string().optional(), emailsPerPage: z.number().optional(), theme: z.string().optional(), enableAISummarization: z.boolean().optional(), enableSmartReplies: z.boolean().optional(), enablePriorityScoring: z.boolean().optional(), settings: z.any().optional() })).mutation(async ({ ctx, input }) => {
        const { updateUserPreferences } = await import('./email-db');
        await updateUserPreferences(ctx.user.id, input);
        return { success: true };
      }),
    }),

    // Email Templates
    templates: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        const { getUserTemplates } = await import('./email-db');
        return getUserTemplates(ctx.user.id);
      }),
      listByCategory: protectedProcedure.input(z.object({ category: z.string() })).query(async ({ ctx, input }) => {
        const { getTemplatesByCategory } = await import('./email-db');
        return getTemplatesByCategory(ctx.user.id, input.category);
      }),
      create: protectedProcedure.input(z.object({ name: z.string(), subject: z.string().optional(), body: z.string(), category: z.string().optional(), variables: z.any().optional() })).mutation(async ({ ctx, input }) => {
        const { createTemplate } = await import('./email-db');
        return createTemplate({ userId: ctx.user.id, ...input });
      }),
      update: protectedProcedure.input(z.object({ templateId: z.number(), name: z.string().optional(), subject: z.string().optional(), body: z.string().optional(), category: z.string().optional(), variables: z.any().optional() })).mutation(async ({ input }) => {
        const { updateTemplate } = await import('./email-db');
        const { templateId, ...data } = input;
        await updateTemplate(templateId, data);
        return { success: true };
      }),
      delete: protectedProcedure.input(z.object({ templateId: z.number() })).mutation(async ({ input }) => {
        const { deleteTemplate } = await import('./email-db');
        await deleteTemplate(input.templateId);
        return { success: true };
      }),
    }),

    // Snooze
    snooze: router({
      snooze: protectedProcedure.input(z.object({ threadId: z.number(), gmailThreadId: z.string(), snoozeUntil: z.string(), reminder: z.boolean().optional() })).mutation(async ({ ctx, input }) => {
        const { snoozeEmail } = await import('./email-db');
        await snoozeEmail({
          userId: ctx.user.id,
          threadId: input.threadId,
          gmailThreadId: input.gmailThreadId,
          snoozeUntil: new Date(input.snoozeUntil),
          reminder: input.reminder || false,
        });
        return { success: true };
      }),
      unsnooze: protectedProcedure.input(z.object({ threadId: z.number() })).mutation(async ({ input }) => {
        const { unsnoozeEmail } = await import('./email-db');
        await unsnoozeEmail(input.threadId);
        return { success: true };
      }),
      list: protectedProcedure.query(async ({ ctx }) => {
        const { getSnoozedEmails } = await import('./email-db');
        return getSnoozedEmails(ctx.user.id);
      }),
    }),

    // AI Analysis
    ai: router({
      categorize: protectedProcedure.input(z.object({ from: z.string(), subject: z.string(), body: z.string(), snippet: z.string() })).mutation(async ({ input }) => {
        const { categorizeEmail } = await import('./email-ai-service');
        return categorizeEmail(input);
      }),
      smartReplies: protectedProcedure.input(z.object({ from: z.string(), subject: z.string(), body: z.string(), context: z.string().optional() })).mutation(async ({ input }) => {
        const { generateSmartReplies } = await import('./email-ai-service');
        return generateSmartReplies(input);
      }),
      extractActions: protectedProcedure.input(z.object({ body: z.string() })).mutation(async ({ input }) => {
        const { extractActionItems } = await import('./email-ai-service');
        return extractActionItems(input.body);
      }),
      sentiment: protectedProcedure.input(z.object({ body: z.string() })).mutation(async ({ input }) => {
        const { analyzeSentiment } = await import('./email-ai-service');
        return analyzeSentiment(input.body);
      }),
      getMetadata: protectedProcedure.input(z.object({ threadId: z.number() })).query(async ({ input }) => {
        const { getEmailAIMetadata } = await import('./email-db');
        return getEmailAIMetadata(input.threadId);
      }),
      saveMetadata: protectedProcedure.input(z.object({ threadId: z.number(), gmailThreadId: z.string(), summary: z.string().optional(), priorityScore: z.number().optional(), sentiment: z.enum(["positive", "neutral", "negative", "urgent"]).optional(), actionItems: z.any().optional(), keyTopics: z.any().optional(), suggestedReplies: z.any().optional() })).mutation(async ({ input }) => {
        const { saveEmailAIMetadata } = await import('./email-db');
        return saveEmailAIMetadata(input);
      }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
