import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Clock, Calendar, Sun, Sunset, Coffee } from "lucide-react";

interface SnoozePickerModalProps {
  threadId: number;
  gmailThreadId: string;
  onSnooze?: () => void;
}

export function SnoozePickerModal({ threadId, gmailThreadId, onSnooze }: SnoozePickerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [customTime, setCustomTime] = useState("");

  const snoozeMutation = trpc.inbox.snooze.snooze.useMutation({
    onSuccess: () => {
      toast.success("Email snoozed successfully");
      setIsOpen(false);
      if (onSnooze) onSnooze();
    },
    onError: (error) => {
      toast.error(`Failed to snooze: ${error.message}`);
    },
  });

  const getSnoozeTime = (hours: number): Date => {
    const now = new Date();
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  };

  const getNextWeekday = (dayOfWeek: number): Date => {
    const now = new Date();
    const daysUntil = (dayOfWeek + 7 - now.getDay()) % 7 || 7;
    const target = new Date(now.getTime() + daysUntil * 24 * 60 * 60 * 1000);
    target.setHours(9, 0, 0, 0); // 9 AM
    return target;
  };

  const handleQuickSnooze = (snoozeUntil: Date) => {
    snoozeMutation.mutate({
      threadId,
      gmailThreadId,
      snoozeUntil,
      reminder,
    });
  };

  const handleCustomSnooze = () => {
    if (!customDate) {
      toast.error("Please select a date");
      return;
    }
    const snoozeUntil = new Date(`${customDate}T${customTime || "09:00"}`);
    if (snoozeUntil <= new Date()) {
      toast.error("Please select a future date and time");
      return;
    }
    snoozeMutation.mutate({
      threadId,
      gmailThreadId,
      snoozeUntil,
      reminder,
    });
  };

  const quickOptions = [
    { label: "Later today", subtitle: "4 hours", icon: Coffee, getTime: () => getSnoozeTime(4) },
    { label: "This evening", subtitle: "6 PM", icon: Sunset, getTime: () => {
      const target = new Date();
      target.setHours(18, 0, 0, 0);
      return target > new Date() ? target : getSnoozeTime(12);
    }},
    { label: "Tomorrow", subtitle: "9 AM", icon: Sun, getTime: () => {
      const target = new Date();
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
      return target;
    }},
    { label: "This weekend", subtitle: "Saturday", icon: Calendar, getTime: () => getNextWeekday(6) },
    { label: "Next week", subtitle: "Monday", icon: Calendar, getTime: () => getNextWeekday(1) },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Clock className="w-4 h-4 mr-2" />
          Snooze
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Snooze Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quick Options */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Quick Snooze</h4>
            <div className="space-y-2">
              {quickOptions.map((option, index) => (
                <Card
                  key={index}
                  className="p-3 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleQuickSnooze(option.getTime())}
                >
                  <div className="flex items-center gap-3">
                    <option.icon className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.subtitle}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Custom Date/Time */}
          <div>
            <h4 className="font-medium mb-3 text-sm">Custom Snooze</h4>
            <div className="space-y-3">
              <div>
                <Label>Date</Label>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label>Time (Optional)</Label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <Button
                onClick={handleCustomSnooze}
                disabled={!customDate || snoozeMutation.isPending}
                className="w-full"
              >
                {snoozeMutation.isPending ? "Snoozing..." : "Snooze Until"}
              </Button>
            </div>
          </div>

          {/* Reminder Option */}
          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <Label>Set Reminder</Label>
              <p className="text-xs text-muted-foreground">Get notified when email returns</p>
            </div>
            <Switch checked={reminder} onCheckedChange={setReminder} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
