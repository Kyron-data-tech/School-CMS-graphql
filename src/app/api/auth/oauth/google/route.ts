import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${url.origin}/api/auth/oauth/callback`;

  // Generate cryptographically random state to protect against CSRF attacks (RFC 6749 Section 10.12)
  const state = randomBytes(16).toString("hex");
  const cookieJar = await cookies();
  cookieJar.set("oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  // If real Google OAuth Client ID is configured in .env, redirect directly to Google OAuth 2.0 authorization server
  if (clientId && clientId !== "mock_google_client_id") {
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.set("client_id", clientId);
    googleAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleAuthUrl.searchParams.set("response_type", "code");
    googleAuthUrl.searchParams.set("scope", "openid email profile");
    googleAuthUrl.searchParams.set("state", state);
    googleAuthUrl.searchParams.set("access_type", "offline");
    googleAuthUrl.searchParams.set("prompt", "select_account");

    return NextResponse.redirect(googleAuthUrl.toString());
  }

  // If in local sandbox / review testing mode, redirect to login page with sandbox trigger
  return NextResponse.redirect(`${url.origin}/login?oauth_sandbox=true&state=${state}`);
}
