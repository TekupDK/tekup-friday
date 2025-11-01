/**
 * AI Router
 * Routes requests to appropriate AI models and handles intent-based actions
 */

import { invokeLLM, type Message } from "./_core/llm";
import { getFridaySystemPrompt } from "./friday-prompts";
import { parseIntent, executeAction, type ActionResult } from "./intent-actions";
import { randomBytes } from "crypto";

export type AIModel = 
  | "gpt-4o" 
  | "gpt-4o-mini" 
  | "claude-3-5-sonnet" 
  | "gemini-2.5-flash"
  | "manus-ai";

export type TaskType =
  | "chat"
  | "email-draft"
  | "invoice-create"
  | "calendar-check"
  | "lead-analysis"
  | "data-analysis"
  | "code-generation";

export interface AIRouterOptions {
  messages: Message[];
  taskType?: TaskType;
  model?: AIModel;
  preferredModel?: AIModel;
  stream?: boolean;
  tools?: any[];
  userId?: number;
  requireApproval?: boolean; // NEW: If true, return pendingAction instead of executing
}

export interface PendingAction {
  id: string;
  type: 'create_lead' | 'create_task' | 'book_meeting' | 'create_invoice' | 'search_gmail' | 'request_flytter_photos' | 'job_completion';
  params: Record<string, any>;
  impact: string;
  preview: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface AIResponse {
  content: string;
  model: AIModel;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: Array<{
    name: string;
    arguments: string;
  }>;
  pendingAction?: PendingAction;
}

/**
 * Select the best model for a given task type
 */
function selectModelForTask(taskType: TaskType): AIModel {
  const modelMap: Record<TaskType, AIModel> = {
    "chat": "gemini-2.5-flash", // Fast and cost-effective for general chat
    "email-draft": "gemini-2.5-flash", // Good at professional writing
    "invoice-create": "gemini-2.5-flash", // Structured data generation
    "calendar-check": "gemini-2.5-flash", // Simple logic
    "lead-analysis": "gemini-2.5-flash", // Complex analysis
    "data-analysis": "gemini-2.5-flash", // Data processing
    "code-generation": "gemini-2.5-flash", // Code quality
  };

  return modelMap[taskType] || "gemini-2.5-flash";
}

/**
 * Determine risk level for an intent type
 */
function getRiskLevel(intentType: string): 'low' | 'medium' | 'high' {
  const riskMap: Record<string, 'low' | 'medium' | 'high'> = {
    'create_lead': 'low',
    'create_task': 'low',
    'book_meeting': 'medium',
    'create_invoice': 'high',
    'search_gmail': 'low',
    'request_flytter_photos': 'low',
    'job_completion': 'medium',
  };
  return riskMap[intentType] || 'medium';
}

/**
 * Generate preview text for an action
 */
function generateActionPreview(intentType: string, params: Record<string, any>): string {
  switch (intentType) {
    case 'create_lead':
      return `Opret nyt lead:\n- Navn: ${params.name || 'Ikke angivet'}\n- Email: ${params.email || 'Ikke angivet'}\n- Telefon: ${params.phone || 'Ikke angivet'}\n- Kilde: ${params.source || 'Ikke angivet'}`;
    
    case 'create_task':
      return `Opret ny opgave:\n- Titel: ${params.title || 'Ikke angivet'}\n- Prioritet: ${params.priority || 'medium'}\n- Deadline: ${params.dueDate ? new Date(params.dueDate).toLocaleDateString('da-DK') : 'Ikke angivet'}`;
    
    case 'book_meeting':
      return `Book kalenderaftale:\n- Titel: ${params.summary || 'Ikke angivet'}\n- Start: ${params.start ? new Date(params.start).toLocaleString('da-DK') : 'Ikke angivet'}\n- Slut: ${params.end ? new Date(params.end).toLocaleString('da-DK') : 'Ikke angivet'}\n- Sted: ${params.location || 'Ikke angivet'}`;
    
    case 'create_invoice':
      const totalAmount = params.lines?.reduce((sum: number, line: any) => sum + (line.quantity * line.unitPrice), 0) || 0;
      return `Opret faktura:\n- Kunde: ${params.contactId || 'Ikke angivet'}\n- Beløb: ${totalAmount} kr\n- Betalingsfrist: ${params.paymentTermsDays || 14} dage\n- Antal linjer: ${params.lines?.length || 0}`;
    
    case 'search_gmail':
      return `Søg i Gmail:\n- Søgeord: "${params.query || ''}"`;
    
    case 'request_flytter_photos':
      return `Anmod om billeder til flytterengøring:\n- Lead: ${params.leadName || 'Ikke angivet'}\n- Email: ${params.email || 'Ikke angivet'}`;
    
    case 'job_completion':
      return `Afslut job:\n- Job ID: ${params.jobId || 'Ikke angivet'}\n- Kunde: ${params.customerName || 'Ikke angivet'}\n- Gennemfør 6-trins tjekliste`;
    
    default:
      return JSON.stringify(params, null, 2);
  }
}

/**
 * Generate impact description for an action
 */
function generateActionImpact(intentType: string, params: Record<string, any>): string {
  switch (intentType) {
    case 'create_lead':
      return 'Opretter et nyt lead i databasen. Leadet vil være synligt i Leads-fanen.';
    
    case 'create_task':
      return 'Opretter en ny opgave i databasen. Opgaven vil være synlig i Tasks-fanen.';
    
    case 'book_meeting':
      return 'Opretter en ny kalenderaftale i Google Calendar. Aftalen vil være synlig i Calendar-fanen. BEMÆRK: Der tilføjes IKKE deltagere (MEMORY_19).';
    
    case 'create_invoice':
      return 'Opretter en KLADDE-faktura i Billy.dk. Fakturaen skal godkendes manuelt i Billy før afsendelse (MEMORY_17).';
    
    case 'search_gmail':
      return 'Søger i Gmail for at finde eksisterende emails. Ingen ændringer foretages.';
    
    case 'request_flytter_photos':
      return 'Sender email til kunden med anmodning om billeder af flytterengøring. Dette er KRITISK før tilbudssendelse (MEMORY_16).';
    
    case 'job_completion':
      return 'Gennemfører 6-trins tjekliste for jobafslutning: faktura, team, betaling, tid, kalender, labels (MEMORY_24).';
    
    default:
      return 'Udfører den anmodede handling.';
  }
}

/**
 * Create a pending action object from intent
 */
function createPendingAction(intent: ReturnType<typeof parseIntent>): PendingAction {
  return {
    id: randomBytes(16).toString('hex'),
    type: intent.intent as PendingAction['type'],
    params: intent.params,
    impact: generateActionImpact(intent.intent, intent.params),
    preview: generateActionPreview(intent.intent, intent.params),
    riskLevel: getRiskLevel(intent.intent),
  };
}

/**
 * Route AI request to the appropriate model with intent-based actions
 */
export async function routeAI(options: AIRouterOptions & { userId?: number }): Promise<AIResponse> {
  const {
    messages,
    taskType = "chat",
    model: explicitModel,
    preferredModel,
    userId,
    requireApproval = true, // DEFAULT: Require approval for all actions
  } = options;

  // Use preferred model first, then explicit model, then select based on task type
  const selectedModel = preferredModel || explicitModel || selectModelForTask(taskType);

  console.log(`[AI Router] Using model: ${selectedModel} for task: ${taskType}`);

  // Get the last user message to check for intents
  const lastUserMessage = messages.filter(m => m.role === "user").pop();
  const userMessageText = typeof lastUserMessage?.content === "string" 
    ? lastUserMessage.content 
    : "";

  // Parse intent from user message
  const intent = parseIntent(userMessageText);
  console.log(`[AI Router] Detected intent: ${intent.intent} (confidence: ${intent.confidence})`);
  console.log(`[AI Router] Intent params:`, intent.params);

  let actionResult: ActionResult | null = null;
  let pendingAction: PendingAction | undefined = undefined;

  // DEBUG: Check execution conditions
  console.log(`[DEBUG] Execution conditions:`, {
    confidence: intent.confidence,
    confidenceCheck: intent.confidence > 0.7,
    intentNotUnknown: intent.intent !== "unknown",
    userId: userId,
    hasUserId: !!userId,
    requireApproval: requireApproval,
    shouldExecute: intent.confidence > 0.7 && intent.intent !== "unknown" && !!userId && !requireApproval
  });

  // If high-confidence intent detected
  if (intent.confidence > 0.7 && intent.intent !== "unknown" && userId) {
    if (requireApproval) {
      // Return pending action for user approval
      console.log(`[AI Router] CREATING pending action for intent: ${intent.intent}`);
      pendingAction = createPendingAction(intent);
      console.log(`[AI Router] Pending action created:`, pendingAction);
    } else {
      // Execute action immediately (legacy mode)
      console.log(`[AI Router] EXECUTING action for intent: ${intent.intent}`);
      try {
        actionResult = await executeAction(intent, userId);
        console.log(`[AI Router] Action SUCCESS:`, actionResult);
      } catch (error) {
        console.error(`[AI Router] Action execution FAILED:`, error);
        actionResult = {
          success: false,
          message: "Der opstod en fejl under udførelsen af handlingen.",
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  }

  // Add Friday system prompt if not already present
  const hasSystemPrompt = messages.some(m => m.role === "system");
  const messagesWithSystem = hasSystemPrompt
    ? messages
    : [{ role: "system" as const, content: getFridaySystemPrompt() }, ...messages];

  // If action was executed, add result to context
  // If pending action, add note to AI
  const finalMessages: Message[] = [...messagesWithSystem];
  if (actionResult) {
    finalMessages.push({
      role: "system",
      content: `[Action Result] ${actionResult.success ? "Success" : "Failed"}: ${actionResult.message}${actionResult.data ? "\nData: " + JSON.stringify(actionResult.data, null, 2) : ""}${actionResult.error ? "\nError: " + actionResult.error : ""}`,
    });
  } else if (pendingAction) {
    finalMessages.push({
      role: "system",
      content: `[Pending Action] Du har foreslået en handling af typen "${pendingAction.type}". Brugeren skal godkende denne handling før den udføres. Forklar kort hvad handlingen vil gøre og hvorfor den er relevant for brugerens forespørgsel.`,
    });
  }

  try {
    // Call AI to generate response (with action context if available)
    const response = await invokeLLM({
      messages: finalMessages,
    });

    const messageContent = response.choices[0]?.message?.content;
    let content = typeof messageContent === "string" ? messageContent : "";

    // If action was executed successfully, prepend action confirmation
    if (actionResult && actionResult.success) {
      content = actionResult.message + "\n\n" + content;
    }

    return {
      content,
      model: selectedModel,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
      pendingAction, // Include pending action if created
    };
  } catch (error) {
    console.error(`[AI Router] Error with model ${selectedModel}:`, error);
    
    // If action succeeded but AI failed, return action result
    if (actionResult && actionResult.success) {
      return {
        content: actionResult.message,
        model: selectedModel,
      };
    }
    
    throw error;
  }
}
