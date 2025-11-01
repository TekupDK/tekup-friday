import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export default function LeadsTab() {
  const { data: leads, isLoading } = trpc.inbox.leads.list.useQuery();

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading leads...</div>;
  }

  return (
    <div className="space-y-2">
      {leads && leads.length > 0 ? (
        leads.map((lead) => (
          <Card key={lead.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium">{lead.name || "Unnamed Lead"}</p>
                <p className="text-sm text-muted-foreground">{lead.email}</p>
              </div>
              <Badge variant="secondary">Score: {lead.score}</Badge>
            </div>
            <Badge variant="outline">{lead.status}</Badge>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No leads found</p>
        </div>
      )}
    </div>
  );
}
