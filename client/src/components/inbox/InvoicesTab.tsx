import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Search, Sparkles, X, Download, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState, useMemo } from "react";
import { Streamdown } from "streamdown";

/**
 * InvoicesTab - Displays and manages Billy.dk invoices
 * 
 * Integration: Uses Billy-mcp By Tekup (TekupDK/tekup-billy)
 * - Base URL: https://tekup-billy-production.up.railway.app
 * - API Version: 2.0.0
 * - Authentication: X-API-Key header
 * - Features: Automatic pagination, search, filter, AI analysis
 */
export default function InvoicesTab() {
  const { data: invoices, isLoading, isFetching } = trpc.inbox.invoices.list.useQuery(undefined, {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: true,
  });
  const analyzeInvoiceMutation = trpc.chat.analyzeInvoice.useMutation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzingInvoice, setAnalyzingInvoice] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<'up' | 'down' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const submitFeedbackMutation = trpc.chat.submitAnalysisFeedback.useMutation();

  // Filter invoices based on search and status
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    return invoices.filter((invoice: any) => {
      const matchesSearch = 
        searchQuery === "" ||
        invoice.invoiceNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.contactId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || 
        invoice.state === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const handleFeedback = async (rating: 'up' | 'down') => {
    if (!selectedInvoice) return;
    
    setFeedbackGiven(rating);
    
    // Show comment input for negative feedback
    if (rating === 'down') {
      setShowCommentInput(true);
      return;
    }
    
    try {
      await submitFeedbackMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        rating,
        analysis: aiAnalysis,
        comment: feedbackComment,
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const submitFeedbackWithComment = async () => {
    if (!selectedInvoice || !feedbackGiven) return;
    
    try {
      await submitFeedbackMutation.mutateAsync({
        invoiceId: selectedInvoice.id,
        rating: feedbackGiven,
        analysis: aiAnalysis,
        comment: feedbackComment,
      });
      setShowCommentInput(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const exportToCSV = (invoice: any, analysis: string) => {
    // Auto-categorize based on invoice state and AI analysis
    const category = (() => {
      if (invoice.state === 'overdue') return 'URGENT';
      if (invoice.state === 'draft') return 'PENDING_REVIEW';
      if (analysis.toLowerCase().includes('risk') || analysis.toLowerCase().includes('concern')) return 'ATTENTION_NEEDED';
      if (analysis.toLowerCase().includes('good') || analysis.toLowerCase().includes('positive')) return 'HEALTHY';
      return 'NORMAL';
    })();

    // Extract priority from analysis
    const priority = (() => {
      if (analysis.toLowerCase().includes('urgent') || invoice.state === 'overdue') return 'HIGH';
      if (analysis.toLowerCase().includes('important') || invoice.state === 'approved') return 'MEDIUM';
      return 'LOW';
    })();

    // Create CSV content with categorization
    const headers = ["Invoice Number", "Customer", "Status", "Category", "Priority", "Entry Date", "Payment Terms", "AI Summary", "Recommendations"];
    
    // Extract recommendations from AI analysis (simple text extraction)
    const recommendations = analysis.split('\n').filter(line => 
      line.toLowerCase().includes('recommend') || 
      line.toLowerCase().includes('action') ||
      line.toLowerCase().includes('follow-up')
    ).join(' | ');
    
    const summary = analysis.replace(/[\n\r]/g, ' ').substring(0, 200) + '...';
    
    const row = [
      invoice.invoiceNo || invoice.id.slice(0, 8),
      invoice.contactId,
      invoice.state,
      category,
      priority,
      new Date(invoice.entryDate).toLocaleDateString('da-DK'),
      `${invoice.paymentTermsDays} days`,
      `"${summary}"`,
      `"${recommendations || 'See full analysis'}"`
    ];
    
    const csvContent = [
      headers.join(','),
      row.join(',')
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `invoice-${invoice.invoiceNo || invoice.id}-analysis.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAnalyzeInvoice = async (invoice: any) => {
    setSelectedInvoice(invoice);
    setAnalyzingInvoice(true);
    setAiAnalysis("");

    try {
      // Create a formatted invoice summary for AI analysis
      const invoiceSummary = `
Invoice Analysis Request:
- Invoice Number: ${invoice.invoiceNo || invoice.id}
- Customer: ${invoice.contactId}
- Status: ${invoice.state}
- Entry Date: ${invoice.entryDate}
- Payment Terms: ${invoice.paymentTermsDays} days
- Lines: ${invoice.lines?.length || 0} items

Please analyze this invoice and provide:
1. Payment status and any overdue warnings
2. Invoice completeness check
3. Any anomalies or unusual patterns
4. Recommendations for follow-up actions
`;

      // Call AI to analyze the invoice using tRPC
      const result = await analyzeInvoiceMutation.mutateAsync({ invoiceData: invoiceSummary });
      setAiAnalysis(result.analysis || "Analysis complete. No issues detected.");
    } catch (error) {
      console.error("Error analyzing invoice:", error);
      setAiAnalysis("Error analyzing invoice. Please try again.");
    } finally {
      setAnalyzingInvoice(false);
    }
  };

  const getStatusVariant = (state: string) => {
    switch (state) {
      case "paid":
        return "default";
      case "sent":
        return "secondary";
      case "overdue":
        return "destructive";
      case "draft":
        return "outline";
      default:
        return "secondary";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-16 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Invoice List */}
      <div className="space-y-2">
        {filteredInvoices.length > 0 ? (
          filteredInvoices.map((invoice: any) => (
            <Card key={invoice.id} className="p-4 hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">
                      {invoice.invoiceNo ? `Invoice #${invoice.invoiceNo}` : `Draft ${invoice.id.slice(0, 8)}`}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Customer: {invoice.contactId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Date: {new Date(invoice.entryDate).toLocaleDateString('da-DK')} • 
                    Payment terms: {invoice.paymentTermsDays} days
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={getStatusVariant(invoice.state)}>
                    {invoice.state}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAnalyzeInvoice(invoice)}
                    className="gap-1"
                  >
                    <Sparkles className="h-3 w-3" />
                    Analyze
                  </Button>
                </div>
              </div>
              {invoice.lines && invoice.lines.length > 0 && (
                <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                  {invoice.lines.length} line{invoice.lines.length !== 1 ? 's' : ''}
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No invoices found</p>
            <p className="text-sm">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Invoices from Billy.dk will appear here"}
            </p>
          </div>
        )}
      </div>

      {/* AI Analysis Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Invoice Analysis
            </DialogTitle>
            <DialogDescription>
              {selectedInvoice && (
                <>
                  Invoice {selectedInvoice.invoiceNo || selectedInvoice.id.slice(0, 8)} • 
                  {selectedInvoice.contactId}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {analyzingInvoice ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <span className="ml-3 text-muted-foreground">Analyzing invoice...</span>
              </div>
            ) : aiAnalysis ? (
              <>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Streamdown>{aiAnalysis}</Streamdown>
                </div>
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Was this analysis helpful?</span>
                      <Button
                        variant={feedbackGiven === 'up' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFeedback('up')}
                        className="gap-1"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        {feedbackGiven === 'up' && 'Thanks!'}
                      </Button>
                      <Button
                        variant={feedbackGiven === 'down' ? 'destructive' : 'outline'}
                        size="sm"
                        onClick={() => handleFeedback('down')}
                        className="gap-1"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        {feedbackGiven === 'down' && 'Noted'}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(selectedInvoice, aiAnalysis)}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Export to CSV
                    </Button>
                  </div>
                  
                  {/* Feedback Comment Input */}
                  {showCommentInput && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Tell us what could be improved... (optional)"
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        className="text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={submitFeedbackWithComment}
                        >
                          Submit Feedback
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowCommentInput(false);
                            setFeedbackComment("");
                          }}
                        >
                          Skip
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Click "Analyze" to get AI insights about this invoice
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
