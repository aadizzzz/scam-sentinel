import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "threat" | "success" | "warning";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
}: MetricCardProps) {
  const variantStyles = {
    default: "gradient-cyber border-border",
    threat: "gradient-threat border-threat/30",
    success: "border-primary/30",
    warning: "border-warning/30",
  };

  const iconStyles = {
    default: "text-accent",
    threat: "text-threat",
    success: "text-primary",
    warning: "text-warning",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card p-5 transition-all hover:border-primary/50",
        variantStyles[variant]
      )}
    >
      <div className="absolute inset-0 scanline pointer-events-none opacity-50" />
      
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className="text-3xl font-bold font-mono tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={cn(
              "inline-flex items-center gap-1 text-xs font-mono",
              trend === "up" && "text-primary",
              trend === "down" && "text-threat",
              trend === "neutral" && "text-muted-foreground"
            )}>
              {trend === "up" && "↑"}
              {trend === "down" && "↓"}
              {trend === "neutral" && "→"}
              {trendValue}
            </div>
          )}
        </div>
        
        <div className={cn(
          "p-2.5 rounded-lg bg-secondary/50",
          iconStyles[variant]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}