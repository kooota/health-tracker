import { getDb } from "@/db/client";
import {
  goalSettings,
  healthConnections,
  measurements,
  syncRuns,
} from "@/db/schema";
import { and, desc, eq, gte, inArray, isNotNull } from "drizzle-orm";

function num(v: unknown) {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  return Number(v);
}

export async function getHealthPlanetConnection() {
  const db = getDb();
  const rows = await db
    .select({
      id: healthConnections.id,
      lastSuccessfulSyncAt: healthConnections.lastSuccessfulSyncAt,
      updatedAt: healthConnections.updatedAt,
    })
    .from(healthConnections)
    .where(eq(healthConnections.provider, "healthplanet"))
    .orderBy(desc(healthConnections.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getLatestSyncRun(connectionId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: syncRuns.id,
      trigger: syncRuns.trigger,
      startedAt: syncRuns.startedAt,
      finishedAt: syncRuns.finishedAt,
      status: syncRuns.status,
      recordsImported: syncRuns.recordsImported,
      errorMessage: syncRuns.errorMessage,
      partialFailure: syncRuns.partialFailure,
    })
    .from(syncRuns)
    .where(eq(syncRuns.connectionId, connectionId))
    .orderBy(desc(syncRuns.startedAt))
    .limit(1);
  return rows[0] ?? null;
}

export async function getCurrentGoal() {
  const db = getDb();
  const rows = await db
    .select({
      id: goalSettings.id,
      startDate: goalSettings.startDate,
      targetDate: goalSettings.targetDate,
      startWeight: goalSettings.startWeight,
      targetWeight: goalSettings.targetWeight,
      createdAt: goalSettings.createdAt,
    })
    .from(goalSettings)
    .where(eq(goalSettings.isActive, true))
    .orderBy(desc(goalSettings.createdAt))
    .limit(1);
  const g = rows[0];
  if (!g) return null;
  return {
    ...g,
    startWeight: num(g.startWeight),
    targetWeight: num(g.targetWeight),
  };
}

export async function getLatestWeight(connectionId: string) {
  const db = getDb();
  const rows = await db
    .select({
      value: measurements.value,
      measuredAt: measurements.measuredAt,
    })
    .from(measurements)
    .where(
      and(
        eq(measurements.connectionId, connectionId),
        eq(measurements.metricType, "weight"),
      ),
    )
    .orderBy(desc(measurements.measuredAt))
    .limit(1);

  const r = rows[0];
  if (!r) return null;
  return { value: num(r.value), measuredAt: r.measuredAt };
}

export async function getSeriesSince(connectionId: string, since: Date) {
  const db = getDb();
  const rows = await db
    .select({
      metricType: measurements.metricType,
      value: measurements.value,
      measuredAt: measurements.measuredAt,
      measurementDay: measurements.measurementDay,
    })
    .from(measurements)
    .where(
      and(
        eq(measurements.connectionId, connectionId),
        gte(measurements.measuredAt, since),
        inArray(measurements.metricType, ["weight", "body_fat", "steps"]),
        isNotNull(measurements.measuredAt),
      ),
    )
    .orderBy(measurements.measuredAt);

  return rows.map((r) => ({
    metricType: r.metricType,
    value: num(r.value),
    measuredAt: r.measuredAt,
    measurementDay: r.measurementDay,
  }));
}

