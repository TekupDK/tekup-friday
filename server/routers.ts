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
import { routeAI, analyzeLeadScore, generateInvoiceFromText, draftEmailResponse } from "./ai-router";
import {
  listGmailThreads,
  getGmailThread,
  searchGmail,
  createGmailDraft,
  listCalendarEvents,
  createCalendarEvent,
  checkCalendarAvailability,
  findFreeTimeSlots,
} from "./mcp";
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
    sendMessage: protectedProcedure.input(z.object({ conversationId: z.number(), content: z.string(), attachments: z.array(z.object({ url: z.string(), name: z.string(), type: z.string() })).optional() })).mutation(async ({ ctx, input }) => {
      const userMessage = await createMessage({ conversationId: input.conversationId, role: "user", content: input.content, attachments: input.attachments });
      const messages = await getConversationMessages(input.conversationId);
      const aiMessages = messages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content }));
      const aiResponse = await routeAI({ messages: aiMessages, taskType: "chat" });
      const assistantMessage = await createMessage({ conversationId: input.conversationId, role: "assistant", content: aiResponse.content, model: aiResponse.model });
      await trackEvent({ userId: ctx.user.id, eventType: "message_sent", eventData: { conversationId: input.conversationId } });
      return { userMessage, assistantMessage };
    }),
    updateTitle: protectedProcedure.input(z.object({ conversationId: z.number(), title: z.string() })).mutation(async ({ input }) => {
      await updateConversationTitle(input.conversationId, input.title);
      return { success: true };
    }),
  }),

  // Inbox modules
  inbox: router({
    email: router({
      list: protectedProcedure.input(z.object({ maxResults: z.number().optional(), query: z.string().optional() })).query(async ({ input }) => listGmailThreads({ maxResults: input.maxResults || 20, query: input.query })),
      get: protectedProcedure.input(z.object({ threadId: z.string() })).query(async ({ input }) => getGmailThread(input.threadId)),
      search: protectedProcedure.input(z.object({ query: z.string() })).query(async ({ input }) => searchGmail(input.query)),
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
      findFreeSlots: protectedProcedure.input(z.object({ date: z.string(), duration: z.number(), workingHours: z.object({ start: z.number(), end: z.number() }).optional() })).query(async ({ input }) => findFreeTimeSlots(input)),
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
      analyzeScore: protectedProcedure.input(z.object({ leadId: z.number(), emailContent: z.string(), senderName: z.string(), senderEmail: z.string() })).mutation(async ({ input }) => {
        const analysis = await analyzeLeadScore({ emailContent: input.emailContent, senderName: input.senderName, senderEmail: input.senderEmail });
        await updateLeadScore(input.leadId, analysis.score);
        return analysis;
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
    generateInvoice: protectedProcedure.input(z.object({ customerInfo: z.string(), serviceDescription: z.string() })).mutation(async ({ input }) => generateInvoiceFromText(input)),
    draftEmail: protectedProcedure.input(z.object({ originalEmail: z.string(), context: z.string().optional(), tone: z.enum(["professional", "friendly", "formal"]).optional() })).mutation(async ({ input }) => draftEmailResponse(input)),
    findRecentLeads: protectedProcedure.input(z.object({ days: z.number().default(7) })).query(async ({ input }) => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - input.days);
      const query = `after:${daysAgo.toISOString().split("T")[0]} (rengøring OR cleaning OR tilbud OR quote)`;
      return searchGmail(query);
    }),
    getCustomers: protectedProcedure.query(async () => getCustomers()),
    searchCustomer: protectedProcedure.input(z.object({ email: z.string() })).query(async ({ input }) => searchCustomerByEmail(input.email)),
  }),
});

export type AppRouter = typeof appRouter;
