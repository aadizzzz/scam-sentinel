import { Shield, Terminal, Activity } from "lucide-react";

interface HeaderProps {
  activeConversations: number;
  totalScamsDetected: number;
}

export function Header({ activeConversations, totalScamsDetected }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Shield className="h-8 w-8 text-primary" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full animate-pulse-glow" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Scam Honeypot
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              INTELLIGENCE EXTRACTION SYSTEM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-primary" />
            <span className="font-mono">
              <span className="text-primary">{activeConversations}</span>
              <span className="text-muted-foreground"> active</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Terminal className="h-4 w-4 text-threat" />
            <span className="font-mono">
              <span className="text-threat">{totalScamsDetected}</span>
              <span className="text-muted-foreground"> scams</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}