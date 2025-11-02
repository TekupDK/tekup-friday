import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, Mail, ChevronDown, X, ArrowLeft, Reply, Forward, Trash2, Download, Send, Plus, Archive } from "lucide-react";
import { useState, useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Streamdown } from "streamdown";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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

export default function EmailTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["TODAY", "YESTERDAY", "LAST_7_DAYS"]));
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [manualRefreshTrigger, setManualRefreshTrigger] = useState(0);
  
  // Compose/Reply dialog state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<EmailMessage | null>(null);
  const [syncStatus, setSyncStatus] = useState<string>('');
  
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
      onSuccess: (data) => {
        // Save to cache on successful fetch
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
          setCachedEmails(data);
        } catch (e) {
          console.error('[EmailTab] Failed to cache emails:', e);
        }
      },
    }
  );

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

  // Send email mutation
  const sendMutation = trpc.inbox.email.send.useMutation({
    onSuccess: () => {
      console.log('[EmailTab] Email sent successfully');
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      refetch();
    },
    onError: (error) => {
      console.error('[EmailTab] Send failed:', error);
      alert(`Failed to send email: ${error.message}`);
    },
  });

  // Reply mutation
  const replyMutation = trpc.inbox.email.reply.useMutation({
    onSuccess: () => {
      console.log('[EmailTab] Reply sent successfully');
      setComposeOpen(false);
      setReplyingTo(null);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      refetch();
    },
    onError: (error) => {
      console.error('[EmailTab] Reply failed:', error);
      alert(`Failed to send reply: ${error.message}`);
    },
  });

  // Mark as read mutation
  const markAsReadMutation = trpc.inbox.email.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Archive mutation
  const archiveMutation = trpc.inbox.email.archive.useMutation({
    onSuccess: () => {
      console.log('[EmailTab] Email archived');
      setSelectedEmailId(null);
      refetch();
    },
  });

  // Compose new email
  const handleCompose = () => {
    setReplyingTo(null);
    setComposeTo("");
    setComposeSubject("");
    setComposeBody("");
    setComposeOpen(true);
  };

  // Reply to email
  const handleReply = (email: EmailMessage) => {
    setReplyingTo(email);
    setComposeTo(email.from);
    setComposeSubject(email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`);
    setComposeBody(`\n\n--- Original Message ---\nFrom: ${email.from}\nDate: ${email.date}\n\n${email.body}`);
    setComposeOpen(true);
  };

  // Send email
  const handleSend = () => {
    if (!composeTo || !composeSubject || !composeBody) {
      alert('Please fill in all fields');
      return;
    }

    if (replyingTo) {
      replyMutation.mutate({
        threadId: replyingTo.threadId,
        messageId: replyingTo.id,
        to: composeTo,
        subject: composeSubject,
        body: composeBody,
      });
    } else {
      sendMutation.mutate({
        to: composeTo,
        subject: composeSubject,
        body: composeBody,
      });
    }
  };

  // Toggle read status
  const handleToggleRead = (messageId: string, currentIsRead: boolean) => {
    markAsReadMutation.mutate({
      messageId,
      isRead: !currentIsRead,
    });
  };

  // Archive email
  const handleArchive = (messageId: string) => {
    archiveMutation.mutate({ messageId });
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
        unread: false, // Gmail API doesn't provide this in thread format
        labels: [] as string[], // Gmail API doesn't provide this in thread format
        hasAttachment: false, // Would need to check payload for attachments
        sender: lastMessage.from || '', // Alias for from
      }];
    });
  }, [displayEmails]);

  // Filter emails by search query
  const filteredEmails = useMemo(() => {
    if (!emailMessages || emailMessages.length === 0) return [];
    if (!searchQuery.trim()) return emailMessages;

    const query = searchQuery.toLowerCase();
    return emailMessages.filter((email: EmailMessage) => 
      email.subject?.toLowerCase().includes(query) ||
      email.from?.toLowerCase().includes(query) ||
      email.to?.toLowerCase().includes(query) ||
      email.body?.toLowerCase().includes(query) ||
      email.snippet?.toLowerCase().includes(query)
    );
  }, [emailMessages, searchQuery]);

  // Group emails by time period
  const groupedEmails = useMemo(() => {
    if (!filteredEmails || filteredEmails.length === 0) return { TODAY: [], YESTERDAY: [], LAST_7_DAYS: [] };

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

    filteredEmails.forEach((email: EmailMessage) => {
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
  }, [filteredEmails]);

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
          <div className="flex-1">
            <h3 className="font-medium truncate">{selectedEmail.subject}</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleToggleRead(selectedEmail.id, !selectedEmail.unread)}
            title={selectedEmail.unread ? "Mark as read" : "Mark as unread"}
          >
            <Mail className={`w-4 h-4 ${selectedEmail.unread ? 'fill-current' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleReply(selectedEmail)}
            title="Reply"
          >
            <Reply className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => handleArchive(selectedEmail.id)}
            title="Archive"
          >
            <Archive className="w-4 h-4" />
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
    <>
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
            variant="default"
            size="icon" 
            onClick={handleCompose}
            title="Compose new email"
          >
            <Plus className="w-4 h-4" />
          </Button>
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
      </div>

      {/* Compose/Reply Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{replyingTo ? 'Reply to Email' : 'Compose New Email'}</DialogTitle>
            <DialogDescription>
              {replyingTo ? `Replying to: ${replyingTo.from}` : 'Send a new email'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                value={composeTo}
                onChange={(e) => setComposeTo(e.target.value)}
                placeholder="recipient@example.com"
                disabled={!!replyingTo}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                placeholder="Write your message..."
                rows={12}
                className="resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setComposeOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSend}
                disabled={sendMutation.isPending || replyMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                {sendMutation.isPending || replyMutation.isPending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
