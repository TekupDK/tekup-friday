import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, Mail, ChevronDown, X, ArrowLeft, Reply, Forward, Trash2, Download, Filter, SortDesc } from "lucide-react";
import { Select } from "@/components/ui/select";
import { useState, useMemo, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Streamdown } from "streamdown";

interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  internalDate?: number;
  body: string;
  snippet: string;
  unread: boolean;
  labels: string[];
  hasAttachment: boolean;
  sender: string;
}

const CACHE_KEY = 'friday_emails_cache';
const CACHE_TIMESTAMP_KEY = 'friday_emails_timestamp';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

type FilterType = 'all' | 'unread' | 'starred' | 'attachments';
type SortType = 'date-desc' | 'date-asc' | 'sender';

export default function EmailTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["TODAY", "YESTERDAY", "LAST_7_DAYS"]));
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [manualRefreshTrigger, setManualRefreshTrigger] = useState(0);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('date-desc');
  const [displayLimit, setDisplayLimit] = useState(50); // Initial display limit
  
  // Check if cache is valid
  const isCacheValid = () => {
    try {
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (!timestamp) return false;
      const age = Date.now() - parseInt(timestamp);
      return age < CACHE_TTL;
    } catch {
      return false;
    }
  };

  // Load cached emails on mount
  const getCachedEmails = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  const [cachedEmails, setCachedEmails] = useState<any[] | null>(getCachedEmails());
  const shouldFetch = !isCacheValid() || manualRefreshTrigger > 0;

  const { data: emails, isLoading, isFetching, refetch, error } = trpc.inbox.email.list.useQuery(
    { maxResults: 50 },
    {
      enabled: shouldFetch, // Only fetch if cache is invalid or manual refresh
      refetchInterval: false, // No automatic refetch - we control it manually
      refetchIntervalInBackground: false,
      retry: false,
    }
  );

  // Save to cache when emails are fetched (with race condition protection)
  useEffect(() => {
    if (emails) {
      try {
        const now = Date.now();
        const existingTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

        // Only update cache if this data is newer than existing cache
        // This prevents race conditions when multiple requests are in flight
        if (!existingTimestamp || now > parseInt(existingTimestamp)) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(emails));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
          setCachedEmails(emails);
          console.log('[EmailTab] Cache updated:', emails.length, 'threads');
        } else {
          console.log('[EmailTab] Skipped cache update (older data)');
        }
      } catch (e) {
        console.error('[EmailTab] Failed to cache emails:', e);
      }
    }
  }, [emails]);

  // Use cached emails if available, otherwise use fresh data
  const displayEmails = cachedEmails || emails;
  const lastFetchTime = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const cacheAge = lastFetchTime ? Math.floor((Date.now() - parseInt(lastFetchTime)) / 1000 / 60) : null;

  // Sync mutation
  const syncMutation = trpc.inbox.email.sync.useMutation({
    onSuccess: (data) => {
      console.log(`✅ Synced ${data.synced} emails from Gmail`);
      setSyncStatus(`✅ Synced ${data.synced} emails`);
      setTimeout(() => setSyncStatus(''), 3000);
      refetch(); // Refresh the list after sync
    },
    onError: (error) => {
      console.error('❌ Sync failed:', error.message);
      setSyncStatus(`❌ Sync failed: ${error.message}`);
      setTimeout(() => setSyncStatus(''), 5000);
    },
  });

  // Manual refresh handler
  const handleManualRefresh = () => {
    setManualRefreshTrigger(prev => prev + 1);
    refetch();
  };

  // Sync from Gmail handler
  const handleSync = () => {
    syncMutation.mutate();
  };

  // Log email status
  console.log('[EmailTab] Emails:', displayEmails?.length || 0, 'Cached:', !!cachedEmails, 'Age:', cacheAge, 'min');

  // Transform GmailThread[] to flat message list for display
  const emailMessages = useMemo<EmailMessage[]>(() => {
    if (!displayEmails) return [];

    // Flatten threads into messages, using the latest message from each thread
    return displayEmails.flatMap((thread: any): EmailMessage[] => {
      if (!thread.messages || thread.messages.length === 0) {
        // If no messages, create a synthetic message from thread data
        return [{
          id: thread.id,
          threadId: thread.id,
          subject: 'No Subject',
          from: '',
          to: '',
          date: new Date().toISOString(),
          body: thread.snippet || '',
          snippet: thread.snippet || '',
          unread: false,
          labels: [] as string[],
          hasAttachment: false,
          sender: '',
        }];
      }

      // Use the latest message from the thread
      const lastMessage = thread.messages[thread.messages.length - 1];
      return [{
        id: lastMessage.id || thread.id,
        threadId: thread.id,
        subject: lastMessage.subject || 'No Subject',
        from: lastMessage.from || '',
        to: lastMessage.to || '',
        date: lastMessage.date || new Date().toISOString(),
        internalDate: lastMessage.date ? new Date(lastMessage.date).getTime() : Date.now(),
        body: lastMessage.body || '',
        snippet: thread.snippet || lastMessage.body?.substring(0, 100) || '',
        unread: lastMessage.isUnread || false, // Parsed from Gmail API
        labels: lastMessage.labels || [], // Parsed from Gmail API
        hasAttachment: lastMessage.hasAttachment || false, // Parsed from Gmail API
        sender: lastMessage.from || '', // Alias for from
      }];
    });
  }, [displayEmails]);

  // Filter emails by search query, filter type, and sort
  const filteredAndSortedEmails = useMemo(() => {
    let result = emailMessages;

    // Apply search filter
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      result = result.filter((email: EmailMessage) =>
        email.subject.toLowerCase().includes(query) ||
        email.from.toLowerCase().includes(query) ||
        email.to.toLowerCase().includes(query) ||
        email.snippet.toLowerCase().includes(query) ||
        email.body.toLowerCase().includes(query)
      );
    }

    // Apply label filter
    if (filter === 'unread') {
      result = result.filter((email: EmailMessage) => email.unread);
    } else if (filter === 'starred') {
      result = result.filter((email: EmailMessage) => email.labels?.includes('STARRED'));
    } else if (filter === 'attachments') {
      result = result.filter((email: EmailMessage) => email.hasAttachment);
    }

    // Apply sort
    const sorted = [...result];
    if (sort === 'date-desc') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.internalDate || a.date).getTime();
        const dateB = new Date(b.internalDate || b.date).getTime();
        return dateB - dateA; // Newest first
      });
    } else if (sort === 'date-asc') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.internalDate || a.date).getTime();
        const dateB = new Date(b.internalDate || b.date).getTime();
        return dateA - dateB; // Oldest first
      });
    } else if (sort === 'sender') {
      sorted.sort((a, b) => a.from.localeCompare(b.from));
    }

    return sorted;
  }, [emailMessages, searchQuery, filter, sort]);

  // Apply pagination limit
  const paginatedEmails = useMemo(() => {
    return filteredAndSortedEmails.slice(0, displayLimit);
  }, [filteredAndSortedEmails, displayLimit]);

  const hasMore = filteredAndSortedEmails.length > displayLimit;

  // Group emails by time period
  const groupedEmails = useMemo(() => {
    if (!paginatedEmails || paginatedEmails.length === 0) return { TODAY: [], YESTERDAY: [], LAST_7_DAYS: [] };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const last7Days = new Date(today);
    last7Days.setDate(last7Days.getDate() - 7);

    const groups: Record<string, EmailMessage[]> = {
      TODAY: [],
      YESTERDAY: [],
      LAST_7_DAYS: [],
    };

    paginatedEmails.forEach((email: EmailMessage) => {
      const emailDate = new Date(email.internalDate ? new Date(email.internalDate) : email.date);

      if (emailDate >= today) {
        groups.TODAY.push(email);
      } else if (emailDate >= yesterday) {
        groups.YESTERDAY.push(email);
      } else if (emailDate >= last7Days) {
        groups.LAST_7_DAYS.push(email);
      }
    });

    return groups;
  }, [paginatedEmails]);

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

  // Only show loading skeleton if no cached data available
  if (isLoading && !cachedEmails) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Show error state for rate limits only if no cached data
  if (error && !cachedEmails) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Mail className="w-16 h-16 text-muted-foreground opacity-50" />
        <div className="text-center space-y-2">
          <h3 className="font-semibold text-lg">Gmail API Rate Limit</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {error.message.includes('rate limit') 
              ? 'Gmail API rate limit reached. Please wait a few minutes and try again.'
              : error.message}
          </p>
          <Button onClick={handleManualRefresh} variant="outline" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // If email is selected, show detail view
  if (selectedEmailId) {
    const selectedEmail = emailMessages.find((e: EmailMessage) => e.id === selectedEmailId);

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
        <Button
          variant="outline"
          size="icon"
          onClick={handleSync}
          disabled={syncMutation.isPending}
          title="Sync from Gmail"
        >
          <Download className={`w-4 h-4 ${syncMutation.isPending ? 'animate-bounce' : ''}`} />
        </Button>
        <Button variant="outline" size="icon" onClick={handleManualRefresh} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex gap-2 items-center">
        <div className="flex gap-2 flex-1">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread
          </Button>
          <Button
            variant={filter === 'starred' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('starred')}
          >
            ⭐ Starred
          </Button>
          <Button
            variant={filter === 'attachments' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('attachments')}
          >
            📎 Attachments
          </Button>
        </div>
        <div className="flex gap-2 items-center text-sm text-muted-foreground">
          <SortDesc className="w-4 h-4" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="bg-background border rounded px-2 py-1 text-sm"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="sender">By sender</option>
          </select>
        </div>
      </div>

      {/* Cache Status */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {cacheAge !== null ? (
            cacheAge === 0 ? 'Just updated' : `Last updated ${cacheAge} ${cacheAge === 1 ? 'minute' : 'minutes'} ago`
          ) : 'No cached data'}
        </span>
        <div className="flex items-center gap-2">
          {syncStatus && <span className={syncStatus.includes('✅') ? 'text-green-500' : 'text-red-500'}>{syncStatus}</span>}
          {isFetching && <span className="text-blue-500">Loading...</span>}
        </div>
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
                  {sectionEmails.map((email: EmailMessage) => (
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

        {emailMessages && emailMessages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No emails found</p>
          </div>
        )}

        {/* Load More Button */}
        {hasMore && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              onClick={() => setDisplayLimit(prev => prev + 50)}
            >
              Load More ({filteredAndSortedEmails.length - displayLimit} remaining)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
