import { ENV } from "./_core/env";

const BILLY_ORG_ID = process.env.BILLY_ORGANIZATION_ID || "";

/**
 * Billy API Sync Helpers
 * Syncs invoices from Billy.dk for customer profiles
 */

interface BillyInvoice {
  id: string;
  invoiceNo: string;
  contactId: string;
  contactName: string;
  contactEmail: string;
  amount: number; // in øre
  paidAmount?: number;
  state: "draft" | "approved" | "sent" | "paid" | "overdue" | "voided";
  entryDate: string;
  dueDate?: string;
  paidDate?: string;
}

/**
 * Sync all invoices for a customer from Billy
 */
export async function syncBillyInvoicesForCustomer(
  customerEmail: string,
  billyCustomerId?: string | null
): Promise<BillyInvoice[]> {
  try {
    // Use billy-mcp to get invoices
    const { execSync } = await import("child_process");

    // Get all invoices from Billy
    const result = execSync(
      `manus-mcp-cli tool call billy_get_invoices --server billy --input '{"organizationId": "${BILLY_ORG_ID}"}'`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );

    const response = JSON.parse(result);
    const allInvoices = response.content?.[0]?.text
      ? JSON.parse(response.content[0].text)
      : [];

    // Filter invoices for this customer
    const customerInvoices = allInvoices.filter((invoice: any) => {
      // Match by email or Billy customer ID
      const emailMatch =
        invoice.contact?.email?.toLowerCase() === customerEmail.toLowerCase();
      const idMatch = billyCustomerId && invoice.contactId === billyCustomerId;
      return emailMatch || idMatch;
    });

    // Transform to our format
    return customerInvoices.map((inv: any) => ({
      id: inv.id,
      invoiceNo: inv.invoiceNo || inv.id,
      contactId: inv.contactId,
      contactName: inv.contact?.name || "",
      contactEmail: inv.contact?.email || "",
      amount: Math.round((inv.totalAmount || 0) * 100), // convert to øre
      paidAmount: Math.round((inv.paidAmount || 0) * 100),
      state: mapBillyState(inv.state),
      entryDate: inv.entryDate || new Date().toISOString(),
      dueDate: inv.paymentTermsDate,
      paidDate: inv.paidDate,
    }));
  } catch (error) {
    console.error("[Billy Sync] Error syncing invoices:", error);
    return [];
  }
}

/**
 * Map Billy invoice state to our enum
 */
function mapBillyState(billyState: string): BillyInvoice["state"] {
  const stateMap: Record<string, BillyInvoice["state"]> = {
    draft: "draft",
    approved: "approved",
    sent: "sent",
    paid: "paid",
    overdue: "overdue",
    voided: "voided",
    cancelled: "voided",
  };

  return stateMap[billyState?.toLowerCase()] || "draft";
}

/**
 * Get Billy customer ID by email
 */
export async function getBillyCustomerIdByEmail(
  email: string
): Promise<string | null> {
  try {
    const { execSync } = await import("child_process");

    // Search for contact in Billy
    const result = execSync(
      `manus-mcp-cli tool call billy_get_contacts --server billy --input '{"organizationId": "${BILLY_ORG_ID}"}'`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );

    const response = JSON.parse(result);
    const contacts = response.content?.[0]?.text
      ? JSON.parse(response.content[0].text)
      : [];

    // Find contact by email
    const contact = contacts.find(
      (c: any) => c.email?.toLowerCase() === email.toLowerCase()
    );

    return contact?.id || null;
  } catch (error) {
    console.error("[Billy Sync] Error getting customer ID:", error);
    return null;
  }
}

/**
 * Sync all customers and their invoices from Billy
 * Used for initial sync or bulk updates
 */
export async function syncAllBillyCustomers(userId: number): Promise<number> {
  try {
    const { execSync } = await import("child_process");
    const { createOrUpdateCustomerProfile } = await import("./customer-db");
    const { addCustomerInvoice, updateCustomerBalance } = await import(
      "./customer-db"
    );

    // Get all contacts from Billy
    const contactsResult = execSync(
      `manus-mcp-cli tool call billy_get_contacts --server billy --input '{"organizationId": "${BILLY_ORG_ID}"}'`,
      { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );

    const contactsResponse = JSON.parse(contactsResult);
    const contacts = contactsResponse.content?.[0]?.text
      ? JSON.parse(contactsResponse.content[0].text)
      : [];

    let syncedCount = 0;

    // Process each contact
    for (const contact of contacts) {
      if (!contact.email) continue;

      // Create or update customer profile
      const customerId = await createOrUpdateCustomerProfile({
        userId,
        email: contact.email,
        name: contact.name || undefined,
        phone: contact.phone || undefined,
        billyCustomerId: contact.id,
        billyOrganizationId: BILLY_ORG_ID,
      });

      // Sync invoices for this customer
      const invoices = await syncBillyInvoicesForCustomer(
        contact.email,
        contact.id
      );

      for (const invoice of invoices) {
        await addCustomerInvoice({
          customerId,
          billyInvoiceId: invoice.id,
          invoiceNo: invoice.invoiceNo,
          amount: invoice.amount,
          paidAmount: invoice.paidAmount || 0,
          status: invoice.state,
          entryDate: invoice.entryDate
            ? new Date(invoice.entryDate)
            : undefined,
          dueDate: invoice.dueDate ? new Date(invoice.dueDate) : undefined,
          paidDate: invoice.paidDate ? new Date(invoice.paidDate) : undefined,
        });
      }

      // Update balance
      await updateCustomerBalance(customerId);
      syncedCount++;
    }

    return syncedCount;
  } catch (error) {
    console.error("[Billy Sync] Error syncing all customers:", error);
    return 0;
  }
}
