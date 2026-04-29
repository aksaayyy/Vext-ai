# Vext AI Router

A Next.js 14+ application with a smart LLM router that automatically fails over when rate limits are hit.

## Features

- **Smart Router** (`src/lib/providers/router.ts`) - Tries providers in order (Groq → NVIDIA → OpenRouter) and catches 429 errors to move to the next provider
- **In-memory Sliding Window Rate Limiter** - Respects provider RPM limits
- **Three LLM Providers**:
  - Groq (groq-sdk)
  - NVIDIA NIM (REST API)
  - OpenRouter (openrouter-sdk)
- **Health Check Endpoint** - Tests all providers and reports their availability
- **Chat Endpoint** - Send prompts through the smart router

## API Endpoints

### GET /api/health
Returns the health status of all LLM providers.

**Response:**
```json
{
  "groq": "ok",
  "nvidia": "rate_limited",
  "openrouter": "ok"
}
```

Possible statuses: `"ok"`, `"error"`, `"rate_limited"`

### POST /api/chat
Send a prompt to the smart router.

**Request:**
```json
{
  "prompt": "Say 'Vext ready'"
}
```

**Response:**
```json
{
  "result": "Vext ready!",
  "provider": "groq"
}
```

## Environment Variables

Create a `.env.local` file with your API keys:

```bash
GROQ_API_KEY=your_groq_api_key_here
NVIDIA_API_KEY=your_nvidia_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` with your API keys

3. Run the development server:
```bash
npm run dev
```

4. Open http://localhost:3000

## Implementation Details

### Rate Limiting
Each provider has a `RateLimiter` class that uses a sliding window algorithm to track requests per minute (RPM). When a 429 error is received from an API, that provider's rate limiter marks it as exhausted for the current window.

### Smart Routing
The `smartCall()` function iterates through providers in order:
1. Checks if the provider can make a request (rate limiter)
2. Attempts the API call
3. On 429, skips to the next provider
4. On success, returns the result
5. If all fail, throws the last error

### Provider Classes
Each provider implements the `Provider` interface:
- `name`: string identifier
- `rpm`: requests per minute limit
- `call(prompt)`: makes the API call
- `checkHealth()`: tests the provider and returns status

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── health/
│   │   │   └── route.ts    # Health check endpoint
│   │   └── chat/
│   │       └── route.ts    # Chat endpoint
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
└── lib/
    └── providers/
        └── router.ts       # Provider classes and smart router
```

## Testing

Test with the provided Groq API key:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Say Vext ready"}'
```

With the test key `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`, the first API call to Groq should succeed and return a completion.
