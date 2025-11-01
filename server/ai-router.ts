/**
 * AI Router
 * Routes requests to appropriate AI models and handles intent-based actions
 */

import { invokeLLM, type Message } from "./_core/llm";
import { getFridaySystemPrompt } from "./friday-prompts";
import { parseIntent, executeAction, type ActionResult } from "./intent-actions";

export type AIModel = 
  | "gpt-4o" 
  | "gpt-4o-mini" 
  | "claude-3-5-sonnet" 
  | "gemini-2.5-flash";

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
  stream?: boolean;
  tools?: any[];
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
 * Route AI request to the appropriate model with intent-based actions
 */
export async function routeAI(options: AIRouterOptions & { userId?: number }): Promise<AIResponse> {
  const {
    messages,
    taskType = "chat",
    model: explicitModel,
    userId,
  } = options;

  // Use explicit model if provided, otherwise select based on task type
  const selectedModel = explicitModel || selectModelForTask(taskType);

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

  // DEBUG: Check execution conditions
  console.log(`[DEBUG] Execution conditions:`, {
    confidence: intent.confidence,
    confidenceCheck: intent.confidence > 0.7,
    intentNotUnknown: intent.intent !== "unknown",
    userId: userId,
    hasUserId: !!userId,
    shouldExecute: intent.confidence > 0.7 && intent.intent !== "unknown" && !!userId
  });

  // If high-confidence intent detected and userId available, execute action
  if (intent.confidence > 0.7 && intent.intent !== "unknown" && userId) {
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

  // Add Friday system prompt if not already present
  const hasSystemPrompt = messages.some(m => m.role === "system");
  const messagesWithSystem = hasSystemPrompt
    ? messages
    : [{ role: "system" as const, content: getFridaySystemPrompt() }, ...messages];

  // If action was executed, add result to context
  const finalMessages: Message[] = [...messagesWithSystem];
  if (actionResult) {
    finalMessages.push({
      role: "system",
      content: `[Action Result] ${actionResult.success ? "Success" : "Failed"}: ${actionResult.message}${actionResult.data ? "\nData: " + JSON.stringify(actionResult.data, null, 2) : ""}${actionResult.error ? "\nError: " + actionResult.error : ""}`,
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
