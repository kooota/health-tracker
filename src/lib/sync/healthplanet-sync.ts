import { getDb } from "@/db/client";
import {
  healthConnections,
  measurements,
  syncRuns,
} from "@/db/schema";
import { decryptSecret } from "@/lib/crypto";
import { addMonthsUtc, formatYmdHmsForHealthPlanet } from "@/lib/datetime";
import { fetchInnerscan, fetchPedometer } from "@/lib/healthplanet";
import { eq } from "drizzle-orm";

type Trigger = "manual" | "cron";

function parseHpDateToUtc(dateStr: string) {
  // Examples: yyyyMMddHHmmss or yyyyMMddHHmm（仕様上は測定/登録の日時; 国内向け JST として扱う）
  const s = dateStr.trim();
  if (s.length !== 12 && s.length !== 14) {
    throw new Error(`Unexpected Health Planet date: ${s}`);
  }
  const yyyy = Number(s.slice(0, 4));
  const MM = Number(s.slice(4, 6));
  const dd = Number(s.slice(6, 8));
  const HH = Number(s.slice(8, 10));
  const mm = Number(s.slice(10, 12));
  const ss = s.length === 14 ? Number(s.slice(12, 14)) : 0;
  return new Date(
    `${String(yyyy)}-${String(MM).padStart(2, "0")}-${String(dd).padStart(2, "0")}T` +
      `${String(HH).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}+09:00`,
  );
}

function measurementDayJst(measuredAtUtc: Date) {
  const jst = new Date(measuredAtUtc.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
  const d = String(jst.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfDayJstUtc(dayYmd: string) {
  // dayYmd in JST, convert to UTC Date at 00:00 JST
  const [y, m, d] = dayYmd.split("-").map((x) => Number(x));
  const utc = Date.UTC(y!, (m ?? 1) - 1, d!, 0, 0, 0) - 9 * 60 * 60 * 1000;
  return new Date(utc);
}

export async function runHealthPlanetSync(trigger: Trigger) {
  const db = getDb();
  const now = new Date();

  const conn = await db
    .select({
      id: healthConnections.id,
      accessTokenEncrypted: healthConnections.accessTokenEncrypted,
      lastSuccessfulSyncAt: healthConnections.lastSuccessfulSyncAt,
    })
    .from(healthConnections)
    .where(eq(healthConnections.provider, "healthplanet"))
    .limit(1);

  if (conn.length === 0) {
    throw new Error("Health Planet is not connected");
  }

  const connectionId = conn[0]!.id;
  const accessToken = decryptSecret(conn[0]!.accessTokenEncrypted);

  const run = await db
    .insert(syncRuns)
    .values({
      connectionId,
      trigger,
      status: "running",
      startedAt: now,
      recordsImported: 0,
      partialFailure: false,
    })
    .returning({ id: syncRuns.id });

  const runId = run[0]!.id;

  let recordsImported = 0;
  let partialFailure = false;
  let newLastSuccessfulSyncAt: Date | null = null;

  try {
    const start = conn[0]!.lastSuccessfulSyncAt
      ? conn[0]!.lastSuccessfulSyncAt
      : addMonthsUtc(now, -12);

    // Windowing: up to 3 months each, inclusive range
    let windowStart = start;
    while (windowStart < now) {
      const windowEnd = addMonthsUtc(windowStart, 3);
      const to = windowEnd < now ? windowEnd : now;

      const fromStr = formatYmdHmsForHealthPlanet(windowStart);
      const toStr = formatYmdHmsForHealthPlanet(to);

      try {
        const [innerscan, pedometer] = await Promise.all([
          fetchInnerscan(accessToken, fromStr, toStr),
          fetchPedometer(accessToken, fromStr, toStr),
        ]);

        // Innerscan: weight/body_fat by timestamp
        for (const item of innerscan) {
          const measuredAt = parseHpDateToUtc(item.date);
          const metricType =
            item.tag === "6021" ? "weight" : item.tag === "6022" ? "body_fat" : null;
          if (!metricType) continue;

          await db
            .insert(measurements)
            .values({
              connectionId,
              metricType,
              sourceEndpoint: "innerscan",
              sourceTag: item.tag,
              value: item.keydata,
              measuredAt,
              measurementDay: measurementDayJst(measuredAt),
              deviceModel: item.model ?? null,
              source: "healthplanet",
            })
            .onConflictDoNothing();

          recordsImported += 1;
        }

        // Pedometer: steps treated as daily, normalize to 00:00 JST
        for (const item of pedometer) {
          if (item.tag !== "6331") continue;
          const measuredAtRaw = parseHpDateToUtc(item.date);
          const day = measurementDayJst(measuredAtRaw);
          const measuredAt = startOfDayJstUtc(day);

          await db
            .insert(measurements)
            .values({
              connectionId,
              metricType: "steps",
              sourceEndpoint: "pedometer",
              sourceTag: item.tag,
              value: item.keydata,
              measuredAt,
              measurementDay: day,
              deviceModel: item.model ?? null,
              source: "healthplanet",
            })
            .onConflictDoNothing();

          recordsImported += 1;
        }

        // Only advance lastSuccessfulSyncAt if all windows succeed
        newLastSuccessfulSyncAt = to;
      } catch {
        partialFailure = true;
        // do not advance cursor; next run will retry from original start
        break;
      }

      windowStart = windowEnd;
    }

    if (!partialFailure && newLastSuccessfulSyncAt) {
      await db
        .update(healthConnections)
        .set({
          lastSuccessfulSyncAt: newLastSuccessfulSyncAt,
          updatedAt: new Date(),
        })
        .where(eq(healthConnections.id, connectionId));
    }

    await db
      .update(syncRuns)
      .set({
        finishedAt: new Date(),
        status: partialFailure ? "partial" : "ok",
        recordsImported,
        partialFailure,
      })
      .where(eq(syncRuns.id, runId));
  } catch (e) {
    const message = e instanceof Error ? e.message : "sync failed";
    await db
      .update(syncRuns)
      .set({
        finishedAt: new Date(),
        status: "error",
        recordsImported,
        partialFailure,
        errorMessage: message,
      })
      .where(eq(syncRuns.id, runId));
    throw e;
  }

  return {
    status: partialFailure ? "partial" : "ok",
    recordsImported,
  } as const;
}

