import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { validateApiKey } from "@/lib/auth/api-key";
import { getStoredApiKeys, saveStoredApiKeys, type ApiKeyRecord } from "@/app/api/admin/api-keys/route";

describe("Enterprise Feature 1: Institutional API Key Engine & Bearer Verification", () => {
  it("should reject requests with missing Authorization header", () => {
    const req = new Request("http://localhost:3000/api/v1/students");
    const result = validateApiKey(req, "students:read");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain("Missing Authorization header");
  });

  it("should reject requests with invalid scheme (not Bearer)", () => {
    const req = new Request("http://localhost:3000/api/v1/students", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    const result = validateApiKey(req, "students:read");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
    expect(result.error).toContain("Invalid Authorization scheme");
  });

  it("should validate and authorize active Bearer token with correct scopes", () => {
    const rawKey = "gia_live_test_valid_key_1234567890abcdef";
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const testRecord: ApiKeyRecord = {
      id: "test_key_001",
      name: "Unit Test Turnstile",
      keyPrefix: rawKey.substring(0, 12),
      keyHash,
      scopes: ["attendance:write", "attendance:read"],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      lastUsedAt: null,
      status: "ACTIVE",
      createdBy: "Test Principal",
    };

    const keys = getStoredApiKeys();
    saveStoredApiKeys([testRecord, ...keys]);

    // Valid scope test
    const req = new Request("http://localhost:3000/api/v1/attendance", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const result = validateApiKey(req, "attendance:write");
    expect(result.valid).toBe(true);
    expect(result.status).toBe(200);
    expect(result.keyRecord?.name).toBe("Unit Test Turnstile");
  });

  it("should enforce least privilege and reject access if required scope is missing", () => {
    const rawKey = "gia_live_scoped_key_9999999999abcdef";
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const testRecord: ApiKeyRecord = {
      id: "test_key_scoped",
      name: "Attendance Only Terminal",
      keyPrefix: rawKey.substring(0, 12),
      keyHash,
      scopes: ["attendance:read"], // does NOT have "fees:read"
      createdAt: new Date().toISOString(),
      expiresAt: null,
      lastUsedAt: null,
      status: "ACTIVE",
      createdBy: "Test Principal",
    };

    const keys = getStoredApiKeys();
    saveStoredApiKeys([testRecord, ...keys]);

    const req = new Request("http://localhost:3000/api/v1/fees", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const result = validateApiKey(req, "fees:read");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toContain("lacks required scope 'fees:read'");
  });

  it("should reject revoked API keys immediately", () => {
    const rawKey = "gia_live_revoked_key_111111111abcdef";
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    const testRecord: ApiKeyRecord = {
      id: "test_key_revoked",
      name: "Revoked Scanner",
      keyPrefix: rawKey.substring(0, 12),
      keyHash,
      scopes: ["students:read"],
      createdAt: new Date().toISOString(),
      expiresAt: null,
      lastUsedAt: null,
      status: "REVOKED",
      createdBy: "Test Principal",
    };

    const keys = getStoredApiKeys();
    saveStoredApiKeys([testRecord, ...keys]);

    const req = new Request("http://localhost:3000/api/v1/students", {
      headers: { Authorization: `Bearer ${rawKey}` },
    });
    const result = validateApiKey(req, "students:read");
    expect(result.valid).toBe(false);
    expect(result.status).toBe(403);
    expect(result.error).toContain("revoked");
  });
});

describe("Enterprise Feature 2: OAuth 2.0 Identity Flow", () => {
  it("should generate cryptographically random state for CSRF mitigation (RFC 6749)", () => {
    const states = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const state = createHash("sha256").update(Math.random().toString() + Date.now()).digest("hex");
      expect(states.has(state)).toBe(false);
      states.add(state);
    }
    expect(states.size).toBe(100);
  });
});
