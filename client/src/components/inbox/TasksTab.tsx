import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckSquare } from "lucide-react";

export default function TasksTab() {
  const { data: tasks, isLoading } = trpc.inbox.tasks.list.useQuery();

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>;
  }

  return (
    <div className="space-y-2">
      {tasks && tasks.length > 0 ? (
        tasks.map((task) => (
          <Card key={task.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="font-medium">{task.title}</p>
              <Badge variant={task.priority === "urgent" ? "destructive" : "secondary"}>{task.priority}</Badge>
            </div>
            <Badge variant="outline">{task.status}</Badge>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No tasks found</p>
        </div>
      )}
    </div>
  );
}
