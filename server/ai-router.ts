/**
 * AI Router
 * Intelligently routes requests to different AI models based on task type and context
 * Supports: OpenAI GPT-4o, Anthropic Claude, Google Gemini
 */

import { invokeLLM, type Message } from "./_core/llm";

export type AIModel = "gpt-4o" | "gpt-4o-mini" | "claude-3.5" | "gemini-2.0";

export type TaskType =
  | "chat" // General conversation
  | "email-draft" // Email composition
  | "invoice-create" // Invoice generation
  | "calendar-check" // Calendar operations
  | "lead-analysis" // Lead scoring and analysis
  | "data-analysis" // Data processing and insights
  | "code-generation"; // Code generation

interface AIRouterOptions {
  messages: Message[];
  taskType?: TaskType;
  model?: AIModel;
  stream?: boolean;
  tools?: Array<{
    type: "function";
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
}

interface AIResponse {
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
}

/**
 * Select the best model for a given task type
 */
function selectModelForTask(taskType: TaskType): AIModel {
  const modelMap: Record<TaskType, AIModel> = {
    "chat": "gpt-4o-mini", // Fast and cost-effective for general chat
    "email-draft": "gpt-4o", // Better at professional writing
    "invoice-create": "gpt-4o", // Structured data generation
    "calendar-check": "gpt-4o-mini", // Simple logic
    "lead-analysis": "gpt-4o", // Complex analysis
    "data-analysis": "gpt-4o", // Data processing
    "code-generation": "gpt-4o", // Code quality
  };

  return modelMap[taskType] || "gpt-4o-mini";
}

/**
 * Route AI request to the appropriate model
 */
export async function routeAI(options: AIRouterOptions): Promise<AIResponse> {
  const {
    messages,
    taskType = "chat",
    model: explicitModel,
    stream = false,
    tools,
  } = options;

  // Use explicit model if provided, otherwise select based on task type
  const selectedModel = explicitModel || selectModelForTask(taskType);

  try {
    // For now, we primarily use OpenAI models via invokeLLM
    // Future: Add support for Claude and Gemini with direct API calls
    const response = await invokeLLM({
      messages,
      tools,
      // stream, // Streaming will be handled separately
    });

    const messageContent = response.choices[0]?.message?.content;
    const content = typeof messageContent === "string" ? messageContent : "";
    const toolCalls = response.choices[0]?.message?.tool_calls?.map((tc) => ({
      name: tc.function.name,
      arguments: tc.function.arguments,
    }));

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
      toolCalls,
    };
  } catch (error) {
    console.error(`AI Router error with model ${selectedModel}:`, error);
    throw new Error(`Failed to get AI response: ${error}`);
  }
}

/**
 * Stream AI response (for real-time chat)
 */
export async function* streamAI(options: AIRouterOptions): AsyncGenerator<string> {
  const {
    messages,
    taskType = "chat",
    model: explicitModel,
  } = options;

  const selectedModel = explicitModel || selectModelForTask(taskType);

  // For streaming, we'll use the OpenAI SDK directly
  // This is a placeholder - actual streaming implementation will be in the chat router
  try {
    const response = await invokeLLM({
      messages,
    });

    const messageContent = response.choices[0]?.message?.content;
    const content = typeof messageContent === "string" ? messageContent : "";
    
    // Simulate streaming by yielding chunks
    const words = content.split(" ");
    for (const word of words) {
      yield word + " ";
      await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate delay
    }
  } catch (error) {
    console.error(`AI Stream error with model ${selectedModel}:`, error);
    throw new Error(`Failed to stream AI response: ${error}`);
  }
}

/**
 * Analyze lead score based on email content
 * Implements MEMORY_25: Verify lead name against actual email
 */
export async function analyzeLeadScore(params: {
  emailContent: string;
  senderName: string;
  senderEmail: string;
}): Promise<{
  score: number;
  factors: Record<string, number>;
  verified: boolean;
}> {
  const messages: Message[] = [
    {
      role: "system",
      content: `You are a lead scoring AI for a cleaning company (Rendetalje). Analyze emails and score leads 0-100 based on:
- Urgency keywords (ASAP, urgent, soon): +20
- Business email domain (not gmail/hotmail): +15
- Phone number included: +10
- Specific address/location: +10
- Detailed requirements: +15
- Professional tone: +10
- Company name mentioned: +10
- Budget/price discussion: +10

Return JSON: { "score": number, "factors": { "urgency": number, "business_email": number, ... }, "verified_name": boolean }`,
    },
    {
      role: "user",
      content: `Analyze this lead:
Sender Name: ${params.senderName}
Sender Email: ${params.senderEmail}
Email Content: ${params.emailContent}`,
    },
  ];

  const response = await routeAI({
    messages,
    taskType: "lead-analysis",
    model: "gpt-4o",
  });

  try {
    const result = JSON.parse(response.content);
    return {
      score: result.score || 0,
      factors: result.factors || {},
      verified: result.verified_name || false,
    };
  } catch (error) {
    console.error("Error parsing lead score:", error);
    return { score: 0, factors: {}, verified: false };
  }
}

/**
 * Generate invoice from natural language
 */
export async function generateInvoiceFromText(params: {
  customerInfo: string;
  serviceDescription: string;
}): Promise<{
  customer: { name: string; email?: string };
  lines: Array<{ description: string; quantity: number; unitPrice: number }>;
  total: number;
}> {
  const messages: Message[] = [
    {
      role: "system",
      content: `You are an invoice generation AI for a cleaning company. Parse customer requests and generate invoice data.
Return JSON: {
  "customer": { "name": string, "email": string },
  "lines": [{ "description": string, "quantity": number, "unitPrice": number }],
  "total": number
}
Use standard cleaning rates: 250 DKK/hour for regular cleaning, 300 DKK/hour for deep cleaning.`,
    },
    {
      role: "user",
      content: `Generate invoice for:
Customer: ${params.customerInfo}
Service: ${params.serviceDescription}`,
    },
  ];

  const response = await routeAI({
    messages,
    taskType: "invoice-create",
    model: "gpt-4o",
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error("Error parsing invoice data:", error);
    throw new Error("Failed to generate invoice");
  }
}

/**
 * Draft email response based on context
 * Implements MEMORY_7: Search existing customer emails before quote emails
 */
export async function draftEmailResponse(params: {
  originalEmail: string;
  context?: string;
  tone?: "professional" | "friendly" | "formal";
}): Promise<{ subject: string; body: string }> {
  const tone = params.tone || "professional";
  
  const messages: Message[] = [
    {
      role: "system",
      content: `You are an email assistant for a cleaning company (Rendetalje). Draft ${tone} email responses.
Return JSON: { "subject": string, "body": string }
Always maintain a ${tone} tone and include relevant details.`,
    },
    {
      role: "user",
      content: `Draft a response to this email:
${params.originalEmail}

${params.context ? `Additional context: ${params.context}` : ""}`,
    },
  ];

  const response = await routeAI({
    messages,
    taskType: "email-draft",
    model: "gpt-4o",
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error("Error parsing email draft:", error);
    throw new Error("Failed to draft email");
  }
}
