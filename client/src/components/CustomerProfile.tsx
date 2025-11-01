import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Mail,
  Phone,
  FileText,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Loader2,
} from "lucide-react";
import { Streamdown } from "streamdown";

interface CustomerProfileProps {
  leadId: number;
  open: boolean;
  onClose: () => void;
}

export default function CustomerProfile({ leadId, open, onClose }: CustomerProfileProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "emails" | "chat">("overview");

  // Fetch customer profile
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = trpc.customer.getProfileByLeadId.useQuery(
    { leadId },
    { enabled: open }
  );

  // Fetch invoices
  const { data: invoices, isLoading: invoicesLoading, refetch: refetchInvoices } = trpc.customer.getInvoices.useQuery(
    { customerId: profile?.id || 0 },
    { enabled: !!profile?.id }
  );

  // Fetch emails
  const { data: emails, isLoading: emailsLoading, refetch: refetchEmails } = trpc.customer.getEmails.useQuery(
    { customerId: profile?.id || 0 },
    { enabled: !!profile?.id }
  );

  // Sync Billy invoices
  const syncBilly = trpc.customer.syncBillyInvoices.useMutation({
    onSuccess: () => {
      refetchProfile();
      refetchInvoices();
    },
  });

  // Sync Gmail emails
  const syncGmail = trpc.customer.syncGmailEmails.useMutation({
    onSuccess: () => {
      refetchProfile();
      refetchEmails();
    },
  });

  // Generate AI resume
  const generateResume = trpc.customer.generateResume.useMutation({
    onSuccess: () => {
      refetchProfile();
    },
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-xl font-semibold">{profile?.name || profile?.email || "Loading..."}</div>
              {profile?.name && <div className="text-sm text-muted-foreground font-normal">{profile.email}</div>}
            </div>
          </DialogTitle>
        </DialogHeader>

        {profileLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
            <div className="border-b px-6">
              <TabsList className="w-full justify-start bg-transparent">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="invoices" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Invoices ({profile?.invoiceCount || 0})
                </TabsTrigger>
                <TabsTrigger value="emails" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Emails ({profile?.emailCount || 0})
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 max-h-[60vh]">
              {/* Overview Tab */}
              <TabsContent value="overview" className="m-0 p-6 space-y-6">
                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{profile?.email}</span>
                    </div>
                    {profile?.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{profile.phone}</span>
                      </div>
                    )}
                    {profile?.lastContactDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Last Contact: {new Date(profile.lastContactDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Invoiced</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{((profile?.totalInvoiced || 0) / 100).toFixed(2)} DKK</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Total Paid</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {((profile?.totalPaid || 0) / 100).toFixed(2)} DKK
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Outstanding</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">
                        {((profile?.balance || 0) / 100).toFixed(2)} DKK
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Resume */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">AI Customer Summary</CardTitle>
                      <CardDescription>AI-generated insights and recommendations</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateResume.mutate({ customerId: profile?.id || 0 })}
                      disabled={generateResume.isPending || !profile?.id}
                    >
                      {generateResume.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span className="ml-2">Regenerate</span>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {profile?.aiResume ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <Streamdown>{profile.aiResume}</Streamdown>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No AI summary yet. Click "Regenerate" to create one.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Invoices Tab */}
              <TabsContent value="invoices" className="m-0 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Customer Invoices</h3>
                    <p className="text-sm text-muted-foreground">
                      {invoices?.length || 0} invoices from Billy
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncBilly.mutate({ customerId: profile?.id || 0 })}
                    disabled={syncBilly.isPending || !profile?.id}
                  >
                    {syncBilly.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span className="ml-2">Opdater</span>
                  </Button>
                </div>

                <Separator />

                {invoicesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : invoices && invoices.length > 0 ? (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <Card key={invoice.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Invoice #{invoice.invoiceNo || invoice.billyInvoiceId}</span>
                                <Badge variant={
                                  invoice.status === "paid" ? "default" :
                                  invoice.status === "overdue" ? "destructive" :
                                  "secondary"
                                }>
                                  {invoice.status}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {invoice.entryDate && `Date: ${new Date(invoice.entryDate).toLocaleDateString()}`}
                                {invoice.dueDate && ` • Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">{(invoice.amount / 100).toFixed(2)} DKK</div>
                              {invoice.paidAmount > 0 && (
                                <div className="text-sm text-green-600">
                                  Paid: {(invoice.paidAmount / 100).toFixed(2)} DKK
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No invoices found. Click "Opdater" to sync from Billy.
                  </div>
                )}
              </TabsContent>

              {/* Emails Tab */}
              <TabsContent value="emails" className="m-0 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Email History</h3>
                    <p className="text-sm text-muted-foreground">
                      {emails?.length || 0} email threads from Gmail
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncGmail.mutate({ customerId: profile?.id || 0 })}
                    disabled={syncGmail.isPending || !profile?.id}
                  >
                    {syncGmail.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span className="ml-2">Sync Gmail</span>
                  </Button>
                </div>

                <Separator />

                {emailsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : emails && emails.length > 0 ? (
                  <div className="space-y-3">
                    {emails.map((email) => (
                      <Card key={email.id} className={!email.isRead ? "border-primary/50" : ""}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="font-medium">{email.subject || "(No Subject)"}</div>
                              {!email.isRead && <Badge variant="default">Unread</Badge>}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2">
                              {email.snippet}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {email.lastMessageDate && new Date(email.lastMessageDate).toLocaleString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No emails found. Click "Sync Gmail" to load email history.
                  </div>
                )}
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="m-0 p-6">
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Dedicated customer chat coming soon...</p>
                  <p className="text-sm mt-2">This will be a Friday conversation specific to this customer.</p>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
