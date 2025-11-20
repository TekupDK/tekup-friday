import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function InboxPreferences() {
  const { data: preferences, isLoading } = trpc.inbox.preferences.get.useQuery();
  const updateMutation = trpc.inbox.preferences.update.useMutation({
    onSuccess: () => {
      toast.success("Preferences saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save preferences: ${error.message}`);
    },
  });

  const [layout, setLayout] = useState<string>("gmail_categories");
  const [defaultView, setDefaultView] = useState<string>("all");
  const [emailsPerPage, setEmailsPerPage] = useState<number>(50);
  const [theme, setTheme] = useState<string>("system");
  const [enableAISummarization, setEnableAISummarization] = useState(true);
  const [enableSmartReplies, setEnableSmartReplies] = useState(true);
  const [enablePriorityScoring, setEnablePriorityScoring] = useState(true);

  useEffect(() => {
    if (preferences) {
      setLayout(preferences.inboxLayout || "gmail_categories");
      setDefaultView(preferences.defaultView || "all");
      setEmailsPerPage(preferences.emailsPerPage || 50);
      setTheme(preferences.theme || "system");
      setEnableAISummarization(preferences.enableAISummarization ?? true);
      setEnableSmartReplies(preferences.enableSmartReplies ?? true);
      setEnablePriorityScoring(preferences.enablePriorityScoring ?? true);
    }
  }, [preferences]);

  const handleSave = () => {
    updateMutation.mutate({
      inboxLayout: layout,
      defaultView,
      emailsPerPage,
      theme,
      enableAISummarization,
      enableSmartReplies,
      enablePriorityScoring,
    });
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading preferences...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Layout */}
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Inbox Layout</h3>
          <p className="text-sm text-muted-foreground mb-3">Choose how your inbox is organized</p>
          <Select value={layout} onValueChange={setLayout}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gmail_categories">Gmail Categories (Main, Updates, Promotions, etc.)</SelectItem>
              <SelectItem value="priority_inbox">Priority Inbox (Important first, then others)</SelectItem>
              <SelectItem value="simple_list">Simple List (Traditional inbox)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Default View */}
        <div>
          <Label>Default View</Label>
          <Select value={defaultView} onValueChange={setDefaultView}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mail</SelectItem>
              <SelectItem value="unread">Unread Only</SelectItem>
              <SelectItem value="starred">Starred</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Emails Per Page */}
        <div>
          <Label>Emails Per Page</Label>
          <Select value={emailsPerPage.toString()} onValueChange={(v) => setEmailsPerPage(parseInt(v))}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Appearance</h3>
          <p className="text-sm text-muted-foreground mb-3">Customize the look and feel</p>
          <Select value={theme} onValueChange={setTheme}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System Default</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* AI Features */}
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">AI Features</h3>
          <p className="text-sm text-muted-foreground mb-3">Toggle AI-powered capabilities</p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>AI Summarization</Label>
            <p className="text-sm text-muted-foreground">Generate concise summaries of long emails</p>
          </div>
          <Switch checked={enableAISummarization} onCheckedChange={setEnableAISummarization} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Smart Replies</Label>
            <p className="text-sm text-muted-foreground">AI-suggested quick responses</p>
          </div>
          <Switch checked={enableSmartReplies} onCheckedChange={setEnableSmartReplies} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label>Priority Scoring</Label>
            <p className="text-sm text-muted-foreground">Automatically identify important emails</p>
          </div>
          <Switch checked={enablePriorityScoring} onCheckedChange={setEnablePriorityScoring} />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}
