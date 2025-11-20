import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { FileText, Search, Edit2 } from "lucide-react";

interface TemplateSelectorModalProps {
  onSelect?: (subject: string, body: string) => void;
}

export function TemplateSelectorModal({ onSelect }: TemplateSelectorModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const { data: templates } = trpc.inbox.templates.list.useQuery();

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (!searchQuery.trim()) return templates;

    const query = searchQuery.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.body.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
    );
  }, [templates, searchQuery]);

  // Group templates by category
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredTemplates.forEach((template) => {
      const category = template.category || "other";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(template);
    });
    return groups;
  }, [filteredTemplates]);

  const handleSelectTemplate = (template: any) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject || "");
    setEditedBody(template.body);
    setShowEditor(true);
  };

  const handleUseTemplate = () => {
    if (!editedBody.trim()) {
      toast.error("Template body cannot be empty");
      return;
    }

    if (onSelect) {
      onSelect(editedSubject, editedBody);
    } else {
      // Copy to clipboard as fallback
      const content = editedSubject
        ? `Subject: ${editedSubject}\n\n${editedBody}`
        : editedBody;
      navigator.clipboard.writeText(content);
      toast.success("Template copied to clipboard");
    }

    setIsOpen(false);
    setShowEditor(false);
    setSelectedTemplate(null);
    setSearchQuery("");
  };

  const categoryLabels: Record<string, string> = {
    response: "Quick Response",
    follow_up: "Follow-up",
    meeting: "Meeting",
    thank_you: "Thank You",
    other: "Other",
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="w-4 h-4 mr-2" />
          Use Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Templates</DialogTitle>
        </DialogHeader>

        {!showEditor ? (
          <>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates..."
                className="pl-10"
              />
            </div>

            {/* Templates List */}
            <div className="space-y-4 overflow-y-auto flex-1">
              {Object.keys(groupedTemplates).length === 0 && (
                <Card className="p-8 text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No templates found. Create some in Settings → Templates</p>
                </Card>
              )}

              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <h4 className="font-medium mb-2 text-sm text-muted-foreground">
                    {categoryLabels[category] || category}
                  </h4>
                  <div className="space-y-2">
                    {categoryTemplates.map((template) => (
                      <Card
                        key={template.id}
                        className="p-4 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => handleSelectTemplate(template)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{template.name}</span>
                              {template.subject && (
                                <Badge variant="secondary" className="text-xs">
                                  Has Subject
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {template.body}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="space-y-4 overflow-y-auto flex-1">
            {/* Template Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{selectedTemplate?.name}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditor(false);
                    setSelectedTemplate(null);
                  }}
                >
                  ← Back to Templates
                </Button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Subject (Optional)</label>
                  <Input
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    placeholder="Email subject..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Body</label>
                  <Textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    placeholder="Email body..."
                    className="mt-1 min-h-[300px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can edit the template before using it
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditor && (
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseTemplate}>
              Use Template
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
