import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Send, Plus, Paperclip, Mic, Bot } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { ActionApprovalModal, type PendingAction } from "./ActionApprovalModal";

interface Message {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
}

export default function ChatPanel() {
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"gemini-2.5-flash" | "claude-3-5-sonnet" | "gpt-4o" | "manus-ai">("gemini-2.5-flash");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, refetch: refetchConversations } = trpc.chat.list.useQuery();
  const { data: conversationData, refetch: refetchMessages } = trpc.chat.get.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId }
  );

  // Poll for title updates when conversation has no title
  useEffect(() => {
    if (!conversationData?.conversation) return;
    
    const needsTitleUpdate = !conversationData.conversation.title || conversationData.conversation.title === "New Conversation";
    if (!needsTitleUpdate) return;

    const interval = setInterval(() => {
      refetchMessages();
      refetchConversations();
    }, 3000);

    return () => clearInterval(interval);
  }, [conversationData?.conversation, refetchMessages, refetchConversations]);

  const createConversation = trpc.chat.create.useMutation({
    onSuccess: (data) => {
      setSelectedConversationId(data.id);
      refetchConversations();
    },
  });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      refetchMessages();
      setInputMessage("");
      
      // Check if there's a pending action
      if (data.pendingAction) {
        setPendingAction(data.pendingAction);
        setShowApprovalModal(true);
      }
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
    },
  });

  const executeAction = trpc.chat.executeAction.useMutation({
    onSuccess: () => {
      refetchMessages();
      setPendingAction(null);
      setShowApprovalModal(false);
      toast.success("Handling udført!");
    },
    onError: (error) => {
      toast.error("Kunne ikke udføre handling: " + error.message);
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationData?.messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    if (!selectedConversationId) {
      // Create new conversation first
      createConversation.mutate(
        { title: inputMessage.slice(0, 50) },
        {
          onSuccess: (data) => {
            sendMessage.mutate({
              conversationId: data.id,
              content: inputMessage,
              model: selectedModel,
            });
          },
        }
      );
    } else {
      sendMessage.mutate({
        conversationId: selectedConversationId,
        content: inputMessage,
        model: selectedModel,
      });
    }
  };

  const handleApproveAction = (alwaysApprove: boolean) => {
    if (!pendingAction || !selectedConversationId) return;

    // TODO: Store "always approve" preference if enabled
    if (alwaysApprove) {
      console.log(`[Action Approval] User enabled auto-approve for: ${pendingAction.type}`);
      // Store in localStorage or user preferences
      localStorage.setItem(`auto-approve-${pendingAction.type}`, "true");
    }

    executeAction.mutate({
      conversationId: selectedConversationId,
      actionId: pendingAction.id,
      actionType: pendingAction.type,
      actionParams: pendingAction.params,
    });
  };

  const handleRejectAction = () => {
    setPendingAction(null);
    setShowApprovalModal(false);
    toast.info("Handling afvist");
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Voice input not supported in this browser");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "da-DK"; // Danish language

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      toast.error("Voice recognition error: " + event.error);
      setIsRecording(false);
    };

    recognition.start();
  };

  return (
    <>
      <div className="h-full flex">
        {/* Conversation List Sidebar - Hidden on mobile */}
        <div className="hidden sm:flex w-48 md:w-64 border-r border-border flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <Button
              onClick={() => createConversation.mutate({ title: "New Conversation" })}
              className="w-full"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {conversations?.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                    selectedConversationId === conv.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-accent/50 hover:shadow-sm"
                  }`}
                >
                  <div className="font-medium truncate">
                    {conv.title && conv.title !== "New Conversation" ? conv.title : (
                      <span className="text-muted-foreground italic">
                        Ny samtale {new Date(conv.createdAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-70">
                    {new Date(conv.updatedAt).toLocaleDateString('da-DK', { day: '2-digit', month: 'short' })}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 flex flex-col min-h-0 w-full">
          {selectedConversationId ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-6" ref={scrollRef}>
                <div className="space-y-6 max-w-3xl mx-auto">
                  {conversationData?.messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.role === "system"
                            ? "bg-muted/50 text-muted-foreground text-xs border border-border"
                            : "bg-muted border border-border"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <Streamdown>{message.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {sendMessage.isPending && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-muted border border-border rounded-2xl px-4 py-3 shadow-sm">
                        <div className="flex gap-1.5">
                          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t border-border p-3 sm:p-4">
                <div className="max-w-3xl mx-auto space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bot className="w-4 h-4" />
                    <Select value={selectedModel} onValueChange={(value: any) => setSelectedModel(value)}>
                      <SelectTrigger className="w-[200px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="manus-ai">Manus AI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Input
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                      placeholder="Message Friday..."
                      className="flex-1"
                    />
                    <Button
                      variant={isRecording ? "destructive" : "outline"}
                      size="icon"
                      onClick={handleVoiceInput}
                      className="shrink-0"
                    >
                      <Mic className={`w-4 h-4 ${isRecording ? "animate-pulse" : ""}`} />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || sendMessage.isPending}
                      size="icon"
                      className="shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-4">
                <div className="text-6xl">💬</div>
                <p className="text-lg">Select a conversation or start a new chat</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Approval Modal */}
      <ActionApprovalModal
        action={pendingAction}
        open={showApprovalModal}
        onApprove={handleApproveAction}
        onReject={handleRejectAction}
      />
    </>
  );
}
