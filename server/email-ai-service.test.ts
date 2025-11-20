import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categorizeEmail, generateSmartReplies, extractActionItems, analyzeSentiment } from './email-ai-service';
import * as emailDb from './email-db';

// Mock the database functions
vi.mock('./email-db', () => ({
  getEmailAIMetadata: vi.fn(),
  saveEmailAIMetadata: vi.fn(),
}));

// Mock the LLM call
vi.mock('./_core/llm', () => ({
  callLLM: vi.fn(),
}));

describe('Email AI Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('categorizeEmail', () => {
    it('should return cached result when available', async () => {
      const cachedMetadata = {
        id: 1,
        threadId: 123,
        gmailThreadId: 'gmail123',
        categorization: { category: 'main', confidence: 95 },
        priorityScore: 80,
        sentiment: 'neutral',
        summary: 'Test summary',
        actionItems: [],
        keyTopics: ['topic1'],
        suggestedLabels: ['label1'],
      };

      vi.mocked(emailDb.getEmailAIMetadata).mockResolvedValue(cachedMetadata as any);

      const result = await categorizeEmail({
        from: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test body',
        snippet: 'Test snippet',
        threadId: 123,
        useCache: true,
      });

      expect(result.category).toBe('main');
      expect(result.confidence).toBe(95);
      expect(emailDb.getEmailAIMetadata).toHaveBeenCalledWith(123);
    });

    it('should use fallback categorization on error', async () => {
      const { callLLM } = await import('./_core/llm');
      vi.mocked(callLLM).mockRejectedValue(new Error('API error'));

      const result = await categorizeEmail({
        from: 'newsletter@example.com',
        subject: 'Special Offer - Save 50%',
        body: 'Unsubscribe here',
        snippet: 'Special offer',
      });

      expect(result.category).toBe('promotions');
      expect(result.confidence).toBeLessThan(50);
    });

    it('should categorize calendar invites correctly', async () => {
      const { callLLM } = await import('./_core/llm');
      vi.mocked(callLLM).mockRejectedValue(new Error('API error'));

      const result = await categorizeEmail({
        from: 'calendar@example.com',
        subject: 'Meeting Invitation: Team Sync',
        body: 'Join us on Zoom for a meeting',
        snippet: 'Meeting invitation',
      });

      expect(result.category).toBe('calendar');
    });

    it('should categorize social notifications correctly', async () => {
      const { callLLM } = await import('./_core/llm');
      vi.mocked(callLLM).mockRejectedValue(new Error('API error'));

      const result = await categorizeEmail({
        from: 'notifications@facebook.com',
        subject: 'You have new notifications',
        body: 'Someone liked your post',
        snippet: 'New notification',
      });

      expect(result.category).toBe('social');
    });

    it('should save result to cache when threadId provided', async () => {
      const { callLLM } = await import('./_core/llm');
      vi.mocked(callLLM).mockResolvedValue(JSON.stringify({
        category: 'main',
        confidence: 90,
        priorityScore: 75,
        sentiment: 'positive',
        summary: 'Important email',
        actionItems: [],
        keyTopics: [],
        suggestedLabels: [],
      }));

      vi.mocked(emailDb.getEmailAIMetadata).mockResolvedValue(null);

      await categorizeEmail({
        from: 'boss@company.com',
        subject: 'Important Project Update',
        body: 'We need to discuss the project',
        snippet: 'Project update',
        threadId: 456,
        gmailThreadId: 'gmail456',
      });

      expect(emailDb.saveEmailAIMetadata).toHaveBeenCalled();
    });
  });

  describe('generateSmartReplies', () => {
    it('should generate three replies with different tones', async () => {
      const { callLLM } = await import('./_core/llm');
      vi.mocked(callLLM).mockResolvedValue(JSON.stringify([
        { text: 'Thank you for your email', tone: 'professional' },
        { text: 'Thanks for reaching out', tone: 'casual' },
        { text: 'I appreciate your message', tone: 'formal' },
      ]));

      const result = await generateSmartReplies({
        from: 'client@example.com',
        subject: 'Question about project',
        body: 'Can you help with this?',
      });

      expect(result).toHaveLength(3);
      expect(result[0].tone).toBeDefined();
    });

    it('should return fallback replies on error', async () => {
      const { callLLM } = await import('./_core/llm');
      vi.mocked(callLLM).mockRejectedValue(new Error('API error'));

      const result = await generateSmartReplies({
        from: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
      });

      expect(result).toHaveLength(3);
      expect(result.some(r => r.tone === 'professional')).toBe(true);
    });
  });

  describe('extractActionItems', () => {
    it('should extract action items from email body', async () => {
      const { callLLM } = await import('./_core/llm');
      vi.mocked(callLLM).mockResolvedValue(JSON.stringify([
        { text: 'Review proposal', deadline: '2025-12-01' },
        { text: 'Send feedback' },
      ]));

      const result = await extractActionItems('Please review the proposal by Dec 1 and send feedback');

      expect(result).toHaveLength(2);
      expect(result[0].text).toContain('Review');
      expect(result[0].deadline).toBeDefined();
    });

    it('should return empty array on error', async () => {
      const { callLLM } = await import('./_core/llm');
      vi.mocked(callLLM).mockRejectedValue(new Error('API error'));

      const result = await extractActionItems('No action items here');

      expect(result).toEqual([]);
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment correctly', async () => {
      const { callLLM } = await import('./_core/llm');
      vi.mocked(callLLM).mockResolvedValue(JSON.stringify({
        sentiment: 'positive',
        score: 0.8,
        isUrgent: false,
      }));

      const result = await analyzeSentiment('Thank you so much! This is great!');

      expect(result.sentiment).toBe('positive');
      expect(result.score).toBeGreaterThan(0);
    });

    it('should detect urgent messages', async () => {
      const { callLLM } = await import('./_core/llm');
      vi.mocked(callLLM).mockResolvedValue(JSON.stringify({
        sentiment: 'urgent',
        score: 0.9,
        isUrgent: true,
      }));

      const result = await analyzeSentiment('URGENT: Need response ASAP!');

      expect(result.sentiment).toBe('urgent');
      expect(result.isUrgent).toBe(true);
    });

    it('should return neutral on error', async () => {
      const { callLLM } = await import('./_core/llm');
      vi.mocked(callLLM).mockRejectedValue(new Error('API error'));

      const result = await analyzeSentiment('Test message');

      expect(result.sentiment).toBe('neutral');
      expect(result.score).toBe(0.5);
    });
  });
});
