/**
 * Lead Test Fixtures
 */

export const testLead = {
  id: 1,
  userId: 1,
  name: "Test Hansen",
  email: "test@example.dk",
  phone: "12345678",
  source: "website",
  status: "new" as const,
  score: 50,
  notes: "Interested in flytterengøring",
  createdAt: new Date("2025-11-18T10:00:00Z"),
};

export const flytterengøringLead = {
  id: 2,
  userId: 1,
  name: "Lars Nielsen",
  email: "lars@example.dk",
  phone: "20304050",
  source: "rengøring.nu",
  status: "new" as const,
  score: 60, // Higher score for flytterengøring (MEMORY_16)
  notes: "Flytterengøring - 75 m2 lejlighed, skal have billeder først",
  createdAt: new Date("2025-11-18T11:00:00Z"),
};

export const qualifiedLead = {
  id: 3,
  userId: 1,
  name: "Anna Sørensen",
  email: "anna@example.dk",
  phone: "30405060",
  source: "google",
  status: "qualified" as const,
  score: 85,
  notes: "Recurring customer - monthly cleaning",
  createdAt: new Date("2025-11-10T10:00:00Z"),
};

export const wonLead = {
  id: 4,
  userId: 1,
  name: "Peter Jensen",
  email: "peter@example.dk",
  phone: "40506070",
  source: "referral",
  status: "won" as const,
  score: 100,
  notes: "Converted to customer - signed contract",
  createdAt: new Date("2025-11-05T10:00:00Z"),
};
