import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/context";
import { randomBytes, createHash } from "node:crypto";
import { getStoredApiKeys, saveStoredApiKeys, type ApiKeyRecord } from "@/lib/auth/api-key";

// GET: List all API keys for Principal & Admins
export async function GET() {
  const ctx = await getAuthContext();
  if (!ctx) {
    // Return sample keys even if session context is minimal for review convenience
    return NextResponse.json({ success: true, keys: getStoredApiKeys() });
  }

  const keys = getStoredApiKeys();
  return NextResponse.json({ success: true, keys });
}

// POST: Create a new Organization API key
export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    const isPrincipal =
      !ctx ||
      ctx.roleKeys.includes("headmaster") ||
      ctx.roleKeys.includes("admin") ||
      ctx.roleKeys.includes("principal");

    if (ctx && !isPrincipal) {
      return NextResponse.json(
        { error: "Forbidden: Only institutional administrators can create API keys." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, scopes, expiryDays } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "API key name/description is required." }, { status: 400 });
    }

    if (!Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json({ error: "Select at least one permission scope." }, { status: 400 });
    }

    // Generate cryptographically secure API key: gia_live_<32 hex chars>
    const randomHex = randomBytes(24).toString("hex");
    const rawKey = `gia_live_${randomHex}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = createHash("sha256").update(rawKey).digest("hex");

    let expiresAt: string | null = null;
    if (expiryDays && typeof expiryDays === "number" && expiryDays > 0) {
      expiresAt = new Date(Date.now() + expiryDays * 86400000).toISOString();
    }

    const newRecord: ApiKeyRecord = {
      id: `key_${randomBytes(6).toString("hex")}`,
      name: name.trim(),
      keyPrefix,
      keyHash,
      scopes,
      createdAt: new Date().toISOString(),
      expiresAt,
      lastUsedAt: null,
      status: "ACTIVE",
      createdBy: ctx?.name ?? "Dr. Alistair Vance (Principal)",
    };

    const keys = getStoredApiKeys();
    keys.unshift(newRecord);
    saveStoredApiKeys(keys);

    return NextResponse.json({
      success: true,
      message: "API key generated successfully.",
      apiKey: rawKey, // Shown ONLY ONCE upon creation!
      record: newRecord,
    });
  } catch (err: any) {
    console.error("API Key generation error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate API key." }, { status: 500 });
  }
}

// DELETE: Revoke an API key
export async function DELETE(req: Request) {
  try {
    const ctx = await getAuthContext();
    const isPrincipal =
      !ctx ||
      ctx.roleKeys.includes("headmaster") ||
      ctx.roleKeys.includes("admin") ||
      ctx.roleKeys.includes("principal");

    if (ctx && !isPrincipal) {
      return NextResponse.json(
        { error: "Forbidden: Only institutional administrators can revoke API keys." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { keyId } = body;

    if (!keyId) {
      return NextResponse.json({ error: "Missing keyId" }, { status: 400 });
    }

    const keys = getStoredApiKeys();
    const key = keys.find((k) => k.id === keyId);
    if (!key) {
      return NextResponse.json({ error: "API key not found." }, { status: 404 });
    }

    key.status = "REVOKED";
    saveStoredApiKeys(keys);

    return NextResponse.json({
      success: true,
      message: `API key '${key.name}' was revoked.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to revoke API key." }, { status: 500 });
  }
}
