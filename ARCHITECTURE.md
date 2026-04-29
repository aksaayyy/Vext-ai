# Vext AI: Intelligence Extraction Pipeline

This document outlines the core architecture of the Vext AI "God Mode" processing pipeline. The system is designed to take raw video links (from YouTube or Instagram Reels) and systematically transform them into highly structured, actionable SaaS Blueprints.

## 1. Media Ingestion & Audio Extraction
The pipeline begins when a user submits a URL via the Dashboard UI.

- **URL Validation**: The backend (`downloader.ts`) validates the URL against known YouTube and Instagram URL patterns.
- **Audio Extraction**: We utilize `yt-dlp` (via the `youtube-dl-exec` wrapper) to bypass video downloading entirely and directly extract the audio stream.
- **Failover Logic**: If standard audio extraction fails or produces an unexpected file extension (e.g., `.mp4.m4a`), the downloader auto-corrects the file path or falls back to a generalized "bestaudio" format fetch to ensure a successful download.

## 2. Audio Processing (FFmpeg)
Raw audio streams vary wildly in format, bitrate, and channels. Before passing the audio to our AI transcription models, we must normalize it.

- **Normalization**: Using `fluent-ffmpeg`, the raw audio file is converted into a **16kHz mono WAV** format (`convertToWav16k`). This specific format is required to maximize the accuracy and processing speed of the Whisper/Parakeet transcription engines.
- **Duration Extraction**: During the FFmpeg pass, the exact duration of the audio is calculated and logged.

## 3. High-Fidelity Transcription
The normalized WAV file is passed to the transcription engine (`transcription.ts`), which features a resilient, multi-provider failover system.

- **Primary Provider (Groq Whisper-Large-v3)**: We attempt to transcribe the audio using Groq's high-speed Whisper endpoints, requesting a `verbose_json` format to capture precise timestamps.
- **Failover Provider (NVIDIA NIM Parakeet)**: If Groq experiences rate limits or outages, the system automatically falls back to NVIDIA's `parakeet-nemo-ctc-30m` model.
- **Provider Health Logging**: Every transcription attempt (success or failure) is logged to the `ProviderHealthLog` in the database to monitor real-time API uptime.

## 4. "God Mode" Intelligence Extraction
Once the transcript is generated, it is fed into our proprietary `IntelligenceService`.

- **Classification**: The transcript is first evaluated to determine its core theme (e.g., `setup/tutorial`, `product teardown`, `saas/blueprint`). Currently, the system defaults all major extractions into the "God Mode" (`saas/blueprint`) path.
- **LLM Routing Engine**: The transcript is passed to a high-tier LLM. The system intelligently routes the request between Groq, NVIDIA, and OpenRouter based on API availability and rate-limiting smoothers.
- **Strict Structured Output**: The LLM is prompted to return a highly complex, deeply nested JSON object. It infers (rather than summarizes) the problem statement, database architecture, execution roadmap, and unit economics.
- **JSON Repair Middleware**: Because LLMs occasionally output malformed JSON (e.g., over-escaped quotes like `\"$9.99/mo\"` or missing brackets), the raw output is intercepted by the `jsonrepair` middleware. This ensures the pipeline doesn't crash on trivial syntax errors.
- **Zod Validation**: The repaired JSON is strictly validated against our `SaaSBlueprintSchema` using Zod to guarantee type safety before saving to the Neon PostgreSQL database.

## 5. Agent Archive Export (SWE Handoff)
The extracted intelligence is immediately available in the Dashboard UI. 

For developers, the UI features an **Agent Archive Export**. Using `jszip`, the browser packages the validated JSON blueprint alongside automatically generated scaffolding (like `system_prompt.txt`, `deploy.sh`, and `README.md`) into a downloadable `.zip` file. This allows founders to seamlessly hand off the raw strategic intelligence to an autonomous Software Engineering (SWE) agent or a human developer.
