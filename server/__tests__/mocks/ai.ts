/**
 * AI Model Mocks
 * Mock responses for Gemini, Claude, GPT-4o, and other AI models
 */

import { vi } from "vitest";

/**
 * Mock AI response for chat messages
 */
export const mockAIChatResponse = {
  role: "assistant",
  content: "Dette er en test AI respons. Jeg kan hjælpe dig med at administrere din rengøringsvirksomhed.",
};

/**
 * Mock AI response with intent detection
 */
export const mockAIIntentResponse = {
  intent: "create_lead",
  confidence: 0.95,
  parameters: {
    name: "Test Hansen",
    email: "test@example.dk",
    phone: "12345678",
    source: "website",
  },
};

/**
 * Mock AI response for customer summary (Danish)
 */
export const mockAICustomerSummary = `
**Kunde Resume**

Test Hansen er en ny kunde fra website med 3 tidligere rengøringsjobs.

**Kontakt:**
- Email: test@example.dk
- Telefon: 12345678

**Balance:** 1.500 kr (1 ubetalt faktura)

**Historik:**
- Flytterengøring i 2024 (3.500 kr)
- Almindelig rengøring hver måned
- Altid betaler til tiden
`;

/**
 * Mock LLM invocation function
 */
export function mockLLMInvoke(response: any = mockAIChatResponse) {
  return vi.fn().mockResolvedValue(response);
}

/**
 * Mock streaming LLM response
 */
export function mockLLMStream(chunks: string[]) {
  return vi.fn().mockImplementation(async function* () {
    for (const chunk of chunks) {
      yield { content: chunk };
    }
  });
}

/**
 * Mock Gemini 2.5 Flash API
 */
export const mockGeminiAPI = {
  generateContent: vi.fn().mockResolvedValue({
    response: {
      text: () => mockAIChatResponse.content,
    },
  }),
};

/**
 * Mock Claude 3.5 Sonnet API
 */
export const mockClaudeAPI = {
  messages: {
    create: vi.fn().mockResolvedValue({
      content: [{ text: mockAIChatResponse.content }],
      role: "assistant",
    }),
  },
};

/**
 * Mock GPT-4o API
 */
export const mockGPT4API = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant",
              content: mockAIChatResponse.content,
            },
          },
        ],
      }),
    },
  },
};

/**
 * Mock intent detection with MEMORY rules
 */
export const mockIntentDetection = {
  create_lead: {
    intent: "create_lead",
    confidence: 0.9,
    parameters: {
      name: "Lars Nielsen",
      email: "lars@example.dk",
      phone: "20304050",
      source: "website",
    },
  },

  create_task: {
    intent: "create_task",
    confidence: 0.85,
    parameters: {
      title: "Send tilbud til Lars Nielsen",
      description: "Følg op på flytterengøring forespørgsel",
      priority: "high",
      dueDate: "2025-11-20",
    },
  },

  book_meeting: {
    intent: "book_meeting",
    confidence: 0.8,
    parameters: {
      participant: "Maria Hansen",
      date: "2025-11-19",
      time: "14:00",
      duration: "2 timer",
      type: "flytterengøring",
    },
  },

  create_invoice: {
    intent: "create_invoice",
    confidence: 0.9,
    parameters: {
      customerName: "Peter Jensen",
      hours: 3,
      description: "Almindelig rengøring",
      rate: 349, // kr/hour (MEMORY_17)
    },
  },

  request_flytter_photos: {
    intent: "request_flytter_photos",
    confidence: 0.95,
    parameters: {
      customerName: "Anna Sørensen",
      propertyType: "lejlighed",
    },
  },

  job_completion: {
    intent: "job_completion",
    confidence: 0.9,
    parameters: {
      customerName: "Hans Nielsen",
      jobType: "flytterengøring",
    },
  },
};
