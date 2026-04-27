import { getDb } from "@/db/client";
import { healthConnections } from "@/db/schema";
import { encryptSecret } from "@/lib/crypto";
import { exchangeCodeForToken } from "@/lib/healthplanet";
import { getSession } from "@/lib/session";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const db = getDb();

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error) redirect(`/settings?hp=error`);
  if (!code) redirect(`/settings?hp=error`);

  const { accessToken, refreshToken, expiresInSec } =
    await exchangeCodeForToken(code);

  const now = new Date();
  const tokenExpiresAt = new Date(now.getTime() + expiresInSec * 1000);

  const encryptedAccess = encryptSecret(accessToken);
  const encryptedRefresh = refreshToken ? encryptSecret(refreshToken) : null;

  // Single-user v1: keep one row per provider, update in-place.
  const existing = await db
    .select({ id: healthConnections.id })
    .from(healthConnections)
    .where(eq(healthConnections.provider, "healthplanet"))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(healthConnections)
      .set({
        accessTokenEncrypted: encryptedAccess,
        refreshTokenEncrypted: encryptedRefresh,
        tokenExpiresAt,
        grantedScopes: "innerscan,pedometer",
        updatedAt: now,
      })
      .where(eq(healthConnections.id, existing[0]!.id));
  } else {
    await db.insert(healthConnections).values({
      provider: "healthplanet",
      accessTokenEncrypted: encryptedAccess,
      refreshTokenEncrypted: encryptedRefresh,
      tokenExpiresAt,
      grantedScopes: "innerscan,pedometer",
      createdAt: now,
      updatedAt: now,
    });
  }

  redirect(`/settings?hp=connected`);
}

