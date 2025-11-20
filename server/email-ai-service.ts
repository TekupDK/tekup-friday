/**
 * AI-powered email categorization and analysis service
 * Friday AI Inbox - Email Intelligence System
 */

import { callLLM } from "./_core/llm";
import { getEmailAIMetadata, saveEmailAIMetadata } from "./email-db";

export interface EmailCategorizationResult {
  category: 'main' | 'updates' | 'promotions' | 'calendar' | 'social' | 'forums';
  confidence: number; // 0-100
  priorityScore: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  summary: string;
  actionItems: Array<{ text: string; deadline?: string }>;
  keyTopics: string[];
  suggestedLabels: string[];
}

export interface SmartReply {
  text: string;
  tone: 'professional' | 'casual' | 'formal';
}

/**
 * Categorize an email using AI with caching support
 */
export async function categorizeEmail(params: {
  from: string;
  subject: string;
  body: string;
  snippet: string;
  threadId?: number;
  gmailThreadId?: string;
  useCache?: boolean;
}): Promise<EmailCategorizationResult> {
  // Check cache first if threadId is provided
  if (params.useCache !== false && params.threadId) {
    const cached = await getEmailAIMetadata(params.threadId);
    if (cached && cached.categorization) {
      console.log(`[Email AI] Cache hit for thread ${params.threadId}`);
      return {
        category: cached.categorization.category || 'main',
        confidence: cached.categorization.confidence || 50,
        priorityScore: cached.priorityScore || 50,
        sentiment: cached.sentiment || 'neutral',
        summary: cached.summary || params.snippet.substring(0, 100),
        actionItems: cached.actionItems || [],
        keyTopics: cached.keyTopics || [],
        suggestedLabels: cached.suggestedLabels || [],
      };
    }
  }
  const prompt = `Analyze this email and provide categorization and insights.

**Email Details:**
From: ${params.from}
Subject: ${params.subject}
Body Preview: ${params.snippet || params.body.substring(0, 500)}

**Task:** Categorize this email and extract insights.

**Categories:**
- main: Personal emails, important conversations, direct communications
- updates: Notifications, confirmations, receipts, account updates
- promotions: Marketing emails, offers, newsletters, advertisements
- calendar: Meeting invites, event reminders, calendar notifications
- social: Social media notifications, friend requests, comments
- forums: Mailing lists, discussion groups, community posts

**Respond in this EXACT JSON format:**
{
  "category": "main",
  "confidence": 95,
  "priorityScore": 75,
  "sentiment": "neutral",
  "summary": "One-line summary of the email",
  "actionItems": [{"text": "Action to take", "deadline": "2025-11-25"}],
  "keyTopics": ["topic1", "topic2"],
  "suggestedLabels": ["label1", "label2"]
}

**Guidelines:**
- confidence: 0-100 (how certain you are about the category)
- priorityScore: 0-100 (how important/urgent is this email)
- sentiment: positive, neutral, negative, or urgent
- summary: One concise sentence summarizing the email
- actionItems: Specific actions the recipient should take (with optional deadlines)
- keyTopics: Main topics discussed (max 3)
- suggestedLabels: Suggested custom labels based on content (e.g., "needs-reply", "waiting", "important")

Respond ONLY with valid JSON, no additional text.`;

  try {
    const response = await callLLM({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
      temperature: 0.3, // Lower temperature for more consistent categorization
    });

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate and set defaults
    const categorizationResult = {
      category: result.category || 'main',
      confidence: Math.min(100, Math.max(0, result.confidence || 50)),
      priorityScore: Math.min(100, Math.max(0, result.priorityScore || 50)),
      sentiment: result.sentiment || 'neutral',
      summary: result.summary || params.snippet.substring(0, 100),
      actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
      keyTopics: Array.isArray(result.keyTopics) ? result.keyTopics.slice(0, 3) : [],
      suggestedLabels: Array.isArray(result.suggestedLabels) ? result.suggestedLabels : [],
    };

    // Save to cache if threadId is provided
    if (params.threadId && params.gmailThreadId) {
      await saveEmailAIMetadata({
        threadId: params.threadId,
        gmailThreadId: params.gmailThreadId,
        categorization: {
          category: categorizationResult.category,
          confidence: categorizationResult.confidence,
        },
        priorityScore: categorizationResult.priorityScore,
        sentiment: categorizationResult.sentiment,
        summary: categorizationResult.summary,
        actionItems: categorizationResult.actionItems,
        keyTopics: categorizationResult.keyTopics,
        suggestedLabels: categorizationResult.suggestedLabels,
      });
      console.log(`[Email AI] Cached result for thread ${params.threadId}`);
    }

    return categorizationResult;
  } catch (error) {
    console.error('[Email AI] Categorization error:', error);

    // Fallback to basic categorization
    return {
      category: categorizeFallback(params),
      confidence: 30,
      priorityScore: 50,
      sentiment: 'neutral',
      summary: params.snippet.substring(0, 100),
      actionItems: [],
      keyTopics: [],
      suggestedLabels: [],
    };
  }
}

/**
 * Fallback categorization using simple keyword matching
 */
function categorizeFallback(params: {
  from: string;
  subject: string;
  body: string;
}): 'main' | 'updates' | 'promotions' | 'calendar' | 'social' | 'forums' {
  const text = `${params.from} ${params.subject} ${params.body}`.toLowerCase();

  // Calendar
  if (
    text.includes('meeting') ||
    text.includes('calendar') ||
    text.includes('event') ||
    text.includes('invitation') ||
    text.includes('zoom') ||
    text.includes('møde')
  ) {
    return 'calendar';
  }

  // Promotions
  if (
    text.includes('unsubscribe') ||
    text.includes('offer') ||
    text.includes('discount') ||
    text.includes('sale') ||
    text.includes('promotion') ||
    text.includes('deal') ||
    text.includes('newsletter')
  ) {
    return 'promotions';
  }

  // Social
  if (
    text.includes('facebook') ||
    text.includes('twitter') ||
    text.includes('linkedin') ||
    text.includes('instagram') ||
    text.includes('notification')
  ) {
    return 'social';
  }

  // Forums
  if (
    text.includes('mailing list') ||
    text.includes('discussion') ||
    text.includes('forum') ||
    text.includes('group')
  ) {
    return 'forums';
  }

  // Updates
  if (
    text.includes('confirmation') ||
    text.includes('receipt') ||
    text.includes('order') ||
    text.includes('shipped') ||
    text.includes('delivered') ||
    text.includes('account') ||
    text.includes('update')
  ) {
    return 'updates';
  }

  // Default to main
  return 'main';
}

/**
 * Generate smart reply suggestions for an email
 */
export async function generateSmartReplies(params: {
  from: string;
  subject: string;
  body: string;
  context?: string; // Previous conversation context
}): Promise<SmartReply[]> {
  const prompt = `Generate 3 smart reply suggestions for this email.

**Email:**
From: ${params.from}
Subject: ${params.subject}
Body: ${params.body.substring(0, 1000)}
${params.context ? `\n**Context:**\n${params.context}` : ''}

**Generate 3 different reply suggestions:**
1. Professional tone (formal)
2. Casual tone (friendly but professional)
3. Brief acknowledgment

**Respond in this EXACT JSON format:**
[
  {"text": "Reply text here", "tone": "professional"},
  {"text": "Reply text here", "tone": "casual"},
  {"text": "Reply text here", "tone": "formal"}
]

**Guidelines:**
- Keep replies concise (2-3 sentences max)
- Match the context and intent
- Be helpful and actionable
- Use proper Danish if the email is in Danish

Respond ONLY with valid JSON array, no additional text.`;

  try {
    const response = await callLLM({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
      temperature: 0.7, // Higher temperature for creative replies
    });

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in AI response');
    }

    const replies = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(replies)) {
      throw new Error('Invalid response format');
    }

    return replies.slice(0, 3).map((r: any) => ({
      text: r.text || 'Thank you for your email.',
      tone: r.tone || 'professional',
    }));
  } catch (error) {
    console.error('[Email AI] Smart replies error:', error);

    // Fallback generic replies
    return [
      { text: 'Thank you for your email. I will review this and get back to you soon.', tone: 'professional' },
      { text: 'Got it, thanks! I\'ll look into this and follow up.', tone: 'casual' },
      { text: 'Received. Will respond shortly.', tone: 'formal' },
    ];
  }
}

/**
 * Extract action items from email content
 */
export async function extractActionItems(emailBody: string): Promise<Array<{ text: string; deadline?: string }>> {
  const prompt = `Extract action items from this email.

**Email Content:**
${emailBody.substring(0, 2000)}

**Task:** Identify specific actions the recipient should take.

**Respond in this EXACT JSON format:**
[
  {"text": "Action description", "deadline": "2025-11-25"},
  {"text": "Another action", "deadline": null}
]

**Guidelines:**
- Only extract explicit action items (not general suggestions)
- Include deadlines if mentioned
- Be specific and actionable
- Limit to top 5 most important actions

Respond ONLY with valid JSON array, no additional text.`;

  try {
    const response = await callLLM({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
      temperature: 0.3,
    });

    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const items = JSON.parse(jsonMatch[0]);
    return Array.isArray(items) ? items.slice(0, 5) : [];
  } catch (error) {
    console.error('[Email AI] Action items extraction error:', error);
    return [];
  }
}

/**
 * Analyze sentiment and urgency
 */
export async function analyzeSentiment(emailBody: string): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  confidence: number;
  reason: string;
}> {
  const prompt = `Analyze the sentiment and urgency of this email.

**Email Content:**
${emailBody.substring(0, 1000)}

**Respond in this EXACT JSON format:**
{
  "sentiment": "neutral",
  "confidence": 85,
  "reason": "Brief explanation"
}

**Sentiments:**
- positive: Happy, grateful, appreciative, congratulatory
- neutral: Informational, matter-of-fact, routine
- negative: Frustrated, angry, disappointed, complaining
- urgent: Time-sensitive, requires immediate action, high priority

Respond ONLY with valid JSON, no additional text.`;

  try {
    const response = await callLLM({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4o-mini',
      temperature: 0.2,
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { sentiment: 'neutral', confidence: 50, reason: 'Unable to determine' };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      sentiment: result.sentiment || 'neutral',
      confidence: Math.min(100, Math.max(0, result.confidence || 50)),
      reason: result.reason || 'No specific reason provided',
    };
  } catch (error) {
    console.error('[Email AI] Sentiment analysis error:', error);
    return { sentiment: 'neutral', confidence: 50, reason: 'Analysis failed' };
  }
}
