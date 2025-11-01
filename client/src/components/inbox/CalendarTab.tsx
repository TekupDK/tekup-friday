import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

export default function CalendarTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { data: events, isLoading, isFetching } = trpc.inbox.calendar.list.useQuery({}, {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: true,
  });

  // Filter events for selected date
  const dayEvents = useMemo(() => {
    if (!events) return [];
    
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    return events.filter((event: any) => {
      const eventStart = new Date(event.start.dateTime || event.start.date);
      return eventStart >= startOfDay && eventStart <= endOfDay;
    });
  }, [events, selectedDate]);

  // Generate hourly slots (7:00 - 20:00)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  const getEventPosition = (event: any) => {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    return {
      top: `${(startHour - 7) * 80}px`,
      height: `${(endHour - startHour) * 80}px`,
    };
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading calendar...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateDay('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-medium">
            {selectedDate.toLocaleDateString('da-DK', { weekday: 'short', day: 'numeric', month: 'short' })}
          </h3>
          <Button variant="outline" size="icon" onClick={() => navigateDay('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date())}>
          Today
        </Button>
      </div>

      {/* Hourly Grid */}
      <div className="relative border rounded-lg overflow-hidden bg-background">
        {/* Time Labels */}
        <div className="absolute left-0 top-0 w-16 bg-muted/30 border-r">
          {hours.map(hour => (
            <div key={hour} className="h-20 border-b flex items-start justify-end pr-2 pt-1">
              <span className="text-xs text-muted-foreground">{hour}:00</span>
            </div>
          ))}
        </div>

        {/* Event Container */}
        <div className="ml-16 relative" style={{ height: `${hours.length * 80}px` }}>
          {/* Grid Lines */}
          {hours.map(hour => (
            <div key={hour} className="h-20 border-b" />
          ))}

          {/* Events */}
          {dayEvents.map((event: any) => {
            const position = getEventPosition(event);
            const eventColor = event.summary?.toLowerCase().includes('flytterengøring') 
              ? 'bg-red-900/80' 
              : 'bg-primary/80';

            return (
              <div
                key={event.id}
                className={`absolute left-2 right-2 ${eventColor} text-white rounded-md p-2 overflow-hidden border-l-4 border-primary`}
                style={position}
              >
                <div className="text-xs font-medium truncate">{event.summary}</div>
                <div className="text-xs opacity-90">
                  {new Date(event.start.dateTime).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(event.end.dateTime).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}

          {/* Current Time Indicator */}
          {selectedDate.toDateString() === new Date().toDateString() && (() => {
            const now = new Date();
            const currentHour = now.getHours() + now.getMinutes() / 60;
            if (currentHour >= 7 && currentHour <= 20) {
              return (
                <div
                  className="absolute left-0 right-0 border-t-2 border-orange-500"
                  style={{ top: `${(currentHour - 7) * 80}px` }}
                >
                  <div className="w-2 h-2 bg-orange-500 rounded-full -mt-1" />
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {dayEvents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No events scheduled for this day</p>
        </div>
      )}
    </div>
  );
}
