import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";

export default function CalendarTab() {
  const { data: events, isLoading } = trpc.inbox.calendar.list.useQuery({});

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading calendar...</div>;
  }

  return (
    <div className="space-y-2">
      {events && events.length > 0 ? (
        events.map((event: any) => (
          <Card key={event.id} className="p-4">
            <p className="font-medium">{event.summary}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(event.start.dateTime).toLocaleString()}
            </p>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No events found</p>
        </div>
      )}
    </div>
  );
}
