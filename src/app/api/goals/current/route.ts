import { getDb } from "@/db/client";
import { goalSettings, healthConnections, measurements } from "@/db/schema";
import { getSession } from "@/lib/session";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  startDate: z.string().min(1),
  targetDate: z.string().min(1),
  targetWeight: z.number().finite(),
});

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const db = getDb();

  const conn = await db
    .select({ id: healthConnections.id })
    .from(healthConnections)
    .where(eq(healthConnections.provider, "healthplanet"))
    .orderBy(desc(healthConnections.updatedAt))
    .limit(1);

  if (conn.length === 0) {
    return NextResponse.json({ error: "not_connected" }, { status: 400 });
  }

  const connectionId = conn[0]!.id;

  const latestWeight = await db
    .select({ value: measurements.value })
    .from(measurements)
    .where(
      and(
        eq(measurements.connectionId, connectionId),
        eq(measurements.metricType, "weight"),
      ),
    )
    .orderBy(desc(measurements.measuredAt))
    .limit(1);

  if (latestWeight.length === 0) {
    return NextResponse.json(
      { error: "no_weight_data" },
      { status: 400 },
    );
  }

  const startWeight = Number(latestWeight[0]!.value);
  if (!Number.isFinite(startWeight)) {
    return NextResponse.json({ error: "invalid_weight" }, { status: 400 });
  }

  // Deactivate existing active goals
  await db.update(goalSettings).set({ isActive: false }).where(eq(goalSettings.isActive, true));

  await db.insert(goalSettings).values({
    startDate: parsed.data.startDate,
    targetDate: parsed.data.targetDate,
    startWeight: String(startWeight),
    targetWeight: String(parsed.data.targetWeight),
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true });
}

