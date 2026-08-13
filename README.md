# Vext AI

Extract code, configuration, and execution logic from video tutorials and demos. Vext uses multi-model AI analysis to turn screen recordings into actionable artifacts -- Dockerfiles, Terraform scripts, CLI commands, and structured documentation.

## Overview

Vext ingests video content (YouTube URLs, uploaded files) and runs synchronized analysis through multiple LLM providers (GPT-4o, Claude, Groq, OpenRouter) to cross-verify extracted logic. The output is a structured "intelligence card" containing code snippets, configuration files, and step-by-step execution instructions.

A smart LLM router automatically fails over between providers when rate limits are hit, using a sliding-window rate limiter per provider.

## Features

- **Multi-Model Intelligence**: Synchronized analysis using multiple LLM providers for cross-verification
- **Execution Pack Generator**: Produces Dockerfiles, Terraform scripts, and CLI commands from video content
- **Shareable Intelligence Cards**: Export extraction results as shareable technical documentation
- **Smart LLM Router**: Automatic failover between Groq, NVIDIA NIM, and OpenRouter with per-provider rate limiting
- **Dashboard**: API key management, usage tracking, pipeline monitoring
- **Audio Transcription**: Extracts and transcribes audio from video sources
- **REST API**: Full API for integration into CI/CD pipelines and automation workflows

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL via Prisma ORM (Neon serverless)
- **Auth**: NextAuth v5 with Prisma adapter
- **LLM Providers**: Groq, NVIDIA NIM, OpenRouter
- **Styling**: Tailwind CSS v4
- **Deployment**: Vercel / Netlify

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` with required variables:
```bash
GROQ_API_KEY=your_groq_key
NVIDIA_API_KEY=your_nvidia_key
OPENROUTER_API_KEY=your_openrouter_key
DATABASE_URL=your_postgresql_url
NEXTAUTH_SECRET=your_secret
```

3. Generate the Prisma client and run the dev server:
```bash
npx prisma generate
npm run dev
```

4. Open http://localhost:3000

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/health` | Health check for all LLM providers |
| `POST /api/chat` | Send a prompt through the smart router |
| `POST /api/extract` | Extract intelligence from a video source |
| `POST /api/process` | Process a video through the full pipeline |
| `GET /api/docs` | API documentation |

## License

MIT -- Copyright (c) 2026 Akshay
