import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import InboxPanel from "@/components/InboxPanel";

/**
 * Friday Chat Interface - Main Layout
 * Split-panel design inspired by Shortwave.ai:
 * - Desktop: Split view (60% chat, 40% inbox)
 * - Mobile: Single column with drawer navigation
 */
export default function ChatInterface() {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeInboxTab, setActiveInboxTab] = useState<"email" | "invoices" | "calendar" | "leads" | "tasks">("email");
  const [mobileView, setMobileView] = useState<"chat" | "inbox">("chat");
  const [showMobileInbox, setShowMobileInbox] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full p-6 sm:p-8 space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Friday
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
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
      <header className="border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm sm:text-base">F</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Friday</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">AI Assistant for TekupDK</p>
          </div>
        </div>
        
        {/* Desktop User Info */}
        <div className="hidden md:flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-semibold text-sm">{user?.name?.charAt(0) || 'U'}</span>
          </div>
        </div>

        {/* Mobile Inbox Toggle */}
        <Sheet open={showMobileInbox} onOpenChange={setShowMobileInbox}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0">
            <div className="h-full">
              <InboxPanel activeTab={activeInboxTab} onTabChange={setActiveInboxTab} />
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile User Avatar */}
        <div className="md:hidden w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-semibold text-sm">{user?.name?.charAt(0) || 'U'}</span>
        </div>
      </header>

      {/* Main Content */}
      {/* Desktop: Split Panel */}
      <div className="hidden md:flex flex-1 overflow-hidden min-h-0">
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

      {/* Mobile: Single Column */}
      <div className="flex md:hidden flex-1 overflow-hidden min-h-0">
        <ChatPanel />
      </div>
    </div>
  );
}
