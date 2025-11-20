import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as emailDb from './email-db';
import { db } from './db';

// Mock the database
vi.mock('./db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
        orderBy: vi.fn(() => Promise.resolve([])),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve({ insertId: 1 })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}));

describe('Email Database Operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Email Categories', () => {
    it('should initialize default categories', async () => {
      const mockSelect = vi.fn(() => Promise.resolve([]));
      const mockInsert = vi.fn(() => Promise.resolve());

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          limit: mockSelect,
        })) as any,
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: mockInsert,
      } as any);

      await emailDb.initializeDefaultCategories();

      expect(mockInsert).toHaveBeenCalled();
    });

    it('should get category by name', async () => {
      const mockCategory = { id: 1, name: 'main', displayName: 'Main' };
      const mockWhere = vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve([mockCategory])),
      }));

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: mockWhere,
        })) as any,
      } as any);

      const result = await emailDb.getCategoryByName('main');

      expect(result).toEqual(mockCategory);
    });
  });

  describe('Email Labels', () => {
    it('should create a new label', async () => {
      const mockInsert = vi.fn(() => Promise.resolve({ insertId: 1 }));
      vi.mocked(db.insert).mockReturnValue({
        values: mockInsert,
      } as any);

      const label = {
        userId: 1,
        name: 'Important',
        color: '#FF0000',
      };

      const result = await emailDb.createLabel(label);

      expect(mockInsert).toHaveBeenCalledWith(label);
      expect(result.id).toBe(1);
    });

    it('should assign label to thread', async () => {
      const mockInsert = vi.fn(() => Promise.resolve());
      vi.mocked(db.insert).mockReturnValue({
        values: mockInsert,
      } as any);

      await emailDb.assignLabelToThread(123, 456);

      expect(mockInsert).toHaveBeenCalledWith({ threadId: 123, labelId: 456 });
    });

    it('should remove label from thread', async () => {
      const mockWhere = vi.fn(() => Promise.resolve());
      vi.mocked(db.delete).mockReturnValue({
        where: mockWhere,
      } as any);

      await emailDb.removeLabelFromThread(123, 456);

      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('Email Thread Operations', () => {
    it('should mark thread as read', async () => {
      const mockWhere = vi.fn(() => Promise.resolve());
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(db.update).mockReturnValue({
        set: mockSet,
      } as any);

      await emailDb.markThreadAsRead(123, true);

      expect(mockSet).toHaveBeenCalledWith({ isRead: true });
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should mark thread as starred', async () => {
      const mockWhere = vi.fn(() => Promise.resolve());
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(db.update).mockReturnValue({
        set: mockSet,
      } as any);

      await emailDb.markThreadAsStarred(123, true);

      expect(mockSet).toHaveBeenCalledWith({ isStarred: true });
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should archive thread', async () => {
      const mockWhere = vi.fn(() => Promise.resolve());
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(db.update).mockReturnValue({
        set: mockSet,
      } as any);

      await emailDb.archiveThread(123, true);

      expect(mockSet).toHaveBeenCalledWith({ isArchived: true });
    });

    it('should delete thread', async () => {
      const mockWhere = vi.fn(() => Promise.resolve());
      vi.mocked(db.delete).mockReturnValue({
        where: mockWhere,
      } as any);

      await emailDb.deleteThread(123);

      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('Email Rules', () => {
    it('should create a rule', async () => {
      const mockInsert = vi.fn(() => Promise.resolve({ insertId: 1 }));
      vi.mocked(db.insert).mockReturnValue({
        values: mockInsert,
      } as any);

      const rule = {
        userId: 1,
        name: 'Test Rule',
        conditions: { type: 'all', rules: [] },
        actions: [],
        priority: 1,
        isEnabled: true,
      };

      const result = await emailDb.createRule(rule as any);

      expect(mockInsert).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('should toggle rule enabled state', async () => {
      const mockWhere = vi.fn(() => Promise.resolve());
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(db.update).mockReturnValue({
        set: mockSet,
      } as any);

      await emailDb.toggleRuleEnabled(1, false);

      expect(mockSet).toHaveBeenCalledWith({ isEnabled: false });
    });
  });

  describe('User Preferences', () => {
    it('should create default preferences if none exist', async () => {
      const mockSelect = vi.fn(() => Promise.resolve([]));
      const mockInsert = vi.fn(() => Promise.resolve());

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: mockSelect,
          })),
        })) as any,
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: mockInsert,
      } as any);

      const result = await emailDb.getUserPreferences(1);

      expect(mockInsert).toHaveBeenCalled();
      expect(result).toHaveProperty('inboxLayout');
    });

    it('should update user preferences', async () => {
      const mockWhere = vi.fn(() => Promise.resolve());
      const mockSet = vi.fn(() => ({ where: mockWhere }));
      vi.mocked(db.update).mockReturnValue({
        set: mockSet,
      } as any);

      await emailDb.updateUserPreferences(1, { enableAISummarization: false });

      expect(mockSet).toHaveBeenCalledWith({ enableAISummarization: false });
    });
  });

  describe('Snoozed Emails', () => {
    it('should snooze an email', async () => {
      const mockInsert = vi.fn(() => Promise.resolve());
      vi.mocked(db.insert).mockReturnValue({
        values: mockInsert,
      } as any);

      const snoozeData = {
        userId: 1,
        threadId: 123,
        gmailThreadId: 'gmail123',
        snoozeUntil: new Date(),
        reminder: true,
      };

      await emailDb.snoozeEmail(snoozeData);

      expect(mockInsert).toHaveBeenCalledWith(snoozeData);
    });

    it('should unsnooze an email', async () => {
      const mockWhere = vi.fn(() => Promise.resolve());
      vi.mocked(db.delete).mockReturnValue({
        where: mockWhere,
      } as any);

      await emailDb.unsnoozeEmail(123);

      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('Email Templates', () => {
    it('should create a template', async () => {
      const mockInsert = vi.fn(() => Promise.resolve({ insertId: 1 }));
      vi.mocked(db.insert).mockReturnValue({
        values: mockInsert,
      } as any);

      const template = {
        userId: 1,
        name: 'Meeting Follow-up',
        subject: 'Re: Meeting',
        body: 'Thank you for the meeting',
        category: 'follow_up',
      };

      const result = await emailDb.createTemplate(template as any);

      expect(mockInsert).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('should delete a template', async () => {
      const mockWhere = vi.fn(() => Promise.resolve());
      vi.mocked(db.delete).mockReturnValue({
        where: mockWhere,
      } as any);

      await emailDb.deleteTemplate(1);

      expect(mockWhere).toHaveBeenCalled();
    });
  });

  describe('Email AI Metadata', () => {
    it('should save new AI metadata', async () => {
      const mockSelect = vi.fn(() => Promise.resolve([]));
      const mockInsert = vi.fn(() => Promise.resolve({ insertId: 1 }));

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: mockSelect,
          })),
        })) as any,
      } as any);

      vi.mocked(db.insert).mockReturnValue({
        values: mockInsert,
      } as any);

      const metadata = {
        threadId: 123,
        gmailThreadId: 'gmail123',
        categorization: { category: 'main', confidence: 95 },
        priorityScore: 80,
        sentiment: 'neutral',
        summary: 'Test summary',
      };

      const result = await emailDb.saveEmailAIMetadata(metadata as any);

      expect(mockInsert).toHaveBeenCalled();
      expect(result.id).toBe(1);
    });

    it('should update existing AI metadata', async () => {
      const existingMetadata = [{ id: 1, threadId: 123 }];
      const mockSelect = vi.fn(() => Promise.resolve(existingMetadata));
      const mockWhere = vi.fn(() => Promise.resolve());
      const mockSet = vi.fn(() => ({ where: mockWhere }));

      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: mockSelect,
          })),
        })) as any,
      } as any);

      vi.mocked(db.update).mockReturnValue({
        set: mockSet,
      } as any);

      const metadata = {
        threadId: 123,
        gmailThreadId: 'gmail123',
        categorization: { category: 'main', confidence: 95 },
      };

      await emailDb.saveEmailAIMetadata(metadata as any);

      expect(mockSet).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
    });
  });
});
