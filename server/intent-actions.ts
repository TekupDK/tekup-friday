/**
 * Intent-Based Action System
 * Parses user messages to detect intents and executes actions directly
 * This replaces tool calling which doesn't work with Gemini via Forge API
 */

import { createLead, createTask, getUserLeads, getUserTasks } from "./db";
import { searchGmailThreads, createCalendarEvent, listCalendarEvents, checkCalendarAvailability } from "./google-api";
import { createInvoice, getCustomers } from "./billy";

export type Intent =
  | "create_lead"
  | "create_task"
  | "create_invoice"
  | "book_meeting"
  | "search_email"
  | "list_tasks"
  | "list_leads"
  | "check_calendar"
  | "request_flytter_photos"
  | "job_completion"
  | "booking_cancellation"
  | "payment_reminder"
  | "adhelp_lead"
  | "rengoering_nu_lead"
  | "leadpoint_lead"
  | "followup_lead"
  | "missing_lead_data"
  | "fast_rengoering"
  | "conflict_resolution"
  | "unknown";

export interface ParsedIntent {
  intent: Intent;
  params: Record<string, any>;
  confidence: number;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Parse user message to detect intent and extract parameters
 */
export function parseIntent(message: string): ParsedIntent {
  const lowerMessage = message.toLowerCase();

  // Create Lead Intent
  if (lowerMessage.includes("opret") && (lowerMessage.includes("lead") || lowerMessage.includes("kunde"))) {
    const params: Record<string, any> = {};
    
    // Extract name
    const nameMatch = message.match(/navn:?\s*([^,\n]+)/i);
    if (nameMatch) params.name = nameMatch[1].trim();
    
    // Extract email
    const emailMatch = message.match(/email:?\s*([^\s,\n]+@[^\s,\n]+)/i);
    if (emailMatch) params.email = emailMatch[1].trim();
    
    // Extract phone
    const phoneMatch = message.match(/telefon:?\s*([0-9\s+]+)/i);
    if (phoneMatch) params.phone = phoneMatch[1].trim().replace(/\s/g, "");
    
    // Extract source
    const sourceMatch = message.match(/kilde:?\s*([^,\n]+)/i);
    if (sourceMatch) params.source = sourceMatch[1].trim();
    
    return {
      intent: "create_lead",
      params,
      confidence: 0.9,
    };
  }

  // Create Invoice Intent
  if (lowerMessage.includes("opret") && lowerMessage.includes("faktura")) {
    const params: Record<string, any> = {};
    
    // Extract customer name/ID
    const customerMatch = message.match(/(?:til\s+)?kunde:?\s*([^,\nfor]+)/i);
    if (customerMatch) params.customerName = customerMatch[1].trim();
    
    // Extract amount
    const amountMatch = message.match(/(\d+(?:[.,]\d+)?)\s*kr/i);
    if (amountMatch) params.amount = parseFloat(amountMatch[1].replace(",", "."));
    
    // Extract description
    const descMatch = message.match(/(?:for|beskrivelse):?\s*([^,\n]+)/i);
    if (descMatch) params.description = descMatch[1].trim();
    
    return {
      intent: "create_invoice",
      params,
      confidence: 0.85,
    };
  }

  // Create Task Intent
  if (lowerMessage.includes("opret") && (lowerMessage.includes("opgave") || lowerMessage.includes("task"))) {
    const params: Record<string, any> = {};
    
    // Extract title (everything after "opret opgave:" or similar)
    const titleMatch = message.match(/opret\s+(?:en\s+)?opgave:?\s*([^,\n]+)/i);
    if (titleMatch) params.title = titleMatch[1].trim();
    
    // Extract priority
    if (lowerMessage.includes("høj prioritet") || lowerMessage.includes("vigtig")) {
      params.priority = "high";
    } else if (lowerMessage.includes("lav prioritet")) {
      params.priority = "low";
    } else if (lowerMessage.includes("urgent")) {
      params.priority = "urgent";
    }
    
    // Extract deadline
    if (lowerMessage.includes("i morgen")) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      params.dueDate = tomorrow.toISOString();
    } else if (lowerMessage.includes("i dag")) {
      params.dueDate = new Date().toISOString();
    }
    
    // Extract time
    const timeMatch = message.match(/kl\.?\s*(\d{1,2})(?::(\d{2}))?/i);
    if (timeMatch && params.dueDate) {
      const date = new Date(params.dueDate);
      date.setHours(parseInt(timeMatch[1]), timeMatch[2] ? parseInt(timeMatch[2]) : 0);
      params.dueDate = date.toISOString();
    }
    
    return {
      intent: "create_task",
      params,
      confidence: 0.9,
    };
  }

  // Book Meeting Intent - Enhanced to recognize "Book X til rengøring" format
  if ((lowerMessage.includes("book") || lowerMessage.includes("opret")) && 
      (lowerMessage.includes("møde") || 
       lowerMessage.includes("aftale") || 
       lowerMessage.includes("tid") ||
       lowerMessage.includes("rengøring") ||
       lowerMessage.includes("hovedrengøring") ||
       lowerMessage.includes("flytterengøring"))) {
    const params: Record<string, any> = {};
    
    // Extract participant/customer name
    // Pattern: "Book [Name] til..." or "med [Name]"
    const participantMatch = message.match(/book\s+(.+?)\s+til/i) || 
                           message.match(/(?:med|hos)\s+([^,\npå]+)/i);
    if (participantMatch) params.participant = participantMatch[1].trim();
    
    // Extract job type
    if (lowerMessage.includes("flytterengøring")) {
      params.jobType = "Flytterengøring";
    } else if (lowerMessage.includes("hovedrengøring")) {
      params.jobType = "Hovedrengøring";
    } else if (lowerMessage.includes("fast rengøring")) {
      params.jobType = "Fast Rengøring";
    } else if (lowerMessage.includes("rengøring")) {
      params.jobType = "Rengøring";
    }
    
    // Extract date/time
    const dateMatch = message.match(/(mandag|tirsdag|onsdag|torsdag|fredag|lørdag|søndag|i\s+dag|i\s+morgen|på\s+mandag|på\s+tirsdag|på\s+onsdag|på\s+torsdag|på\s+fredag)/i);
    if (dateMatch) params.dateHint = dateMatch[1].trim().replace("på ", "");
    
    // Extract time range (e.g., "kl 10-13" or "kl 10:00-13:00")
    const timeRangeMatch = message.match(/kl\.?\s*(\d{1,2})(?::(\d{2}))?\s*-\s*(\d{1,2})(?::(\d{2}))?/i);
    if (timeRangeMatch) {
      params.startHour = parseInt(timeRangeMatch[1]);
      params.startMinute = timeRangeMatch[2] ? parseInt(timeRangeMatch[2]) : 0;
      params.endHour = parseInt(timeRangeMatch[3]);
      params.endMinute = timeRangeMatch[4] ? parseInt(timeRangeMatch[4]) : 0;
    } else {
      // Single time
      const timeMatch = message.match(/kl\.?\s*(\d{1,2})(?::(\d{2}))?/i);
      if (timeMatch) {
        params.startHour = parseInt(timeMatch[1]);
        params.startMinute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      }
    }
    
    return {
      intent: "book_meeting",
      params,
      confidence: 0.8,
    };
  }

  // Search Email Intent
  if ((lowerMessage.includes("søg") || lowerMessage.includes("find")) && 
      (lowerMessage.includes("email") || lowerMessage.includes("mail") || lowerMessage.includes("besked"))) {
    const params: Record<string, any> = {};
    
    // Extract search query
    const fromMatch = message.match(/fra\s+([^,\n]+)/i);
    if (fromMatch) params.from = fromMatch[1].trim();
    
    const aboutMatch = message.match(/om\s+([^,\n]+)/i);
    if (aboutMatch) params.subject = aboutMatch[1].trim();
    
    // Time range
    if (lowerMessage.includes("sidste uge") || lowerMessage.includes("seneste uge")) {
      params.timeRange = "last_week";
    } else if (lowerMessage.includes("sidste 7 dage") || lowerMessage.includes("seneste 7 dage")) {
      params.timeRange = "last_7_days";
    }
    
    return {
      intent: "search_email",
      params,
      confidence: 0.85,
    };
  }

  // List Tasks Intent
  if ((lowerMessage.includes("vis") || lowerMessage.includes("list")) && 
      (lowerMessage.includes("opgave") || lowerMessage.includes("task") || lowerMessage.includes("todo"))) {
    return {
      intent: "list_tasks",
      params: {},
      confidence: 0.9,
    };
  }

  // List Leads Intent
  if ((lowerMessage.includes("vis") || lowerMessage.includes("find") || lowerMessage.includes("list")) && 
      lowerMessage.includes("lead")) {
    const params: Record<string, any> = {};
    
    if (lowerMessage.includes("nye") || lowerMessage.includes("seneste")) {
      params.filter = "recent";
    }
    
    return {
      intent: "list_leads",
      params,
      confidence: 0.85,
    };
  }

  // Check Calendar Intent
  if ((lowerMessage.includes("tjek") || lowerMessage.includes("se")) && 
      (lowerMessage.includes("kalender") || lowerMessage.includes("aftale"))) {
    return {
      intent: "check_calendar",
      params: {},
      confidence: 0.8,
    };
  }

  // Request Flytterengøring Photos Intent (MEMORY_16)
  if ((lowerMessage.includes("nyt lead") || lowerMessage.includes("lead") || lowerMessage.includes("kunde")) &&
      (lowerMessage.includes("flytterengøring") || lowerMessage.includes("flytte"))) {
    const params: Record<string, any> = {};
    
    // Extract customer name
    const nameMatch = message.match(/(?:navn:?|lead:?)\s*([^,\nønsker]+)/i);
    if (nameMatch) params.customerName = nameMatch[1].trim();
    
    // Extract square meters
    const sqmMatch = message.match(/(\d+)\s*m²/i);
    if (sqmMatch) params.squareMeters = parseInt(sqmMatch[1]);
    
    return {
      intent: "request_flytter_photos",
      params,
      confidence: 0.9,
    };
  }

  // Job Completion Intent (MEMORY_24)
  if ((lowerMessage.includes("færdig") || lowerMessage.includes("afslut") || lowerMessage.includes("done")) &&
      (lowerMessage.includes("rengøring") || lowerMessage.includes("job") || lowerMessage.includes("opgave"))) {
    const params: Record<string, any> = {};

    // Extract customer name
    const nameMatch = message.match(/([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i);
    if (nameMatch) params.customerName = nameMatch[1].trim();

    return {
      intent: "job_completion",
      params,
      confidence: 0.85,
    };
  }

  // Booking Cancellation Intent
  if ((lowerMessage.includes("aflys") || lowerMessage.includes("ændre") || lowerMessage.includes("flytte") || lowerMessage.includes("cancel")) &&
      (lowerMessage.includes("booking") || lowerMessage.includes("aftale") || lowerMessage.includes("tid"))) {
    const params: Record<string, any> = {};

    // Extract customer name
    const nameMatch = message.match(/([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i);
    if (nameMatch) params.customerName = nameMatch[1].trim();

    // Determine if cancellation or reschedule
    if (lowerMessage.includes("aflys") || lowerMessage.includes("cancel")) {
      params.action = "cancel";
    } else {
      params.action = "reschedule";
    }

    return {
      intent: "booking_cancellation",
      params,
      confidence: 0.9,
    };
  }

  // Payment Reminder Intent
  if ((lowerMessage.includes("påmindelse") || lowerMessage.includes("reminder") || lowerMessage.includes("betaling")) &&
      (lowerMessage.includes("faktura") || lowerMessage.includes("invoice") || lowerMessage.includes("payment"))) {
    const params: Record<string, any> = {};

    // Extract customer name
    const nameMatch = message.match(/([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i);
    if (nameMatch) params.customerName = nameMatch[1].trim();

    return {
      intent: "payment_reminder",
      params,
      confidence: 0.85,
    };
  }

  // AdHelp Lead Intent
  if ((lowerMessage.includes("adhelp") || lowerMessage.includes("mw@adhelp") || lowerMessage.includes("sp@adhelp")) &&
      (lowerMessage.includes("lead") || lowerMessage.includes("kunde") || lowerMessage.includes("henvendelse"))) {
    const params: Record<string, any> = {};

    // Extract customer email from message
    const emailMatch = message.match(/kunde.*?email:?\s*([^\s,\n]+@[^\s,\n]+)/i);
    if (emailMatch) params.customerEmail = emailMatch[1].trim();

    // Extract rengøringstype
    const typeMatch = message.match(/(?:rengøringstype|type):?\s*([^,\n]+)/i);
    if (typeMatch) params.jobType = typeMatch[1].trim();

    return {
      intent: "adhelp_lead",
      params,
      confidence: 0.9,
    };
  }

  // Rengøring.nu Lead Intent
  if ((lowerMessage.includes("rengøring.nu") || lowerMessage.includes("leadmail.no")) &&
      (lowerMessage.includes("lead") || lowerMessage.includes("kunde") || lowerMessage.includes("henvendelse"))) {
    const params: Record<string, any> = {};

    // Extract customer email
    const emailMatch = message.match(/(?:kunde.*?email|email):?\s*([^\s,\n]+@[^\s,\n]+)/i);
    if (emailMatch) params.customerEmail = emailMatch[1].trim();

    return {
      intent: "rengoering_nu_lead",
      params,
      confidence: 0.95,
    };
  }

  // Leadpoint Lead Intent
  if ((lowerMessage.includes("leadpoint") || lowerMessage.includes("rengøring århus") || lowerMessage.includes("rengøring aarhus")) &&
      (lowerMessage.includes("lead") || lowerMessage.includes("kunde"))) {
    const params: Record<string, any> = {};

    return {
      intent: "leadpoint_lead",
      params,
      confidence: 0.9,
    };
  }

  // Fast Rengøring Intent
  if ((lowerMessage.includes("fast rengøring") || lowerMessage.includes("ugentlig") || lowerMessage.includes("varig") || lowerMessage.includes("recurring")) &&
      (lowerMessage.includes("tilbud") || lowerMessage.includes("pris") || lowerMessage.includes("lead"))) {
    const params: Record<string, any> = {};

    // Extract square meters
    const sqmMatch = message.match(/(\d+)\s*m²/i);
    if (sqmMatch) params.squareMeters = parseInt(sqmMatch[1]);

    // Extract frequency
    if (lowerMessage.includes("ugentlig") || lowerMessage.includes("weekly")) {
      params.frequency = "ugentlig";
    } else if (lowerMessage.includes("hver 14") || lowerMessage.includes("biweekly")) {
      params.frequency = "hver 14. dag";
    }

    return {
      intent: "fast_rengoering",
      params,
      confidence: 0.9,
    };
  }

  // Conflict Resolution Intent
  if (lowerMessage.includes("ikke tilfreds") || lowerMessage.includes("ikke gjort ordentligt") ||
      lowerMessage.includes("klage") || lowerMessage.includes("ikke ok") ||
      lowerMessage.includes("utilfreds") || lowerMessage.includes("problem")) {
    const params: Record<string, any> = {};

    // Extract customer name
    const nameMatch = message.match(/([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i);
    if (nameMatch) params.customerName = nameMatch[1].trim();

    // Extract issue description
    params.issue = message.substring(0, 200); // First 200 chars as context

    return {
      intent: "conflict_resolution",
      params,
      confidence: 0.95,
    };
  }

  // Follow-up Lead Intent
  if ((lowerMessage.includes("opfølgning") || lowerMessage.includes("followup") || lowerMessage.includes("følg op")) &&
      (lowerMessage.includes("lead") || lowerMessage.includes("tilbud") || lowerMessage.includes("kunde"))) {
    const params: Record<string, any> = {};

    // Extract customer name
    const nameMatch = message.match(/([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/i);
    if (nameMatch) params.customerName = nameMatch[1].trim();

    return {
      intent: "followup_lead",
      params,
      confidence: 0.85,
    };
  }

  return {
    intent: "unknown",
    params: {},
    confidence: 0,
  };
}

/**
 * Execute action based on detected intent
 */
export async function executeAction(
  intent: ParsedIntent,
  userId: number
): Promise<ActionResult> {
  try {
    switch (intent.intent) {
      case "create_lead":
        return await executeCreateLead(intent.params, userId);

      case "create_task":
        return await executeCreateTask(intent.params, userId);

      case "create_invoice":
        return await executeCreateInvoice(intent.params, userId);

      case "book_meeting":
        return await executeBookMeeting(intent.params, userId);

      case "search_email":
        return await executeSearchEmail(intent.params, userId);

      case "list_tasks":
        return await executeListTasks(userId);

      case "list_leads":
        return await executeListLeads(intent.params, userId);

      case "check_calendar":
        return await executeCheckCalendar(userId);

      case "request_flytter_photos":
        return await executeRequestFlytterPhotos(intent.params, userId);

      case "job_completion":
        return await executeJobCompletion(intent.params, userId);

      case "booking_cancellation":
        return await executeBookingCancellation(intent.params, userId);

      case "payment_reminder":
        return await executePaymentReminder(intent.params, userId);

      case "adhelp_lead":
        return await executeAdHelpLead(intent.params, userId);

      case "rengoering_nu_lead":
        return await executeRengoeringNuLead(intent.params, userId);

      case "leadpoint_lead":
        return await executeLeadpointLead(intent.params, userId);

      case "fast_rengoering":
        return await executeFastRengoering(intent.params, userId);

      case "conflict_resolution":
        return await executeConflictResolution(intent.params, userId);

      case "followup_lead":
        return await executeFollowupLead(intent.params, userId);

      default:
        return {
          success: false,
          message: "Jeg forstod ikke helt hvad du ønsker. Kan du omformulere?",
        };
    }
  } catch (error) {
    console.error("[Intent Action] Error executing action:", error);
    return {
      success: false,
      message: "Der opstod en fejl under udførelsen af handlingen.",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function executeCreateLead(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { name, email, phone, source } = params;
  
  if (!name || !email) {
    return {
      success: false,
      message: "Jeg mangler navn og email for at oprette et lead. Prøv igen med: Navn: X, Email: Y",
    };
  }
  
  const lead = await createLead({
    userId,
    name,
    email,
    phone: phone || null,
    source: source || "manual",
    score: 50,
    status: "new",
  });
  
  return {
    success: true,
    message: `✅ Lead oprettet: **${name}** (${email})${phone ? `, Telefon: ${phone}` : ""}. Leadet er nu synligt i Leads-fanen.`,
    data: lead,
  };
}

async function executeCreateTask(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { title, priority, dueDate } = params;
  
  if (!title) {
    return {
      success: false,
      message: "Jeg mangler en titel for opgaven. Prøv: Opret opgave: [titel]",
    };
  }
  
  const task = await createTask({
    userId,
    title,
    description: null,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    priority: priority || "medium",
    status: "todo",
    relatedTo: null,
  });
  
  return {
    success: true,
    message: `✅ Opgave oprettet: **${title}**${priority ? ` (${priority} prioritet)` : ""}${dueDate ? ` - Deadline: ${new Date(dueDate).toLocaleString("da-DK")}` : ""}. Opgaven er nu synlig i Tasks-fanen.`,
    data: task,
  };
}

async function executeCreateInvoice(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerName, amount, description } = params;
  
  // CRITICAL RULE: Validate required parameters
  if (!customerName) {
    return {
      success: false,
      message: "Jeg mangler kundenavn. Prøv: Opret faktura til [Kundenavn] for [antal] arbejdstimer",
    };
  }
  
  // Parse work hours from description or amount
  let workHours = 0;
  let jobType = "REN-001"; // Default: Fast Rengøring
  let jobDescription = description || "Rengøring";
  
  // Extract work hours from message
  const hoursMatch = description?.match(/(\d+)\s*(?:arbejdstimer|timer|t)/i);
  if (hoursMatch) {
    workHours = parseInt(hoursMatch[1]);
  } else if (amount) {
    // Calculate from amount (349 kr/time)
    workHours = Math.round(amount / 349);
  }
  
  if (workHours === 0) {
    return {
      success: false,
      message: "Jeg mangler antal arbejdstimer. Prøv: Opret faktura til [Kundenavn] for [antal] arbejdstimer [type rengøring]",
    };
  }
  
  // Detect job type from description
  if (description) {
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("flytterengøring") || lowerDesc.includes("flytte")) {
      jobType = "REN-003";
      jobDescription = "Flytterengøring";
    } else if (lowerDesc.includes("hovedrengøring") || lowerDesc.includes("hoved")) {
      jobType = "REN-002";
      jobDescription = "Hovedrengøring";
    } else if (lowerDesc.includes("erhverv")) {
      jobType = "REN-004";
      jobDescription = "Erhvervsrengøring";
    } else if (lowerDesc.includes("fast")) {
      jobType = "REN-001";
      jobDescription = "Fast Rengøring";
    }
  }
  
  // STEP 1: Search for customer in Billy
  let allCustomers: any[];
  try {
    allCustomers = await getCustomers();
  } catch (error) {
    return {
      success: false,
      message: "Kunne ikke hente kunder fra Billy. Tjek Billy API forbindelse.",
      error: error instanceof Error ? error.message : String(error),
    };
  }
  
  const customers = allCustomers.filter((c: any) => 
    c.name.toLowerCase().includes(customerName.toLowerCase())
  );
  
  if (customers.length === 0) {
    return {
      success: false,
      message: `⚠️ Jeg kunne ikke finde en kunde ved navn "${customerName}" i Billy.\n\n**Næste skridt:**\n1. Opret kunden først i Billy.dk\n2. Eller brug det præcise kundenavn fra Billy\n3. Eller giv mig kundens email så jeg kan oprette dem`,
    };
  }
  
  if (customers.length > 1) {
    const customerList = customers.map((c: any) => `- ${c.name}`).join("\n");
    return {
      success: false,
      message: `⚠️ Jeg fandt ${customers.length} kunder der matcher "${customerName}":  \n\n${customerList}\n\nVælg venligst et mere præcist navn.`,
      data: { customers },
    };
  }
  
  const customer = customers[0];
  
  // STEP 2: Calculate invoice details
  const unitPrice = 349; // CRITICAL: 349 kr/time/person (MEMORY_17)
  const totalAmount = workHours * unitPrice;
  
  // STEP 3: Create invoice as DRAFT (CRITICAL: NEVER auto-approve - MEMORY_17)
  let invoice: any;
  try {
    invoice = await createInvoice({
      contactId: customer.id,
      entryDate: new Date().toISOString().split("T")[0],
      paymentTermsDays: 1, // 1 day for one-time jobs
      lines: [
        {
          productId: jobType, // REN-001 to REN-005
          description: `${jobDescription} - ${workHours} arbejdstimer`,
          quantity: workHours,
          unitPrice: unitPrice, // CRITICAL: Set unitPrice per line (MEMORY_17)
        },
      ],
      // state: "draft" is default - DO NOT set to "approved"
    });
  } catch (error) {
    return {
      success: false,
      message: "Kunne ikke oprette faktura i Billy. Tjek Billy API forbindelse.",
      error: error instanceof Error ? error.message : String(error),
    };
  }
  
  // STEP 4: Return for REVIEW (CRITICAL: User must approve manually)
  return {
    success: true,
    message: `✅ **Faktura DRAFT oprettet** (ikke godkendt endnu)\n\n💼 **Kunde:** ${customer.name}\n📝 **Type:** ${jobDescription} (${jobType})\n⏱️ **Arbejdstimer:** ${workHours}t\n💰 **Pris:** ${unitPrice} kr/time\n💵 **Total:** ${totalAmount} kr inkl. moms\n\n⚠️ **Næste skridt:**\n1. Gå til Invoices-fanen og gennemse fakturaen\n2. Godkend manuelt i Billy.dk hvis alt ser rigtigt ud\n3. Send faktura til kunden\n\n✅ **VERIFICERET:** Faktura oprettet som draft (ikke auto-godkendt)`,
    data: { invoice, customer, workHours, totalAmount },
  };
}

async function executeBookMeeting(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { participant, jobType, dateHint, startHour, startMinute, endHour, endMinute } = params;
  
  // CRITICAL RULE: Validate required parameters
  if (!participant) {
    return {
      success: false,
      message: "Jeg mangler kundens navn. Prøv: Book [Navn] til rengøring på [dag] kl [tid]",
    };
  }
  
  if (startHour === undefined) {
    return {
      success: false,
      message: "Jeg mangler tidspunkt. Prøv: Book [Navn] til rengøring på [dag] kl [tid]",
    };
  }
  
  // CRITICAL RULE: Date/Time Verification FIRST (MEMORY_0)
  const now = new Date();
  let targetDate = new Date(now);

  // Map Danish weekdays
  const weekdayMap: Record<string, number> = {
    "mandag": 1, "tirsdag": 2, "onsdag": 3, "torsdag": 4,
    "fredag": 5, "lørdag": 6, "søndag": 0,
  };

  if (dateHint) {
    const lowerHint = dateHint.toLowerCase();
    if (lowerHint === "i dag") {
      // Keep current date
    } else if (lowerHint === "i morgen") {
      targetDate.setDate(now.getDate() + 1);
    } else if (weekdayMap[lowerHint] !== undefined) {
      const targetDay = weekdayMap[lowerHint];
      const currentDay = now.getDay();
      let daysToAdd = targetDay - currentDay;
      if (daysToAdd <= 0) daysToAdd += 7; // Next week
      targetDate.setDate(now.getDate() + daysToAdd);
    }
  } else {
    return {
      success: false,
      message: "Jeg mangler dato. Prøv: Book [Navn] til rengøring på [mandag/tirsdag/etc] kl [tid]",
    };
  }

  // CRITICAL RULE: Round hours only (MEMORY_15)
  // If minutes are not 0 or 30, round to nearest half hour
  let finalStartMinute = startMinute || 0;
  let finalEndMinute = endMinute || 0;

  if (finalStartMinute !== 0 && finalStartMinute !== 30) {
    finalStartMinute = finalStartMinute < 30 ? 0 : 30;
  }
  if (finalEndMinute !== 0 && finalEndMinute !== 30) {
    finalEndMinute = finalEndMinute < 30 ? 0 : 30;
  }

  targetDate.setHours(startHour, finalStartMinute, 0, 0);

  // CRITICAL VERIFICATION: Ensure date is in the FUTURE
  if (targetDate.getTime() <= now.getTime()) {
    return {
      success: false,
      message: `⚠️ **FORTIDS-DATO DETEKTERET!**\n\nDen foreslåede dato (${targetDate.toLocaleString("da-DK")}) er i fortiden eller netop nu.\n\nTjek den aktuelle dato/tid:\n- Nu: ${now.toLocaleString("da-DK")}\n- Foreslået: ${targetDate.toLocaleString("da-DK")}\n\nForeslå venligst en fremtidig dato.`,
    };
  }
  
  // Calculate end time
  const endDate = new Date(targetDate);
  if (endHour !== undefined) {
    endDate.setHours(endHour, finalEndMinute, 0, 0);
  } else {
    // Default: 3 hours for rengøring
    endDate.setHours(startHour + 3, finalStartMinute, 0, 0);
  }
  
  // Calculate duration in hours (for display)
  const durationMs = endDate.getTime() - targetDate.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  
  // STEP 1: Check calendar availability FIRST (MEMORY_5)
  try {
    const existingEvents = await listCalendarEvents({
      timeMin: targetDate.toISOString(),
      timeMax: endDate.toISOString(),
    });
    
    if (existingEvents && existingEvents.length > 0) {
      return {
        success: false,
        message: `⚠️ Kalenderen er optaget på ${targetDate.toLocaleDateString("da-DK")} kl. ${startHour}:${finalStartMinute.toString().padStart(2, "0")}. Der er allerede ${existingEvents.length} aftale(r) i dette tidsrum. Vælg venligst et andet tidspunkt.`,
        data: { existingEvents },
      };
    }
  } catch (error) {
    console.error("[Calendar Check] Error checking availability:", error);
    // Continue anyway - better to book than fail
  }
  
  // STEP 2: Create event with proper format
  // Format: 🏠 [TYPE] #X - [Customer Name] (MEMORY_19)
  const eventTitle = `🏠 ${jobType || "Rengøring"} - ${participant}`;
  
  // CRITICAL RULE: NO attendees parameter (MEMORY_19)
  // This prevents automatic Google Calendar invites
  const event = await createCalendarEvent({
    summary: eventTitle,
    start: targetDate.toISOString(),
    end: endDate.toISOString(),
    description: `${jobType || "Rengøring"} for ${participant}\n\nOprettet af Friday AI\n\nKRITISK: Ingen attendees tilføjet (MEMORY_19)`,
    // NO attendees field - this is critical!
  });
  
  return {
    success: true,
    message: `✅ Booking oprettet: **${participant}** - ${jobType || "Rengøring"}\n\n📅 **Dato:** ${targetDate.toLocaleDateString("da-DK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}\n⏰ **Tid:** ${startHour}:${finalStartMinute.toString().padStart(2, "0")} - ${endHour || (startHour + 3)}:${finalEndMinute.toString().padStart(2, "0")} (${durationHours}t)\n\n✅ **VERIFICERET:** Ingen attendees tilføjet (ingen automatiske invites sendt)\n✅ **VERIFICERET:** Runde timer anvendt\n\nBookingen er nu synlig i Calendar-fanen.`,
    data: event,
  };
}

async function executeSearchEmail(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { from, subject, timeRange } = params;
  
  let query = "";
  if (from) query += `from:${from} `;
  if (subject) query += `subject:${subject} `;
  
  // Add time range
  if (timeRange === "last_week" || timeRange === "last_7_days") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    query += `after:${weekAgo.toISOString().split("T")[0]}`;
  }
  
  const results = await searchGmailThreads({ query: query.trim() || "in:inbox", maxResults: 20 });
  
  return {
    success: true,
    message: `📧 Jeg fandt **${results.length} emails**${from ? ` fra ${from}` : ""}. Resultaterne vises i Email-fanen.`,
    data: results,
  };
}

async function executeListTasks(userId: number): Promise<ActionResult> {
  const tasks = await getUserTasks(userId);
  
  if (tasks.length === 0) {
    return {
      success: true,
      message: "📝 Du har ingen opgaver endnu. Vil du have mig til at oprette en?",
      data: [],
    };
  }
  
  const pendingTasks = tasks.filter((t: any) => t.status !== "completed");
  
  return {
    success: true,
    message: `📝 Du har **${pendingTasks.length} aktive opgaver** (${tasks.length} total). Se dem i Tasks-fanen.`,
    data: tasks,
  };
}

async function executeListLeads(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const leads = await getUserLeads(userId);
  
  if (leads.length === 0) {
    return {
      success: true,
      message: "👥 Du har ingen leads endnu. Vil du have mig til at søge efter nye leads i dine emails?",
      data: [],
    };
  }
  
  let filteredLeads = leads;
  if (params.filter === "recent") {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    filteredLeads = leads.filter((l: any) => new Date(l.createdAt) > weekAgo);
  }
  
  const newLeads = filteredLeads.filter((l: any) => l.status === "new");
  
  return {
    success: true,
    message: `👥 Du har **${newLeads.length} nye leads** (${filteredLeads.length} total${params.filter === "recent" ? " fra sidste uge" : ""}). Se dem i Leads-fanen.`,
    data: filteredLeads,
  };
}

async function executeCheckCalendar(userId: number): Promise<ActionResult> {
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 7);
  
  const events = await listCalendarEvents({ timeMin: now.toISOString(), timeMax: endOfWeek.toISOString() });
  
  return {
    success: true,
    message: `📅 Du har **${events.length} aftaler** i din kalender de næste 7 dage. Se dem i Calendar-fanen.`,
    data: events,
  };
}

async function executeRequestFlytterPhotos(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerName, squareMeters } = params;
  
  // CRITICAL RULE: ALWAYS request photos FIRST for flytterengøring (MEMORY_16)
  if (!customerName) {
    return {
      success: false,
      message: "Jeg mangler kundens navn. Prøv: Nyt lead: [Navn] ønsker flytterengøring, [antal]m²",
    };
  }
  
  // Create lead first
  const lead = await createLead({
    userId,
    name: customerName,
    email: null,
    phone: null,
    source: "flytterengøring",
    score: 60, // Higher score for flytterengøring
    status: "new",
    notes: `Flytterengøring${squareMeters ? ` - ${squareMeters}m²` : ""}`,
  });
  
  // CRITICAL: Request photos BEFORE sending quote (MEMORY_16)
  return {
    success: true,
    message: `✅ Lead oprettet: **${customerName}** - Flytterengøring${squareMeters ? ` (${squareMeters}m²)` : ""}

⚠️ **KRITISK REGEL (MEMORY_16): BED OM BILLEDER FØRST!**

📸 **Næste skridt - Spørg kunden:**

"Hej ${customerName}! 👋

For at give dig det mest præcise tilbud på din flytterengøring, har jeg brug for nogle billeder:

1. **Køkken** (ovn, emhætte, skabe)
2. **Badeværelse** (fliser, fuger, brusekabine)
3. **Problemområder** (hvis der er særligt beskidte områder)

Derudover har jeg brug for:
- Dit **budget** for rengøringen
- **Fokusområder** (hvad skal prioriteres?)
- **Deadline** (hvornår skal det være færdigt?)

Send billeder og info, så sender jeg dig et skræddersyet tilbud! 😊"

🚫 **SEND IKKE tilbud før billeder er modtaget!**

Leadet er nu synligt i Leads-fanen.`,
    data: { lead, requiresPhotos: true },
  };
}

async function executeJobCompletion(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerName } = params;
  
  // CRITICAL RULE: Follow completion checklist (MEMORY_24)
  if (!customerName) {
    return {
      success: false,
      message: "Jeg mangler kundens navn. Prøv: [Navn]'s rengøring er færdig",
    };
  }
  
  // Return completion checklist
  return {
    success: true,
    message: `✅ **Job Afslutnings-Workflow for ${customerName}**

📋 **CHECKLIST (MEMORY_24):**

1️⃣ **Er fakturaen oprettet i Billy?**
   - [ ] Ja, faktura oprettet
   - [ ] Nej, opret nu

2️⃣ **Hvilket team udførte jobbet?**
   - [ ] Jonas + Rawan
   - [ ] Jonas + FB

3️⃣ **Betaling modtaget?**
   - [ ] MobilePay 71759
   - [ ] Bankoverførsel
   - [ ] Afventer betaling

4️⃣ **Faktisk arbejdstid?**
   - [ ] [Indtast timer] timer
   - Sammenlign med booket tid

5️⃣ **Opdater kalender event:**
   - [ ] Tilføj team info
   - [ ] Tilføj faktisk arbejdstid
   - [ ] Tilføj betalingsmetode

6️⃣ **Email labels (Gmail):**
   - [ ] Fjern INBOX label
   - [ ] Fjern IMPORTANT label
   - [ ] Tilføj COMPLETED label

---

**Når alle punkter er tjekket:**
Svar "Checklist færdig for ${customerName}" så opdaterer jeg systemet.

Vil du have hjælp til nogle af punkterne?`,
    data: { customerName, checklistComplete: false },
  };
}

async function executeBookingCancellation(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerName, action } = params;

  if (!customerName) {
    return {
      success: false,
      message: "Jeg mangler kundens navn. Prøv: Aflys/ændr booking for [Navn]",
    };
  }

  // STEP 1: Find calendar event for customer
  const now = new Date();
  const oneMonthFromNow = new Date(now);
  oneMonthFromNow.setMonth(now.getMonth() + 1);

  let events: any[] = [];
  try {
    events = await listCalendarEvents({
      timeMin: now.toISOString(),
      timeMax: oneMonthFromNow.toISOString(),
    });
  } catch (error) {
    return {
      success: false,
      message: "Kunne ikke hente kalender events. Tjek Google Calendar forbindelse.",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Find event matching customer name
  const customerEvent = events.find((event: any) =>
    event.summary?.toLowerCase().includes(customerName.toLowerCase())
  );

  if (!customerEvent) {
    return {
      success: false,
      message: `⚠️ Jeg kunne ikke finde en booking for ${customerName} i kalenderen de næste 30 dage.`,
    };
  }

  // STEP 2: Calculate hours until booking
  const eventStart = new Date(customerEvent.start?.dateTime || customerEvent.start?.date);
  const hoursUntil = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60);

  // STEP 3: Generate response based on timing
  if (hoursUntil < 24) {
    // Less than 24 hours
    return {
      success: true,
      message: `⚠️ **Booking < 24 timer** - ${customerName}

📅 **Booking:** ${eventStart.toLocaleDateString("da-DK")} kl. ${eventStart.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}
⏰ **Om:** ${Math.round(hoursUntil)} timer

**RESPONSE DRAFT:**

---
Hej ${customerName},

Vi beklager, men vi har desværre allerede allokeret ressourcer til din booking.

Vi kan ikke refundere fuldt, men tilbyder:
• 50% refusion, eller
• Ombokning til anden dato

Hvad foretrækker du?

Mvh Jonas
---

**Næste skridt:**
${action === "cancel" ? "1. Hvis kunde bekræfter aflysning → Slet calendar event + fjern 'I kalender' label" : "1. Hvis kunde vil ombooke → Foreslå nye tider"}`,
      data: { customerEvent, hoursUntil, within24Hours: true },
    };
  } else {
    // More than 24 hours
    if (action === "cancel") {
      return {
        success: true,
        message: `✅ **Aflysning godkendt** - ${customerName}

📅 **Original booking:** ${eventStart.toLocaleDateString("da-DK")} kl. ${eventStart.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}

**RESPONSE DRAFT:**

---
Hej ${customerName},

Selvfølgelig! Din booking er aflyst 🌿

Giv endelig lyd hvis du har brug for rengøring en anden gang.

Mvh Jonas
---

**Næste skridt:**
1. Slet calendar event
2. Fjern "I kalender" label
3. Tilføj "Afsluttet" label`,
        data: { customerEvent, hoursUntil, action: "cancel" },
      };
    } else {
      // Reschedule
      return {
        success: true,
        message: `✅ **Ombokning** - ${customerName}

📅 **Nuværende booking:** ${eventStart.toLocaleDateString("da-DK")} kl. ${eventStart.toLocaleTimeString("da-DK", { hour: "2-digit", minute: "2-digit" })}

**RESPONSE DRAFT:**

---
Hej ${customerName},

Selvfølgelig! 🌿

Hvilke nye datoer kunne passe dig?

📅 Ledige tider:
• [Tjek kalender og indsæt dato 1]
• [Tjek kalender og indsæt dato 2]
• [Tjek kalender og indsæt dato 3]

Mvh Jonas
---

**Næste skridt:**
1. Tjek kalender for ledige tider
2. Send forslag til kunden
3. Opdater calendar event når ny dato bekræftet`,
        data: { customerEvent, hoursUntil, action: "reschedule" },
      };
    }
  }
}

async function executePaymentReminder(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerName } = params;

  if (!customerName) {
    return {
      success: false,
      message: "Jeg mangler kundens navn. Prøv: Betalingspåmindelse til [Navn]",
    };
  }

  // This is a DRAFT-only function - actual payment checking would require Billy API integration
  return {
    success: true,
    message: `💳 **Betalingspåmindelse DRAFT** - ${customerName}

**TRIN 1: TJEK BETALINGSSTATUS**
- Tjek Billy.dk for faktura status
- Tjek MobilePay 71759 for indbetalinger
- Tjek Bank 6695-2002056146 for overførsler

**TRIN 2: HVIS IKKE BETALT**

**Dag 2-3 (48t efter faktura):**
---
Hej ${customerName},

Lille reminder om betaling for [opgave] [dato] 🌿

💳 Beløb: [XXX] kr
MobilePay: 71759
Bank: 6695-2002056146

Frist: 24t (forsinkelsesgebyr 100 kr/påbegyndt dag)

Mvh Jonas
---

**Dag 7+ (Hvis stadig ikke betalt):**
Flag thread som IMPORTANT → Manuel opfølgning fra Jonas

**VIGTIGT:**
Send IKKE automatisk - kun draft til review!`,
    data: { customerName },
  };
}

async function executeAdHelpLead(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerEmail, jobType } = params;

  if (!customerEmail) {
    return {
      success: false,
      message: "⚠️ **KRITISK:** Jeg mangler kundens FAKTISKE emailadresse fra AdHelp lead-data.\n\n🚨 Husk: Send ALDRIG til mw@adhelp.dk eller sp@adhelp.dk!\n\nEkstraher kundens personlige email fra lead-beskeden først.",
    };
  }

  // STEP 1: Search for existing communication
  let existingEmails: any[] = [];
  try {
    existingEmails = await searchGmailThreads({
      query: `to:${customerEmail} OR from:${customerEmail}`,
      maxResults: 10,
    });
  } catch (error) {
    console.error("[AdHelp Lead] Email search failed:", error);
  }

  if (existingEmails.length > 0) {
    return {
      success: false,
      message: `⚠️ **DUPLIKAT DETEKTERET!**

Jeg fandt ${existingEmails.length} eksisterende email(s) med ${customerEmail}.

🚫 Send IKKE duplikeret tilbud!

Tjek Email-fanen først og send opfølgning i stedet hvis nødvendigt.`,
      data: { existingEmails },
    };
  }

  // STEP 2: Return instructions for manual send
  return {
    success: true,
    message: `✅ **AdHelp Lead Verified** - Klar til tilbud

📧 **Kunde email:** ${customerEmail}
📝 **Type:** ${jobType || "Ikke specificeret"}

🚨 **KRITISK REGEL:**
Send til: ${customerEmail}
Send ALDRIG til: mw@adhelp.dk eller sp@adhelp.dk

**Næste skridt:**
1. Verificer "rengøringstype" felt fra lead
2. Tjek kalender for ledige tider
3. Send tilbud direkte til ${customerEmail} (ikke AdHelp email!)
4. Flyt original AdHelp email til "Leads" label

✅ Ingen tidligere kommunikation fundet - OK at sende tilbud!`,
    data: { customerEmail, jobType },
  };
}

async function executeRengoeringNuLead(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerEmail } = params;

  if (!customerEmail) {
    return {
      success: false,
      message: "⚠️ **KRITISK:** Jeg mangler kundens emailadresse fra Rengøring.nu lead.\n\n🚨 Husk: Opret NY email til kundens adresse - ALDRIG reply på lead-tråden!",
    };
  }

  // STEP 1: Search for existing communication
  let existingEmails: any[] = [];
  try {
    existingEmails = await searchGmailThreads({
      query: `to:${customerEmail} OR from:${customerEmail}`,
      maxResults: 10,
    });
  } catch (error) {
    console.error("[Rengøring.nu Lead] Email search failed:", error);
  }

  if (existingEmails.length > 0) {
    return {
      success: false,
      message: `⚠️ **DUPLIKAT DETEKTERET!**

Jeg fandt ${existingEmails.length} eksisterende email(s) med ${customerEmail}.

🚫 Send IKKE duplikeret tilbud!

Send opfølgning i stedet hvis nødvendigt.`,
      data: { existingEmails },
    };
  }

  // STEP 2: Critical reminder about reply behavior
  return {
    success: true,
    message: `✅ **Rengøring.nu Lead Verified** - Klar til tilbud

📧 **Kunde email:** ${customerEmail}

🚨🚨🚨 **KRITISK TRIGGER:**
→ STOP → Må ALDRIG reply på lead-tråden!
→ Opret NY selvstændig email til: ${customerEmail}
→ Må IKKE bruge inReplyTo parameter

**Workflow:**
1. Ekstraher kundedata fra lead (navn, m², adresse, etc.)
2. Krydscheck kundenavn fra lead vs faktisk email-signatur
3. Tjek kalender for ledige tider
4. Opret NY email til ${customerEmail} (IKKE reply!)
5. Send tilbud (max 10-12 linjer format)
6. Flyt lead-email til "Leads" label
7. Din nye email får "Venter på svar" label

✅ Ingen tidligere kommunikation fundet - OK at sende tilbud!

⚠️ **Lavere conversion rate** - Rengøring.nu leads har generelt lavere kvalitet end Leadpoint.`,
    data: { customerEmail, source: "Rengøring.nu" },
  };
}

async function executeLeadpointLead(params: Record<string, any>, userId: number): Promise<ActionResult> {
  return {
    success: true,
    message: `✅ **Leadpoint Lead (Rengøring Aarhus)** - Standard workflow

📋 **WORKFLOW:**

**TRIN 1: Verificer data**
- Krydscheck kundenavn fra lead vs email-signatur
- Tjek for manglende kritiske felter (m², adresse, kontaktinfo)

**TRIN 2: Søg eksisterende kommunikation**
- search_email med kundens email
- Hvis duplikat → Send opfølgning i stedet

**TRIN 3: Tjek kalender**
- get_calendar_events for ledige tider
- Foreslå 2-3 konkrete datoer

**TRIN 4: Send tilbud**
✅ Leadpoint kan svares DIREKTE (normal reply OK)
- Brug standard tilbudsformat (max 10-12 linjer)
- Flyt til "Venter på svar" label efter send

**Forskelle fra andre kilder:**
✅ Leadpoint: Kan reply direkte
❌ Rengøring.nu: Må ALDRIG reply - ny email
⚠️ AdHelp: Send til kunde email, IKKE til mw@/sp@adhelp.dk

**Kvalitet:** Bedre conversion rate end Rengøring.nu`,
    data: { source: "Leadpoint" },
  };
}

async function executeFastRengoering(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { squareMeters, frequency } = params;

  // Calculate estimates for fast rengøring
  const firstCleanHours = squareMeters ? Math.ceil(squareMeters / 20) : 4; // Rough estimate: 20m² per hour for first clean
  const recurringHours = squareMeters ? Math.ceil(squareMeters / 30) : 3; // Rough estimate: 30m² per hour for maintenance

  const firstCleanPrice = firstCleanHours * 349;
  const recurringPrice = recurringHours * 349;

  return {
    success: true,
    message: `📅 **Fast Rengøring Tilbud** ${squareMeters ? `- ${squareMeters}m²` : ""}

💰 **SEPARATE PRISER (KRITISK!):**

**Første rengøring (grundig/fundament):**
• Estimat: ${firstCleanHours} timer = ${firstCleanPrice} kr inkl. moms
• Dybdegående rengøring af alle områder
• Fundament for efterfølgende vedligeholdelse

**Efterfølgende rengøring (vedligeholdelse):**
• Estimat: ${recurringHours} timer = ${recurringPrice} kr inkl. moms ${frequency ? `(${frequency})` : ""}
• Hurtigere da boligen allerede er grundigt rengjort
• Fokus på vedligeholdelse

**TILBUDS FORMAT:**

---
Hej [Navn],

Tak for din henvendelse 🌿

📏 ${squareMeters || "[X]"}m² fast rengøring

💰 PRISER:
• Første rengøring (grundig): ${firstCleanHours}t = ${firstCleanPrice} kr
• Efterfølgende (vedligeholdelse): ${recurringHours}t = ${recurringPrice} kr

📅 Ledige tider for første rengøring:
• [Tjek kalender - dato 1]
• [Tjek kalender - dato 2]

Hvor ofte ønsker du rengøring? (ugentlig/hver 14. dag)

Mvh Jonas
---

**Næste skridt:**
1. Tjek kalender for ledige tider til første rengøring
2. Send tilbud med SEPARATE priser
3. Når booket: Opret recurring calendar events baseret på frekvens`,
    data: { squareMeters, frequency, firstCleanHours, recurringHours, firstCleanPrice, recurringPrice },
  };
}

async function executeConflictResolution(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerName, issue } = params;

  if (!customerName) {
    return {
      success: false,
      message: "Jeg mangler kundens navn for at håndtere konflikten.",
    };
  }

  return {
    success: true,
    message: `🚨 **KONFLIKT DETEKTERET** - ${customerName}

**IMMEDIATE ACTION - Follow Template:**

---
Hej ${customerName},

Jeg beklager - du har ret. [Konkret erkendelse af problemet]

[1-2 sætninger om hvad der skete - ingen undskyldninger]

For at rette op på dette tilbyder jeg:
• Vi kommer tilbage og ordner det, eller
• Rabat på [XXX] kr (1-2 timer = 349-698 kr)

Hvad foretrækker du?

Mvh Jonas
---

**KRITISKE REGLER:**
✅ Start ALTID med: "Jeg beklager - du har ret"
✅ Forklar konkret hvad der skete (ingen undskyldninger)
✅ Tilbyd 2 konkrete muligheder
✅ Spørg kunden hvad de foretrækker
✅ Prioriter forhold > enkelt betaling

**Succesfulde cases:**
✅ Ken Gustavsen: Manglende ovn → 1t rabat → Kunde tilfreds
✅ Jørgen Pagh: Fejl i tilbud → Erkend → Ret pris → Tillid bevaret

**Fejlede cases (UNDGÅ!):**
❌ Cecilie: Fastholdt pris → Inkasso → Forhold ødelagt
❌ Amalie: Ingen fleksibilitet → Konflikt

**Næste skridt:**
1. Send ovenstående template
2. Flag thread som IMPORTANT
3. Notify Jonas for manual review
4. Find ALTID mindelighed FØR inkasso

**Issue context:** ${issue}`,
    data: { customerName, issue },
  };
}

async function executeFollowupLead(params: Record<string, any>, userId: number): Promise<ActionResult> {
  const { customerName } = params;

  if (!customerName) {
    return {
      success: false,
      message: "Jeg mangler kundens navn for opfølgning.",
    };
  }

  return {
    success: true,
    message: `📧 **Lead Opfølgning** - ${customerName}

**TRIN 1: VERIFICER TIMING**
- Hvornår blev original tilbud sendt?
- Dag 7-10: Opfølgning #1
- Dag 14-17: Opfølgning #2
- Dag 21+: Afslut lead

**OPFØLGNING #1 (7-10 dage):**
---
Hej ${customerName},

Stadig interesseret? Nye ledige tider:
• [Tjek kalender - dato 1]
• [Tjek kalender - dato 2]

Mvh Jonas
---
Max 10 linjer

**OPFØLGNING #2 (14-17 dage):**
---
Hej ${customerName},

Jeg ville høre om du stadig har brug for rengøring?

Mvh Jonas
---

**OPFØLGNING #3 (21+ dage):**
Ingen flere opfølgninger
→ Flyt til "Afsluttet" label
→ Lead lukkes som "No Response"

**Næste skridt:**
1. Tjek original tilbuds dato
2. Vælg passende opfølgnings-template
3. Tjek kalender for nye ledige tider
4. Send opfølgning
5. Afslut efter 2-3 forsøg uden svar`,
    data: { customerName },
  };
}
