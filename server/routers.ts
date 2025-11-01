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
  getCustomers,
  getInvoices as getBillyInvoices,
  createInvoice as createBillyInvoice,
  searchCustomerByEmail,
} from "./billy";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
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
      list: protectedProcedure.input(z.object({ maxResults: z.number().optional(), query: z.string().optional() })).query(async ({ input }) => searchGmailThreads({ query: input.query || 'in:inbox', maxResults: input.maxResults || 20 })),
      get: protectedProcedure.input(z.object({ threadId: z.string() })).query(async ({ input }) => getGmailThread(input.threadId)),
      search: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => searchGmailThreads({ query: input.query, maxResults: 50 })),
      createDraft: protectedProcedure.input(z.object({ to: z.string(), subject: z.string(), body: z.string(), cc: z.string().optional(), bcc: z.string().optional() })).mutation(async ({ input }) => createGmailDraft(input)),
    }),
    invoices: router({
      list: protectedProcedure.query(async () => getBillyInvoices()),
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
    getCustomers: protectedProcedure.query(async () => getCustomers()),
    searchCustomer: protectedProcedure.input(z.object({ email: z.string() })).query(async ({ input }) => searchCustomerByEmail(input.email)),
  }),
});

export type AppRouter = typeof appRouter;
