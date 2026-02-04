import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { MessageSquare, Clock, AlertTriangle, ExternalLink } from "lucide-react";

interface ConversationCardProps {
  id: string;
  conversationId: string;
  scamDetected: boolean;
  turnCount: number;
  status: "active" | "completed" | "expired";
  createdAt: string;
  intelligenceCount: number;
  onClick?: () => void;
}

export function ConversationCard({
  conversationId,
  scamDetected,
  turnCount,
  status,
  createdAt,
  intelligenceCount,
  onClick,
}: ConversationCardProps) {
  const truncatedId = conversationId.slice(0, 8) + "...";
  const timeAgo = getTimeAgo(new Date(createdAt));

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all group",
        "bg-card hover:bg-secondary/30 hover:border-primary/50",
        scamDetected && status === "active" && "border-threat/40 hover:border-threat/60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-foreground group-hover:text-primary transition-colors">
              {truncatedId}
            </code>
            {scamDetected && (
              <StatusBadge status="threat" />
            )}
            {!scamDetected && (
              <StatusBadge status="safe" />
            )}
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {turnCount} turns
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
            {intelligenceCount > 0 && (
              <span className="flex items-center gap-1 text-warning">
                <AlertTriangle className="h-3 w-3" />
                {intelligenceCount} intel
              </span>
            )}
          </div>
        </div>
        
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}