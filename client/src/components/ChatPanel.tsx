import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { Send, Plus, Paperclip, Mic, Bot } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, refetch: refetchConversations } = trpc.chat.list.useQuery();
  const { data: conversationData, refetch: refetchMessages } = trpc.chat.get.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId }
  );

  const createConversation = trpc.chat.create.useMutation({
    onSuccess: (data) => {
      setSelectedConversationId(data.id);
      refetchConversations();
    },
  });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      refetchMessages();
      setInputMessage("");
    },
    onError: (error) => {
      toast.error("Failed to send message: " + error.message);
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

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Voice input not supported in this browser");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

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
    <div className="h-full flex">
      {/* Conversation List Sidebar */}
      <div className="w-64 border-r border-border flex flex-col">
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
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  selectedConversationId === conv.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <div className="font-medium truncate">{conv.title || "New Conversation"}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(conv.updatedAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-6 max-w-3xl mx-auto">
                {conversationData?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <Streamdown>{message.content}</Streamdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border p-4">
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
  );
}
