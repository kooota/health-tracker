import { getSession } from "@/lib/session";
import { runHealthPlanetSync } from "@/lib/sync/healthplanet-sync";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await runHealthPlanetSync("manual");
  return NextResponse.json(result);
}

