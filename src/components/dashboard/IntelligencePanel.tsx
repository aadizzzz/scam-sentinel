import { cn } from "@/lib/utils";
import { CreditCard, Smartphone, Link, Phone, Mail, Copy, Check } from "lucide-react";
import { useState } from "react";

interface IntelligenceItem {
  type: "bank_account" | "upi_id" | "phishing_url" | "phone_number" | "email";
  value: string;
  extractedAt: string;
}

interface IntelligencePanelProps {
  items: IntelligenceItem[];
  className?: string;
}

const typeConfig = {
  bank_account: {
    icon: CreditCard,
    label: "Bank Account",
    color: "text-warning",
  },
  upi_id: {
    icon: Smartphone,
    label: "UPI ID",
    color: "text-primary",
  },
  phishing_url: {
    icon: Link,
    label: "Phishing URL",
    color: "text-threat",
  },
  phone_number: {
    icon: Phone,
    label: "Phone Number",
    color: "text-accent",
  },
  email: {
    icon: Mail,
    label: "Email",
    color: "text-muted-foreground",
  },
};

export function IntelligencePanel({ items, className }: IntelligencePanelProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const copyToClipboard = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, IntelligenceItem[]>);

  if (items.length === 0) {
    return (
      <div className={cn("p-6 rounded-lg border border-dashed border-border bg-card/50", className)}>
        <p className="text-sm text-muted-foreground text-center">
          No intelligence extracted yet
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {Object.entries(groupedItems).map(([type, typeItems]) => {
        const config = typeConfig[type as keyof typeof typeConfig];
        const Icon = config.icon;

        return (
          <div key={type} className="space-y-2">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-4 w-4", config.color)} />
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {config.label}
              </span>
              <span className="text-xs font-mono text-muted-foreground/60">
                ({typeItems.length})
              </span>
            </div>

            <div className="space-y-1">
              {typeItems.map((item, idx) => (
                <div
                  key={idx}
                  className="group flex items-center justify-between p-2 rounded bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <code className={cn(
                    "text-sm font-mono truncate",
                    type === "phishing_url" ? "text-threat" : "text-foreground"
                  )}>
                    {item.value}
                  </code>
                  <button
                    onClick={() => copyToClipboard(item.value)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background rounded"
                  >
                    {copiedValue === item.value ? (
                      <Check className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}