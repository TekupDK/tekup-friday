import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Clock, User } from "lucide-react";
import { useState, useMemo } from "react";

export default function CalendarTab() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  
  // Calculate date range: 7 days before to 30 days after selected date
  const dateRange = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(selectedDate);
    end.setDate(end.getDate() + 30);
    end.setHours(23, 59, 59, 999);
    
    return {
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
    };
  }, [selectedDate]);
  
  const { data: events, isLoading, isFetching } = trpc.inbox.calendar.list.useQuery(dateRange, {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    refetchIntervalInBackground: true,
  });

  // Debug: Log events data
  console.log('🔥 [HOT RELOAD ACTIVE] Events data:', events);
  console.log('📅 [CalendarTab] Selected date:', selectedDate);
  console.log('📅 [CalendarTab] Date range:', dateRange);

  // Filter events for selected date
  const dayEvents = useMemo(() => {
    if (!events) {
      console.log('[CalendarTab] No events data');
      return [];
    }
    
    console.log('[CalendarTab] Filtering events:', events.length, 'total events');
    
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const filtered = events.filter((event: any) => {
      // Backend returns start/end as strings, not objects
      const eventStart = new Date(event.start);
      console.log('[CalendarTab] Event:', event.summary, 'Start:', eventStart, 'Day range:', startOfDay, '-', endOfDay);
      return eventStart >= startOfDay && eventStart <= endOfDay;
    });
    
    console.log('[CalendarTab] Filtered events for day:', filtered.length);
    return filtered;
  }, [events, selectedDate]);

  // Generate hourly slots (7:00 - 20:00)
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  const getEventPosition = (event: any) => {
    // Backend returns start/end as strings, not objects
    const start = new Date(event.start);
    const end = new Date(event.end);
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
                onClick={() => setSelectedEvent(event)}
                className={`absolute left-2 right-2 ${eventColor} text-white rounded-md p-2 overflow-hidden border-l-4 border-primary cursor-pointer hover:opacity-90 transition-opacity`}
                style={position}
              >
                <div className="text-xs font-medium truncate">{event.summary}</div>
                <div className="text-xs opacity-90">
                  {new Date(event.start).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                  {' - '}
                  {new Date(event.end).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
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

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {selectedEvent?.summary || 'Event Details'}
            </DialogTitle>
            <DialogDescription>
              {selectedEvent && new Date(selectedEvent.start).toLocaleDateString('da-DK', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 mt-4">
              {/* Time */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">Tidspunkt</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(selectedEvent.start).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                    {' - '}
                    {new Date(selectedEvent.end).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Varighed: {Math.round((new Date(selectedEvent.end).getTime() - new Date(selectedEvent.start).getTime()) / (1000 * 60))} minutter
                  </div>
                </div>
              </div>

              {/* Location */}
              {selectedEvent.location && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Lokation</div>
                    <div className="text-sm text-muted-foreground">{selectedEvent.location}</div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedEvent.description && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">Beskrivelse</div>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedEvent.description}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedEvent(null)}>
                  Luk
                </Button>
                <Button variant="default" className="flex-1">
                  Rediger
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
