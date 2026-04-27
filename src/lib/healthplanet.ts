import { z } from "zod";

const tokenResponseSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().or(z.string().transform((s) => Number(s))),
  refresh_token: z.string().optional(),
});

const statusItemSchema = z.object({
  date: z.string(),
  keydata: z.string(),
  model: z.string().optional(),
  tag: z.string(),
});

const statusResponseSchema = z.object({
  data: z.array(statusItemSchema).optional().default([]),
});

export function getHealthPlanetAuthUrl() {
  const clientId = process.env.HEALTHPLANET_CLIENT_ID;
  const redirectUri = process.env.HEALTHPLANET_REDIRECT_URI;
  if (!clientId) throw new Error("HEALTHPLANET_CLIENT_ID is required");
  if (!redirectUri) throw new Error("HEALTHPLANET_REDIRECT_URI is required");

  const url = new URL("https://www.healthplanet.jp/oauth/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "innerscan,pedometer");
  url.searchParams.set("response_type", "code");
  return url.toString();
}

export async function exchangeCodeForToken(code: string) {
  const clientId = process.env.HEALTHPLANET_CLIENT_ID;
  const clientSecret = process.env.HEALTHPLANET_CLIENT_SECRET;
  const redirectUri = process.env.HEALTHPLANET_REDIRECT_URI;
  if (!clientId) throw new Error("HEALTHPLANET_CLIENT_ID is required");
  if (!clientSecret) throw new Error("HEALTHPLANET_CLIENT_SECRET is required");
  if (!redirectUri) throw new Error("HEALTHPLANET_REDIRECT_URI is required");

  const body = new URLSearchParams();
  body.set("client_id", clientId);
  body.set("client_secret", clientSecret);
  body.set("redirect_uri", redirectUri);
  body.set("code", code);
  body.set("grant_type", "authorization_code");

  const res = await fetch("https://www.healthplanet.jp/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Health Planet token exchange failed: ${res.status} ${text}`);
  }

  const json = await res.json();
  const parsed = tokenResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("Health Planet token response invalid");

  return {
    accessToken: parsed.data.access_token,
    refreshToken: parsed.data.refresh_token ?? null,
    expiresInSec: parsed.data.expires_in,
  };
}

export async function fetchInnerscan(accessToken: string, from?: string, to?: string) {
  const url = new URL("https://www.healthplanet.jp/status/innerscan.json");
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("date", "1");
  url.searchParams.set("tag", "6021,6022");
  if (from) url.searchParams.set("from", from);
  if (to) url.searchParams.set("to", to);

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`innerscan fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  const parsed = statusResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("innerscan response invalid");
  return parsed.data.data;
}

export async function fetchPedometer(accessToken: string, from?: string, to?: string) {
  const url = new URL("https://www.healthplanet.jp/status/pedometer.json");
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("date", "1");
  // 6331 = steps
  url.searchParams.set("tag", "6331");
  if (from) url.searchParams.set("from", from);
  if (to) url.searchParams.set("to", to);

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`pedometer fetch failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  const parsed = statusResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error("pedometer response invalid");
  return parsed.data.data;
}

