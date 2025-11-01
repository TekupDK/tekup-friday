/**
 * MCP (Model Context Protocol) Client
 * Handles Gmail and Google Calendar integrations via manus-mcp-cli
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

interface MCPToolResult {
  content: Array<{
    type: string;
    text?: string;
    [key: string]: unknown;
  }>;
  isError?: boolean;
}

/**
 * Call an MCP tool via manus-mcp-cli
 */
async function callMCPTool(
  server: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<any> {
  try {
    const argsJson = JSON.stringify(args);
    const tmpFile = `/tmp/mcp-result-${Date.now()}.json`;
    const command = `MANUS_MCP_RESULT_FILEPATH=${tmpFile} manus-mcp-cli tool call ${toolName} --server ${server} --input '${argsJson}'`;
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes("Tool call completed")) {
      console.error(`MCP stderr: ${stderr}`);
    }
    
    // Read result from file
    const resultContent = fs.readFileSync(tmpFile, "utf-8");
    const result = JSON.parse(resultContent);
    
    // Clean up temp file
    fs.unlinkSync(tmpFile);
    
    return result;
  } catch (error) {
    console.error(`MCP tool call failed: ${error}`);
    throw new Error(`Failed to call MCP tool ${toolName}: ${error}`);
  }
}

/**
 * Parse MCP result to extract text content
 */
function extractTextContent(result: MCPToolResult): string {
  if (result.isError) {
    throw new Error("MCP tool returned an error");
  }
  
  const textContent = result.content
    .filter((c) => c.type === "text" && c.text)
    .map((c) => c.text)
    .join("\n");
  
  return textContent;
}

// ============= Gmail Functions =============

export interface GmailThread {
  id: string;
  subject: string;
  from: string;
  snippet: string;
  date: string;
  labels: string[];
  unread: boolean;
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
 * List Gmail threads
 */
export async function listGmailThreads(params: {
  maxResults?: number;
  query?: string;
}): Promise<GmailThread[]> {
  try {
    const result = await callMCPTool("gmail", "gmail_search_messages", {
      max_results: params.maxResults || 20,
      q: params.query || "",
    });
    
    // Check if MCP returned an error or unfinished call
    if (result.message && result.message.includes("unfinished")) {
      console.warn("Gmail MCP requires OAuth authentication");
      return [];
    }
    
    const content = extractTextContent(result);
    // Parse the JSON response from Gmail MCP
    const threads = JSON.parse(content);
    
    // Validate that threads is an array
    if (!Array.isArray(threads)) {
      console.warn("Gmail MCP returned non-array result:", threads);
      return [];
    }
    
    return threads;
  } catch (error) {
    console.error("Error listing Gmail threads:", error);
    return [];
  }
}

/**
 * Get a specific Gmail thread
 */
export async function getGmailThread(threadId: string): Promise<GmailMessage[]> {
  try {
    const result = await callMCPTool("gmail", "gmail_read_threads", {
      thread_ids: [threadId],
      include_full_messages: true,
    });
    
    const content = extractTextContent(result);
    const messages = JSON.parse(content);
    return messages;
  } catch (error) {
    console.error("Error getting Gmail thread:", error);
    return [];
  }
}

/**
 * Search Gmail
 */
export async function searchGmail(query: string, maxResults = 20): Promise<GmailThread[]> {
  return listGmailThreads({ query, maxResults });
}

/**
 * Create a draft email
 */
export async function createGmailDraft(params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}): Promise<{ draftId: string }> {
  try {
    const messages = [{
      to: [params.to],
      subject: params.subject,
      content: params.body,
      cc: params.cc ? [params.cc] : undefined,
      bcc: params.bcc ? [params.bcc] : undefined,
    }];
    const result = await callMCPTool("gmail", "gmail_send_messages", {
      messages,
    });
    
    const content = extractTextContent(result);
    const draft = JSON.parse(content);
    return draft;
  } catch (error) {
    console.error("Error creating Gmail draft:", error);
    throw error;
  }
}

// ============= Google Calendar Functions =============

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  status: string;
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
    const result = await callMCPTool("google-calendar", "google_calendar_search_events", {
      calendar_id: "primary",
      time_min: params.timeMin || new Date().toISOString(),
      time_max: params.timeMax,
      max_results: params.maxResults || 50,
    });
    
    // Check if MCP returned an error or unfinished call
    if (!result || (result.message && result.message.includes("unfinished"))) {
      console.warn("Google Calendar MCP requires OAuth authentication");
      return [];
    }
    
    const content = extractTextContent(result);
    const events = JSON.parse(content);
    
    // Validate that events is an array
    if (!Array.isArray(events)) {
      console.warn("Google Calendar MCP returned non-array result:", events);
      return [];
    }
    
    return events;
  } catch (error) {
    console.error("Error listing calendar events:", error);
    return [];
  }
}

/**
 * Create a calendar event
 */
export async function createCalendarEvent(params: {
  summary: string;
  description?: string;
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
  location?: string;
}): Promise<CalendarEvent> {
  try {
    const events = [{
      calendar_id: "primary",
      summary: params.summary,
      description: params.description,
      start_time: params.start,
      end_time: params.end,
      location: params.location,
    }];
    const result = await callMCPTool("google-calendar", "google_calendar_create_events", {
      events,
    });
    
    // Check if MCP returned an error or unfinished call
    if (!result || (result.message && result.message.includes("unfinished"))) {
      console.warn("Google Calendar MCP requires OAuth authentication");
      throw new Error("Google Calendar OAuth required. Please authenticate via MCP.");
    }
    
    const content = extractTextContent(result);
    const event = JSON.parse(content);
    return event;
  } catch (error) {
    console.error("Error creating calendar event:", error);
    throw error;
  }
}

/**
 * Check calendar availability for a given time range
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
    console.error("Error checking calendar availability:", error);
    return { available: false, conflictingEvents: [] };
  }
}

/**
 * Find free time slots in calendar
 */
export async function findFreeTimeSlots(params: {
  date: string; // YYYY-MM-DD
  duration: number; // minutes
  workingHours?: { start: number; end: number }; // 9-17 by default
}): Promise<Array<{ start: string; end: string }>> {
  const workingHours = params.workingHours || { start: 9, end: 17 };
  const date = new Date(params.date);
  
  // Get all events for the day
  const dayStart = new Date(date);
  dayStart.setHours(workingHours.start, 0, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(workingHours.end, 0, 0, 0);
  
  const events = await listCalendarEvents({
    timeMin: dayStart.toISOString(),
    timeMax: dayEnd.toISOString(),
  });
  
  // Find gaps between events
  const freeSlots: Array<{ start: string; end: string }> = [];
  let currentTime = dayStart;
  
  // Sort events by start time
  const sortedEvents = events.sort(
    (a, b) => new Date(a.start.dateTime).getTime() - new Date(b.start.dateTime).getTime()
  );
  
  for (const event of sortedEvents) {
    const eventStart = new Date(event.start.dateTime);
    const eventEnd = new Date(event.end.dateTime);
    
    // Check if there's a gap before this event
    const gapDuration = eventStart.getTime() - currentTime.getTime();
    if (gapDuration >= params.duration * 60 * 1000) {
      freeSlots.push({
        start: currentTime.toISOString(),
        end: new Date(currentTime.getTime() + params.duration * 60 * 1000).toISOString(),
      });
    }
    
    currentTime = eventEnd > currentTime ? eventEnd : currentTime;
  }
  
  // Check if there's time left at the end of the day
  const remainingTime = dayEnd.getTime() - currentTime.getTime();
  if (remainingTime >= params.duration * 60 * 1000) {
    freeSlots.push({
      start: currentTime.toISOString(),
      end: new Date(currentTime.getTime() + params.duration * 60 * 1000).toISOString(),
    });
  }
  
  return freeSlots;
}
