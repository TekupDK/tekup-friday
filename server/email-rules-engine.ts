/**
 * Email Rules Engine - Automation for Friday AI Inbox
 * Processes emails based on user-defined rules
 */

import type { EmailRule } from "../drizzle/schema";
import {
  assignLabelToThread,
  assignCategoryToThread,
  getCategoryByName,
  snoozeEmail,
  markThreadAsRead,
  markThreadAsStarred,
  archiveThread,
  deleteThread,
} from "./email-db";

interface EmailData {
  threadId: number;
  gmailThreadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  hasAttachment: boolean;
  labels: string[];
}

interface RuleCondition {
  field: 'from' | 'to' | 'subject' | 'body' | 'hasAttachment' | 'label';
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'matches';
  value: string;
}

interface RuleAction {
  type: 'addLabel' | 'addCategory' | 'markRead' | 'markStarred' | 'archive' | 'delete' | 'forward' | 'snooze';
  params: Record<string, any>;
}

/**
 * Evaluate if an email matches a rule's conditions
 */
export function evaluateRuleConditions(
  email: EmailData,
  conditions: {
    type: 'all' | 'any';
    rules: RuleCondition[];
  }
): boolean {
  if (conditions.rules.length === 0) {
    return false;
  }

  const results = conditions.rules.map(condition => evaluateCondition(email, condition));

  if (conditions.type === 'all') {
    return results.every(r => r === true);
  } else {
    return results.some(r => r === true);
  }
}

/**
 * Evaluate a single condition against email data
 */
function evaluateCondition(email: EmailData, condition: RuleCondition): boolean {
  let fieldValue: string;

  switch (condition.field) {
    case 'from':
      fieldValue = email.from;
      break;
    case 'to':
      fieldValue = email.to;
      break;
    case 'subject':
      fieldValue = email.subject;
      break;
    case 'body':
      fieldValue = email.body;
      break;
    case 'hasAttachment':
      fieldValue = email.hasAttachment ? 'true' : 'false';
      break;
    case 'label':
      fieldValue = email.labels.join(',');
      break;
    default:
      return false;
  }

  const searchValue = condition.value.toLowerCase();
  const targetValue = fieldValue.toLowerCase();

  switch (condition.operator) {
    case 'contains':
      return targetValue.includes(searchValue);
    case 'equals':
      return targetValue === searchValue;
    case 'startsWith':
      return targetValue.startsWith(searchValue);
    case 'endsWith':
      return targetValue.endsWith(searchValue);
    case 'matches':
      try {
        const regex = new RegExp(condition.value, 'i');
        return regex.test(fieldValue);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Execute rule actions on an email
 */
export async function executeRuleActions(
  email: EmailData,
  actions: RuleAction[],
  userId: number
): Promise<{ success: boolean; actionsExecuted: string[] }> {
  const actionsExecuted: string[] = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case 'addLabel':
          if (action.params.labelId) {
            await assignLabelToThread(email.threadId, action.params.labelId);
            actionsExecuted.push(`Added label ${action.params.labelId}`);
          }
          break;

        case 'addCategory':
          if (action.params.categoryName) {
            const category = await getCategoryByName(action.params.categoryName);
            if (category) {
              await assignCategoryToThread({
                threadId: email.threadId,
                categoryId: category.id,
                confidence: 100,
                isManual: false,
              });
              actionsExecuted.push(`Categorized as ${action.params.categoryName}`);
            }
          }
          break;

        case 'markRead':
          await markThreadAsRead(email.threadId, true);
          actionsExecuted.push('Marked as read');
          break;

        case 'markStarred':
          await markThreadAsStarred(email.threadId, true);
          actionsExecuted.push('Marked as starred');
          break;

        case 'archive':
          await archiveThread(email.threadId, true);
          actionsExecuted.push('Archived');
          break;

        case 'snooze':
          if (action.params.snoozeUntil) {
            await snoozeEmail({
              userId,
              threadId: email.threadId,
              gmailThreadId: email.gmailThreadId,
              snoozeUntil: new Date(action.params.snoozeUntil),
              reminder: action.params.reminder || false,
            });
            actionsExecuted.push(`Snoozed until ${action.params.snoozeUntil}`);
          }
          break;

        case 'forward':
          if (action.params.forwardTo) {
            // TODO: Implement Gmail API integration to forward emails
            // This requires calling Gmail API: gmail.users.messages.send()
            // with proper formatting of the forwarded message
            actionsExecuted.push(`Forward to ${action.params.forwardTo} (requires Gmail API)`);
          }
          break;

        case 'delete':
          await deleteThread(email.threadId);
          // Note: This is a hard delete. Consider using archive instead for safety.
          // To sync with Gmail, call: gmail.users.messages.trash() or delete()
          actionsExecuted.push('Deleted');
          break;

        default:
          console.warn(`[Rules Engine] Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error(`[Rules Engine] Error executing action ${action.type}:`, error);
    }
  }

  return {
    success: actionsExecuted.length > 0,
    actionsExecuted,
  };
}

/**
 * Process an email through all active rules
 */
export async function processEmailWithRules(
  email: EmailData,
  rules: EmailRule[],
  userId: number
): Promise<{ rulesMatched: number; actionsExecuted: string[] }> {
  let rulesMatched = 0;
  const allActions: string[] = [];

  // Sort rules by priority (higher priority first)
  const sortedRules = [...rules]
    .filter(rule => rule.isEnabled)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const rule of sortedRules) {
    try {
      // Evaluate conditions
      const matches = evaluateRuleConditions(email, rule.conditions);

      if (matches) {
        rulesMatched++;
        console.log(`[Rules Engine] Rule matched: ${rule.name}`);

        // Execute actions
        const result = await executeRuleActions(email, rule.actions, userId);

        if (result.success) {
          allActions.push(...result.actionsExecuted);
        }
      }
    } catch (error) {
      console.error(`[Rules Engine] Error processing rule ${rule.name}:`, error);
    }
  }

  return {
    rulesMatched,
    actionsExecuted: allActions,
  };
}

/**
 * Pre-built rule templates
 */
export const RULE_TEMPLATES = {
  NEWSLETTERS_TO_PROMOTIONS: {
    name: "Newsletter → Promotions",
    description: "Automatically categorize newsletters as promotions",
    conditions: {
      type: 'any' as const,
      rules: [
        { field: 'body' as const, operator: 'contains' as const, value: 'unsubscribe' },
        { field: 'subject' as const, operator: 'contains' as const, value: 'newsletter' },
      ],
    },
    actions: [
      { type: 'addCategory' as const, params: { categoryName: 'promotions' } },
    ],
  },

  CALENDAR_INVITES: {
    name: "Meeting Invites → Calendar",
    description: "Automatically categorize calendar invites",
    conditions: {
      type: 'any' as const,
      rules: [
        { field: 'subject' as const, operator: 'contains' as const, value: 'invitation' },
        { field: 'subject' as const, operator: 'contains' as const, value: 'meeting' },
        { field: 'body' as const, operator: 'contains' as const, value: 'zoom' },
        { field: 'body' as const, operator: 'contains' as const, value: 'calendar' },
      ],
    },
    actions: [
      { type: 'addCategory' as const, params: { categoryName: 'calendar' } },
    ],
  },

  RECEIPTS_AND_CONFIRMATIONS: {
    name: "Receipts → Updates",
    description: "Categorize order confirmations and receipts",
    conditions: {
      type: 'any' as const,
      rules: [
        { field: 'subject' as const, operator: 'contains' as const, value: 'receipt' },
        { field: 'subject' as const, operator: 'contains' as const, value: 'confirmation' },
        { field: 'subject' as const, operator: 'contains' as const, value: 'order' },
        { field: 'subject' as const, operator: 'contains' as const, value: 'shipped' },
      ],
    },
    actions: [
      { type: 'addCategory' as const, params: { categoryName: 'updates' } },
      { type: 'markRead' as const, params: {} },
    ],
  },

  IMPORTANT_CLIENTS: {
    name: "Important Client Emails",
    description: "Flag emails from important clients",
    conditions: {
      type: 'any' as const,
      rules: [
        { field: 'from' as const, operator: 'contains' as const, value: '@important-client.com' },
      ],
    },
    actions: [
      { type: 'markStarred' as const, params: {} },
      { type: 'addCategory' as const, params: { categoryName: 'main' } },
    ],
  },
};
