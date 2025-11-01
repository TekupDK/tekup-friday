import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, FileText, Calendar, Users, CheckSquare } from "lucide-react";
import EmailTab from "@/components/inbox/EmailTab";
import InvoicesTab from "@/components/inbox/InvoicesTab";
import CalendarTab from "@/components/inbox/CalendarTab";
import LeadsTab from "@/components/inbox/LeadsTab";
import TasksTab from "@/components/inbox/TasksTab";

interface InboxPanelProps {
  activeTab: "email" | "invoices" | "calendar" | "leads" | "tasks";
  onTabChange: (tab: "email" | "invoices" | "calendar" | "leads" | "tasks") => void;
}

export default function InboxPanel({ activeTab, onTabChange }: InboxPanelProps) {
  return (
    <div className="h-full flex flex-col bg-muted/30">
      <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as any)} className="flex-1 flex flex-col">
        <div className="border-b border-border px-2 sm:px-4">
          <TabsList className="w-full justify-start bg-transparent gap-1">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Email</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Invoices</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Leads</span>
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Tasks</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          <TabsContent value="email" className="m-0 p-3 sm:p-4">
            <EmailTab />
          </TabsContent>
          <TabsContent value="invoices" className="m-0 p-3 sm:p-4">
            <InvoicesTab />
          </TabsContent>
          <TabsContent value="calendar" className="m-0 p-3 sm:p-4">
            <CalendarTab />
          </TabsContent>
          <TabsContent value="leads" className="m-0 p-3 sm:p-4">
            <LeadsTab />
          </TabsContent>
          <TabsContent value="tasks" className="m-0 p-3 sm:p-4">
            <TasksTab />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
