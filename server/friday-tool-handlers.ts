/**
 * Friday AI Tool Handlers
 * Implements the actual execution logic for each tool
 */

import { ToolName } from "./friday-tools";
import {
  listGmailThreads,
  getGmailThread,
  searchGmail,
  createGmailDraft,
  listCalendarEvents,
  createCalendarEvent,
  findFreeTimeSlots,
} from "./mcp";
import {
  getInvoices,
  createInvoice,
  searchCustomerByEmail,
} from "./billy";
import {
  getUserLeads,
  createLead,
  updateLeadStatus,
  getUserTasks,
  createTask,
} from "./db";

export interface ToolCallResult {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Execute a tool call with the given arguments
 */
export async function executeToolCall(
  toolName: ToolName,
  args: Record<string, any>,
  userId: number,
): Promise<ToolCallResult> {
  try {
    switch (toolName) {
      // Gmail Tools
      case "search_gmail":
        return await handleSearchGmail(args as { query: string; maxResults?: number });

      case "get_gmail_thread":
        return await handleGetGmailThread(args as { threadId: string });

      case "create_gmail_draft":
        return await handleCreateGmailDraft(args as { to: string; subject: string; body: string; cc?: string; bcc?: string });

      // Billy Tools
      case "list_billy_invoices":
        return await handleListBillyInvoices();

      case "search_billy_customer":
        return await handleSearchBillyCustomer(args as { email: string });

      case "create_billy_invoice":
        return await handleCreateBillyInvoice(args as { contactId: string; entryDate: string; paymentTermsDays?: number; lines: Array<{ description: string; quantity: number; unitPrice: number; productId?: string }> });

      // Calendar Tools
      case "list_calendar_events":
        return await handleListCalendarEvents(args);

      case "find_free_calendar_slots":
        return await handleFindFreeCalendarSlots(args as { date: string; duration: number; workingHours?: { start: number; end: number } });

      case "create_calendar_event":
        return await handleCreateCalendarEvent(args as { summary: string; description?: string; start: string; end: string; location?: string });

      // Lead Tools
      case "list_leads":
        return await handleListLeads(userId, args);

      case "create_lead":
        return await handleCreateLead(userId, args as { source: string; name: string; email?: string; phone?: string; notes?: string; score?: number });

      case "update_lead_status":
        return await handleUpdateLeadStatus(args as { leadId: number; status: string });

      // Task Tools
      case "list_tasks":
        return await handleListTasks(userId, args);

      case "create_task":
        return await handleCreateTask(userId, args as { title: string; description?: string; dueDate?: string; priority?: string });

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        };
    }
  } catch (error) {
    console.error(`Tool execution error for ${toolName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Gmail Tool Handlers
async function handleSearchGmail(args: { query: string; maxResults?: number }): Promise<ToolCallResult> {
  const results = await searchGmail(args.query, args.maxResults);
  return {
    success: true,
    data: results,
  };
}

async function handleGetGmailThread(args: { threadId: string }): Promise<ToolCallResult> {
  const thread = await getGmailThread(args.threadId);
  return {
    success: true,
    data: thread,
  };
}

async function handleCreateGmailDraft(args: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}): Promise<ToolCallResult> {
  const draft = await createGmailDraft(args);
  return {
    success: true,
    data: draft,
  };
}

// Billy Tool Handlers
async function handleListBillyInvoices(): Promise<ToolCallResult> {
  const invoices = await getInvoices();
  return {
    success: true,
    data: invoices,
  };
}

async function handleSearchBillyCustomer(args: { email: string }): Promise<ToolCallResult> {
  const customer = await searchCustomerByEmail(args.email);
  return {
    success: true,
    data: customer,
  };
}

async function handleCreateBillyInvoice(args: {
  contactId: string;
  entryDate: string;
  paymentTermsDays?: number;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string;
  }>;
}): Promise<ToolCallResult> {
  const invoice = await createInvoice(args);
  return {
    success: true,
    data: invoice,
  };
}

// Calendar Tool Handlers
async function handleListCalendarEvents(args: {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}): Promise<ToolCallResult> {
  const events = await listCalendarEvents(args);
  return {
    success: true,
    data: events,
  };
}

async function handleFindFreeCalendarSlots(args: {
  date: string;
  duration: number;
  workingHours?: { start: number; end: number };
}): Promise<ToolCallResult> {
  const slots = await findFreeTimeSlots(args);
  return {
    success: true,
    data: slots,
  };
}

async function handleCreateCalendarEvent(args: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}): Promise<ToolCallResult> {
  const event = await createCalendarEvent(args);
  return {
    success: true,
    data: event,
  };
}

// Lead Tool Handlers
async function handleListLeads(userId: number, args: { status?: string; source?: string }): Promise<ToolCallResult> {
  const leads = await getUserLeads(userId);
  
  // Filter by status if provided
  let filteredLeads = leads;
  if (args.status) {
    filteredLeads = filteredLeads.filter((lead) => lead.status === args.status);
  }
  if (args.source) {
    filteredLeads = filteredLeads.filter((lead) => lead.source === args.source);
  }

  return {
    success: true,
    data: filteredLeads,
  };
}

async function handleCreateLead(
  userId: number,
  args: {
    source: string;
    name: string;
    email?: string;
    phone?: string;
    notes?: string;
    score?: number;
  },
): Promise<ToolCallResult> {
  const lead = await createLead({
    userId,
    source: args.source,
    name: args.name,
    email: args.email || null,
    phone: args.phone || null,
    score: args.score || 0,
    status: "new",
    notes: args.notes || null,
  });

  return {
    success: true,
    data: lead,
  };
}

async function handleUpdateLeadStatus(args: { leadId: number; status: string }): Promise<ToolCallResult> {
  await updateLeadStatus(args.leadId, args.status as "new" | "contacted" | "qualified" | "proposal" | "won" | "lost");
  return {
    success: true,
    data: { leadId: args.leadId, status: args.status },
  };
}

// Task Tool Handlers
async function handleListTasks(userId: number, args: { status?: string }): Promise<ToolCallResult> {
  const tasks = await getUserTasks(userId);

  // Filter by status if provided
  let filteredTasks = tasks;
  if (args.status) {
    filteredTasks = filteredTasks.filter((task) => task.status === args.status);
  }

  return {
    success: true,
    data: filteredTasks,
  };
}

async function handleCreateTask(
  userId: number,
  args: {
    title: string;
    description?: string;
    dueDate?: string;
    priority?: string;
  },
): Promise<ToolCallResult> {
  const task = await createTask({
    userId,
    title: args.title,
    description: args.description || null,
    dueDate: args.dueDate ? new Date(args.dueDate) : null,
    status: "todo",
    priority: (args.priority || "medium") as "low" | "medium" | "high" | "urgent",
  });

  return {
    success: true,
    data: task,
  };
}
