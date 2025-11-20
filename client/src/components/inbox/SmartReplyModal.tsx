import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Reply, Sparkles, Copy, Send } from "lucide-react";

interface SmartReplyModalProps {
  emailFrom: string;
  emailSubject: string;
  emailBody: string;
  onSend?: (reply: string) => void;
}

export function SmartReplyModal({ emailFrom, emailSubject, emailBody, onSend }: SmartReplyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReply, setSelectedReply] = useState<string | null>(null);
  const [customReply, setCustomReply] = useState("");

  const { data: smartReplies, isLoading } = trpc.inbox.ai.smartReplies.useMutation({
    onError: (error) => {
      toast.error(`Failed to generate replies: ${error.message}`);
    },
  });

  const handleOpen = () => {
    setIsOpen(true);
    // Generate smart replies when dialog opens
    smartReplies.mutate({
      from: emailFrom,
      subject: emailSubject,
      body: emailBody,
      context: "",
    });
  };

  const handleUseReply = (reply: string) => {
    setSelectedReply(reply);
    setCustomReply(reply);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleSend = () => {
    if (!customReply.trim()) {
      toast.error("Please write a reply first");
      return;
    }
    if (onSend) {
      onSend(customReply);
    } else {
      // Copy to clipboard as fallback
      navigator.clipboard.writeText(customReply);
      toast.success("Reply copied to clipboard");
    }
    setIsOpen(false);
    setSelectedReply(null);
    setCustomReply("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpen}>
          <Reply className="w-4 h-4 mr-2" />
          Smart Reply
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI-Generated Smart Replies
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Original Email Context */}
          <Card className="p-3 bg-muted/30">
            <p className="text-sm font-medium mb-1">Replying to:</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{emailFrom}</span> - {emailSubject}
            </p>
          </Card>

          {/* AI Suggestions */}
          <div>
            <h4 className="font-medium mb-3">AI Suggestions</h4>
            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            )}
            {smartReplies.data && (
              <div className="space-y-2">
                {smartReplies.data.map((reply, index) => (
                  <Card
                    key={index}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedReply === reply.text ? "border-primary bg-accent" : "hover:bg-accent/50"
                    }`}
                    onClick={() => handleUseReply(reply.text)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {reply.tone}
                          </Badge>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{reply.text}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(reply.text);
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Custom Reply Editor */}
          <div>
            <h4 className="font-medium mb-3">Your Reply</h4>
            <Textarea
              value={customReply}
              onChange={(e) => setCustomReply(e.target.value)}
              placeholder="Edit the suggested reply or write your own..."
              className="min-h-[150px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => handleCopy(customReply)} variant="outline" disabled={!customReply.trim()}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button onClick={handleSend} disabled={!customReply.trim()}>
            <Send className="w-4 h-4 mr-2" />
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
