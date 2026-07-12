import { describe, it, expect } from "vitest";
import app from "../index.js";

describe("POST /api/auth/signup", () => {
  it("creates a user and returns 201 with a session cookie", async () => {
    const res = await app.request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "testuser1",
        email: "testuser1@example.com",
        password: "password123",
      }),
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.username).toBe("testuser1");
    expect(body.user.email).toBe("testuser1@example.com");
    expect(body.user.passwordHash).toBeUndefined(); // never leak the hash
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("rejects a duplicate email", async () => {
    const payload = {
      username: "dupeuser1",
      email: "dupe@example.com",
      password: "password123",
    };

    await app.request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const res = await app.request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, username: "dupeuser2" }),
    });

    expect(res.status).toBe(409);
  });

  it("rejects a password under 8 characters", async () => {
    const res = await app.request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "shortpass",
        email: "shortpass@example.com",
        password: "abc123",
      }),
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
  });
});

describe("POST /api/auth/signin", () => {
  const credentials = {
    username: "signinuser",
    email: "signinuser@example.com",
    password: "password123",
  };

  async function signup() {
    return app.request("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
  }

  it("signs in with correct email + password", async () => {
    await signup();

    const res = await app.request("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: credentials.email, password: credentials.password }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toContain("session=");
  });

  it("signs in with correct username in a different case", async () => {
    await signup();

    const res = await app.request("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: credentials.username.toUpperCase(), password: credentials.password }),
    });

    expect(res.status).toBe(200);
  });

  it("rejects a wrong password", async () => {
    await signup();

    const res = await app.request("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: credentials.email, password: "wrongpassword" }),
    });

    expect(res.status).toBe(401);
  });

  it("rejects a nonexistent identifier", async () => {
    const res = await app.request("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "nobody@example.com", password: "whatever123" }),
    });

    expect(res.status).toBe(401);
  });
});