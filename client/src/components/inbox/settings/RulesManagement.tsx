import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export function RulesManagement() {
  const { data: rules, refetch } = trpc.inbox.rules.list.useQuery();
  const toggleMutation = trpc.inbox.rules.toggleEnabled.useMutation({
    onSuccess: () => {
      toast.success("Rule updated successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update rule: ${error.message}`);
    },
  });
  const deleteMutation = trpc.inbox.rules.delete.useMutation({
    onSuccess: () => {
      toast.success("Rule deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete rule: ${error.message}`);
    },
  });

  const [expandedRules, setExpandedRules] = useState<Set<number>>(new Set());

  const toggleExpanded = (ruleId: number) => {
    setExpandedRules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ruleId)) {
        newSet.delete(ruleId);
      } else {
        newSet.add(ruleId);
      }
      return newSet;
    });
  };

  const handleToggle = (ruleId: number, isEnabled: boolean) => {
    toggleMutation.mutate({ ruleId, isEnabled });
  };

  const handleDelete = (ruleId: number) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      deleteMutation.mutate({ ruleId });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Email Rules</h3>
          <p className="text-sm text-muted-foreground">Automate email management with custom rules</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Rule
        </Button>
      </div>

      {/* Rule Templates */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Quick Templates</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm">
            📧 Newsletters → Promotions
          </Button>
          <Button variant="outline" size="sm">
            📅 Meeting Invites → Calendar
          </Button>
          <Button variant="outline" size="sm">
            🧾 Receipts → Updates
          </Button>
          <Button variant="outline" size="sm">
            ⭐ Important Clients → Starred
          </Button>
        </div>
      </Card>

      {/* Rules List */}
      <div className="space-y-2">
        {rules && rules.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No rules created yet. Use templates or click "New Rule" to get started.</p>
          </Card>
        )}
        {rules?.map((rule) => {
          const isExpanded = expandedRules.has(rule.id);
          return (
            <Card key={rule.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <Switch
                    checked={rule.isEnabled}
                    onCheckedChange={(checked) => handleToggle(rule.id, checked)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{rule.name}</span>
                      <Badge variant="outline">Priority: {rule.priority || 0}</Badge>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => toggleExpanded(rule.id)}>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(rule.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t space-y-3 text-sm">
                  <div>
                    <span className="font-medium">Conditions: </span>
                    <span className="text-muted-foreground">
                      {rule.conditions.type === 'all' ? 'All' : 'Any'} of {rule.conditions.rules.length} rules
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Actions: </span>
                    <span className="text-muted-foreground">
                      {rule.actions.length} action{rule.actions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(rule.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
