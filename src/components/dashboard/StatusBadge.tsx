import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "completed" | "expired" | "threat" | "safe";
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variants = {
    active: "bg-primary/20 text-primary border-primary/40 box-glow-primary",
    completed: "bg-muted text-muted-foreground border-border",
    expired: "bg-muted/50 text-muted-foreground/60 border-border/50",
    threat: "bg-threat/20 text-threat border-threat/40 box-glow-threat animate-pulse-glow",
    safe: "bg-accent/20 text-accent border-accent/40",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded border",
        variants[status],
        className
      )}
    >
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === "active" && "bg-primary",
        status === "completed" && "bg-muted-foreground",
        status === "expired" && "bg-muted-foreground/50",
        status === "threat" && "bg-threat",
        status === "safe" && "bg-accent"
      )} />
      {status.toUpperCase()}
    </span>
  );
}