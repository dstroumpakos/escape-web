/**
 * Sign in with Apple: verify the identity token (a JWT signed by Apple) so a
 * client can no longer just claim "I am Apple user X". Checks the signature
 * against Apple's published keys, the issuer, the audience (our app's bundle
 * id) and the expiry.
 *
 * Audience: APPLE_CLIENT_IDS (comma-separated) on the Convex deployment;
 * defaults to the iOS bundle id.
 */

import { action } from "./_generated/server";
import { v } from "convex/values";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";

export type AppleIdentity = {
  sub: string;
  email?: string;
  emailVerified: boolean;
};

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function parseJson(bytes: Uint8Array): any {
  return JSON.parse(new TextDecoder().decode(bytes));
}

export async function verifyAppleIdentityToken(token: string): Promise<AppleIdentity> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("APPLE_TOKEN_INVALID");
  const [h, p, sig] = parts;

  let header: any;
  let payload: any;
  try {
    header = parseJson(b64urlToBytes(h));
    payload = parseJson(b64urlToBytes(p));
  } catch {
    throw new Error("APPLE_TOKEN_INVALID");
  }
  if (header.alg !== "RS256" || typeof header.kid !== "string") throw new Error("APPLE_TOKEN_INVALID");

  const res = await fetch(APPLE_KEYS_URL);
  if (!res.ok) throw new Error("APPLE_KEYS_UNAVAILABLE");
  const { keys } = (await res.json()) as { keys: any[] };
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("APPLE_TOKEN_INVALID");

  const key = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlToBytes(sig).buffer as ArrayBuffer,
    new TextEncoder().encode(`${h}.${p}`).buffer as ArrayBuffer
  );
  if (!ok) throw new Error("APPLE_TOKEN_INVALID");

  const allowed = (process.env.APPLE_CLIENT_IDS ?? "com.unlocked.escapeapp")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (payload.iss !== APPLE_ISSUER) throw new Error("APPLE_TOKEN_INVALID");
  if (!allowed.includes(payload.aud)) throw new Error("APPLE_TOKEN_INVALID");
  if (typeof payload.exp !== "number" || payload.exp * 1000 < Date.now()) throw new Error("APPLE_TOKEN_EXPIRED");
  if (typeof payload.sub !== "string" || !payload.sub) throw new Error("APPLE_TOKEN_INVALID");

  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email.toLowerCase() : undefined,
    emailVerified: payload.email_verified === true || payload.email_verified === "true",
  };
}

/* ══════════════════════════════════════════════════════════════
 * Account deletion: revoke Sign in with Apple (App Store guideline 5.1.1(v)).
 *
 * The app asks Apple for a fresh authorization code right before deleting the
 * account and sends it here after the account is gone. We swap it for a token
 * and revoke that token, so the app disappears from the person's
 * "Sign in with Apple" list. The code itself proves who is asking, so no
 * session is needed (the session is already deleted by then).
 *
 * Needs a "Sign in with Apple" key from Apple Developer → Keys, set on Convex:
 *   APPLE_TEAM_ID (default 97G74KAACL), APPLE_SIGNIN_KEY_ID,
 *   APPLE_SIGNIN_PRIVATE_KEY (the .p8 file's text).
 * Without the key it logs a warning and does nothing.
 * ══════════════════════════════════════════════════════════════ */

const APPLE_APP_CLIENT_ID = "com.unlocked.escapeapp";

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function jsonB64url(o: unknown): string {
  return bytesToB64url(new TextEncoder().encode(JSON.stringify(o)));
}

/** The ES256 client secret Apple wants on /auth/token and /auth/revoke. */
async function appleClientSecret(clientId: string): Promise<string | null> {
  const teamId = process.env.APPLE_TEAM_ID || "97G74KAACL";
  const keyId = process.env.APPLE_SIGNIN_KEY_ID;
  const pem = process.env.APPLE_SIGNIN_PRIVATE_KEY;
  if (!keyId || !pem) return null;
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\n/g, "").replace(/\s+/g, "");
  const der = b64urlToBytes(b64.replace(/\+/g, "-").replace(/\//g, "_"));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der.buffer as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );
  const now = Math.floor(Date.now() / 1000);
  const signingInput = `${jsonB64url({ alg: "ES256", kid: keyId })}.${jsonB64url({
    iss: teamId,
    iat: now,
    exp: now + 300,
    aud: APPLE_ISSUER,
    sub: clientId,
  })}`;
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput).buffer as ArrayBuffer
  );
  return `${signingInput}.${bytesToB64url(new Uint8Array(sig))}`;
}

export const revokeAuthorization = action({
  args: { authorizationCode: v.string() },
  handler: async (_ctx, args): Promise<{ revoked: boolean }> => {
    const clientSecret = await appleClientSecret(APPLE_APP_CLIENT_ID);
    if (!clientSecret) {
      console.warn("[appleAuth] APPLE_SIGNIN_KEY_ID / APPLE_SIGNIN_PRIVATE_KEY not set: Apple sign-in not revoked");
      return { revoked: false };
    }
    const tokenRes = await fetch(`${APPLE_ISSUER}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: APPLE_APP_CLIENT_ID,
        client_secret: clientSecret,
        code: args.authorizationCode,
        grant_type: "authorization_code",
      }).toString(),
    });
    if (!tokenRes.ok) {
      console.warn("[appleAuth] code exchange failed", tokenRes.status, await tokenRes.text().catch(() => ""));
      return { revoked: false };
    }
    const tokens = (await tokenRes.json()) as { refresh_token?: string; access_token?: string };
    const token = tokens.refresh_token || tokens.access_token;
    if (!token) return { revoked: false };
    const revokeRes = await fetch(`${APPLE_ISSUER}/auth/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: APPLE_APP_CLIENT_ID,
        client_secret: clientSecret,
        token,
        token_type_hint: tokens.refresh_token ? "refresh_token" : "access_token",
      }).toString(),
    });
    if (!revokeRes.ok) console.warn("[appleAuth] revoke failed", revokeRes.status);
    return { revoked: revokeRes.ok };
  },
});
