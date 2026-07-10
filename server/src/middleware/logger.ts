import type { MiddlewareHandler } from "hono";
import crypto from "node:crypto";

export const requestLogger: MiddlewareHandler = async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  const start = Date.now();

  await next();

  console.log(JSON.stringify({
    level: "info",
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs: Date.now() - start,
    timestamp: new Date().toISOString(),
  }));
};

export function logError(fields: Record<string, unknown>, message: string): void {
  console.error(JSON.stringify({ level: "error", message, ...fields, timestamp: new Date().toISOString() }));
}