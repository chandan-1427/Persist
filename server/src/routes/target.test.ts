import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import app from "../index.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";

async function signup(overrides: Partial<{ username: string; email: string; password: string }> = {}) {
  const payload = {
    username: overrides.username ?? "targetuser",
    email: overrides.email ?? "targetuser@example.com",
    password: overrides.password ?? "password123",
  };

  const res = await app.request("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const cookie = res.headers.get("set-cookie")!;
  const body = await res.json();
  return { cookie, user: body.user };
}

describe("POST /api/target", () => {
  it("sets a target with a mandatory reason", async () => {
    const { cookie } = await signup();

    const res = await app.request("/api/target", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ days: 21, reason: "Finish the side project" }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.targetAt).toBeTruthy();
    expect(body.targetReason).toBe("Finish the side project");
  });

  it("rejects setting a target without a reason", async () => {
    const { cookie } = await signup({ username: "noreason", email: "noreason@example.com" });

    const res = await app.request("/api/target", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ days: 21 }),
    });

    expect(res.status).toBe(400);
  });

  it("rejects setting a second target while one is active", async () => {
    const { cookie } = await signup({ username: "duplicatetarget", email: "duplicatetarget@example.com" });

    await app.request("/api/target", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ days: 21, reason: "First target" }),
    });

    const res = await app.request("/api/target", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ days: 10, reason: "Second target" }),
    });

    expect(res.status).toBe(409);
  });

  it("rejects unauthenticated requests", async () => {
    const res = await app.request("/api/target", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days: 21, reason: "No auth" }),
    });

    expect(res.status).toBe(401);
  });
});

describe("GET /api/target", () => {
  it("returns targetAt, targetSetAt, and targetReason", async () => {
    const { cookie } = await signup({ username: "getuser", email: "getuser@example.com" });

    await app.request("/api/target", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ days: 21, reason: "Get test" }),
    });

    const res = await app.request("/api/target", { headers: { Cookie: cookie } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.targetAt).toBeTruthy();
    expect(body.targetSetAt).toBeTruthy();
    expect(body.targetReason).toBe("Get test");
  });

  it("returns nulls when no target is set", async () => {
    const { cookie } = await signup({ username: "notarget", email: "notarget@example.com" });

    const res = await app.request("/api/target", { headers: { Cookie: cookie } });

    const body = await res.json();
    expect(body.targetAt).toBeNull();
  });
});

describe("DELETE /api/target", () => {
  it("blocks deletion before 24 hours have passed", async () => {
    const { cookie } = await signup({ username: "earlydelete", email: "earlydelete@example.com" });

    await app.request("/api/target", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ days: 21, reason: "Too early" }),
    });

    const res = await app.request("/api/target", { method: "DELETE", headers: { Cookie: cookie } });

    expect(res.status).toBe(403);
  });

  it("allows deletion after 24 hours and clears all fields", async () => {
    const { cookie, user } = await signup({ username: "latedelete", email: "latedelete@example.com" });

    await app.request("/api/target", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ days: 21, reason: "Will be deleted" }),
    });

    // Simulate 25 hours passing, same trick as the manual Supabase test
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await db.update(users).set({ targetSetAt: twentyFiveHoursAgo }).where(eq(users.id, user.id));

    const deleteRes = await app.request("/api/target", { method: "DELETE", headers: { Cookie: cookie } });
    expect(deleteRes.status).toBe(204);

    const getRes = await app.request("/api/target", { headers: { Cookie: cookie } });
    const body = await getRes.json();
    expect(body.targetAt).toBeNull();
    expect(body.targetSetAt).toBeNull();
    expect(body.targetReason).toBeNull();
  });

  it("returns 404 when there's no target to delete", async () => {
    const { cookie } = await signup({ username: "nodelete", email: "nodelete@example.com" });

    const res = await app.request("/api/target", { method: "DELETE", headers: { Cookie: cookie } });

    expect(res.status).toBe(404);
  });
});