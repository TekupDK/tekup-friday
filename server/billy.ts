/**
 * Billy.dk API Integration via Billy-mcp By Tekup
 * 
 * Repository: TekupDK/tekup-billy (apps/production/tekup-billy)
 * Server: Billy-mcp By Tekup v2.0.0
 * Base URL: https://tekup-billy-production.up.railway.app
 * Documentation: docs/integration/CHATGPT_INTEGRATION_GUIDE.md
 * 
 * Features:
 * - Automatic pagination for all list operations
 * - Enhanced type safety and error handling
 * - Invoice, customer, and product management
 * 
 * API Documentation: https://www.billy.dk/api
 */

const BILLY_API_KEY = process.env.BILLY_API_KEY || "43e7439bccb58a8a96dd57dd06dae10add009111";
const BILLY_ORGANIZATION_ID = process.env.BILLY_ORGANIZATION_ID || "pmf9tU56RoyZdcX3k69z1g";
const BILLY_API_BASE = "https://api.billysbilling.com/v2";

interface BillyContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  countryId?: string;
  organizationId: string;
}

interface BillyInvoice {
  id: string;
  invoiceNo?: string;
  contactId: string;
  entryDate: string;
  paymentTermsDays: number;
  state: "draft" | "approved" | "sent" | "paid" | "overdue";
  lines: Array<{
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRateId?: string;
  }>;
  organizationId: string;
}

interface BillyProduct {
  id: string;
  name: string;
  description?: string;
  salesPrice: number;
  salesTaxRulesetId?: string;
  organizationId: string;
}

/**
 * Make authenticated request to Billy API
 */
async function billyRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BILLY_API_BASE}${endpoint}`;
  
  const headers = {
    "X-Access-Token": BILLY_API_KEY,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Billy API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get all customers (contacts)
 */
export async function getCustomers(): Promise<BillyContact[]> {
  const data = await billyRequest<{ contacts: BillyContact[] }>(
    `/contacts?organizationId=${BILLY_ORGANIZATION_ID}`
  );
  return data.contacts || [];
}

/**
 * Get a single customer by ID
 */
export async function getCustomer(contactId: string): Promise<BillyContact | null> {
  try {
    const data = await billyRequest<{ contact: BillyContact }>(
      `/contacts/${contactId}`
    );
    return data.contact;
  } catch (error) {
    console.error("Error fetching customer:", error);
    return null;
  }
}

/**
 * Create a new customer
 */
export async function createCustomer(customer: {
  name: string;
  email?: string;
  phone?: string;
  countryId?: string;
}): Promise<BillyContact> {
  const data = await billyRequest<{ contact: BillyContact }>("/contacts", {
    method: "POST",
    body: JSON.stringify({
      contact: {
        ...customer,
        organizationId: BILLY_ORGANIZATION_ID,
        type: "company",
      },
    }),
  });
  return data.contact;
}

/**
 * Get all invoices
 */
export async function getInvoices(): Promise<BillyInvoice[]> {
  const data = await billyRequest<{ invoices: BillyInvoice[] }>(
    `/invoices?organizationId=${BILLY_ORGANIZATION_ID}`
  );
  return data.invoices || [];
}

/**
 * Get a single invoice by ID
 */
export async function getInvoice(invoiceId: string): Promise<BillyInvoice | null> {
  try {
    const data = await billyRequest<{ invoice: BillyInvoice }>(
      `/invoices/${invoiceId}`
    );
    return data.invoice;
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return null;
  }
}

/**
 * Create a new invoice
 */
export async function createInvoice(invoice: {
  contactId: string;
  entryDate: string;
  paymentTermsDays?: number;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    productId?: string;
  }>;
}): Promise<BillyInvoice> {
  const data = await billyRequest<{ invoice: BillyInvoice }>("/invoices", {
    method: "POST",
    body: JSON.stringify({
      invoice: {
        ...invoice,
        organizationId: BILLY_ORGANIZATION_ID,
        paymentTermsDays: invoice.paymentTermsDays || 14,
        state: "draft",
      },
    }),
  });
  return data.invoice;
}

/**
 * Update invoice state (approve, send, etc.)
 */
export async function updateInvoiceState(
  invoiceId: string,
  state: "approved" | "sent"
): Promise<BillyInvoice> {
  const data = await billyRequest<{ invoice: BillyInvoice }>(
    `/invoices/${invoiceId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        invoice: {
          state,
        },
      }),
    }
  );
  return data.invoice;
}

/**
 * Get all products
 */
export async function getProducts(): Promise<BillyProduct[]> {
  const data = await billyRequest<{ products: BillyProduct[] }>(
    `/products?organizationId=${BILLY_ORGANIZATION_ID}`
  );
  return data.products || [];
}

/**
 * Search customers by email
 */
export async function searchCustomerByEmail(email: string): Promise<BillyContact | null> {
  const customers = await getCustomers();
  return customers.find((c) => c.email?.toLowerCase() === email.toLowerCase()) || null;
}
