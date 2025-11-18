/**
 * Google API Mocks (Gmail + Calendar)
 * Mock responses for Google Workspace APIs
 */

import { vi } from "vitest";

/**
 * Mock Gmail thread
 */
export const mockGmailThread = {
  id: "thread-123",
  snippet: "Hej, jeg vil gerne have et tilbud på flytterengøring...",
  messages: [
    {
      id: "msg-123",
      threadId: "thread-123",
      labelIds: ["INBOX", "UNREAD"],
      payload: {
        headers: [
          { name: "From", value: "Test Hansen <test@example.dk>" },
          { name: "To", value: "kontakt@rendetalje.dk" },
          { name: "Subject", value: "Forespørgsel om flytterengøring" },
          { name: "Date", value: "Mon, 18 Nov 2025 10:00:00 +0100" },
        ],
        body: {
          data: Buffer.from(
            "Hej,\n\nJeg skal flytte fra min lejlighed om 2 uger og har brug for hjælp til flytterengøring.\n\nLejligheden er 75 m2 med 3 værelser.\n\nMvh,\nTest Hansen"
          ).toString("base64"),
        },
      },
    },
  ],
};

/**
 * Mock Gmail search results
 */
export const mockGmailSearchResults = {
  messages: [
    { id: "msg-123", threadId: "thread-123" },
    { id: "msg-124", threadId: "thread-124" },
  ],
  resultSizeEstimate: 2,
};

/**
 * Mock Gmail draft
 */
export const mockGmailDraft = {
  id: "draft-789",
  message: {
    id: "msg-draft-789",
    threadId: "thread-123",
    labelIds: ["DRAFT"],
    payload: {
      headers: [
        { name: "To", value: "test@example.dk" },
        { name: "Subject", value: "Re: Forespørgsel om flytterengøring" },
      ],
    },
  },
};

/**
 * Mock Calendar event
 */
export const mockCalendarEvent = {
  id: "event-456",
  summary: "🏠 Flytterengøring - Test Hansen",
  description: "Flytterengøring for Test Hansen\n\n75 m2 lejlighed\n3 værelser",
  start: {
    dateTime: "2025-11-20T10:00:00+01:00",
    timeZone: "Europe/Copenhagen",
  },
  end: {
    dateTime: "2025-11-20T13:00:00+01:00",
    timeZone: "Europe/Copenhagen",
  },
  location: "Testvej 123, 2000 Frederiksberg",
  attendees: [], // MEMORY_19: NEVER add attendees
  status: "confirmed",
};

/**
 * Mock Calendar free/busy response
 */
export const mockCalendarFreeBusy = {
  calendars: {
    "primary": {
      busy: [
        {
          start: "2025-11-19T09:00:00+01:00",
          end: "2025-11-19T11:00:00+01:00",
        },
      ],
    },
  },
};

/**
 * Mock Gmail API client
 */
export const mockGmailAPI = {
  users: {
    messages: {
      list: vi.fn().mockResolvedValue({
        data: mockGmailSearchResults,
      }),
      get: vi.fn().mockResolvedValue({
        data: mockGmailThread.messages[0],
      }),
    },
    threads: {
      get: vi.fn().mockResolvedValue({
        data: mockGmailThread,
      }),
      list: vi.fn().mockResolvedValue({
        data: {
          threads: [{ id: "thread-123" }, { id: "thread-124" }],
        },
      }),
    },
    drafts: {
      create: vi.fn().mockResolvedValue({
        data: mockGmailDraft,
      }),
    },
  },
};

/**
 * Mock Calendar API client
 */
export const mockCalendarAPI = {
  events: {
    list: vi.fn().mockResolvedValue({
      data: {
        items: [mockCalendarEvent],
      },
    }),
    get: vi.fn().mockResolvedValue({
      data: mockCalendarEvent,
    }),
    insert: vi.fn().mockImplementation((params) => {
      // MEMORY_19: Verify NO attendees are added
      if (params.requestBody?.attendees && params.requestBody.attendees.length > 0) {
        throw new Error("MEMORY_19 VIOLATION: Attendees should NEVER be added!");
      }

      return Promise.resolve({
        data: {
          ...mockCalendarEvent,
          ...params.requestBody,
          attendees: [], // Force empty attendees
        },
      });
    }),
    update: vi.fn().mockResolvedValue({
      data: mockCalendarEvent,
    }),
  },
  freebusy: {
    query: vi.fn().mockResolvedValue({
      data: mockCalendarFreeBusy,
    }),
  },
};

/**
 * Helper: Check if time slot is available
 */
export function isTimeSlotAvailable(startTime: string, endTime: string): boolean {
  const busyPeriods = mockCalendarFreeBusy.calendars.primary.busy;

  for (const busy of busyPeriods) {
    if (
      (startTime >= busy.start && startTime < busy.end) ||
      (endTime > busy.start && endTime <= busy.end)
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Helper: Verify round hours (MEMORY_15)
 */
export function isRoundHour(timeString: string): boolean {
  const time = new Date(timeString);
  const minutes = time.getMinutes();

  // Only 00 or 30 minutes allowed
  return minutes === 0 || minutes === 30;
}
