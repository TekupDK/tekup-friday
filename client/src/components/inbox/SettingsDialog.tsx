import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InboxPreferences } from "./settings/InboxPreferences";
import { LabelManagement } from "./settings/LabelManagement";
import { RulesManagement } from "./settings/RulesManagement";
import { TemplateManagement } from "./settings/TemplateManagement";
import { AISettings } from "./settings/AISettings";

export function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Settings">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Friday AI Inbox Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="inbox" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="labels">Labels</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="ai">AI</TabsTrigger>
          </TabsList>
          <div className="overflow-y-auto mt-4" style={{ maxHeight: 'calc(80vh - 160px)' }}>
            <TabsContent value="inbox">
              <InboxPreferences />
            </TabsContent>
            <TabsContent value="labels">
              <LabelManagement />
            </TabsContent>
            <TabsContent value="rules">
              <RulesManagement />
            </TabsContent>
            <TabsContent value="templates">
              <TemplateManagement />
            </TabsContent>
            <TabsContent value="ai">
              <AISettings />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
