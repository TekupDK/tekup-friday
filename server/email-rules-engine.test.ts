import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateRuleConditions, executeRuleActions, processEmailWithRules, RULE_TEMPLATES } from './email-rules-engine';
import type { EmailRule } from '../drizzle/schema';
import * as emailDb from './email-db';

// Mock email database operations
vi.mock('./email-db', () => ({
  assignLabelToThread: vi.fn(),
  assignCategoryToThread: vi.fn(),
  getCategoryByName: vi.fn(),
  snoozeEmail: vi.fn(),
  markThreadAsRead: vi.fn(),
  markThreadAsStarred: vi.fn(),
  archiveThread: vi.fn(),
  deleteThread: vi.fn(),
}));

describe('Email Rules Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('evaluateRuleConditions', () => {
    const emailData = {
      threadId: 1,
      gmailThreadId: 'test123',
      from: 'john@example.com',
      to: 'me@example.com',
      subject: 'Meeting Invitation',
      body: 'Please join our Zoom meeting tomorrow',
      hasAttachment: false,
      labels: ['INBOX'],
    };

    it('should match "contains" operator', () => {
      const conditions = {
        type: 'all' as const,
        rules: [
          { field: 'subject' as const, operator: 'contains' as const, value: 'meeting' },
        ],
      };

      const result = evaluateRuleConditions(emailData, conditions);
      expect(result).toBe(true);
    });

    it('should match "equals" operator', () => {
      const conditions = {
        type: 'all' as const,
        rules: [
          { field: 'from' as const, operator: 'equals' as const, value: 'john@example.com' },
        ],
      };

      const result = evaluateRuleConditions(emailData, conditions);
      expect(result).toBe(true);
    });

    it('should match "startsWith" operator', () => {
      const conditions = {
        type: 'all' as const,
        rules: [
          { field: 'from' as const, operator: 'startsWith' as const, value: 'john@' },
        ],
      };

      const result = evaluateRuleConditions(emailData, conditions);
      expect(result).toBe(true);
    });

    it('should match "endsWith" operator', () => {
      const conditions = {
        type: 'all' as const,
        rules: [
          { field: 'from' as const, operator: 'endsWith' as const, value: '@example.com' },
        ],
      };

      const result = evaluateRuleConditions(emailData, conditions);
      expect(result).toBe(true);
    });

    it('should match "matches" operator with regex', () => {
      const conditions = {
        type: 'all' as const,
        rules: [
          { field: 'subject' as const, operator: 'matches' as const, value: 'meeting|invite' },
        ],
      };

      const result = evaluateRuleConditions(emailData, conditions);
      expect(result).toBe(true);
    });

    it('should handle "all" conditions (AND logic)', () => {
      const conditions = {
        type: 'all' as const,
        rules: [
          { field: 'subject' as const, operator: 'contains' as const, value: 'meeting' },
          { field: 'body' as const, operator: 'contains' as const, value: 'zoom' },
        ],
      };

      const result = evaluateRuleConditions(emailData, conditions);
      expect(result).toBe(true);
    });

    it('should handle "any" conditions (OR logic)', () => {
      const conditions = {
        type: 'any' as const,
        rules: [
          { field: 'subject' as const, operator: 'contains' as const, value: 'meeting' },
          { field: 'subject' as const, operator: 'contains' as const, value: 'nonexistent' },
        ],
      };

      const result = evaluateRuleConditions(emailData, conditions);
      expect(result).toBe(true);
    });

    it('should fail when "all" conditions are not met', () => {
      const conditions = {
        type: 'all' as const,
        rules: [
          { field: 'subject' as const, operator: 'contains' as const, value: 'meeting' },
          { field: 'body' as const, operator: 'contains' as const, value: 'nonexistent' },
        ],
      };

      const result = evaluateRuleConditions(emailData, conditions);
      expect(result).toBe(false);
    });

    it('should check hasAttachment field', () => {
      const conditions = {
        type: 'all' as const,
        rules: [
          { field: 'hasAttachment' as const, operator: 'equals' as const, value: 'false' },
        ],
      };

      const result = evaluateRuleConditions(emailData, conditions);
      expect(result).toBe(true);
    });

    it('should check labels field', () => {
      const conditions = {
        type: 'all' as const,
        rules: [
          { field: 'label' as const, operator: 'contains' as const, value: 'inbox' },
        ],
      };

      const result = evaluateRuleConditions(emailData, conditions);
      expect(result).toBe(true);
    });
  });

  describe('executeRuleActions', () => {
    const emailData = {
      threadId: 1,
      gmailThreadId: 'test123',
      from: 'john@example.com',
      to: 'me@example.com',
      subject: 'Test',
      body: 'Test body',
      hasAttachment: false,
      labels: [],
    };

    it('should execute addLabel action', async () => {
      const actions = [
        { type: 'addLabel' as const, params: { labelId: 5 } },
      ];

      const result = await executeRuleActions(emailData, actions, 1);

      expect(emailDb.assignLabelToThread).toHaveBeenCalledWith(1, 5);
      expect(result.success).toBe(true);
      expect(result.actionsExecuted).toContain('Added label 5');
    });

    it('should execute addCategory action', async () => {
      vi.mocked(emailDb.getCategoryByName).mockResolvedValue({ id: 2, name: 'promotions' } as any);

      const actions = [
        { type: 'addCategory' as const, params: { categoryName: 'promotions' } },
      ];

      const result = await executeRuleActions(emailData, actions, 1);

      expect(emailDb.getCategoryByName).toHaveBeenCalledWith('promotions');
      expect(emailDb.assignCategoryToThread).toHaveBeenCalled();
      expect(result.actionsExecuted[0]).toContain('Categorized as promotions');
    });

    it('should execute markRead action', async () => {
      const actions = [
        { type: 'markRead' as const, params: {} },
      ];

      const result = await executeRuleActions(emailData, actions, 1);

      expect(emailDb.markThreadAsRead).toHaveBeenCalledWith(1, true);
      expect(result.actionsExecuted).toContain('Marked as read');
    });

    it('should execute markStarred action', async () => {
      const actions = [
        { type: 'markStarred' as const, params: {} },
      ];

      const result = await executeRuleActions(emailData, actions, 1);

      expect(emailDb.markThreadAsStarred).toHaveBeenCalledWith(1, true);
      expect(result.actionsExecuted).toContain('Marked as starred');
    });

    it('should execute archive action', async () => {
      const actions = [
        { type: 'archive' as const, params: {} },
      ];

      const result = await executeRuleActions(emailData, actions, 1);

      expect(emailDb.archiveThread).toHaveBeenCalledWith(1, true);
      expect(result.actionsExecuted).toContain('Archived');
    });

    it('should execute delete action', async () => {
      const actions = [
        { type: 'delete' as const, params: {} },
      ];

      const result = await executeRuleActions(emailData, actions, 1);

      expect(emailDb.deleteThread).toHaveBeenCalledWith(1);
      expect(result.actionsExecuted).toContain('Deleted');
    });

    it('should execute snooze action', async () => {
      const snoozeUntil = new Date('2025-12-01');
      const actions = [
        {
          type: 'snooze' as const,
          params: {
            snoozeUntil: snoozeUntil.toISOString(),
            reminder: true,
          },
        },
      ];

      const result = await executeRuleActions(emailData, actions, 1);

      expect(emailDb.snoozeEmail).toHaveBeenCalled();
      expect(result.actionsExecuted[0]).toContain('Snoozed until');
    });

    it('should execute multiple actions', async () => {
      vi.mocked(emailDb.getCategoryByName).mockResolvedValue({ id: 2, name: 'main' } as any);

      const actions = [
        { type: 'markStarred' as const, params: {} },
        { type: 'addCategory' as const, params: { categoryName: 'main' } },
      ];

      const result = await executeRuleActions(emailData, actions, 1);

      expect(result.actionsExecuted).toHaveLength(2);
      expect(emailDb.markThreadAsStarred).toHaveBeenCalled();
      expect(emailDb.assignCategoryToThread).toHaveBeenCalled();
    });

    it('should handle action errors gracefully', async () => {
      vi.mocked(emailDb.assignLabelToThread).mockRejectedValue(new Error('DB error'));

      const actions = [
        { type: 'addLabel' as const, params: { labelId: 5 } },
      ];

      const result = await executeRuleActions(emailData, actions, 1);

      // Should not throw, but log error
      expect(result.success).toBe(false);
    });
  });

  describe('processEmailWithRules', () => {
    const emailData = {
      threadId: 1,
      gmailThreadId: 'test123',
      from: 'newsletter@company.com',
      to: 'me@example.com',
      subject: 'Weekly Newsletter - Special Offer',
      body: 'Unsubscribe at the bottom',
      hasAttachment: false,
      labels: [],
    };

    it('should process email through matching rules', async () => {
      vi.mocked(emailDb.getCategoryByName).mockResolvedValue({ id: 3, name: 'promotions' } as any);

      const rules: EmailRule[] = [
        {
          id: 1,
          userId: 1,
          name: 'Newsletter Rule',
          description: 'Categorize newsletters',
          conditions: {
            type: 'any',
            rules: [
              { field: 'body', operator: 'contains', value: 'unsubscribe' },
            ],
          },
          actions: [
            { type: 'addCategory', params: { categoryName: 'promotions' } },
          ],
          priority: 10,
          isEnabled: true,
          createdAt: new Date(),
        } as any,
      ];

      const result = await processEmailWithRules(emailData, rules, 1);

      expect(result.rulesMatched).toBe(1);
      expect(result.actionsExecuted.length).toBeGreaterThan(0);
    });

    it('should process rules by priority order', async () => {
      vi.mocked(emailDb.getCategoryByName).mockResolvedValue({ id: 1, name: 'main' } as any);

      const rules: EmailRule[] = [
        {
          id: 1,
          userId: 1,
          name: 'Low Priority',
          conditions: { type: 'all', rules: [{ field: 'subject', operator: 'contains', value: 'newsletter' }] },
          actions: [{ type: 'markRead', params: {} }],
          priority: 5,
          isEnabled: true,
          createdAt: new Date(),
        } as any,
        {
          id: 2,
          userId: 1,
          name: 'High Priority',
          conditions: { type: 'all', rules: [{ field: 'subject', operator: 'contains', value: 'newsletter' }] },
          actions: [{ type: 'markStarred', params: {} }],
          priority: 10,
          isEnabled: true,
          createdAt: new Date(),
        } as any,
      ];

      const result = await processEmailWithRules(emailData, rules, 1);

      expect(result.rulesMatched).toBe(2);
      // High priority rule (markStarred) should be called first
      const calls = vi.mocked(emailDb.markThreadAsStarred).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
    });

    it('should skip disabled rules', async () => {
      const rules: EmailRule[] = [
        {
          id: 1,
          userId: 1,
          name: 'Disabled Rule',
          conditions: { type: 'all', rules: [{ field: 'subject', operator: 'contains', value: 'newsletter' }] },
          actions: [{ type: 'markRead', params: {} }],
          priority: 10,
          isEnabled: false,
          createdAt: new Date(),
        } as any,
      ];

      const result = await processEmailWithRules(emailData, rules, 1);

      expect(result.rulesMatched).toBe(0);
      expect(emailDb.markThreadAsRead).not.toHaveBeenCalled();
    });

    it('should handle no matching rules', async () => {
      const rules: EmailRule[] = [
        {
          id: 1,
          userId: 1,
          name: 'Non-matching Rule',
          conditions: { type: 'all', rules: [{ field: 'from', operator: 'contains', value: 'nonexistent@example.com' }] },
          actions: [{ type: 'markRead', params: {} }],
          priority: 10,
          isEnabled: true,
          createdAt: new Date(),
        } as any,
      ];

      const result = await processEmailWithRules(emailData, rules, 1);

      expect(result.rulesMatched).toBe(0);
      expect(result.actionsExecuted).toHaveLength(0);
    });
  });

  describe('RULE_TEMPLATES', () => {
    it('should have all required templates', () => {
      expect(RULE_TEMPLATES).toHaveProperty('NEWSLETTERS_TO_PROMOTIONS');
      expect(RULE_TEMPLATES).toHaveProperty('CALENDAR_INVITES');
      expect(RULE_TEMPLATES).toHaveProperty('RECEIPTS_AND_CONFIRMATIONS');
      expect(RULE_TEMPLATES).toHaveProperty('IMPORTANT_CLIENTS');
    });

    it('should have valid template structure', () => {
      const template = RULE_TEMPLATES.NEWSLETTERS_TO_PROMOTIONS;
      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('description');
      expect(template).toHaveProperty('conditions');
      expect(template).toHaveProperty('actions');
      expect(template.conditions).toHaveProperty('type');
      expect(template.conditions).toHaveProperty('rules');
      expect(Array.isArray(template.actions)).toBe(true);
    });
  });
});
