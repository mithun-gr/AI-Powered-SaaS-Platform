/**
 * app/auth/callback/route.ts
 *
 * Direct Google OAuth 2.0 callback — 100% free, no Supabase OAuth needed.
 * Google redirects here with ?code= after consent. We exchange it for tokens
 * directly with Google's API, extract user info, write mrc_auth cookie, redirect.
 *
 * Flow:  User → Google consent screen → /auth/callback?code=XXX → /dashboard
 */

import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

const SESSION_7_DAYS_MS = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years — permanent
const SESSION_7_DAYS_S  = 10 * 365 * 24 * 60 * 60;        // seconds

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code  = searchParams.get("code");
  const error = searchParams.get("error");
  const next  = searchParams.get("state") ?? "/dashboard"; // we pass intended destination in state

  // ── OAuth error from Google (user denied, etc.) ──────────────────────────
  if (error) {
    console.warn("Google OAuth error:", error);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, origin)
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=no_code", origin));
  }

  try {
    // 1. Exchange authorization code for access token
    const redirectUri = `${origin}/auth/callback`;

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Token exchange failed:", err);
      return NextResponse.redirect(new URL("/login?error=token_failed", origin));
    }

    const tokenData = await tokenRes.json();
    const accessToken: string = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(new URL("/login?error=no_access_token", origin));
    }

    // 2. Get user profile from Google
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      console.error("Userinfo fetch failed:", userRes.status);
      return NextResponse.redirect(new URL("/login?error=userinfo_failed", origin));
    }

    const googleUser = await userRes.json();
    // googleUser: { sub, email, name, picture, email_verified, ... }

    if (!googleUser.email) {
      return NextResponse.redirect(new URL("/login?error=no_email", origin));
    }

    // 3. Determine role — check if it's the admin email, otherwise client
    const role: "client" | "admin" =
      googleUser.email === "admin@morchantra.com" ? "admin" : "client";

    // 4. Build mrc_auth cookie payload
    const session = {
      role,
      email: googleUser.email,
      name:  googleUser.name || googleUser.email.split("@")[0],
      picture: googleUser.picture || "",
      exp:   Date.now() + SESSION_7_DAYS_MS,
    };

    // 5. Also persist in localStorage-compatible format
    const userPayload = {
      email:  googleUser.email,
      name:   googleUser.name || "",
      picture: googleUser.picture || "",
      role,
      provider: "google",
    };

    // 6. Build redirect response
    const destination =
      next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    const redirectUrl = new URL(destination, origin);

    const response = NextResponse.redirect(redirectUrl);

    // Write mrc_auth cookie (read by proxy.ts server-side AND getAuthSession() client-side)
    // Important: pass plain JSON — Next.js response.cookies.set() handles encoding itself
    response.cookies.set("mrc_auth", JSON.stringify(session), {
      httpOnly: false,   // must be readable client-side (getAuthSession reads document.cookie)
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_7_DAYS_S,
      path: "/",
    });

    // Write a user cookie so client-side code picks it up without extra round-trips
    response.cookies.set(
      "mrc_user",
      JSON.stringify(userPayload),
      {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_7_DAYS_S,
        path: "/",
      }
    );

    return response;
  } catch (err) {
    console.error("Google OAuth callback unexpected error:", err);
    return NextResponse.redirect(new URL("/login?error=internal", origin));
  }
}
