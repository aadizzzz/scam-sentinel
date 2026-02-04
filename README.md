# 🛡️ Scam Sentinel

**Scam Sentinel** is an AI-powered honeypot system designed to detect, engage, and extract intelligence from scammers. It uses sophisticated AI agent personas to waste scammers' time while automatically harvesting critical information like bank accounts, UPI IDs, and phishing URLs.

## 🚀 Features

- **🛡️ Auto-Detection**: Real-time analysis of messages to detect scam indicators (urgency, financial requests, threats).
- **🤖 AI Agent Persona**: "Priya/Rahul" - a naive, confused victim persona that keeps scammers engaged without arousing suspicion.
- **🕵️ Intelligence Extraction**: Automatically parses and saves:
  - Bank Account Numbers
  - UPI IDs/Payment Profiles
  - Phone Numbers
  - Phishing URLs
- **📊 Dashboard**: A React-based UI to view live conversations, extracted stats, and active threats.
- **🔌 API Access**: Simple REST API to integrate the honeypot into other channels (WhatsApp/Telegram bots).

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Shadcn UI
- **Backend/Edge**: Supabase Edge Functions (Deno)
- **AI**: Google Gemini (via Lovable AI Gateway)
- **Database**: Supabase (PostgreSQL)

## ⚡ Deployment

### Prerequisites
1. [Supabase CLI](https://supabase.com/docs/guides/cli) installed.
2. A Supabase project created.

### Environment Setup
Create a `.env` file in the root:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_public_key
```

### Deploy Edge Functions
The core logic resides in Supabase Edge Functions. Deploy them using:

```bash
npx supabase functions deploy honeypot --project-ref <your-project-ref>
npx supabase functions deploy generate-api-key --project-ref <your-project-ref>
```

## 🔌 API Documentation

### Honeypot Endpoint
**POST** `https://gemccyscdcudahvfqeyk.supabase.co/functions/v1/honeypot`

Simulates receiving a message from a scammer. The system analyzes it and generates a response if needed.

**Headers:**
- `Content-Type`: `application/json`
- `x-api-key`: `Your-Generated-API-Key`

**Body:**
```json
{
  "message": "Hello, you have won a lottery! Send bank details.",
  "conversation_id": "optional-uuid" // If omitted, a new conversation is started
}
```
*(Note: Accepts `content`, `text`, `body`, or `query` as aliases for `message`)*

**Response:**
```json
{
  "conversation_id": "uuid",
  "scam_detected": true,
  "agent_active": true,
  "response_message": "oh wow really? is this real?",
  "extracted_intelligence": {
    "bank_accounts": [],
    "upi_ids": []
  }
}
```

## 🔒 Security

- **API Keys**: Access to the honeypot API is protected by custom API keys generated via the `generate-api-key` endpoint.
- **Row Level Security (RLS)**: User data is protected via Supabase RLS policies.

## 📄 License

MIT License. Free to use for scam-baiting and educational purposes.
