interface RateLimitWindow {
  timestamps: number[];
}

class RateLimiter {
  private windows: Map<string, RateLimitWindow> = new Map();

  constructor(private rpm: number) {}

  canMakeRequest(providerName: string): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute sliding window
    const maxRequests = this.rpm;

    if (!this.windows.has(providerName)) {
      this.windows.set(providerName, { timestamps: [] });
    }

    const window = this.windows.get(providerName)!;

    // Remove timestamps older than 1 minute
    window.timestamps = window.timestamps.filter(
      (ts) => now - ts < windowMs
    );

    // Check if we can make another request
    const canMakeRequest = window.timestamps.length < maxRequests;

    if (canMakeRequest) {
      window.timestamps.push(now);
    }

    return canMakeRequest;
  }

  recordRequest(providerName: string): void {
    const now = Date.now();
    const windowMs = 60000;

    if (!this.windows.has(providerName)) {
      this.windows.set(providerName, { timestamps: [] });
    }

    const window = this.windows.get(providerName)!;
    window.timestamps = window.timestamps.filter(
      (ts) => now - ts < windowMs
    );
    window.timestamps.push(now);
  }

  record429(providerName: string): void {
    // Mark provider as rate limited by filling up the window
    const windowMs = 60000;
    const maxRequests = this.rpm;

    if (!this.windows.has(providerName)) {
      this.windows.set(providerName, { timestamps: [] });
    }

    const window = this.windows.get(providerName)!;
    const now = Date.now();
    window.timestamps = window.timestamps.filter(
      (ts) => now - ts < windowMs
    );

    // Fill the window to block requests
    while (window.timestamps.length < maxRequests) {
      window.timestamps.push(now);
    }
  }

  getRemainingRequests(providerName: string): number {
    const now = Date.now();
    const windowMs = 60000;

    if (!this.windows.has(providerName)) {
      this.windows.set(providerName, { timestamps: [] });
    }

    const window = this.windows.get(providerName)!;
    window.timestamps = window.timestamps.filter(
      (ts) => now - ts < windowMs
    );

    return Math.max(0, this.rpm - window.timestamps.length);
  }
}

interface Provider {
  name: string;
  rpm: number;
  call(prompt: string): Promise<string>;
}

class GroqProvider implements Provider {
  name = "groq";
  rpm = 30;
  private rateLimiter: RateLimiter;
  private client: any;

  constructor(apiKey?: string) {
    this.rateLimiter = new RateLimiter(this.rpm);
    if (apiKey) {
      const { Groq } = require("groq-sdk");
      this.client = new Groq({ apiKey, dangerouslyAllowBrowser: true });
    }
  }

  async call(prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error("Groq API key not configured");
    }

    if (!this.rateLimiter.canMakeRequest(this.name)) {
      const e = new Error("Rate limit exceeded") as any;
      e.status = 429;
      throw e;
    }

    try {
      const response = await this.client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
      });
      this.rateLimiter.recordRequest(this.name);
      return response.choices[0]?.message?.content || "";
    } catch (error: any) {
      if (error?.status === 429) {
        this.rateLimiter.record429(this.name);
        const e = new Error("Rate limit exceeded") as any;
        e.status = 429;
        throw e;
      }
      throw error;
    }
  }

  async checkHealth(): Promise<{ status: "ok" | "error" | "rate_limited"; message: string }> {
    if (!this.client) {
      return { status: "error", message: "API key not configured" };
    }
    try {
      await this.call("Say 'health'");
      return { status: "ok", message: "Healthy" };
    } catch (error: any) {
      if (error?.status === 429) {
        return { status: "rate_limited", message: "Rate limited" };
      }
      return { status: "error", message: error?.message || String(error) };
    }
  }
}

class NVIDIAProvider implements Provider {
  name = "nvidia";
  rpm = 30;
  private rateLimiter: RateLimiter;
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.rateLimiter = new RateLimiter(this.rpm);
    this.apiKey = apiKey;
  }

  async call(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("NVIDIA API key not configured");
    }

    if (!this.rateLimiter.canMakeRequest(this.name)) {
      const e = new Error("Rate limit exceeded") as any;
      e.status = 429;
      throw e;
    }

    try {
      const response = await fetch(
        "https://integrate.api.nvidia.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "meta/llama-3.1-8b-instruct",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.5,
            max_tokens: 1024,
            stream: false,
          }),
        }
      );

      if (response.status === 429) {
        this.rateLimiter.record429(this.name);
        const e = new Error("Rate limit exceeded") as any;
        e.status = 429;
        throw e;
      }

      if (!response.ok) {
        throw new Error(`NVIDIA API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.rateLimiter.recordRequest(this.name);
      return data.choices?.[0]?.message?.content || "";
    } catch (error: any) {
      if (error?.status === 429) {
        this.rateLimiter.record429(this.name);
        const e = new Error("Rate limit exceeded") as any;
        e.status = 429;
        throw e;
      }
      throw error;
    }
  }

  async checkHealth(): Promise<{ status: "ok" | "error" | "rate_limited"; message: string }> {
    if (!this.apiKey) {
      return { status: "error", message: "API key not configured" };
    }
    try {
      await this.call("Say 'health'");
      return { status: "ok", message: "Healthy" };
    } catch (error: any) {
      if (error?.status === 429) {
        return { status: "rate_limited", message: "Rate limited" };
      }
      return { status: "error", message: error?.message || String(error) };
    }
  }
}

class OpenRouterProvider implements Provider {
  name = "openrouter";
  rpm = 30;
  private rateLimiter: RateLimiter;
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.rateLimiter = new RateLimiter(this.rpm);
    this.apiKey = apiKey;
  }

  async call(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key not configured");
    }

    if (!this.rateLimiter.canMakeRequest(this.name)) {
      const e = new Error("Rate limit exceeded") as any;
      e.status = 429;
      throw e;
    }

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          max_tokens: 1024,
        }),
      });

      if (response.status === 429) {
        this.rateLimiter.record429(this.name);
        const e = new Error("Rate limit exceeded") as any;
        e.status = 429;
        throw e;
      }

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.rateLimiter.recordRequest(this.name);
      return data.choices?.[0]?.message?.content || "";
    } catch (error: any) {
      if (error?.status === 429) {
        this.rateLimiter.record429(this.name);
        const e = new Error("Rate limit exceeded") as any;
        e.status = 429;
        throw e;
      }
      throw error;
    }
  }

  async checkHealth(): Promise<{ status: "ok" | "error" | "rate_limited"; message: string }> {
    if (!this.apiKey) {
      return { status: "error", message: "API key not configured" };
    }
    try {
      await this.call("Say 'health'");
      return { status: "ok", message: "Healthy" };
    } catch (error: any) {
      if (error?.status === 429) {
        return { status: "rate_limited", message: "Rate limited" };
      }
      return { status: "error", message: error?.message || String(error) };
    }
  }
}

async function smartCall(prompt: string, providers: Provider[]): Promise<string> {
  if (!providers || providers.length === 0) {
    throw new Error("No providers available");
  }

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      const result = await provider.call(prompt);
      return result;
    } catch (error: any) {
      lastError = error;
      if (error?.status === 429) {
        console.log(`${provider.name} is rate limited, trying next provider...`);
        continue;
      }
      console.log(`${provider.name} failed: ${error?.message}, trying next provider...`);
    }
  }

  throw lastError || new Error("All providers failed");
}

export { GroqProvider, NVIDIAProvider, OpenRouterProvider, smartCall, type Provider };
