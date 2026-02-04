-- Create enum for conversation status
CREATE TYPE public.conversation_status AS ENUM ('active', 'completed', 'expired');

-- Create honeypot_conversations table
CREATE TABLE public.honeypot_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id TEXT NOT NULL UNIQUE,
    api_key_hash TEXT NOT NULL,
    scam_detected BOOLEAN NOT NULL DEFAULT false,
    agent_active BOOLEAN NOT NULL DEFAULT false,
    turn_count INTEGER NOT NULL DEFAULT 0,
    status conversation_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation_messages table
CREATE TABLE public.conversation_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES public.honeypot_conversations(conversation_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('scammer', 'agent', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create extracted_intelligence table
CREATE TABLE public.extracted_intelligence (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES public.honeypot_conversations(conversation_id) ON DELETE CASCADE,
    intelligence_type TEXT NOT NULL CHECK (intelligence_type IN ('bank_account', 'upi_id', 'phishing_url', 'phone_number', 'email')),
    value TEXT NOT NULL,
    confidence DECIMAL(3, 2) NOT NULL DEFAULT 1.0,
    extracted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(conversation_id, intelligence_type, value)
);

-- Create api_keys table for authentication
CREATE TABLE public.api_keys (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    requests_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_conversations_api_key ON public.honeypot_conversations(api_key_hash);
CREATE INDEX idx_conversations_status ON public.honeypot_conversations(status);
CREATE INDEX idx_messages_conversation ON public.conversation_messages(conversation_id);
CREATE INDEX idx_intelligence_conversation ON public.extracted_intelligence(conversation_id);
CREATE INDEX idx_intelligence_type ON public.extracted_intelligence(intelligence_type);

-- Enable RLS on all tables
ALTER TABLE public.honeypot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (edge functions use service role)
CREATE POLICY "Service role full access to conversations"
ON public.honeypot_conversations
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to messages"
ON public.conversation_messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to intelligence"
ON public.extracted_intelligence
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to api_keys"
ON public.api_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Public read access for dashboard (anon key)
CREATE POLICY "Public read access to conversations"
ON public.honeypot_conversations
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public read access to messages"
ON public.conversation_messages
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Public read access to intelligence"
ON public.extracted_intelligence
FOR SELECT
TO anon
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.honeypot_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.honeypot_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.extracted_intelligence;