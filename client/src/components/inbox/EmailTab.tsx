import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, Mail, ChevronDown, X, ArrowLeft, Reply, Forward, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Streamdown } from "streamdown";

export default function EmailTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["TODAY", "YESTERDAY", "LAST_7_DAYS"]));
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  
  const { data: emails, isLoading, isFetching, refetch } = trpc.inbox.email.list.useQuery(
    { maxResults: 50 },
    {
      refetchInterval: 30000, // Auto-refresh every 30 seconds
      refetchIntervalInBackground: true,
    }
  );

  // Group emails by time period
  const groupedEmails = useMemo(() => {
    if (!emails) return { TODAY: [], YESTERDAY: [], LAST_7_DAYS: [] };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const groups: Record<string, any[]> = {
      TODAY: [],
      YESTERDAY: [],
      LAST_7_DAYS: [],
    };

    emails.forEach((email: any) => {
      const emailDate = new Date(email.internalDate || email.date);
      
      if (emailDate >= today) {
        groups.TODAY.push(email);
      } else if (emailDate >= yesterday) {
        groups.YESTERDAY.push(email);
      } else if (emailDate >= last7Days) {
        groups.LAST_7_DAYS.push(email);
      }
    });

    return groups;
  }, [emails]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // If email is selected, show detail view
  if (selectedEmailId) {
    const selectedEmail = emails?.find((e: any) => e.id === selectedEmailId);
    
    if (!selectedEmail) {
      setSelectedEmailId(null);
      return null;
    }

    return (
      <div className="h-full flex flex-col">
        {/* Email Detail Header */}
        <div className="flex items-center gap-2 pb-4 border-b">
          <Button variant="ghost" size="icon" onClick={() => setSelectedEmailId(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon">
            <Reply className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Forward className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Email Content */}
        <ScrollArea className="flex-1 mt-4">
          <div className="space-y-4">
            {/* Subject */}
            <h2 className="text-2xl font-semibold">{selectedEmail.subject}</h2>
            
            {/* From/To */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">From:</span>
                <span className="font-medium">{selectedEmail.from || selectedEmail.sender}</span>
              </div>
              {selectedEmail.to && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">To:</span>
                  <span>{selectedEmail.to}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {new Date(selectedEmail.internalDate || selectedEmail.date).toLocaleString('da-DK', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-2">
              {selectedEmail.unread && <Badge variant="destructive">Needs Action</Badge>}
              {selectedEmail.labels?.includes('DRAFT') && <Badge variant="secondary" className="bg-orange-500/20 text-orange-700">Draft</Badge>}
              {selectedEmail.hasAttachment && <Badge variant="outline">📎 Attachment</Badge>}
            </div>

            {/* Email Body */}
            <div className="prose prose-sm max-w-none dark:prose-invert pt-4 border-t">
              {selectedEmail.body ? (
                <Streamdown>{selectedEmail.body}</Streamdown>
              ) : (
                <p className="text-muted-foreground">{selectedEmail.snippet}</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emails, contacts, labels..."
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
        {isFetching && <span className="text-xs text-muted-foreground">Syncing...</span>}
      </div>

      {/* Email Groups */}
      <div className="space-y-6">
        {Object.entries(groupedEmails).map(([section, sectionEmails]) => {
          if (sectionEmails.length === 0) return null;
          
          const isExpanded = expandedSections.has(section);
          const sectionTitle = section.replace(/_/g, ' ');

          return (
            <div key={section} className="space-y-2">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section)}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                {sectionTitle}
                <Badge variant="secondary" className="ml-auto">{sectionEmails.length}</Badge>
              </button>

              {/* Email List */}
              {isExpanded && (
                <div className="space-y-2 ml-6">
                  {sectionEmails.map((email: any) => (
                    <Card 
                      key={email.id} 
                      className="p-4 hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedEmailId(email.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{email.from || email.sender}</p>
                            {email.unread && <Badge variant="destructive" className="text-xs">Needs Action</Badge>}
                            {email.labels?.includes('DRAFT') && <Badge variant="secondary" className="text-xs bg-orange-500/20 text-orange-700">Draft</Badge>}
                          </div>
                          <p className="text-sm font-medium truncate mb-1">{email.subject}</p>
                          <p className="text-xs text-muted-foreground truncate">{email.snippet}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(email.internalDate || email.date).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {email.hasAttachment && <Badge variant="outline" className="text-xs">📎</Badge>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {emails && emails.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No emails found</p>
          </div>
        )}
      </div>
    </div>
  );
}
