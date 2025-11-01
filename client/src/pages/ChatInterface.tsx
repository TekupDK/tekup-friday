import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ChatPanel from "@/components/ChatPanel";
import InboxPanel from "@/components/InboxPanel";

/**
 * Friday Chat Interface - Main Layout
 * Split-panel design inspired by Shortwave.ai:
 * - Left (60%): Chat interface with Friday AI
 * - Right (40%): Unified inbox (Email, Invoices, Calendar, Leads, Tasks)
 */
export default function ChatInterface() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeInboxTab, setActiveInboxTab] = useState<"email" | "invoices" | "calendar" | "leads" | "tasks">("email");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Friday
            </h1>
            <p className="text-muted-foreground">
              Your intelligent AI assistant for TekupDK operations
            </p>
          </div>
          <Button asChild size="lg" className="w-full">
            <a href={getLoginUrl()}>Sign in to continue</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          <h1 className="text-xl font-semibold">Friday</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
        </div>
      </header>

      {/* Main Content - Split Panel */}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        {/* Chat Panel (Left - 60%) */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <ChatPanel />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Inbox Panel (Right - 40%) */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <InboxPanel activeTab={activeInboxTab} onTabChange={setActiveInboxTab} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
