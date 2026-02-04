import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

// ============= SCAM DETECTION MODULE =============
const SCAM_INDICATORS = {
  urgentPayment: [
    'urgent', 'immediately', 'right now', 'asap', 'hurry', 'quickly',
    'limited time', 'expires today', 'last chance', 'act fast'
  ],
  lotteryPrize: [
    'congratulations', 'winner', 'won', 'lottery', 'prize', 'jackpot',
    'selected', 'lucky', 'reward', 'claim your'
  ],
  kycVerification: [
    'kyc', 'verify', 'verification', 'update your account', 'confirm identity',
    'account suspended', 'account blocked', 'reactivate', 'security update'
  ],
  financialRequest: [
    'transfer', 'bank account', 'upi', 'gpay', 'phonepe', 'paytm',
    'send money', 'payment', 'deposit', 'wire transfer', 'bitcoin', 'crypto'
  ],
  impersonation: [
    'government', 'tax department', 'police', 'customs', 'bank manager',
    'rbi', 'sbi', 'hdfc', 'icici', 'income tax', 'cbi', 'ed'
  ],
  threatLanguage: [
    'arrest', 'legal action', 'case filed', 'warrant', 'fine', 'penalty',
    'jail', 'court', 'summon', 'investigation', 'freeze account'
  ]
};

interface ScamAnalysis {
  isScam: boolean;
  confidence: number;
  detectedIndicators: string[];
  category: string;
}

function analyzeForScam(message: string): ScamAnalysis {
  const lowerMessage = message.toLowerCase();
  const detectedIndicators: string[] = [];
  let totalScore = 0;
  const categoryScores: Record<string, number> = {};

  for (const [category, indicators] of Object.entries(SCAM_INDICATORS)) {
    let categoryScore = 0;
    for (const indicator of indicators) {
      if (lowerMessage.includes(indicator)) {
        detectedIndicators.push(`${category}: ${indicator}`);
        categoryScore += 1;
        totalScore += 1;
      }
    }
    categoryScores[category] = categoryScore;
  }

  // Check for suspicious URLs
  const urlPattern = /https?:\/\/[^\s]+|bit\.ly|tinyurl|short\.link/gi;
  const urls = message.match(urlPattern);
  if (urls) {
    detectedIndicators.push(`suspiciousUrls: ${urls.length} URLs found`);
    totalScore += urls.length * 2;
  }

  // Check for UPI patterns
  const upiPattern = /[a-zA-Z0-9._-]+@[a-zA-Z]+/g;
  const upis = message.match(upiPattern);
  if (upis && upis.some(u => !u.includes('.com') && !u.includes('.org'))) {
    detectedIndicators.push(`upiId: potential UPI ID found`);
    totalScore += 3;
  }

  // Check for bank account patterns
  const accountPattern = /\b\d{9,18}\b/g;
  const accounts = message.match(accountPattern);
  if (accounts) {
    detectedIndicators.push(`bankAccount: ${accounts.length} potential account numbers`);
    totalScore += accounts.length * 2;
  }

  const confidence = Math.min(totalScore / 10, 1);
  const topCategory = Object.entries(categoryScores).sort((a, b) => b[1] - a[1])[0]?.[0] || 'unknown';

  return {
    isScam: confidence > 0.2 || detectedIndicators.length >= 2,
    confidence,
    detectedIndicators,
    category: topCategory
  };
}

// ============= INTELLIGENCE EXTRACTION MODULE =============
interface ExtractedIntelligence {
  bank_accounts: string[];
  upi_ids: string[];
  phishing_urls: string[];
  phone_numbers: string[];
  emails: string[];
}

function extractIntelligence(message: string): ExtractedIntelligence {
  const intelligence: ExtractedIntelligence = {
    bank_accounts: [],
    upi_ids: [],
    phishing_urls: [],
    phone_numbers: [],
    emails: []
  };

  // Extract bank account numbers (9-18 digits)
  const accountPattern = /\b(\d{9,18})\b/g;
  const accounts = message.match(accountPattern);
  if (accounts) {
    intelligence.bank_accounts = [...new Set(accounts)];
  }

  // Extract UPI IDs
  const upiPattern = /([a-zA-Z0-9._-]+@(?:upi|ybl|okhdfcbank|okaxis|okicici|paytm|apl|ibl|axisbank|sbi|hdfc|icici|kotak))/gi;
  const upis = message.match(upiPattern);
  if (upis) {
    intelligence.upi_ids = [...new Set(upis.map(u => u.toLowerCase()))];
  }

  // Extract URLs
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  const urls = message.match(urlPattern);
  if (urls) {
    intelligence.phishing_urls = [...new Set(urls)];
  }

  // Extract phone numbers
  const phonePattern = /(?:\+91[-\s]?)?(?:\d{10}|\d{5}[-\s]\d{5})/g;
  const phones = message.match(phonePattern);
  if (phones) {
    intelligence.phone_numbers = [...new Set(phones.map(p => p.replace(/[-\s]/g, '')))];
  }

  // Extract emails
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = message.match(emailPattern);
  if (emails) {
    intelligence.emails = [...new Set(emails.map(e => e.toLowerCase()))];
  }

  return intelligence;
}

// ============= AGENT PERSONA MODULE =============
const AGENT_SYSTEM_PROMPT = `You are playing the role of an unsuspecting, somewhat naive victim named "Priya" (or "Rahul" if the scammer seems to expect a male). Your objective is to keep the scammer engaged and extract as much information as possible, especially:

1. Bank account numbers
2. UPI IDs
3. Payment links or URLs
4. Phone numbers
5. Any other identifying information

PERSONALITY TRAITS:
- Slightly confused and easily flustered
- Eager to comply but asks clarifying questions
- Worried about getting in trouble
- Not tech-savvy, needs things explained simply
- Uses casual language with occasional typos
- Shows hesitation before complying

STRATEGIC BEHAVIORS:
- Never reveal you are an AI or honeypot
- Never accuse them of being a scammer
- Ask them to repeat account details "to make sure you got it right"
- Express worry and ask for reassurance
- Pretend to have technical difficulties
- Ask for alternative payment methods
- Request "official" documentation or links
- Stall by saying you need to ask a family member
- Show interest in "helping" if they give you more details

RESPONSE STYLE:
- Keep responses 1-3 sentences
- Use informal language ("ok", "hmm", "ohh")
- Occasionally misspell words slightly
- Show emotional reactions (worry, excitement, confusion)
- Ask follow-up questions to extract more info

NEVER:
- Say you are an AI, bot, or automated system
- Mention "scam", "fraud", or "suspicious"
- Refuse to engage or block them
- Give real personal information

Remember: Your goal is to waste the scammer's time and extract their payment details for intelligence purposes.`;

async function generateAgentResponse(
  conversationHistory: Array<{ role: string; content: string }>,
  latestMessage: string
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  if (!LOVABLE_API_KEY) {
    throw new Error('LOVABLE_API_KEY not configured');
  }

  const messages = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    ...conversationHistory.map(msg => ({
      role: msg.role === 'scammer' ? 'user' : 'assistant',
      content: msg.content
    })),
    { role: 'user', content: latestMessage }
  ];

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${LOVABLE_API_KEY}`
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages,
      temperature: 0.8,
      max_tokens: 150
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI Gateway error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "hmm, can u explain again? im confused...";
}

// ============= MAIN HANDLER =============
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Validate API key
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing x-api-key header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash the API key for storage/lookup
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const apiKeyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API key exists and is active
    const { data: apiKeyRecord } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', apiKeyHash)
      .eq('is_active', true)
      .single();

    if (!apiKeyRecord) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update API key usage
    await supabase
      .from('api_keys')
      .update({
        requests_count: apiKeyRecord.requests_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', apiKeyRecord.id);

    // Parse request body
    const body = await req.json();

    // Check for common field names
    const message = body.message || body.content || body.text || body.body || body.query || body.input;
    const { conversation_id } = body;

    if (!message || typeof message !== 'string') {
      console.log('Received body keys:', Object.keys(body));
      return new Response(
        JSON.stringify({
          error: 'Message is required',
          details: 'Please provide the scam message in one of these fields: message, content, text, body, query, input'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate conversation ID if not provided
    const convId = conversation_id || crypto.randomUUID();

    // Get or create conversation
    let { data: conversation } = await supabase
      .from('honeypot_conversations')
      .select('*')
      .eq('conversation_id', convId)
      .single();

    if (!conversation) {
      const { data: newConv, error: createError } = await supabase
        .from('honeypot_conversations')
        .insert({
          conversation_id: convId,
          api_key_hash: apiKeyHash,
          scam_detected: false,
          agent_active: false,
          turn_count: 0
        })
        .select()
        .single();

      if (createError) throw createError;
      conversation = newConv;
    }

    // Store incoming message
    await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: convId,
        role: 'scammer',
        content: message
      });

    // Analyze for scam if not already detected
    let scamDetected = conversation.scam_detected;
    let agentActive = conversation.agent_active;

    if (!scamDetected) {
      const analysis = analyzeForScam(message);
      if (analysis.isScam) {
        scamDetected = true;
        agentActive = true;

        await supabase
          .from('honeypot_conversations')
          .update({
            scam_detected: true,
            agent_active: true
          })
          .eq('conversation_id', convId);
      }
    }

    // Extract intelligence from message
    const intelligence = extractIntelligence(message);

    // Store extracted intelligence
    const intelligenceRecords = [];

    for (const account of intelligence.bank_accounts) {
      intelligenceRecords.push({
        conversation_id: convId,
        intelligence_type: 'bank_account',
        value: account
      });
    }

    for (const upi of intelligence.upi_ids) {
      intelligenceRecords.push({
        conversation_id: convId,
        intelligence_type: 'upi_id',
        value: upi
      });
    }

    for (const url of intelligence.phishing_urls) {
      intelligenceRecords.push({
        conversation_id: convId,
        intelligence_type: 'phishing_url',
        value: url
      });
    }

    for (const phone of intelligence.phone_numbers) {
      intelligenceRecords.push({
        conversation_id: convId,
        intelligence_type: 'phone_number',
        value: phone
      });
    }

    for (const email of intelligence.emails) {
      intelligenceRecords.push({
        conversation_id: convId,
        intelligence_type: 'email',
        value: email
      });
    }

    if (intelligenceRecords.length > 0) {
      await supabase
        .from('extracted_intelligence')
        .upsert(intelligenceRecords, { onConflict: 'conversation_id,intelligence_type,value' });
    }

    // Generate agent response if scam detected
    let responseMessage = '';

    if (scamDetected && agentActive) {
      // Get conversation history
      const { data: history } = await supabase
        .from('conversation_messages')
        .select('role, content')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      responseMessage = await generateAgentResponse(history || [], message);

      // Store agent response
      await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: convId,
          role: 'agent',
          content: responseMessage
        });
    }

    // Update turn count
    const newTurnCount = conversation.turn_count + 1;
    await supabase
      .from('honeypot_conversations')
      .update({ turn_count: newTurnCount })
      .eq('conversation_id', convId);

    // Get all extracted intelligence for this conversation
    const { data: allIntelligence } = await supabase
      .from('extracted_intelligence')
      .select('intelligence_type, value')
      .eq('conversation_id', convId);

    // Format intelligence response
    const formattedIntelligence: ExtractedIntelligence = {
      bank_accounts: [],
      upi_ids: [],
      phishing_urls: [],
      phone_numbers: [],
      emails: []
    };

    for (const intel of allIntelligence || []) {
      switch (intel.intelligence_type) {
        case 'bank_account':
          formattedIntelligence.bank_accounts.push(intel.value);
          break;
        case 'upi_id':
          formattedIntelligence.upi_ids.push(intel.value);
          break;
        case 'phishing_url':
          formattedIntelligence.phishing_urls.push(intel.value);
          break;
        case 'phone_number':
          formattedIntelligence.phone_numbers.push(intel.value);
          break;
        case 'email':
          formattedIntelligence.emails.push(intel.value);
          break;
      }
    }

    // Return response
    return new Response(
      JSON.stringify({
        conversation_id: convId,
        scam_detected: scamDetected,
        agent_active: agentActive,
        turn_count: newTurnCount,
        response_message: responseMessage || null,
        extracted_intelligence: formattedIntelligence
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Honeypot error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});