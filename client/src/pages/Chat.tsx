import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Loader2, LogOut, MessageCircle, Phone, Video, Clock, Check, CheckCheck, Sparkles, Sun } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

interface ChatMessage {
  id: number;
  content: string;
  senderId: number;
  senderName: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  messageType: "text" | "voice" | "video";
}

export default function Chat() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock logout
  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Simulate receiving a message
  const addMockMessage = () => {
    const mockMessage: ChatMessage = {
      id: messages.length + 1,
      content: "This is a beautiful app! 💫",
      senderId: 2,
      senderName: "Her",
      timestamp: new Date(),
      status: "read",
      messageType: "text",
    };
    setMessages([...messages, mockMessage]);
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: messages.length + 1,
      content: inputValue,
      senderId: user?.id || 1,
      senderName: user?.name || "You",
      timestamp: new Date(),
      status: "sent",
      messageType: "text",
    };

    setMessages([...messages, newMessage]);
    setInputValue("");

    // Simulate delivery
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg
        )
      );
    }, 500);

    // Simulate read
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "read" } : msg
        )
      );
    }, 1500);

    // Simulate response
    setTimeout(() => {
      addMockMessage();
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="w-4 h-4 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="w-4 h-4 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="w-4 h-4 text-accent" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-[oklch(0.70_0.10_45)] flex items-center justify-center">
              <Heart className="w-6 h-6 text-accent-foreground" fill="currentColor" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-semibold">EchoChat</h1>
              <p className="text-xs text-muted-foreground">
                {isOnline ? "Online" : "Offline"} • Just for us
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/horizon")}
              className="text-muted-foreground hover:text-accent"
              title="Shared Horizon"
            >
              <Sun className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-accent"
              title="Voice call"
            >
              <Phone className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-accent"
              title="Video call"
            >
              <Video className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/keepsakes")}
              className="text-muted-foreground hover:text-accent"
              title="View Keepsakes"
            >
              <Sparkles className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto max-w-4xl w-full mx-auto px-4 py-6 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h2 className="font-serif text-2xl font-semibold mb-2">Waiting for You</h2>
            <p className="text-muted-foreground max-w-sm">
              Start a conversation. Share your thoughts, moments, and dreams in this private space.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.senderId === user?.id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl transition-all ${
                    message.senderId === user?.id
                      ? "bg-gradient-to-r from-accent/80 to-[oklch(0.75_0.10_45)] text-accent-foreground rounded-br-none"
                      : "bg-card border border-border/50 text-foreground rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {message.senderId === user?.id && (
                      getStatusIcon(message.status)
                    )}
                  </div>
                </div>
              </div>
            ))}
            {otherUserTyping && (
              <div className="flex justify-start">
                <div className="bg-card border border-border/50 px-4 py-3 rounded-2xl rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground heartbeat"></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground heartbeat" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 rounded-full bg-muted-foreground heartbeat" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <footer className="bg-card border-t border-border/50 backdrop-blur-sm sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setIsTyping(true);
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Share your thoughts..."
              className="bg-input border-border/50 text-foreground placeholder:text-muted-foreground/50 rounded-full px-6"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              className="bg-gradient-to-r from-accent to-[oklch(0.75_0.10_45)] text-accent-foreground hover:shadow-lg hover:shadow-accent/50 transition-all rounded-full px-6 font-semibold"
            >
              Send
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
