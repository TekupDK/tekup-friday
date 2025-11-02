import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, X, User, LogOut } from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import InboxPanel from "@/components/InboxPanel";

/**
 * Friday Chat Interface - Main Layout
 * Split-panel design inspired by Shortwave.ai:
 * - Desktop: Split view (60% chat, 40% inbox)
 * - Mobile: Single column with drawer navigation
 */
export default function ChatInterface() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeInboxTab, setActiveInboxTab] = useState<
    "email" | "invoices" | "calendar" | "leads" | "tasks"
  >("email");
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
        {/* Left: Branding */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg transition-transform hover:scale-105">
            <span className="text-white font-bold text-sm sm:text-base">F</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Friday
            </h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              AI Assistant for TekupDK
            </p>
          </div>
        </div>

        {/* Right: User Info with Dropdown */}
        <div className="flex items-center gap-2">
          {/* Mobile Inbox Toggle */}
          <Sheet open={showMobileInbox} onOpenChange={setShowMobileInbox}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px] p-0">
              <div className="h-full">
                <InboxPanel
                  activeTab={activeInboxTab}
                  onTabChange={setActiveInboxTab}
                />
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop User Info with Dropdown Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center transition-transform hover:scale-110">
                  <span className="text-primary font-semibold text-sm">
                    {user?.name?.charAt(0) || "U"}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile User Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="md:hidden w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className="text-primary font-semibold text-sm">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm">
                <p className="font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <InboxPanel
              activeTab={activeInboxTab}
              onTabChange={setActiveInboxTab}
            />
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
