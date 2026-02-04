import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/dashboard/Header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ConversationCard } from "@/components/dashboard/ConversationCard";
import { IntelligencePanel } from "@/components/dashboard/IntelligencePanel";
import { ConversationViewer } from "@/components/dashboard/ConversationViewer";
import { ApiTester } from "@/components/dashboard/ApiTester";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield,
  MessageSquare,
  AlertTriangle,
  Database,
  Activity,
  Code,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  conversation_id: string;
  scam_detected: boolean;
  agent_active: boolean;
  turn_count: number;
  status: "active" | "completed" | "expired";
  created_at: string;
}

interface Intelligence {
  id: string;
  conversation_id: string;
  intelligence_type: string;
  value: string;
  extracted_at: string;
}

interface Message {
  id: string;
  conversation_id: string;
  role: "scammer" | "agent" | "system";
  content: string;
  created_at: string;
}

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [intelligence, setIntelligence] = useState<Intelligence[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      const [convResult, intelResult] = await Promise.all([
        supabase
          .from("honeypot_conversations")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("extracted_intelligence")
          .select("*")
          .order("extracted_at", { ascending: false })
          .limit(100),
      ]);

      if (convResult.data) setConversations(convResult.data as Conversation[]);
      if (intelResult.data) setIntelligence(intelResult.data as Intelligence[]);
      setLoading(false);
    };

    fetchData();

    // Subscribe to realtime updates
    const conversationsChannel = supabase
      .channel("conversations-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "honeypot_conversations" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setConversations((prev) => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === (payload.new as Conversation).id
                  ? (payload.new as Conversation)
                  : c
              )
            );
          }
        }
      )
      .subscribe();

    const intelligenceChannel = supabase
      .channel("intelligence-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "extracted_intelligence" },
        (payload) => {
          setIntelligence((prev) => [payload.new as Intelligence, ...prev]);
        }
      )
      .subscribe();

    return () => {
      conversationsChannel.unsubscribe();
      intelligenceChannel.unsubscribe();
    };
  }, []);

  // Fetch messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("conversation_messages")
        .select("*")
        .eq("conversation_id", selectedConversation)
        .order("created_at", { ascending: true });

      if (data) setMessages(data as Message[]);
    };

    fetchMessages();
  }, [selectedConversation]);

  // Calculate metrics
  const activeConversations = conversations.filter((c) => c.status === "active").length;
  const totalScamsDetected = conversations.filter((c) => c.scam_detected).length;
  const totalTurns = conversations.reduce((acc, c) => acc + c.turn_count, 0);
  const intelligenceByType = intelligence.reduce((acc, i) => {
    acc[i.intelligence_type] = (acc[i.intelligence_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get intelligence counts per conversation
  const conversationIntelCounts = intelligence.reduce((acc, i) => {
    acc[i.conversation_id] = (acc[i.conversation_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get selected conversation intelligence
  const selectedIntelligence = intelligence.filter(
    (i) => i.conversation_id === selectedConversation
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Shield className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground font-mono">Loading system...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 scanline pointer-events-none opacity-30" />

      <Header
        activeConversations={activeConversations}
        totalScamsDetected={totalScamsDetected}
      />

      <main className="container px-4 py-6 space-y-6">
        {/* Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Active Conversations"
            value={activeConversations}
            subtitle="Currently engaging"
            icon={Activity}
            variant="success"
          />
          <MetricCard
            title="Scams Detected"
            value={totalScamsDetected}
            subtitle="Auto-classified threats"
            icon={AlertTriangle}
            variant="threat"
          />
          <MetricCard
            title="Total Turns"
            value={totalTurns}
            subtitle="Agent responses sent"
            icon={MessageSquare}
          />
          <MetricCard
            title="Intel Extracted"
            value={intelligence.length}
            subtitle={`${intelligenceByType.bank_account || 0} accounts, ${intelligenceByType.upi_id || 0} UPIs`}
            icon={Database}
          />
        </div>

        {/* Main Content */}
        <Tabs defaultValue="conversations" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="conversations" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversations
            </TabsTrigger>
            <TabsTrigger value="intelligence" className="gap-2">
              <Database className="h-4 w-4" />
              Intelligence
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Code className="h-4 w-4" />
              API Tester
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversations" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Conversations List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-mono">
                    Recent Conversations
                  </CardTitle>
                  <CardDescription>
                    Click to view conversation details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {conversations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No conversations yet. Use the API to start engaging.
                        </p>
                      ) : (
                        conversations.map((conv) => (
                          <ConversationCard
                            key={conv.id}
                            id={conv.id}
                            conversationId={conv.conversation_id}
                            scamDetected={conv.scam_detected}
                            turnCount={conv.turn_count}
                            status={conv.status}
                            createdAt={conv.created_at}
                            intelligenceCount={conversationIntelCounts[conv.conversation_id] || 0}
                            onClick={() => setSelectedConversation(conv.conversation_id)}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Conversation Detail */}
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-mono">
                      {selectedConversation ? (
                        <>
                          Conversation{" "}
                          <code className="text-primary">
                            {selectedConversation.slice(0, 8)}...
                          </code>
                        </>
                      ) : (
                        "Select a Conversation"
                      )}
                    </CardTitle>
                    <CardDescription>
                      {selectedConversation
                        ? `${messages.length} messages, ${selectedIntelligence.length} intel items`
                        : "View messages and extracted intelligence"}
                    </CardDescription>
                  </div>
                  {selectedConversation && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedConversation(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedConversation ? (
                    <div className="space-y-6">
                      <ConversationViewer
                        messages={messages.map((m) => ({
                          role: m.role,
                          content: m.content,
                          createdAt: m.created_at,
                        }))}
                      />

                      {selectedIntelligence.length > 0 && (
                        <div className="pt-4 border-t">
                          <h4 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">
                            Extracted Intelligence
                          </h4>
                          <IntelligencePanel
                            items={selectedIntelligence.map((i) => ({
                              type: i.intelligence_type as any,
                              value: i.value,
                              extractedAt: i.extracted_at,
                            }))}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-sm">
                        Select a conversation to view details
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="intelligence" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-mono">
                  All Extracted Intelligence
                </CardTitle>
                <CardDescription>
                  Bank accounts, UPI IDs, URLs, and other data extracted from scam conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IntelligencePanel
                  items={intelligence.map((i) => ({
                    type: i.intelligence_type as any,
                    value: i.value,
                    extractedAt: i.extracted_at,
                  }))}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-mono">
                  API Testing Console
                </CardTitle>
                <CardDescription>
                  Test the honeypot API with sample scam messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ApiTester />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-mono">
                  API Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-mono text-sm text-primary">Request</h4>
                  <pre className="p-4 rounded-lg bg-secondary text-sm font-mono overflow-x-auto">
                    {`POST https://gemccyscdcudahvfqeyk.supabase.co/functions/v1/honeypot
Headers:
  Content-Type: application/json
  x-api-key: <your-api-key>

Body:
{
  "message": "Congratulations! You won $1M lottery...",
  "conversation_id": "optional-uuid"
}`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <h4 className="font-mono text-sm text-primary">Response</h4>
                  <pre className="p-4 rounded-lg bg-secondary text-sm font-mono overflow-x-auto">
                    {`{
  "conversation_id": "uuid",
  "scam_detected": true,
  "agent_active": true,
  "turn_count": 1,
  "response_message": "oh wow really?? how do i claim this??",
  "extracted_intelligence": {
    "bank_accounts": [],
    "upi_ids": ["scammer@upi"],
    "phishing_urls": ["https://fake-site.com"],
    "phone_numbers": [],
    "emails": []
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;