import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function EmailTab() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: emails, isLoading, refetch } = trpc.inbox.email.list.useQuery({ maxResults: 20 });

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading emails...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emails..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Email List */}
      <div className="space-y-2">
        {emails && emails.length > 0 ? (
          emails.map((email: any) => (
            <Card key={email.id} className="p-4 hover:bg-accent/50 cursor-pointer transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{email.from}</p>
                    {email.unread && <Badge variant="default" className="text-xs">New</Badge>}
                  </div>
                  <p className="text-sm font-medium truncate mb-1">{email.subject}</p>
                  <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{email.date}</span>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No emails found</p>
          </div>
        )}
      </div>
    </div>
  );
}
