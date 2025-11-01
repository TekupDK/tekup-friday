import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

/**
 * InvoicesTab Component
 * 
 * Displays invoices from Billy.dk via billy-mcp (TekupDK/tekup-billy)
 * Billy-MCP provides a standardized MCP interface to Billy.dk's accounting API
 */
export default function InvoicesTab() {
  const { data: invoices, isLoading } = trpc.inbox.invoices.list.useQuery();

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>;
  }

  return (
    <div className="space-y-2">
      {invoices && invoices.length > 0 ? (
        invoices.map((invoice: any) => (
          <Card key={invoice.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{invoice.contactId}</p>
                <p className="text-sm text-muted-foreground">Invoice #{invoice.invoiceNo || invoice.id}</p>
              </div>
              <Badge variant={invoice.state === "paid" ? "default" : "secondary"}>{invoice.state}</Badge>
            </div>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No invoices found</p>
        </div>
      )}
    </div>
  );
}
