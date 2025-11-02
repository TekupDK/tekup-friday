import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Eye, Search, Filter } from "lucide-react";
import CustomerProfile from "@/components/CustomerProfile";

// Helper functions for lead scoring and status colors
function getScoreColor(score: number): string {
  if (score >= 80) return "border-l-green-500"; // Hot
  if (score >= 60) return "border-l-blue-500"; // Warm
  if (score >= 40) return "border-l-yellow-500"; // Cool
  return "border-l-gray-400"; // Cold
}

function getScoreBadgeVariant(
  score: number
): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 80) return "default"; // Green
  if (score >= 60) return "secondary"; // Blue
  return "outline"; // Yellow/Gray
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "🔥 Hot Lead";
  if (score >= 60) return "🔵 Warm";
  if (score >= 40) return "🟡 Cool";
  return "❄️ Cold";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "won":
      return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400";
    case "proposal":
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400";
    case "qualified":
      return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "contacted":
      return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400";
    case "new":
      return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400";
    case "lost":
      return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

export default function LeadsTab() {
  const { data: leads, isLoading } = trpc.inbox.leads.list.useQuery();
  const { data: profiles } = trpc.customer.listProfiles.useQuery(undefined, {
    staleTime: 60_000,
  });
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  // Filter leads based on search query and filters
  const filteredLeads = useMemo(() => {
    if (!leads) return [];

    let filtered = leads;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        lead =>
          lead.name?.toLowerCase().includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.phone?.includes(query) ||
          lead.company?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Apply source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter(lead => lead.source === sourceFilter);
    }

    return filtered;
  }, [leads, searchQuery, statusFilter, sourceFilter]);

  // Index customer profiles by leadId for quick lookup
  const profileByLeadId = useMemo(() => {
    const map = new Map<number, any>();
    profiles?.forEach((p: any) => {
      if (typeof p.leadId === "number") map.set(p.leadId, p);
    });
    return map;
  }, [profiles]);

  // Console logging for debugging (matching Calendar/Invoices pattern)
  console.log(
    "🎯 [LeadsTab] Leads data:",
    leads ? `${leads.length} leads` : "Loading..."
  );

  if (leads) {
    const hotLeads = leads.filter(l => l.score >= 80);
    const warmLeads = leads.filter(l => l.score >= 60 && l.score < 80);
    const coolLeads = leads.filter(l => l.score >= 40 && l.score < 60);
    const coldLeads = leads.filter(l => l.score < 40);
    const newLeads = leads.filter(l => l.status === "new");
    const wonLeads = leads.filter(l => l.status === "won");
    const lostLeads = leads.filter(l => l.status === "lost");

    console.log("🎯 [LeadsTab] Score distribution:", {
      hot: hotLeads.length,
      warm: warmLeads.length,
      cool: coolLeads.length,
      cold: coldLeads.length,
    });
    console.log("🎯 [LeadsTab] Status breakdown:", {
      new: newLeads.length,
      won: wonLeads.length,
      lost: lostLeads.length,
    });
    if (profiles && leads) {
      const billyLeads = leads.filter(l => {
        const p = profileByLeadId.get(l.id);
        return p && (p.invoiceCount || 0) > 0;
      });
      const inboxLeads = leads.filter(l => {
        const p = profileByLeadId.get(l.id);
        return l.source === "gmail" || (p && (p.emailCount || 0) > 0);
      });
      console.log("🎯 [LeadsTab] Sync summary:", {
        billyLinked: billyLeads.length,
        inboxLinked: inboxLeads.length,
      });
      console.log(
        "🎯 [LeadsTab] Billy-linked leads:",
        billyLeads.map(l => ({
          id: l.id,
          name: l.name,
          email: l.email,
          score: l.score,
          status: l.status,
        }))
      );
      console.log(
        "🎯 [LeadsTab] Inbox-linked leads:",
        inboxLeads.map(l => ({
          id: l.id,
          name: l.name,
          email: l.email,
          score: l.score,
          status: l.status,
        }))
      );
    }

    if (searchQuery || statusFilter !== "all" || sourceFilter !== "all") {
      console.log("🎯 [LeadsTab] Filters active:", {
        search: searchQuery,
        status: statusFilter,
        source: sourceFilter,
      });
      console.log(
        "🎯 [LeadsTab] Filtered results:",
        `${filteredLeads.length} leads`
      );
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading leads...
      </div>
    );
  }

  // Calculate stats
  const stats = leads
    ? (() => {
        const total = leads.length;
        const newCount = leads.filter(l => l.status === "new").length;
        const hot = leads.filter(l => l.score >= 80).length;
        const won = leads.filter(l => l.status === "won").length;
        const lost = leads.filter(l => l.status === "lost").length;
        const avgScore =
          Math.round(
            leads.reduce((sum, l) => sum + l.score, 0) / leads.length
          ) || 0;
        // Linkage stats (requires profiles)
        const billyLinked = leads.filter(l => {
          const p = profileByLeadId.get(l.id);
          return p && (p.invoiceCount || 0) > 0;
        }).length;
        const inboxLinked = leads.filter(l => {
          const p = profileByLeadId.get(l.id);
          return l.source === "gmail" || (p && (p.emailCount || 0) > 0);
        }).length;
        return {
          total,
          new: newCount,
          hot,
          won,
          lost,
          avgScore,
          billyLinked,
          inboxLinked,
        };
      })()
    : null;

  // Get unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    if (!leads) return [];
    return Array.from(new Set(leads.map(l => l.source)));
  }, [leads]);

  return (
    <>
      {/* Search & Filter Bar */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Søg på navn, email, telefon, firma..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Kilde" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle kilder</SelectItem>
              {uniqueSources.map(source => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(statusFilter !== "all" ||
            sourceFilter !== "all" ||
            searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setSourceFilter("all");
                setSearchQuery("");
              }}
            >
              Ryd filtre
            </Button>
          )}
        </div>
      </div>

      {/* Stats Summary Header */}
      {stats && (
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Total Leads
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">New</div>
            <div className="text-2xl font-bold text-gray-600">{stats.new}</div>
          </Card>
          <Card className="p-3 border-l-4 border-l-green-500">
            <div className="text-xs text-muted-foreground mb-1">
              🔥 Hot Leads
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.hot}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Won</div>
            <div className="text-2xl font-bold text-green-600">{stats.won}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Lost</div>
            <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Avg Score</div>
            <div className="text-2xl font-bold">{stats.avgScore}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Billy Linked
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {stats.billyLinked}
            </div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">
              Inbox Linked
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.inboxLinked}
            </div>
          </Card>
        </div>
      )}

      <ScrollArea className="h-[calc(100vh-28rem)]">
        <div className="space-y-2 pr-4">
          {filteredLeads && filteredLeads.length > 0 ? (
            filteredLeads.map(lead => (
              <Card
                key={lead.id}
                className={`p-4 border-l-4 ${getScoreColor(lead.score)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {lead.name || "Unnamed Lead"}
                      </p>
                      {(!lead.email || !lead.phone) && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300"
                        >
                          ⚠️ Ufuldstændig
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lead.email || "📧 Email mangler"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lead.phone || "📞 Telefon mangler"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getScoreBadgeVariant(lead.score)}>
                      {getScoreLabel(lead.score)} ({lead.score})
                    </Badge>
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
                  <Badge className={getStatusColor(lead.status)}>
                    {lead.status}
                  </Badge>
                  <Badge variant="secondary">{lead.source}</Badge>
                  {/* Billy/Inbox sync badges */}
                  {(() => {
                    const p = profileByLeadId.get(lead.id);
                    const hasBilly = p && (p.invoiceCount || 0) > 0;
                    const hasInbox =
                      lead.source === "gmail" || (p && (p.emailCount || 0) > 0);
                    return (
                      <>
                        {hasBilly && (
                          <Badge
                            variant="outline"
                            className="border-green-300 text-green-700 dark:text-green-400"
                          >
                            Billy
                          </Badge>
                        )}
                        {hasInbox && (
                          <Badge
                            variant="outline"
                            className="border-blue-300 text-blue-700 dark:text-blue-400"
                          >
                            Inbox
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>
                {searchQuery
                  ? "Ingen leads matcher din søgning"
                  : "No leads found"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

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
