/**
 * Billy.dk API Mocks
 * Mock responses for Billy invoice and contact APIs
 */

import { vi } from "vitest";

/**
 * Mock Billy invoice data
 */
export const mockBillyInvoice = {
  id: "billy-inv-123",
  invoiceNo: "2025-001",
  type: "invoice",
  state: "draft", // MEMORY_17: Always draft, never approved
  contactId: "billy-contact-456",
  contactName: "Test Hansen",
  currency: "DKK",
  totalAmount: 1047, // 3 hours * 349 kr/hour
  paidAmount: 0,
  dueDate: "2025-12-01",
  lines: [
    {
      productId: "REN-001",
      description: "Almindelig rengøring",
      quantity: 3,
      unitPrice: 349, // MEMORY_17: 349 kr/hour
      totalAmount: 1047,
    },
  ],
  createdAt: "2025-11-18T10:00:00Z",
};

/**
 * Mock Billy contact data
 */
export const mockBillyContact = {
  id: "billy-contact-456",
  name: "Test Hansen",
  type: "company",
  email: "test@example.dk",
  phone: "12345678",
  address: {
    street: "Testvej 123",
    zipcode: "2000",
    city: "Frederiksberg",
    country: "DK",
  },
  createdAt: "2025-11-01T10:00:00Z",
};

/**
 * Mock multiple Billy invoices
 */
export const mockBillyInvoices = [
  mockBillyInvoice,
  {
    ...mockBillyInvoice,
    id: "billy-inv-124",
    invoiceNo: "2025-002",
    state: "approved",
    totalAmount: 2094, // 6 hours
    paidAmount: 2094,
    lines: [
      {
        productId: "REN-003",
        description: "Flytterengøring",
        quantity: 6,
        unitPrice: 349,
        totalAmount: 2094,
      },
    ],
  },
  {
    ...mockBillyInvoice,
    id: "billy-inv-125",
    invoiceNo: "2025-003",
    state: "approved",
    totalAmount: 1745, // 5 hours
    paidAmount: 0, // Unpaid
    lines: [
      {
        productId: "REN-002",
        description: "Vinduespudsning",
        quantity: 5,
        unitPrice: 349,
        totalAmount: 1745,
      },
    ],
  },
];

/**
 * Mock Billy API client
 */
export const mockBillyAPI = {
  /**
   * Get invoices (with filters)
   */
  getInvoices: vi.fn().mockResolvedValue({
    invoices: mockBillyInvoices,
  }),

  /**
   * Get single invoice by ID
   */
  getInvoice: vi.fn().mockResolvedValue({
    invoice: mockBillyInvoice,
  }),

  /**
   * Create invoice (MEMORY_17: draft-only)
   */
  createInvoice: vi.fn().mockImplementation((data) => {
    return Promise.resolve({
      invoice: {
        ...mockBillyInvoice,
        ...data,
        state: "draft", // MEMORY_17: Force draft state
      },
    });
  }),

  /**
   * Update invoice
   */
  updateInvoice: vi.fn().mockResolvedValue({
    invoice: mockBillyInvoice,
  }),

  /**
   * Get contacts
   */
  getContacts: vi.fn().mockResolvedValue({
    contacts: [mockBillyContact],
  }),

  /**
   * Get single contact by ID
   */
  getContact: vi.fn().mockResolvedValue({
    contact: mockBillyContact,
  }),

  /**
   * Search contact by email
   */
  searchContactByEmail: vi.fn().mockImplementation((email) => {
    if (email === mockBillyContact.email) {
      return Promise.resolve(mockBillyContact);
    }
    return Promise.resolve(null);
  }),

  /**
   * Create contact
   */
  createContact: vi.fn().mockResolvedValue({
    contact: mockBillyContact,
  }),
};

/**
 * Mock Billy sync results
 */
export const mockBillySyncResult = {
  success: true,
  invoicesSynced: 3,
  newInvoices: 1,
  updatedInvoices: 2,
  errors: [],
};

/**
 * Helper: Calculate total balance from invoices
 */
export function calculateMockBalance(invoices = mockBillyInvoices) {
  return invoices.reduce((total, invoice) => {
    const unpaid = invoice.totalAmount - invoice.paidAmount;
    return total + unpaid;
  }, 0);
}

/**
 * Helper: Get unpaid invoices
 */
export function getMockUnpaidInvoices(invoices = mockBillyInvoices) {
  return invoices.filter((inv) => inv.paidAmount < inv.totalAmount);
}
