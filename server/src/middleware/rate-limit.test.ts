import { Hono } from "hono";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { rateLimit } from "./rate-limit.js";

describe("rateLimit middleware", () => {
  let originalEnv: string | undefined;

  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production"; // the bypass only checks for "test", so this re-enables it
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it("allows requests under the limit and blocks the one that exceeds it", async () => {
    const testApp = new Hono();
    testApp.use("*", rateLimit({ windowMs: 60_000, max: 3 }));
    testApp.get("/", (c) => c.text("ok"));

    for (let i = 0; i < 3; i++) {
      const res = await testApp.request("/", { headers: { "x-forwarded-for": "1.2.3.4" } });
      expect(res.status).toBe(200);
    }

    const blocked = await testApp.request("/", { headers: { "x-forwarded-for": "1.2.3.4" } });
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
  });

  it("tracks limits independently per IP", async () => {
    const testApp = new Hono();
    testApp.use("*", rateLimit({ windowMs: 60_000, max: 1 }));
    testApp.get("/", (c) => c.text("ok"));

    const ipA = await testApp.request("/", { headers: { "x-forwarded-for": "5.5.5.5" } });
    expect(ipA.status).toBe(200);

    const ipB = await testApp.request("/", { headers: { "x-forwarded-for": "6.6.6.6" } });
    expect(ipB.status).toBe(200); // different IP, unaffected by ipA's usage

    const ipABlocked = await testApp.request("/", { headers: { "x-forwarded-for": "5.5.5.5" } });
    expect(ipABlocked.status).toBe(429);
  });
});