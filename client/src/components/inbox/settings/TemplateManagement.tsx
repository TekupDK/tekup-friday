import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TEMPLATE_CATEGORIES = [
  { value: "response", label: "Quick Response" },
  { value: "follow_up", label: "Follow-up" },
  { value: "meeting", label: "Meeting" },
  { value: "thank_you", label: "Thank You" },
  { value: "other", label: "Other" },
];

export function TemplateManagement() {
  const { data: templates, refetch } = trpc.inbox.templates.list.useQuery();
  const createMutation = trpc.inbox.templates.create.useMutation({
    onSuccess: () => {
      toast.success("Template created successfully");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
  const deleteMutation = trpc.inbox.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("response");

  const resetForm = () => {
    setName("");
    setSubject("");
    setBody("");
    setCategory("response");
  };

  const handleCreate = () => {
    if (!name.trim() || !body.trim()) {
      toast.error("Please fill in template name and body");
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      subject: subject.trim() || null,
      body: body.trim(),
      category,
    });
  };

  const handleDelete = (templateId: number) => {
    if (confirm("Are you sure you want to delete this template?")) {
      deleteMutation.mutate({ templateId });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Email Templates</h3>
          <p className="text-sm text-muted-foreground">Save frequently used email responses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Email Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Meeting Follow-up"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subject (Optional)</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject line"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Body</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Email body text... You can use {{name}}, {{company}} for variables"
                  className="mt-2 min-h-[150px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Tip: Use double curly braces for variables, e.g., {`{{name}}`}, {`{{company}}`}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Template"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates List */}
      <div className="space-y-2">
        {templates && templates.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No templates created yet. Click "New Template" to get started.</p>
          </Card>
        )}
        {templates?.map((template) => (
          <Card key={template.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium">{template.name}</span>
                  <Badge variant="secondary">
                    {TEMPLATE_CATEGORIES.find((c) => c.value === template.category)?.label || template.category}
                  </Badge>
                </div>
                {template.subject && (
                  <p className="text-sm text-muted-foreground mb-2">
                    <span className="font-medium">Subject:</span> {template.subject}
                  </p>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">{template.body}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Created {new Date(template.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(template.body)}
                  title="Copy body"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(template.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
