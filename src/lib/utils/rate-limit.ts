/**
 * Simple Token Bucket / Queue for Rate Limit Smoothing.
 * Ensures we don't hammer providers even if many requests come at once.
 */

interface QueuedRequest {
  resolve: (value: void | PromiseLike<void>) => void;
  reject: (reason?: any) => void;
}

class RateLimitSmoother {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private lastCall = 0;
  private minInterval: number;

  constructor(rpm: number) {
    // interval = 60000 / rpm
    this.minInterval = Math.floor(60000 / rpm);
  }

  async wait() {
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ resolve, reject });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLast = now - this.lastCall;
      const waitTime = Math.max(0, this.minInterval - timeSinceLast);

      if (waitTime > 0) {
        await new Promise(r => setTimeout(r, waitTime));
      }

      const req = this.queue.shift();
      if (req) {
        this.lastCall = Date.now();
        req.resolve();
      }
    }

    this.processing = false;
  }
}

// Singletons for each major provider tier
export const groqSmoother = new RateLimitSmoother(25); // Target 25 RPM (limit 30)
export const nvidiaSmoother = new RateLimitSmoother(8);  // Target 8 RPM (limit 10)
export const openRouterSmoother = new RateLimitSmoother(15); // Target 15 RPM (limit 20)
