import { runHealthPlanetSync } from "@/lib/sync/healthplanet-sync";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";

  const ok =
    !!expected && header.startsWith("Bearer ") && header.slice("Bearer ".length) === expected;

  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const result = await runHealthPlanetSync("cron");
  return NextResponse.json(result);
}

