/**
 * Task Test Fixtures
 */

export const testTask = {
  id: 1,
  userId: 1,
  title: "Send tilbud til Test Hansen",
  description: "Følg op på flytterengøring forespørgsel fra website",
  priority: "high" as const,
  status: "todo" as const,
  dueDate: new Date("2025-11-20T14:00:00Z"),
  createdAt: new Date("2025-11-18T10:00:00Z"),
};

export const mediumPriorityTask = {
  id: 2,
  userId: 1,
  title: "Ring til Lars Nielsen",
  description: "Afklar detaljer om flytterengøring",
  priority: "medium" as const,
  status: "todo" as const,
  dueDate: new Date("2025-11-19T10:00:00Z"),
  createdAt: new Date("2025-11-18T11:00:00Z"),
};

export const completedTask = {
  id: 3,
  userId: 1,
  title: "Opret faktura til Anna Sørensen",
  description: "Månedlig rengøring - 3 timer",
  priority: "low" as const,
  status: "done" as const,
  dueDate: new Date("2025-11-15T10:00:00Z"),
  createdAt: new Date("2025-11-14T10:00:00Z"),
};
