import { cn } from "@/lib/utils";
import { User, Bot, AlertCircle } from "lucide-react";

interface Message {
  role: "scammer" | "agent" | "system";
  content: string;
  createdAt: string;
}

interface ConversationViewerProps {
  messages: Message[];
  className?: string;
}

export function ConversationViewer({ messages, className }: ConversationViewerProps) {
  if (messages.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-64 text-muted-foreground", className)}>
        No messages yet
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 max-h-[500px] overflow-y-auto pr-2", className)}>
      {messages.map((message, idx) => (
        <div
          key={idx}
          className={cn(
            "flex gap-3 animate-slide-up",
            message.role === "agent" && "flex-row-reverse"
          )}
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <div
            className={cn(
              "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
              message.role === "scammer" && "bg-threat/20 text-threat",
              message.role === "agent" && "bg-primary/20 text-primary",
              message.role === "system" && "bg-muted text-muted-foreground"
            )}
          >
            {message.role === "scammer" && <AlertCircle className="h-4 w-4" />}
            {message.role === "agent" && <Bot className="h-4 w-4" />}
            {message.role === "system" && <User className="h-4 w-4" />}
          </div>

          <div
            className={cn(
              "flex-1 p-3 rounded-lg",
              message.role === "scammer" && "bg-threat/10 border border-threat/20",
              message.role === "agent" && "bg-primary/10 border border-primary/20",
              message.role === "system" && "bg-muted border border-border"
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className={cn(
                  "text-xs font-mono uppercase",
                  message.role === "scammer" && "text-threat",
                  message.role === "agent" && "text-primary",
                  message.role === "system" && "text-muted-foreground"
                )}
              >
                {message.role === "scammer" && "INCOMING"}
                {message.role === "agent" && "HONEYPOT"}
                {message.role === "system" && "SYSTEM"}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
        </div>
      ))}
    </div>
  );
}