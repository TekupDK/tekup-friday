import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

const COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Red", value: "#EF4444" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Gray", value: "#6B7280" },
];

export function LabelManagement() {
  const { data: labels, refetch } = trpc.inbox.labels.list.useQuery();
  const createMutation = trpc.inbox.labels.create.useMutation({
    onSuccess: () => {
      toast.success("Label created successfully");
      refetch();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create label: ${error.message}`);
    },
  });
  const deleteMutation = trpc.inbox.labels.delete.useMutation({
    onSuccess: () => {
      toast.success("Label deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete label: ${error.message}`);
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0].value);

  const resetForm = () => {
    setName("");
    setColor(COLORS[0].value);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error("Please enter a label name");
      return;
    }
    createMutation.mutate({ name: name.trim(), color });
  };

  const handleDelete = (labelId: number) => {
    if (confirm("Are you sure you want to delete this label?")) {
      deleteMutation.mutate({ labelId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Email Labels</h3>
          <p className="text-sm text-muted-foreground">Create custom labels to organize your emails</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Label
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Label</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Label Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Important, Follow-up, Urgent"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {COLORS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`h-10 rounded-md border-2 transition-all ${
                        color === c.value ? "border-foreground scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>Preview</Label>
                <div className="mt-2">
                  <Badge style={{ backgroundColor: color, color: "#fff" }}>{name || "Label Name"}</Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creating..." : "Create Label"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Labels List */}
      <div className="space-y-2">
        {labels && labels.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No labels created yet. Click "New Label" to get started.</p>
          </Card>
        )}
        {labels?.map((label) => (
          <Card key={label.id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge style={{ backgroundColor: label.color || "#6B7280", color: "#fff" }}>
                {label.name}
              </Badge>
              <span className="text-sm text-muted-foreground">Created {new Date(label.createdAt).toLocaleDateString()}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(label.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
