# Friday AI Calendar - Funktionalitet & Design

**Forfatter:** Friday AI Development Team  
**Sidste opdatering:** 2. november 2025  
**Version:** 1.0.0

---

## 📅 Oversigt

Friday AI's kalender-integration er inspireret af **Shortwave.ai's** tilgang til kalender-management, hvor fokus er på AI-assisteret booking fremfor en traditionel kalender-UI. Systemet kombinerer Google Calendar API med intelligente AI-værktøjer for at automatisere booking-processer i rengøringsvirksomheden Rendetalje.dk.

### Nøglefunktioner

- ✅ **Google Calendar Integration** - Fuld read/write adgang via Service Account
- ✅ **Timegrid Visning** - Hourly calendar view (7:00-20:00)
- ✅ **AI-Assisteret Booking** - Automatisk forslag til ledige tider
- ✅ **Event Dialog Modal** - Detaljeret event information
- ✅ **Auto-refresh** - Live opdateringer hver 30 sekunder
- ✅ **Business Rules** - Indbyggede regler for booking (MEMORY_15, MEMORY_19)

---

## 🏗️ Arkitektur & Design

### Filosofi (Inspireret af Shortwave.ai)

Friday AI følger **Shortwave.ai's design-princip**:

> "Ingen separat kalender-vindue, men dyb integration via AI Assistant"

**Forskelle fra traditionelle kalendere (Outlook/Google Calendar):**

| Traditionel Kalender        | Friday AI Kalender                       |
| --------------------------- | ---------------------------------------- |
| Klik-baseret UI for booking | AI-kommandoer ("Book møde fredag kl 14") |
| Manuel tjek af ledige tider | Automatisk availability check            |
| Separat kalender-app        | Integreret i inbox-panel                 |
| Drag-drop events            | Natural language commands                |

**Ligheder med Shortwave.ai:**

- 🤖 AI Assistant håndterer booking-logik
- 📧 Email → Calendar workflow
- 🔄 Snooze/reminder integration med datoer
- 🚫 INGEN automatiske Google Calendar invites til deltagere

---

## 🎨 UI Komponenter

### 1. Calendar Tab (`CalendarTab.tsx`)

**Placering:** InboxPanel → Calendar Tab  
**Layout:** Hourly grid calendar (7:00-20:00)

#### Visuelle Elementer

```
┌─────────────────────────────────────────┐
│  ◀ Tir 5. nov     [Today] ▶            │ ← Navigation
├─────┬───────────────────────────────────┤
│ 7:00│                                   │
│ 8:00│  ┌─────────────────────────────┐  │
│ 9:00│  │ 🏠 Flytterengøring #12      │  │ ← Event card
│10:00│  │ 10:00 - 12:00               │  │
│11:00│  └─────────────────────────────┘  │
│12:00│                                   │
│13:00│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ← Current time indicator
│     │                                   │
│20:00│                                   │
└─────┴───────────────────────────────────┘
```

#### Funktioner

**Date Navigation:**

- Prev/Next day buttons (◀ ▶)
- "Today" button - hop til i dag
- Date display i dansk format ("Tir 5. nov")

**Event Display:**

- **Positioning:** Dynamisk beregnet baseret på start/end tid
- **Height:** Proportionel til event varighed (1 time = 80px)
- **Color Coding:**
  - 🏠 Flytterengøring: `bg-red-900/80` (rødbrun)
  - Andre jobs: `bg-primary/80` (blå)
- **Hover Effect:** `hover:opacity-90`

**Current Time Indicator:**

- Orange streg med cirkel (`border-orange-500`)
- Vises kun hvis selectedDate === i dag
- Opdateres real-time

**Auto-refresh:**

```typescript
refetchInterval: 30000, // 30 sekunder
refetchIntervalInBackground: true
```

**Empty State:**

```
      🗓️
No events scheduled for this day
```

---

### 2. Event Detail Dialog

**Trigger:** Klik på event i calendar grid  
**Component:** Radix UI Dialog Modal

#### Dialog Layout

```
┌──────────────────────────────────────────┐
│  📅 Flytterengøring #12 - Mette Nielsen  │ ← Title
│  Tirsdag den 5. november 2025            │ ← Date
├──────────────────────────────────────────┤
│  🕐 Tidspunkt                            │
│     10:00 - 12:00                        │
│     Varighed: 120 minutter               │
│                                          │
│  📍 Lokation                             │
│     Vesterbrogade 12, 1620 København V   │
│                                          │
│  👤 Beskrivelse                          │
│     85m², 2 medarbejdere, 3t estimat     │
│     Thread: [THREAD_REF_123]             │
├──────────────────────────────────────────┤
│  [Luk]                    [Rediger]      │ ← Actions
└──────────────────────────────────────────┘
```

#### Dialog Felter

| Felt        | Ikon      | Data        | Format          |
| ----------- | --------- | ----------- | --------------- |
| Tidspunkt   | 🕐 Clock  | start, end  | HH:MM - HH:MM   |
| Varighed    | -         | calculated  | X minutter      |
| Lokation    | 📍 MapPin | location    | Adresse string  |
| Beskrivelse | 👤 User   | description | Multi-line text |

**Action Buttons:**

- **Luk** (`variant="outline"`) - Lukker dialog
- **Rediger** (`variant="default"`) - (Placeholder for fremtidig funktionalitet)

**Dialog State Management:**

```typescript
const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

// Open
onClick={() => setSelectedEvent(event)}

// Close
onOpenChange={(open) => !open && setSelectedEvent(null)}
```

---

## 🔌 Google Calendar API Integration

### Service Account Konfiguration

**Authentication Flow:**

```
Service Account (google-service-account.json)
    ↓
JWT Token with Domain-Wide Delegation
    ↓
Impersonate User (info@rendetalje.dk)
    ↓
Access Calendar (c_39570a852bf141658572fa37bb229c...)
```

**Environment Variables:**

```bash
GOOGLE_SERVICE_ACCOUNT_KEY='{...}'  # JSON nøgle
GOOGLE_IMPERSONATED_USER='info@rendetalje.dk'
GOOGLE_CALENDAR_ID='c_39570a852bf141658572fa37bb229c7246564a6cca47560bc66a4f9e4fec67ff@group.calendar.google.com'
```

**OAuth Scopes:**

```javascript
("https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events");
```

---

### API Functions (`google-api.ts`)

#### 1. `listCalendarEvents(params)`

**Purpose:** Hent kalender events i et tidsinterval

**Parameters:**

```typescript
{
  timeMin?: string;    // ISO 8601: "2025-11-01T00:00:00+01:00"
  timeMax?: string;    // ISO 8601: "2025-11-30T23:59:59+01:00"
  maxResults?: number; // Standard: 50
}
```

**Return:**

```typescript
CalendarEvent[] = [
  {
    id: "abc123",
    summary: "🏠 Flytterengøring #12 - Mette Nielsen",
    description: "85m², 2 medarbejdere...",
    start: "2025-11-05T10:00:00+01:00",
    end: "2025-11-05T12:00:00+01:00",
    location: "Vesterbrogade 12, 1620 København V"
  }
]
```

**Google API Call:**

```javascript
calendar.events.list({
  calendarId: CALENDAR_ID,
  timeMin: params.timeMin,
  timeMax: params.timeMax,
  maxResults: params.maxResults || 50,
  singleEvents: true, // Expand recurring events
  orderBy: "startTime", // Sort by start time
});
```

---

#### 2. `createCalendarEvent(params)`

**Purpose:** Opret nyt calendar event (KRITISK: Ingen attendees!)

**Parameters:**

```typescript
{
  summary: string;      // "🏠 Fast Rengøring #3 - Mette Nielsen"
  description?: string; // Multi-line beskrivelse
  start: string;        // ISO 8601 med timezone
  end: string;          // ISO 8601 med timezone
  location?: string;    // Adresse
}
```

**⚠️ MEMORY_19 - KRITISK REGEL:**

```javascript
// ALDRIG tilføj attendees parameter!
const event = {
  summary: params.summary,
  description: params.description,
  location: params.location,
  start: {
    dateTime: params.start,
    timeZone: "Europe/Copenhagen",
  },
  end: {
    dateTime: params.end,
    timeZone: "Europe/Copenhagen",
  },
  // ❌ INGEN attendees field!
  // Dette forhindrer automatiske Google Calendar invites
};
```

**Hvorfor ingen attendees?**

1. Google Calendar sender automatisk email invites til attendees
2. Rendetalje.dk håndterer kunderelation manuelt
3. Forhindrer spam og forvirring hos kunder
4. Booking-bekræftelse sendes via Gmail drafts i stedet

---

#### 3. `checkCalendarAvailability(params)`

**Purpose:** Tjek om et tidspunkt er ledigt

**Parameters:**

```typescript
{
  start: string; // ISO 8601
  end: string; // ISO 8601
}
```

**Return:**

```typescript
{
  available: boolean;             // true hvis ledigt
  conflictingEvents: CalendarEvent[]; // Events i samme tidsrum
}
```

**Logik:**

```javascript
const events = await listCalendarEvents({ timeMin: start, timeMax: end });
return {
  available: events.length === 0,
  conflictingEvents: events,
};
```

---

#### 4. `findFreeSlots(params)`

**Purpose:** Find ledige tidspunkter på en dag

**Parameters:**

```typescript
{
  startDate: string; // "2025-11-05T00:00:00+01:00"
  endDate: string; // "2025-11-05T23:59:59+01:00"
  durationHours: number; // 1.5, 2, 2.5, 3 (RUNDE timer)
}
```

**Algorithm:**

```
1. Hent alle events i datointervallet
2. Sorter events efter start tid
3. Find gaps mellem events
4. Filtrer gaps der er >= durationHours
5. Returner ledige slots som [{ start, end }]
```

**Return:**

```typescript
[
  { start: "2025-11-05T09:00:00+01:00", end: "2025-11-05T11:00:00+01:00" },
  { start: "2025-11-05T14:00:00+01:00", end: "2025-11-05T16:00:00+01:00" },
];
```

---

## 🤖 AI Tools & Integration

### Friday AI Calendar Tools

Friday AI har **3 dedikerede calendar tools** tilgængelig:

#### Tool 1: `list_calendar_events`

**Beskrivelse:** "Hent kalender events. Brug dette til at tjekke ledige tider før du foreslår booking."

**Parameters:**

```javascript
{
  timeMin: "ISO 8601 format (f.eks. '2025-11-01T00:00:00+01:00')",
  timeMax: "ISO 8601 format",
  maxResults: "Maksimalt antal events (standard: 50)"
}
```

**AI Use Cases:**

- ✅ "Hvad har jeg i kalenderen i morgen?"
- ✅ "Er der ledigt fredag eftermiddag?"
- ✅ "Vis mine bookings næste uge"

---

#### Tool 2: `find_free_calendar_slots`

**Beskrivelse:** "Find ledige tider i kalenderen. Brug dette til at foreslå konkrete tider til kunder."

**Parameters:**

```javascript
{
  date: "YYYY-MM-DD format",
  duration: "Varighed i timer (RUNDE timer: 1, 1.5, 2, 2.5, 3)",
  workingHours: {
    start: 8,  // Arbejdstid start (0-23)
    end: 17    // Arbejdstid slut (0-23)
  }
}
```

**AI Use Cases:**

- ✅ "Hvad er ledigt onsdag for en 2-timers rengøring?"
- ✅ "Find 3-timers slot næste mandag"
- ✅ "Foreslå tidspunkter til Mette Nielsen (3t job)"

---

#### Tool 3: `create_calendar_event`

**Beskrivelse:** "Opret kalender event. KRITISK: ALDRIG brug 'attendees' parameter!"

**Parameters:**

```javascript
{
  summary: "Event titel (format: '🏠 Fast Rengøring #3 - Mette Nielsen')",
  description: "Event beskrivelse med adresse, telefon, email, aftale detaljer",
  start: "ISO 8601 format med timezone: '2025-11-05T10:00:00+01:00'",
  end: "ISO 8601 format med timezone: '2025-11-05T13:00:00+01:00'",
  location: "Kundens adresse"
}
```

**AI Use Cases:**

- ✅ "Book flytterengøring hos Mette Nielsen fredag kl 10-12"
- ✅ "Lav booking for Florian Keppeler næste onsdag kl 14"
- ✅ "Opret event for 3-timers rengøring hos [kunde]"

---

## 📋 Business Rules & Workflows

### MEMORY_19: Ingen Attendees (Kritisk!)

**Regel:**

> ❌ ALDRIG brug 'attendees' parameter i createCalendarEvent()
>
> Dette forårsager automatiske Google Calendar invitationer til kunder

**Implementation:**

```javascript
// ✅ KORREKT
const event = {
  summary: "🏠 Flytterengøring #12 - Mette Nielsen",
  start: { dateTime: "2025-11-05T10:00:00+01:00", timeZone: "Europe/Copenhagen" },
  end: { dateTime: "2025-11-05T12:00:00+01:00", timeZone: "Europe/Copenhagen" },
  description: "...",
  // INGEN attendees field
};

// ❌ FORKERT
const event = {
  ...
  attendees: [{ email: "kunde@email.dk" }], // Dette sender Google invite!
};
```

**Hvorfor denne regel?**

1. **Google sender automatisk invites** hvis attendees er defineret
2. **Rendetalje.dk sender manuel booking-bekræftelse** via Gmail drafts
3. **Forhindrer spam** og multiple notifikationer til kunder
4. **Giver kontrol** over kommunikationen med kunder

**Verificering:**

```typescript
// AI verificerer altid efter booking
message: `✅ **VERIFICERET:** Ingen attendees tilføjet (ingen automatiske invites sendt)`;
```

---

### MEMORY_15: Runde Timer

**Regel:**

> ✅ ALTID brug runde tider: Hele eller halve timer (10:00, 10:30, 11:00)

**Gyldige Tider:**

```
✅ 10:00, 10:30, 11:00, 11:30, 12:00
❌ 10:15, 10:45, 11:20, 11:50
```

**AI Logik:**

```javascript
// Round ned til nærmeste halve time
const roundedMinute = Math.floor(minute / 30) * 30;

// Eksempel:
// 10:17 → 10:00
// 10:42 → 10:30
// 10:59 → 10:30
```

**Hvorfor denne regel?**

1. **Professionel planlægning** - Kunder forventer hele/halve timer
2. **Buffer tid** - Giver plads til transport mellem jobs
3. **Kalender æstetik** - Pæn visning i hourly grid
4. **Branchestandard** - Håndværkere booker sjældent på kvarter

---

### Flytterengøring Workflow

**Special Rules for Flytterengøring:**

1. **2 Medarbejdere Standard:**

   ```
   Estimat: 3 timer arbejde
   → Booking: 1.5 timer i kalenderen (3t ÷ 2 medarbejdere)
   ```

2. **Event Format:**

   ```
   summary: "🏠 Flytterengøring #12 - Mette Nielsen"
   description: "85m², 2 medarbejdere, 3t estimat\nThread: [THREAD_REF_123]"
   ```

3. **Email → Calendar Flow:**
   ```
   1. Modtag flytterengøring email
   2. AI læser email tråd (get_threads)
   3. AI verificerer ledige tider (list_calendar_events)
   4. AI opretter event (create_calendar_event)
   5. AI opdaterer email label → "I kalender"
   6. AI sender booking-bekræftelse via Gmail draft
   ```

---

## 🔄 Data Flows

### 1. Calendar View Load

```
User navigates to Calendar Tab
    ↓
tRPC: inbox.calendar.list.useQuery({ timeMin, timeMax })
    ↓
Backend: routers.ts → listCalendarEvents()
    ↓
Google API: calendar.events.list()
    ↓
Return: CalendarEvent[]
    ↓
Frontend: Filter by selectedDate
    ↓
Render: Hourly grid with events
    ↓
Auto-refresh every 30s
```

---

### 2. AI-Assisted Booking

```
User: "Book møde med Mette fredag kl 14"
    ↓
AI: Parse intent → book_meeting
    ↓
AI: Call list_calendar_events({ timeMin: friday 00:00, timeMax: friday 23:59 })
    ↓
AI: Check availability at 14:00
    ↓
AI: Call create_calendar_event({
      summary: "🏠 Rengøring - Mette Nielsen",
      start: "2025-11-08T14:00:00+01:00",
      end: "2025-11-08T16:00:00+01:00",
      // NO attendees!
    })
    ↓
Google Calendar: Event created
    ↓
AI: Return success message with verification
    ↓
Frontend: Calendar Tab auto-refreshes
    ↓
User: Sees new event in calendar
```

---

### 3. Find Free Slots

```
User: "Hvad er ledigt onsdag?"
    ↓
AI: Call find_free_calendar_slots({
      date: "2025-11-06",
      duration: 2,
      workingHours: { start: 8, end: 17 }
    })
    ↓
Backend: listCalendarEvents(wednesday 00:00 - 23:59)
    ↓
Algorithm: Find gaps >= 2 hours
    ↓
Return: [
      { start: "09:00", end: "11:00" },
      { start: "14:00", end: "16:00" }
    ]
    ↓
AI: Format response:
    "Ledige tider onsdag:
     - 09:00-11:00 (2t)
     - 14:00-16:00 (2t)
     Hvilken tid passer Mette?"
```

---

## 🎯 Sammenligning: Friday AI vs Shortwave.ai

| Feature                | Shortwave.ai             | Friday AI                         |
| ---------------------- | ------------------------ | --------------------------------- |
| **Calendar UI**        | Ingen separat vindue     | Hourly grid i Inbox               |
| **Booking Metode**     | 100% AI kommandoer       | AI + Visual calendar              |
| **Google Integration** | Via AI Assistant         | Via Service Account + AI          |
| **Attendees**          | ❌ Ingen auto-invites    | ❌ Ingen auto-invites (MEMORY_19) |
| **Date Picker**        | Snooze UI ("Friday 2pm") | AI natural language               |
| **Event Display**      | Ingen visual             | Hourly grid med farver            |
| **Auto-refresh**       | ✅ Real-time             | ✅ 30s intervals                  |
| **Business Rules**     | ❌ Generel               | ✅ 25 MEMORY rules                |

---

## 🚀 Best Practices

### For Brugere

**✅ Effektiv AI Booking:**

```
Gør dette:
✅ "Hvad er ledigt fredag?"
✅ "Book Mette Nielsen onsdag kl 14"
✅ "Flyt mødet til næste mandag"

Undgå dette:
❌ "Book på et tidspunkt der passer"
❌ "Find en dag"
```

**✅ Specificer Detaljer:**

```
God kommando:
"Book 3-timers flytterengøring hos Mette Nielsen,
Vesterbrogade 12, fredag kl 10"

Mangler detaljer:
"Book Mette"
```

---

### For Udviklere

**✅ Calendar Event Creation:**

```typescript
// KORREKT - Følger alle regler
await createCalendarEvent({
  summary: "🏠 Flytterengøring #12 - Mette Nielsen",
  description: "85m², 2 medarbejdere, 3t estimat\nThread: [THREAD_123]",
  start: "2025-11-05T10:00:00+01:00", // Round time
  end: "2025-11-05T12:00:00+01:00", // Round time
  location: "Vesterbrogade 12, 1620 København V",
  // NO attendees!
});
```

**✅ Availability Check:**

```typescript
// ALTID tjek før booking
const events = await listCalendarEvents({
  timeMin: proposedStart,
  timeMax: proposedEnd,
});

if (events.length > 0) {
  // Konflikt - find alternativ tid
  const freeSlots = await findFreeSlots({
    date: targetDate,
    duration: 2,
  });
}
```

**✅ Error Handling:**

```typescript
try {
  await createCalendarEvent(params);
} catch (error) {
  console.error("Calendar API error:", error);
  // Fallback: Notify user to book manually
  return "Kunne ikke oprette booking. Tjek Google Calendar manuelt.";
}
```

---

## ⚠️ Begrænsninger & Limitationer

### Google Calendar API Rate Limits

**Quota:**

- 500 queries per 100 seconds per user
- 1,000,000 queries per day

**Friday AI Mitigation:**

- ✅ Auto-refresh kun hver 30s (i stedet for real-time)
- ✅ Cache emails i 5 minutter
- ✅ Batch queries hvor muligt

**Hvad hvis rate limit nås?**

```typescript
if (error?.code === 429) {
  // Fallback til cached data
  return expiredCache.data;
}
```

---

### UI Limitationer

**Ingen Features (endnu):**

- ❌ Drag-drop events
- ❌ Multi-day view
- ❌ Week/month view
- ❌ Recurring events UI
- ❌ Event editing i UI (kun via AI)

**Hvorfor?**

- 🎯 Fokus på AI-first workflow
- 🎯 Simplicity over features
- 🎯 Rendetalje.dk behøver ikke avanceret UI

---

## 📚 Relaterede Dokumenter

- **[API_REFERENCE.md](./API_REFERENCE.md)** - Komplet API dokumentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System arkitektur
- **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - Development guidelines
- **[README.md](../README.md)** - Project overview

---

## 🔍 Eksempel Use Cases

### Use Case 1: Simpel Booking

**Input:** "Book Mette Nielsen i morgen kl 10"

**AI Flow:**

1. Parse intent: `book_meeting`
2. Extract: participant="Mette Nielsen", date="i morgen", time="kl 10"
3. Call `list_calendar_events(tomorrow 00:00-23:59)`
4. Check availability at 10:00
5. Call `create_calendar_event({
  summary: "🏠 Rengøring - Mette Nielsen",
  start: "2025-11-06T10:00:00+01:00",
  end: "2025-11-06T12:00:00+01:00"
})`
6. Return: "✅ Booking oprettet: Mette Nielsen - Rengøring\n📅 Onsdag 6. november 2025\n⏰ 10:00 - 12:00"

---

### Use Case 2: Find Ledig Tid

**Input:** "Hvad er ledigt fredag til en 3-timers rengøring?"

**AI Flow:**

1. Parse: date="fredag", duration=3 timer
2. Call `find_free_calendar_slots({
  date: "2025-11-08",
  duration: 3,
  workingHours: { start: 8, end: 17 }
})`
3. Return gaps: [
   { start: "08:00", end: "11:00" },
   { start: "13:00", end: "16:00" }
   ]
4. AI formats: "Ledige tider fredag:\n- 08:00-11:00 (3t)\n- 13:00-16:00 (3t)\n\nHvilken tid passer kunden?"

---

### Use Case 3: Flytterengøring med 2 Medarbejdere

**Input:** Email fra kunde: "Flytter d. 8/11, lejlighed er 85m²"

**AI Flow:**

1. Detect: flytterengøring intent
2. Calculate: 85m² = ~3 timers arbejde
3. Adjust for 2 workers: 3t ÷ 2 = 1.5t booking
4. Call `find_free_calendar_slots({ date: "2025-11-08", duration: 1.5 })`
5. Suggest times to user
6. User confirms: "Book kl 10"
7. Call `create_calendar_event({
  summary: "🏠 Flytterengøring #12 - [Kunde]",
  description: "85m², 2 medarbejdere, 3t estimat\nThread: [REF]",
  start: "2025-11-08T10:00:00+01:00",
  end: "2025-11-08T11:30:00+01:00"
})`

---

## 🏁 Konklusion

Friday AI's kalender-integration kombinerer det bedste fra to verdener:

1. **Shortwave.ai's AI-first approach** - Natural language booking uden klik
2. **Traditional calendar UI** - Visual overview og manuelt override

**Nøgle-takeaways:**

- ✅ AI Assistant håndterer 90% af bookings
- ✅ Visual calendar til oversight og verification
- ✅ MEMORY_19 forhindrer spam (ingen auto-invites)
- ✅ Google Calendar API via Service Account
- ✅ Auto-refresh for real-time opdateringer
- ✅ Business rules indbygget i AI prompt

**Fremtidige forbedringer:**

- 🔮 Recurring events support
- 🔮 Multi-calendar view
- 🔮 Team calendar (flere medarbejdere)
- 🔮 SMS notifications ved booking

---

**Dokumentet er opdateret med alle detaljer fra `CalendarTab.tsx`, `google-api.ts`, `friday-tools.ts`, og `intent-actions.ts`**
