import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Eye } from "lucide-react";
import CustomerProfile from "@/components/CustomerProfile";

export default function LeadsTab() {
  const { data: leads, isLoading } = trpc.inbox.leads.list.useQuery();
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading leads...</div>;
  }

  return (
    <>
      <div className="space-y-2">
        {leads && leads.length > 0 ? (
          leads.map((lead) => (
            <Card key={lead.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium">{lead.name || "Unnamed Lead"}</p>
                  <p className="text-sm text-muted-foreground">{lead.email}</p>
                  {lead.phone && (
                    <p className="text-sm text-muted-foreground">{lead.phone}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Score: {lead.score}</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLeadId(lead.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Profile
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{lead.status}</Badge>
                <Badge variant="secondary">{lead.source}</Badge>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No leads found</p>
          </div>
        )}
      </div>

      {/* Customer Profile Modal */}
      {selectedLeadId && (
        <CustomerProfile
          leadId={selectedLeadId}
          open={!!selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
        />
      )}
    </>
  );
}
