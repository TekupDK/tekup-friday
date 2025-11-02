import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckSquare, Search, Filter, Calendar, Clock, Flag, Sparkles, Check, X, Eye, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Streamdown } from "streamdown";

// Helper functions for task styling
function getPriorityColor(priority: string): string {
  switch (priority) {
    case "urgent": return "border-l-red-500 bg-red-50/50 dark:bg-red-900/10";
    case "high": return "border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10";
    case "medium": return "border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10";
    case "low": return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10";
    default: return "border-l-gray-400";
  }
}

function getPriorityBadgeVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  if (priority === "urgent") return "destructive";
  if (priority === "high") return "default";
  return "secondary";
}

function getStatusColor(status: string): string {
  switch (status) {
    case "done": return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400";
    case "in_progress": return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400";
    case "todo": return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400";
    case "cancelled": return "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

function isOverdue(task: any): boolean {
  if (!task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

function getDateGroup(task: any): string {
  if (!task.dueDate) return "NO_DATE";
  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);

  if (dueDate < today) return "OVERDUE";
  if (dueDate.toDateString() === today.toDateString()) return "TODAY";
  if (dueDate.toDateString() === tomorrow.toDateString()) return "TOMORROW";
  if (dueDate < weekFromNow) return "THIS_WEEK";
  return "LATER";
}

export default function TasksTab() {
  const utils = trpc.useUtils();
  const { data: tasks, isLoading } = trpc.inbox.tasks.list.useQuery();
  const updateTaskStatusMutation = trpc.inbox.tasks.updateStatus.useMutation({
    onSuccess: () => {
      utils.inbox.tasks.list.invalidate();
    },
  });
  const updateTaskMutation = trpc.inbox.tasks.update.useMutation({
    onSuccess: () => {
      utils.inbox.tasks.list.invalidate();
      setEditMode(false);
    },
  });
  const deleteTaskMutation = trpc.inbox.tasks.delete.useMutation({
    onSuccess: () => {
      utils.inbox.tasks.list.invalidate();
      setSelectedTask(null);
    },
  });
  const analyzeTaskMutation = trpc.chat.analyzeInvoice.useMutation(); // Reuse for task analysis
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzingTask, setAnalyzingTask] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedTask, setEditedTask] = useState<any>(null);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    let filtered = tasks;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    return filtered;
  }, [tasks, searchQuery, statusFilter, priorityFilter]);

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    const groups: Record<string, any[]> = {
      OVERDUE: [],
      TODAY: [],
      TOMORROW: [],
      THIS_WEEK: [],
      LATER: [],
      NO_DATE: [],
    };

    filteredTasks.forEach(task => {
      const group = getDateGroup(task);
      groups[group].push(task);
    });

    return groups;
  }, [filteredTasks]);

  // Calculate stats
  const stats = tasks ? (() => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === "todo").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const done = tasks.filter(t => t.status === "done").length;
    const urgent = tasks.filter(t => t.priority === "urgent").length;
    const overdue = tasks.filter(t => isOverdue(t) && t.status !== "done").length;
    return { total, todo, inProgress, done, urgent, overdue };
  })() : null;

  // Console logging
  console.log("✅ [TasksTab] Tasks data:", tasks ? `${tasks.length} tasks` : "Loading...");
  if (tasks) {
    console.log("✅ [TasksTab] Stats:", stats);
  }

  // Handle task status update
  const handleStatusUpdate = async (taskId: number, newStatus: "todo" | "in_progress" | "done" | "cancelled") => {
    try {
      await updateTaskStatusMutation.mutateAsync({ taskId, status: newStatus });
      console.log(`✅ Task ${taskId} updated to ${newStatus}`);
    } catch (error) {
      console.error("❌ Failed to update task:", error);
    }
  };

  // Handle edit mode
  const handleEditTask = () => {
    setEditMode(true);
    setEditedTask({
      title: selectedTask.title,
      description: selectedTask.description || "",
      priority: selectedTask.priority,
      status: selectedTask.status,
      dueDate: selectedTask.dueDate ? new Date(selectedTask.dueDate).toISOString().split('T')[0] : "",
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedTask || !editedTask) return;
    
    try {
      await updateTaskMutation.mutateAsync({
        taskId: selectedTask.id,
        ...editedTask,
        dueDate: editedTask.dueDate || undefined,
      });
      setSelectedTask({ ...selectedTask, ...editedTask });
    } catch (error) {
      console.error("❌ Failed to update task:", error);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    
    if (!confirm("Er du sikker på, at du vil slette denne opgave?")) return;
    
    try {
      await deleteTaskMutation.mutateAsync({ taskId: selectedTask.id });
    } catch (error) {
      console.error("❌ Failed to delete task:", error);
    }
  };

  // Handle AI analysis
  const handleAnalyzeTask = async (task: any) => {
    setAnalyzingTask(true);
    setAiAnalysis("");
    
    try {
      const taskData = `
Task: ${task.title}
Description: ${task.description || "No description"}
Priority: ${task.priority}
Status: ${task.status}
Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('da-DK') : "Not set"}
Created: ${new Date(task.createdAt).toLocaleDateString('da-DK')}
      `.trim();
      
      const response = await analyzeTaskMutation.mutateAsync({ invoiceData: taskData });
      setAiAnalysis(response.analysis || "No analysis available");
    } catch (error) {
      console.error("❌ AI analysis failed:", error);
      setAiAnalysis("AI analysis failed. Please try again.");
    } finally {
      setAnalyzingTask(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Search & Filter Bar */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Søg opgaver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle status</SelectItem>
                <SelectItem value="todo">Todo</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Prioritet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle prioriteter</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {(statusFilter !== "all" || priorityFilter !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
                setSearchQuery("");
              }}
            >
              Ryd filtre
            </Button>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      {stats && (
        <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Total</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Todo</div>
            <div className="text-2xl font-bold text-gray-600">{stats.todo}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">In Progress</div>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
          </Card>
          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-1">Done</div>
            <div className="text-2xl font-bold text-green-600">{stats.done}</div>
          </Card>
          <Card className="p-3 border-l-4 border-l-red-500">
            <div className="text-xs text-muted-foreground mb-1">🔥 Urgent</div>
            <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
          </Card>
          <Card className="p-3 border-l-4 border-l-orange-500">
            <div className="text-xs text-muted-foreground mb-1">⚠️ Overdue</div>
            <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
          </Card>
        </div>
      )}

      {/* Grouped Tasks */}
      <ScrollArea className="h-[calc(100vh-28rem)]">
        <div className="space-y-6 pr-4">
          {Object.entries(groupedTasks).map(([group, groupTasks]) => {
            if (groupTasks.length === 0) return null;

            const groupTitle = {
              OVERDUE: "⚠️ Overdue",
              TODAY: "📅 Today",
              TOMORROW: "🔜 Tomorrow",
              THIS_WEEK: "📆 This Week",
              LATER: "🗓️ Later",
              NO_DATE: "📝 No Due Date",
            }[group];

            return (
              <div key={group} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {groupTitle}
                  </h3>
                  <Badge variant="secondary">{groupTasks.length}</Badge>
                </div>

                <div className="space-y-2">
                  {groupTasks.map((task) => (
                    <Card key={task.id} className={`p-4 border-l-4 ${getPriorityColor(task.priority)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{task.title}</p>
                            {isOverdue(task) && task.status !== "done" && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                          )}
                          {task.dueDate && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(task.dueDate).toLocaleDateString('da-DK', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Badge variant={getPriorityBadgeVariant(task.priority)}>
                            <Flag className="w-3 h-3 mr-1" />
                            {task.priority}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTask(task)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                        {task.relatedTo && (
                          <Badge variant="outline" className="text-xs">
                            {task.relatedTo}
                          </Badge>
                        )}
                        {/* Quick action buttons */}
                        {task.status !== "done" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusUpdate(task.id, "done")}
                            disabled={updateTaskStatusMutation.isPending}
                            className="ml-auto"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{searchQuery ? "Ingen opgaver matcher din søgning" : "No tasks found"}</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Task Detail Modal */}
      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => {
          setSelectedTask(null);
          setEditMode(false);
          setAiAnalysis("");
        }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Task Details
              </DialogTitle>
              <DialogDescription>
                View and analyze task details with AI assistance
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Task Info - Edit Mode or View Mode */}
              {editMode && editedTask ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input
                      id="edit-title"
                      value={editedTask.title}
                      onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                      placeholder="Task title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      value={editedTask.description}
                      onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                      placeholder="Task description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="edit-priority">Priority</Label>
                      <Select value={editedTask.priority} onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}>
                        <SelectTrigger id="edit-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select value={editedTask.status} onValueChange={(value) => setEditedTask({ ...editedTask, status: value })}>
                        <SelectTrigger id="edit-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">Todo</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-dueDate">Due Date</Label>
                    <Input
                      id="edit-dueDate"
                      type="date"
                      value={editedTask.dueDate}
                      onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} disabled={updateTaskMutation.isPending}>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{selectedTask.title}</h3>
                      {selectedTask.description && (
                        <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-3">
                      <Button variant="outline" size="sm" onClick={handleEditTask}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteTask}
                        disabled={deleteTaskMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={getStatusColor(selectedTask.status)}>{selectedTask.status}</Badge>
                    <Badge variant={getPriorityBadgeVariant(selectedTask.priority)}>
                      <Flag className="w-3 h-3 mr-1" />
                      {selectedTask.priority}
                    </Badge>
                    {isOverdue(selectedTask) && selectedTask.status !== "done" && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Created:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedTask.createdAt).toLocaleDateString('da-DK')}
                      </span>
                    </div>
                    {selectedTask.dueDate && (
                      <div>
                        <span className="text-muted-foreground">Due:</span>
                        <span className="ml-2 font-medium">
                          {new Date(selectedTask.dueDate).toLocaleDateString('da-DK')}
                        </span>
                      </div>
                    )}
                    {selectedTask.relatedTo && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Related to:</span>
                        <span className="ml-2 font-medium">{selectedTask.relatedTo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Analysis Section - Only show when not in edit mode */}
              {!editMode && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-500" />
                      AI Task Analysis
                    </h4>
                    {!aiAnalysis && (
                      <Button
                        onClick={() => handleAnalyzeTask(selectedTask)}
                        disabled={analyzingTask}
                        size="sm"
                        variant="outline"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        {analyzingTask ? "Analyzing..." : "Analyze with AI"}
                      </Button>
                    )}
                  </div>

                  {analyzingTask && (
                    <div className="space-y-2">
                      <div className="h-4 bg-muted/50 rounded animate-pulse" />
                      <div className="h-4 bg-muted/50 rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-muted/50 rounded animate-pulse w-1/2" />
                    </div>
                  )}

                  {aiAnalysis && !analyzingTask && (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <Streamdown>{aiAnalysis}</Streamdown>
                    </div>
                  )}

                  {!aiAnalysis && !analyzingTask && (
                    <p className="text-sm text-muted-foreground">
                      Click "Analyze with AI" to get intelligent insights about this task.
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons - Only show when not in edit mode */}
              {!editMode && (
                <div className="flex gap-2 border-t pt-4">
                  <Button
                    variant="default"
                    onClick={() => handleStatusUpdate(selectedTask.id, "in_progress")}
                    disabled={selectedTask.status === "in_progress"}
                  >
                    Start Task
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => handleStatusUpdate(selectedTask.id, "done")}
                    disabled={selectedTask.status === "done"}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleStatusUpdate(selectedTask.id, "cancelled")}
                    disabled={selectedTask.status === "cancelled"}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
