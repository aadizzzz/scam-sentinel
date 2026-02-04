import { useState } from "react";
import { cn } from "@/lib/utils";
import { Play, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function ApiTester() {
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState("");
  const [response, setResponse] = useState<object | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "gemccyscdcudahvfqeyk";
  const apiEndpoint = `https://${projectId}.supabase.co/functions/v1/honeypot`;

  const handleSubmit = async () => {
    if (!apiKey || !message) return;

    setLoading(true);
    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId || undefined,
        }),
      });

      const data = await res.json();
      setResponse(data);

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }
    } catch (error) {
      setResponse({ error: "Failed to connect to API" });
    } finally {
      setLoading(false);
    }
  };

  const copyEndpoint = async () => {
    await navigator.clipboard.writeText(apiEndpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          API Endpoint
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 p-2.5 rounded bg-secondary text-sm font-mono text-muted-foreground overflow-x-auto">
            POST {apiEndpoint}
          </code>
          <Button
            variant="outline"
            size="icon"
            onClick={copyEndpoint}
            className="shrink-0"
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            API Key (x-api-key header)
          </label>
          <Input
            type="password"
            placeholder="hp_..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="font-mono"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Conversation ID (optional)
          </label>
          <Input
            placeholder="Leave empty to start new"
            value={conversationId}
            onChange={(e) => setConversationId(e.target.value)}
            className="font-mono"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Scam Message
        </label>
        <Textarea
          placeholder="Enter a sample scam message to test..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="font-mono resize-none"
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !apiKey || !message}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            Send Request
          </>
        )}
      </Button>

      {response && (
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
            Response
          </label>
          <pre className={cn(
            "p-4 rounded-lg bg-secondary overflow-x-auto text-sm font-mono",
            "max-h-80 overflow-y-auto"
          )}>
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}