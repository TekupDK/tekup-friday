/**
 * Email Draft Generation System
 * Implements Jace AI-inspired proactive email drafting
 */

import { db } from "./db";
import { emailDrafts, emailMessages, userWritingStyles } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { routeAI } from "./ai-router";
import { FRIDAY_MAIN_PROMPT, EMAIL_HANDLING_PROMPT } from "./friday-prompts";
import { getGmailThread } from "./google-api";

/**
 * Detect email intent from message content
 */
export async function detectEmailIntent(email: {
  from: string;
  subject: string;
  body: string;
}): Promise<{
  intent: string;
  confidence: number;
  shouldDraft: boolean;
}> {
  const prompt = `Analyze this email and determine the intent. Return JSON only.

Email:
From: ${email.from}
Subject: ${email.subject}
Body: ${email.body.substring(0, 500)}

Return JSON:
{
  "intent": "quote_request" | "complaint" | "booking" | "follow_up" | "payment" | "question" | "other",
  "confidence": 0-100,
  "shouldDraft": true/false (draft if quote_request, complaint, booking, question)
}`;

  try {
    const response = await routeAI({
      messages: [{ role: "user", content: prompt }],
      taskType: "analysis",
      userId: 1, // System user for background tasks
      requireApproval: false,
    });

    const result = JSON.parse(response.content);
    return result;
  } catch (error) {
    console.error('[Draft] Intent detection failed:', error);
    return { intent: 'unknown', confidence: 0, shouldDraft: false };
  }
}

/**
 * Get user's writing style profile
 */
export async function getUserWritingStyle(userId: number) {
  try {
    const [style] = await db
      .select()
      .from(userWritingStyles)
      .where(eq(userWritingStyles.userId, userId))
      .limit(1);

    return style || null;
  } catch (error) {
    console.error('[Draft] Failed to get writing style:', error);
    return null;
  }
}

/**
 * Generate draft response for an email
 */
export async function generateDraftResponse(params: {
  userId: number;
  gmailThreadId: string;
  gmailMessageId: string;
  email: {
    from: string;
    subject: string;
    body: string;
  };
  intent: string;
}): Promise<{
  draftBody: string;
  confidence: number;
}> {
  try {
    // 1. Get thread history for context
    const thread = await getGmailThread(params.gmailThreadId);
    const threadHistory = thread.messages
      .map((m: any) => `From: ${m.from}\nDate: ${m.date}\n\n${m.body}`)
      .join('\n\n---\n\n');

    // 2. Get user's writing style
    const writingStyle = await getUserWritingStyle(params.userId);

    // 3. Build draft generation prompt
    const styleInstructions = writingStyle
      ? `
Write in the user's style:
- Formality: ${writingStyle.toneProfile?.formality || 70}/100
- Friendliness: ${writingStyle.toneProfile?.friendliness || 80}/100
- Directness: ${writingStyle.toneProfile?.directness || 70}/100
- Common phrases: ${writingStyle.commonPhrases?.join(', ') || 'Tak for din henvendelse, Mvh'}
- Closing: ${writingStyle.closingSignature || 'Mvh,\\nRendetalje\\n22 65 02 26'}
`
      : `
Write in Danish business style:
- Professional but warm (varm og imødekommende)
- Direct and honest (direkte og ærlig)
- Use common Danish business phrases
- Always close with: Mvh,\\n[Name]\\nRendetalje\\n22 65 02 26
`;

    const prompt = `You are Friday, an AI assistant for Rendetalje cleaning company.

${FRIDAY_MAIN_PROMPT}

${EMAIL_HANDLING_PROMPT}

---

TASK: Generate a draft email response to this customer email.

CURRENT EMAIL:
From: ${params.email.from}
Subject: ${params.email.subject}
Body:
${params.email.body}

THREAD HISTORY:
${threadHistory}

INTENT: ${params.intent}

${styleInstructions}

INSTRUCTIONS:
1. If intent is "quote_request": Follow the quote format template from EMAIL_HANDLING_PROMPT
2. If intent is "complaint": Use conflict resolution template
3. If intent is "booking": Suggest checking calendar first
4. If intent is "question": Answer professionally and warmly
5. Always request photos for flytterengøring (MEMORY_16)
6. Always search Gmail before sending quotes (avoid duplicates)

IMPORTANT:
- Write ONLY the email body (no subject line)
- Use Danish language
- Be professional but warm
- Follow all MEMORY rules

Return ONLY the draft email text, nothing else.`;

    // 4. Generate draft using AI
    const response = await routeAI({
      messages: [{ role: "system", content: FRIDAY_MAIN_PROMPT }, { role: "user", content: prompt }],
      taskType: "email_draft",
      userId: params.userId,
      requireApproval: false,
    });

    // 5. Calculate confidence based on intent and style match
    const confidence = params.intent === 'quote_request' || params.intent === 'complaint' || params.intent === 'booking'
      ? 85
      : 70;

    return {
      draftBody: response.content,
      confidence,
    };
  } catch (error) {
    console.error('[Draft] Generation failed:', error);
    throw new Error(`Draft generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Save draft to database
 */
export async function saveDraft(params: {
  userId: number;
  gmailThreadId: string;
  gmailMessageId: string;
  draftSubject: string;
  draftBody: string;
  confidence: number;
  intent: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const [draft] = await db
      .insert(emailDrafts)
      .values({
        userId: params.userId,
        gmailThreadId: params.gmailThreadId,
        gmailMessageId: params.gmailMessageId,
        draftSubject: params.draftSubject,
        draftBody: params.draftBody,
        confidence: params.confidence,
        intent: params.intent,
        status: 'pending',
        metadata: params.metadata || {},
      })
      .returning();

    console.log(`[Draft] Saved draft for thread ${params.gmailThreadId} (confidence: ${params.confidence}%)`);
    return draft;
  } catch (error) {
    console.error('[Draft] Failed to save:', error);
    throw error;
  }
}

/**
 * Get drafts for a user
 */
export async function getUserDrafts(userId: number, status?: 'pending' | 'approved' | 'edited' | 'rejected' | 'sent') {
  try {
    const query = status
      ? db.select().from(emailDrafts).where(and(eq(emailDrafts.userId, userId), eq(emailDrafts.status, status)))
      : db.select().from(emailDrafts).where(eq(emailDrafts.userId, userId));

    const drafts = await query.orderBy(desc(emailDrafts.createdAt));
    return drafts;
  } catch (error) {
    console.error('[Draft] Failed to get drafts:', error);
    return [];
  }
}

/**
 * Get draft for specific thread
 */
export async function getDraftForThread(userId: number, gmailThreadId: string) {
  try {
    const [draft] = await db
      .select()
      .from(emailDrafts)
      .where(
        and(
          eq(emailDrafts.userId, userId),
          eq(emailDrafts.gmailThreadId, gmailThreadId),
          eq(emailDrafts.status, 'pending')
        )
      )
      .orderBy(desc(emailDrafts.createdAt))
      .limit(1);

    return draft || null;
  } catch (error) {
    console.error('[Draft] Failed to get draft for thread:', error);
    return null;
  }
}

/**
 * Update draft status
 */
export async function updateDraftStatus(draftId: number, status: 'approved' | 'edited' | 'rejected' | 'sent') {
  try {
    await db
      .update(emailDrafts)
      .set({ status, updatedAt: new Date() })
      .where(eq(emailDrafts.id, draftId));

    console.log(`[Draft] Updated draft ${draftId} status to ${status}`);
    return { success: true };
  } catch (error) {
    console.error('[Draft] Failed to update status:', error);
    throw error;
  }
}

/**
 * Update draft content (when user edits)
 */
export async function updateDraftContent(draftId: number, newBody: string) {
  try {
    await db
      .update(emailDrafts)
      .set({ draftBody: newBody, status: 'edited', updatedAt: new Date() })
      .where(eq(emailDrafts.id, draftId));

    console.log(`[Draft] Updated draft ${draftId} content`);
    return { success: true };
  } catch (error) {
    console.error('[Draft] Failed to update content:', error);
    throw error;
  }
}

/**
 * Analyze sent emails to build writing style profile
 */
export async function analyzeWritingStyle(userId: number, sentEmails: Array<{ body: string }>) {
  try {
    if (sentEmails.length === 0) {
      console.log('[Style] No sent emails to analyze');
      return null;
    }

    const emailBodies = sentEmails.map((e) => e.body).join('\n\n---\n\n');

    const prompt = `Analyze these sent emails and describe the writing style.

Emails:
${emailBodies.substring(0, 3000)}

Return JSON only:
{
  "toneProfile": {
    "formality": 0-100,
    "friendliness": 0-100,
    "directness": 0-100
  },
  "commonPhrases": ["phrase1", "phrase2", ...],
  "closingSignature": "Mvh,\\nJonas\\nRendetalje\\n22 65 02 26"
}`;

    const response = await routeAI({
      messages: [{ role: "user", content: prompt }],
      taskType: "analysis",
      userId,
      requireApproval: false,
    });

    const profile = JSON.parse(response.content);

    // Save to database
    const existing = await getUserWritingStyle(userId);

    if (existing) {
      await db
        .update(userWritingStyles)
        .set({
          toneProfile: profile.toneProfile,
          commonPhrases: profile.commonPhrases,
          closingSignature: profile.closingSignature,
          sentEmailAnalyzed: sentEmails.length,
          lastAnalyzedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userWritingStyles.userId, userId));
    } else {
      await db.insert(userWritingStyles).values({
        userId,
        toneProfile: profile.toneProfile,
        commonPhrases: profile.commonPhrases,
        closingSignature: profile.closingSignature,
        sentEmailAnalyzed: sentEmails.length,
        lastAnalyzedAt: new Date(),
      });
    }

    console.log(`[Style] Analyzed ${sentEmails.length} emails for user ${userId}`);
    return profile;
  } catch (error) {
    console.error('[Style] Analysis failed:', error);
    return null;
  }
}

/**
 * Process new emails and generate drafts (background job)
 */
export async function processNewEmailsForDrafts(userId: number) {
  try {
    console.log(`[Draft Worker] Processing new emails for user ${userId}...`);

    // Get unread emails from database
    const { getUserEmails } = await import('./db');
    const emails = await getUserEmails(userId, 20); // Process last 20 emails

    let draftsCreated = 0;

    for (const email of emails) {
      // Skip if already has a draft
      const existingDraft = await getDraftForThread(userId, email.gmailThreadId);
      if (existingDraft) {
        console.log(`[Draft Worker] Skipping ${email.gmailThreadId} - already has draft`);
        continue;
      }

      // Skip if read (already handled)
      if (email.isRead) {
        continue;
      }

      // Detect intent
      const intentResult = await detectEmailIntent({
        from: email.from,
        subject: email.subject || '',
        body: email.bodyText || '',
      });

      console.log(`[Draft Worker] Email ${email.gmailMessageId}: ${intentResult.intent} (${intentResult.confidence}% confidence)`);

      // Only generate draft for high-value intents
      if (intentResult.shouldDraft && intentResult.confidence > 60) {
        const draft = await generateDraftResponse({
          userId,
          gmailThreadId: email.gmailThreadId,
          gmailMessageId: email.gmailMessageId,
          email: {
            from: email.from,
            subject: email.subject || '',
            body: email.bodyText || '',
          },
          intent: intentResult.intent,
        });

        await saveDraft({
          userId,
          gmailThreadId: email.gmailThreadId,
          gmailMessageId: email.gmailMessageId,
          draftSubject: `Re: ${email.subject || ''}`,
          draftBody: draft.draftBody,
          confidence: draft.confidence,
          intent: intentResult.intent,
        });

        draftsCreated++;
      }
    }

    console.log(`[Draft Worker] Created ${draftsCreated} drafts`);
    return { success: true, draftsCreated };
  } catch (error) {
    console.error('[Draft Worker] Failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
