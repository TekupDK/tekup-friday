/**
 * Google API Client with Service Account Authentication
 * 
 * This module provides direct access to Gmail and Google Calendar APIs
 * using service account credentials with domain-wide delegation.
 */

import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

// Service Account Configuration
const SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const IMPERSONATED_USER = process.env.GOOGLE_IMPERSONATED_USER || 'info@rendetalje.dk';
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com';

// OAuth Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Create authenticated JWT client with domain-wide delegation
 */
async function getAuthClient(): Promise<JWT> {
  // Try to load from JSON file first
  let credentials;
  
  try {
    const { readFileSync, existsSync } = await import('fs');
    const { join } = await import('path');
    const credentialsPath = join(process.cwd(), 'google-service-account.json');
    
    if (existsSync(credentialsPath)) {
      credentials = JSON.parse(readFileSync(credentialsPath, 'utf8'));
    } else if (SERVICE_ACCOUNT_KEY) {
      credentials = JSON.parse(SERVICE_ACCOUNT_KEY);
    } else {
      throw new Error('Google Service Account credentials not found');
    }
  } catch (error) {
    console.error('Error loading Google Service Account credentials:', error);
    throw new Error('Invalid Google Service Account configuration');
  }

  const client = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
    subject: IMPERSONATED_USER, // Impersonate this user
  });

  return client;
}

// ============================================================================
// GMAIL API
// ============================================================================

export interface GmailThread {
  id: string;
  snippet: string;
  messages: GmailMessage[];
}

export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
}

/**
 * Search Gmail threads
 */
export async function searchGmailThreads(params: {
  query: string;
  maxResults?: number;
}): Promise<GmailThread[]> {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const response = await gmail.users.threads.list({
      userId: 'me',
      q: params.query,
      maxResults: params.maxResults || 10,
    });

    if (!response.data.threads) {
      return [];
    }

    // Fetch full thread details
    const threads: GmailThread[] = [];
    for (const thread of response.data.threads) {
      if (!thread.id) continue;

      const threadDetail = await gmail.users.threads.get({
        userId: 'me',
        id: thread.id,
      });

      const messages: GmailMessage[] = [];
      if (threadDetail.data.messages) {
        for (const msg of threadDetail.data.messages) {
          const headers = msg.payload?.headers || [];
          const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
          const toHeader = headers.find(h => h.name?.toLowerCase() === 'to');
          const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
          const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date');

          // Extract body
          let body = '';
          if (msg.payload?.body?.data) {
            body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
          } else if (msg.payload?.parts) {
            const textPart = msg.payload.parts.find(p => p.mimeType === 'text/plain');
            if (textPart?.body?.data) {
              body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
            }
          }

          messages.push({
            id: msg.id || '',
            threadId: msg.threadId || '',
            from: fromHeader?.value || '',
            to: toHeader?.value || '',
            subject: subjectHeader?.value || '',
            body: body.substring(0, 500), // Limit body length
            date: dateHeader?.value || '',
          });
        }
      }

      threads.push({
        id: thread.id,
        snippet: threadDetail.data.snippet || '',
        messages,
      });
    }

    return threads;
  } catch (error) {
    console.error('Error searching Gmail:', error);
    throw error;
  }
}

/**
 * Get a single Gmail thread by ID
 */
export async function getGmailThread(threadId: string): Promise<GmailThread | null> {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    const threadDetail = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
    });

    const messages: GmailMessage[] = [];
    if (threadDetail.data.messages) {
      for (const msg of threadDetail.data.messages) {
        const headers = msg.payload?.headers || [];
        const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
        const toHeader = headers.find(h => h.name?.toLowerCase() === 'to');
        const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
        const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date');

        let body = '';
        if (msg.payload?.body?.data) {
          body = Buffer.from(msg.payload.body.data, 'base64').toString('utf-8');
        } else if (msg.payload?.parts) {
          const textPart = msg.payload.parts.find(p => p.mimeType === 'text/plain');
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          }
        }

        messages.push({
          id: msg.id || '',
          threadId: msg.threadId || '',
          from: fromHeader?.value || '',
          to: toHeader?.value || '',
          subject: subjectHeader?.value || '',
          body,
          date: dateHeader?.value || '',
        });
      }
    }

    return {
      id: threadId,
      snippet: threadDetail.data.snippet || '',
      messages,
    };
  } catch (error) {
    console.error('Error getting Gmail thread:', error);
    return null;
  }
}

/**
 * Create a draft email
 */
export async function createGmailDraft(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ id: string; message: string }> {
  try {
    const auth = await getAuthClient();
    const gmail = google.gmail({ version: 'v1', auth });

    // Create email in RFC 2822 format
    const email = [
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      params.body,
    ].join('\n');

    const encodedEmail = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: encodedEmail,
        },
      },
    });

    return {
      id: response.data.id || '',
      message: 'Draft created successfully',
    };
  } catch (error) {
    console.error('Error creating Gmail draft:', error);
    throw error;
  }
}

// ============================================================================
// GOOGLE CALENDAR API
// ============================================================================

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}

/**
 * List calendar events
 */
export async function listCalendarEvents(params: {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}): Promise<CalendarEvent[]> {
  try {
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const response = await calendar.events.list({
      calendarId: CALENDAR_ID,
      timeMin: params.timeMin || new Date().toISOString(),
      timeMax: params.timeMax,
      maxResults: params.maxResults || 50,
      singleEvents: true,
      orderBy: 'startTime',
    });

    if (!response.data.items) {
      return [];
    }

    return response.data.items.map(event => ({
      id: event.id || '',
      summary: event.summary || '',
      description: event.description || undefined,
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      location: event.location || undefined,
    }));
  } catch (error) {
    console.error('Error listing calendar events:', error);
    return [];
  }
}

/**
 * Create a calendar event
 * CRITICAL: NEVER add attendees parameter (MEMORY_19)
 */
export async function createCalendarEvent(params: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
}): Promise<CalendarEvent> {
  try {
    const auth = await getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    // CRITICAL: NO attendees parameter!
    const event = {
      summary: params.summary,
      description: params.description,
      location: params.location,
      start: {
        dateTime: params.start,
        timeZone: 'Europe/Copenhagen',
      },
      end: {
        dateTime: params.end,
        timeZone: 'Europe/Copenhagen',
      },
      // NO attendees field - this prevents automatic email invites
    };

    const response = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: event,
    });

    return {
      id: response.data.id || '',
      summary: response.data.summary || '',
      description: response.data.description || undefined,
      start: response.data.start?.dateTime || response.data.start?.date || '',
      end: response.data.end?.dateTime || response.data.end?.date || '',
      location: response.data.location || undefined,
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

/**
 * Check calendar availability
 */
export async function checkCalendarAvailability(params: {
  start: string;
  end: string;
}): Promise<{ available: boolean; conflictingEvents: CalendarEvent[] }> {
  try {
    const events = await listCalendarEvents({
      timeMin: params.start,
      timeMax: params.end,
    });

    return {
      available: events.length === 0,
      conflictingEvents: events,
    };
  } catch (error) {
    console.error('Error checking calendar availability:', error);
    return { available: false, conflictingEvents: [] };
  }
}

/**
 * Find free time slots
 */
export async function findFreeSlots(params: {
  startDate: string;
  endDate: string;
  durationHours: number;
}): Promise<{ start: string; end: string }[]> {
  try {
    const events = await listCalendarEvents({
      timeMin: params.startDate,
      timeMax: params.endDate,
    });

    // Simple algorithm: find gaps between events
    const freeSlots: { start: string; end: string }[] = [];
    const duration = params.durationHours * 60 * 60 * 1000; // Convert to milliseconds

    // Sort events by start time
    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    let currentTime = new Date(params.startDate);
    const endTime = new Date(params.endDate);

    for (const event of events) {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);

      // Check if there's a gap before this event
      if (eventStart.getTime() - currentTime.getTime() >= duration) {
        freeSlots.push({
          start: currentTime.toISOString(),
          end: new Date(currentTime.getTime() + duration).toISOString(),
        });
      }

      currentTime = eventEnd;
    }

    // Check if there's time after the last event
    if (endTime.getTime() - currentTime.getTime() >= duration) {
      freeSlots.push({
        start: currentTime.toISOString(),
        end: new Date(currentTime.getTime() + duration).toISOString(),
      });
    }

    return freeSlots;
  } catch (error) {
    console.error('Error finding free slots:', error);
    return [];
  }
}
