/* eslint-disable */
// Minimal type augmentation for Workers AI binding to satisfy TypeScript
declare interface Ai {
  run(model: string, input: unknown): Promise<any>;
}

declare namespace Cloudflare {
  interface Env {
    AI: Ai;
  }
}

interface Env extends Cloudflare.Env {}


