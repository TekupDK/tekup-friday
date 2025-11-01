/**
 * Friday AI Tool Definitions
 * Defines all available tools/functions that Friday can call
 */

export const FRIDAY_TOOLS = [
  // Gmail Tools
  {
    type: "function" as const,
    function: {
      name: "search_gmail",
      description: "Søg i Gmail efter emails baseret på søgekriterier. Brug dette til at finde leads, kunde emails, eller tidligere kommunikation.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Gmail søgequery (f.eks. 'from:kunde@example.com' eller 'subject:rengøring' eller 'after:2025/10/01')",
          },
          maxResults: {
            type: "number",
            description: "Maksimalt antal resultater at returnere (standard: 20)",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_gmail_thread",
      description: "Hent fuld email tråd med alle beskeder. Brug dette til at læse email indhold før du svarer eller opretter faktura.",
      parameters: {
        type: "object",
        properties: {
          threadId: {
            type: "string",
            description: "Gmail thread ID",
          },
        },
        required: ["threadId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_gmail_draft",
      description: "Opret et email udkast i Gmail. Brug dette til at forberede svar til kunder. ALDRIG send direkte - opret altid udkast først.",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            description: "Modtagers email adresse",
          },
          subject: {
            type: "string",
            description: "Email emne",
          },
          body: {
            type: "string",
            description: "Email indhold (kan være HTML eller plain text)",
          },
          cc: {
            type: "string",
            description: "CC email adresser (kommasepareret)",
          },
        },
        required: ["to", "subject", "body"],
      },
    },
  },

  // Billy Invoice Tools
  {
    type: "function" as const,
    function: {
      name: "list_billy_invoices",
      description: "Hent liste over fakturaer fra Billy. Brug dette til at se eksisterende fakturaer.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_billy_customer",
      description: "Søg efter kunde i Billy baseret på email adresse. Brug dette før du opretter ny faktura for at finde customer ID.",
      parameters: {
        type: "object",
        properties: {
          email: {
            type: "string",
            description: "Kundens email adresse",
          },
        },
        required: ["email"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_billy_invoice",
      description: "Opret ny faktura i Billy. VIGTIGT: Tjek altid om kunde eksisterer først med search_billy_customer. Brug product IDs: REN-001 (Fast), REN-002 (Hoved), REN-003 (Flytte), REN-004 (Erhverv), REN-005 (Special). Pris: 349 kr/time/person.",
      parameters: {
        type: "object",
        properties: {
          contactId: {
            type: "string",
            description: "Billy customer/contact ID (find med search_billy_customer)",
          },
          entryDate: {
            type: "string",
            description: "Dato for arbejdet (YYYY-MM-DD format)",
          },
          paymentTermsDays: {
            type: "number",
            description: "Betalingsfrist i dage (1 for engangsopgaver, 30 for faste kunder)",
          },
          lines: {
            type: "array",
            description: "Faktura linjer",
            items: {
              type: "object",
              properties: {
                productId: {
                  type: "string",
                  description: "Product ID (REN-001 til REN-005)",
                },
                description: {
                  type: "string",
                  description: "Beskrivelse af arbejdet",
                },
                quantity: {
                  type: "number",
                  description: "Antal arbejdstimer (personer × timer)",
                },
                unitPrice: {
                  type: "number",
                  description: "Pris per time (349 kr)",
                },
              },
              required: ["description", "quantity", "unitPrice"],
            },
          },
        },
        required: ["contactId", "entryDate", "lines"],
      },
    },
  },

  // Google Calendar Tools
  {
    type: "function" as const,
    function: {
      name: "list_calendar_events",
      description: "Hent kalender events. Brug dette til at tjekke ledige tider før du foreslår booking.",
      parameters: {
        type: "object",
        properties: {
          timeMin: {
            type: "string",
            description: "Start tidspunkt (ISO 8601 format, f.eks. '2025-11-01T00:00:00+01:00')",
          },
          timeMax: {
            type: "string",
            description: "Slut tidspunkt (ISO 8601 format)",
          },
          maxResults: {
            type: "number",
            description: "Maksimalt antal events (standard: 50)",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "find_free_calendar_slots",
      description: "Find ledige tider i kalenderen. Brug dette til at foreslå konkrete tider til kunder.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description: "Dato at søge på (YYYY-MM-DD format)",
          },
          duration: {
            type: "number",
            description: "Varighed i timer (brug RUNDE timer: 1, 1.5, 2, 2.5, 3 osv.)",
          },
          workingHours: {
            type: "object",
            description: "Arbejdstider (standard: 8-17)",
            properties: {
              start: {
                type: "number",
                description: "Start time (0-23)",
              },
              end: {
                type: "number",
                description: "Slut time (0-23)",
              },
            },
          },
        },
        required: ["date", "duration"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_calendar_event",
      description: "Opret kalender event. KRITISK: ALDRIG brug 'attendees' parameter - det sender Google invitationer! Format: '🏠 [TYPE] #[NR] - [Kunde]'. Brug RUNDE timer (1t, 1.5t, 2t).",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Event titel (format: '🏠 Fast Rengøring #3 - Mette Nielsen')",
          },
          description: {
            type: "string",
            description: "Event beskrivelse med adresse, telefon, email, aftale detaljer, team, estimat, pris, thread reference",
          },
          start: {
            type: "string",
            description: "Start tidspunkt (ISO 8601 format med timezone: '2025-11-05T10:00:00+01:00')",
          },
          end: {
            type: "string",
            description: "Slut tidspunkt (ISO 8601 format med timezone: '2025-11-05T13:00:00+01:00')",
          },
          location: {
            type: "string",
            description: "Adresse for opgaven",
          },
        },
        required: ["summary", "start", "end"],
      },
    },
  },

  // Lead Management Tools
  {
    type: "function" as const,
    function: {
      name: "list_leads",
      description: "Hent liste over leads. Brug dette til at se nye leads eller søge efter specifikke leads.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Filter på status (new, contacted, quoted, won, lost)",
          },
          source: {
            type: "string",
            description: "Filter på kilde (rengoring_nu, rengoring_aarhus, adhelp, website, referral)",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_lead",
      description: "Opret nyt lead fra email eller anden kilde. Brug dette når du finder et nyt lead i Gmail.",
      parameters: {
        type: "object",
        properties: {
          source: {
            type: "string",
            description: "Lead kilde (rengoring_nu, rengoring_aarhus, adhelp, website, referral)",
          },
          name: {
            type: "string",
            description: "Kundens navn",
          },
          email: {
            type: "string",
            description: "Kundens email",
          },
          phone: {
            type: "string",
            description: "Kundens telefon",
          },
          notes: {
            type: "string",
            description: "Noter om leadet",
          },
          score: {
            type: "number",
            description: "Lead score 0-100 (baseret på urgency, business email, phone, osv.)",
          },
        },
        required: ["source", "name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_lead_status",
      description: "Opdater lead status. Brug dette når lead flytter gennem pipeline.",
      parameters: {
        type: "object",
        properties: {
          leadId: {
            type: "number",
            description: "Lead ID",
          },
          status: {
            type: "string",
            description: "Ny status (new, contacted, quoted, won, lost)",
          },
        },
        required: ["leadId", "status"],
      },
    },
  },

  // Task Management Tools
  {
    type: "function" as const,
    function: {
      name: "list_tasks",
      description: "Hent liste over opgaver. Brug dette til at se hvad der skal gøres.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Filter på status (pending, in_progress, completed)",
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Opret ny opgave. Brug dette til at huske opfølgning eller andre opgaver.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Opgave titel",
          },
          description: {
            type: "string",
            description: "Opgave beskrivelse",
          },
          dueDate: {
            type: "string",
            description: "Forfaldsdato (YYYY-MM-DD format)",
          },
          priority: {
            type: "string",
            description: "Prioritet (low, medium, high)",
          },
        },
        required: ["title"],
      },
    },
  },
];

/**
 * Tool name to handler mapping
 */
export type ToolName =
  | "search_gmail"
  | "get_gmail_thread"
  | "create_gmail_draft"
  | "list_billy_invoices"
  | "search_billy_customer"
  | "create_billy_invoice"
  | "list_calendar_events"
  | "find_free_calendar_slots"
  | "create_calendar_event"
  | "list_leads"
  | "create_lead"
  | "update_lead_status"
  | "list_tasks"
  | "create_task";
