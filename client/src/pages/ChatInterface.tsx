import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { useState, useEffect } from "react";
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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Menu,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  Keyboard,
  Wifi,
  WifiOff,
} from "lucide-react";
import ChatPanel from "@/components/ChatPanel";
import InboxPanel from "@/components/InboxPanel";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Friday Chat Interface - Main Layout
 * Split-panel design inspired by Shortwave.ai:
 * - Desktop: Split view (60% chat, 40% inbox)
 * - Mobile: Single column with drawer navigation
 */
export default function ChatInterface() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, switchable } = useTheme();
  const [activeInboxTab, setActiveInboxTab] = useState<
    "email" | "invoices" | "calendar" | "leads" | "tasks"
  >("email");
  const [mobileView, setMobileView] = useState<"chat" | "inbox">("chat");
  const [showMobileInbox, setShowMobileInbox] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

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

        {/* Middle: Status Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">
                Synced
              </span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs font-medium text-muted-foreground">
                Offline
              </span>
            </>
          )}
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
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowProfile(true)}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowSettings(true)}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {switchable && toggleTheme && (
                <DropdownMenuItem
                  onClick={toggleTheme}
                  className="cursor-pointer"
                >
                  {theme === "dark" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setShowKeyboardShortcuts(true)}
                className="cursor-pointer"
              >
                <Keyboard className="mr-2 h-4 w-4" />
                <span>Keyboard Shortcuts</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
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
              <DropdownMenuItem
                onClick={() => setShowProfile(true)}
                className="cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowSettings(true)}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {switchable && toggleTheme && (
                <DropdownMenuItem
                  onClick={toggleTheme}
                  className="cursor-pointer"
                >
                  {theme === "dark" ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setShowKeyboardShortcuts(true)}
                className="cursor-pointer"
              >
                <Keyboard className="mr-2 h-4 w-4" />
                <span>Keyboard Shortcuts</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Help & Support</span>
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

      {/* Profile Dialog */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>My Profile</DialogTitle>
            <DialogDescription>
              View and manage your profile information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-semibold text-2xl">
                  {user?.name?.charAt(0) || "U"}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {user?.name || "User"}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="space-y-3 pt-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">
                    {user?.role || "User"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium text-green-500">Active</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Login Method</p>
                  <p className="font-medium capitalize">
                    {user?.loginMethod || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Customize your Friday AI experience
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Appearance</h4>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Theme</p>
                  <p className="text-xs text-muted-foreground">
                    Current: {theme === "dark" ? "Dark" : "Light"} mode
                  </p>
                </div>
                {switchable && toggleTheme && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleTheme}
                    className="gap-2"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className="h-4 w-4" />
                        Light
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        Dark
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Notifications</h4>
              <div className="p-3 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  Email and push notification settings will be available soon.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Dialog */}
      <Dialog
        open={showKeyboardShortcuts}
        onOpenChange={setShowKeyboardShortcuts}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
            <DialogDescription>
              Speed up your workflow with these keyboard shortcuts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-sm mb-2">General</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Open Command Menu</span>
                    <kbd className="px-2 py-1 text-xs font-semibold border rounded bg-muted">
                      Ctrl + K
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Search</span>
                    <kbd className="px-2 py-1 text-xs font-semibold border rounded bg-muted">
                      Ctrl + /
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Toggle Sidebar</span>
                    <kbd className="px-2 py-1 text-xs font-semibold border rounded bg-muted">
                      Ctrl + B
                    </kbd>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm mb-2">Chat</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">New Chat</span>
                    <kbd className="px-2 py-1 text-xs font-semibold border rounded bg-muted">
                      Ctrl + N
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Focus Input</span>
                    <kbd className="px-2 py-1 text-xs font-semibold border rounded bg-muted">
                      Ctrl + I
                    </kbd>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Send Message</span>
                    <kbd className="px-2 py-1 text-xs font-semibold border rounded bg-muted">
                      Ctrl + Enter
                    </kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
