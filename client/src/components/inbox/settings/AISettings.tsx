import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export function AISettings() {
  const { data: preferences } = trpc.inbox.preferences.get.useQuery();
  const updateMutation = trpc.inbox.preferences.update.useMutation({
    onSuccess: () => {
      toast.success("AI settings saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const [enableAISummarization, setEnableAISummarization] = useState(true);
  const [enableSmartReplies, setEnableSmartReplies] = useState(true);
  const [enablePriorityScoring, setEnablePriorityScoring] = useState(true);
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [confidenceThreshold, setConfidenceThreshold] = useState([70]);

  useEffect(() => {
    if (preferences) {
      setEnableAISummarization(preferences.enableAISummarization ?? true);
      setEnableSmartReplies(preferences.enableSmartReplies ?? true);
      setEnablePriorityScoring(preferences.enablePriorityScoring ?? true);
      setAutoCategorize(preferences.autoCategorize ?? true);
      setAiModel(preferences.aiModel || "gpt-4o-mini");
      setConfidenceThreshold([preferences.confidenceThreshold || 70]);
    }
  }, [preferences]);

  const handleSave = () => {
    updateMutation.mutate({
      enableAISummarization,
      enableSmartReplies,
      enablePriorityScoring,
      autoCategorize,
      aiModel,
      confidenceThreshold: confidenceThreshold[0],
    });
  };

  return (
    <div className="space-y-6">
      {/* AI Features */}
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">AI-Powered Features</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enable or disable individual AI capabilities
          </p>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <Label>Email Summarization</Label>
            <p className="text-sm text-muted-foreground">
              Generate concise summaries of long emails automatically
            </p>
          </div>
          <Switch checked={enableAISummarization} onCheckedChange={setEnableAISummarization} />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <Label>Smart Replies</Label>
            <p className="text-sm text-muted-foreground">
              AI-suggested quick responses based on email content
            </p>
          </div>
          <Switch checked={enableSmartReplies} onCheckedChange={setEnableSmartReplies} />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <Label>Priority Scoring</Label>
            <p className="text-sm text-muted-foreground">
              Automatically identify and score important emails
            </p>
          </div>
          <Switch checked={enablePriorityScoring} onCheckedChange={setEnablePriorityScoring} />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <Label>Auto-Categorization</Label>
            <p className="text-sm text-muted-foreground">
              Automatically sort emails into categories (Main, Updates, Promotions, etc.)
            </p>
          </div>
          <Switch checked={autoCategorize} onCheckedChange={setAutoCategorize} />
        </div>
      </Card>

      {/* AI Model Selection */}
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">AI Model</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose the AI model for email analysis
          </p>
        </div>

        <div>
          <Label>Model Selection</Label>
          <Select value={aiModel} onValueChange={setAiModel}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast & Efficient)</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o (Balanced)</SelectItem>
              <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Most Accurate)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Faster models provide quicker responses, while more accurate models give better results
          </p>
        </div>
      </Card>

      {/* Confidence Threshold */}
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Confidence Threshold</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Minimum confidence level for AI categorization (0-100%)
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Threshold: {confidenceThreshold[0]}%</Label>
            <span className="text-xs text-muted-foreground">
              {confidenceThreshold[0] < 50 ? "Aggressive" : confidenceThreshold[0] < 75 ? "Balanced" : "Conservative"}
            </span>
          </div>
          <Slider
            value={confidenceThreshold}
            onValueChange={setConfidenceThreshold}
            min={0}
            max={100}
            step={5}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Lower threshold = More emails categorized automatically
            <br />
            Higher threshold = Only high-confidence categorizations
          </p>
        </div>
      </Card>

      {/* Action Items Extraction */}
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold mb-1">Advanced AI Features</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Experimental features powered by AI
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Action Item Extraction</Label>
              <p className="text-sm text-muted-foreground">
                Automatically detect tasks and deadlines in emails
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Sentiment Analysis</Label>
              <p className="text-sm text-muted-foreground">
                Detect tone and urgency of incoming emails
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <Label>Key Topic Detection</Label>
              <p className="text-sm text-muted-foreground">
                Identify main topics discussed in email threads
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? "Saving..." : "Save AI Settings"}
        </Button>
      </div>
    </div>
  );
}
