import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/logout-button";
import { getDb } from "@/db/client";
import { healthConnections } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  getCurrentGoal,
  getLatestSyncRun,
  getLatestWeight,
} from "@/lib/dashboard/queries";
import GoalForm from "@/components/settings/goal-form";
import ManualSyncButton from "@/components/settings/manual-sync-button";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const db = getDb();

  const hpConnection = await db
    .select({
      id: healthConnections.id,
      lastSuccessfulSyncAt: healthConnections.lastSuccessfulSyncAt,
      updatedAt: healthConnections.updatedAt,
    })
    .from(healthConnections)
    .where(eq(healthConnections.provider, "healthplanet"))
    .orderBy(desc(healthConnections.updatedAt))
    .limit(1);

  const connected = hpConnection.length > 0;
  const connectionId = hpConnection[0]?.id ?? null;
  const [goal, latestWeight, latestSync] = connectionId
    ? await Promise.all([
        getCurrentGoal(),
        getLatestWeight(connectionId),
        getLatestSyncRun(connectionId),
      ])
    : await Promise.all([getCurrentGoal(), Promise.resolve(null), Promise.resolve(null)]);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">設定</h1>
          <p className="mt-1 text-sm text-zinc-600">
            目標と同期状態の管理（v1）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/dashboard"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
          >
            ダッシュボードへ
          </a>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">目標</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {goal
              ? `開始 ${goal.startDate} / 期限 ${goal.targetDate} / ${goal.targetWeight.toFixed(
                  1,
                )}kg`
              : "未設定"}
          </p>

          <GoalForm
            initialGoal={
              goal
                ? {
                    startDate: goal.startDate,
                    targetDate: goal.targetDate,
                    startWeight: goal.startWeight,
                    targetWeight: goal.targetWeight,
                  }
                : null
            }
            latestWeight={
              latestWeight
                ? {
                    value: latestWeight.value,
                    measuredAt: latestWeight.measuredAt.toISOString(),
                  }
                : null
            }
          />
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Health Planet</h2>
          <p className="mt-1 text-sm text-zinc-600">
            {connected ? "連携済み" : "未連携"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/api/healthplanet/connect"
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {connected ? "再連携" : "連携する"}
            </a>
            <ManualSyncButton disabled={!connected} />
          </div>

          <div className="mt-4 text-xs text-zinc-500">
            <div>
              最終同期:{" "}
              {hpConnection[0]?.lastSuccessfulSyncAt
                ? hpConnection[0].lastSuccessfulSyncAt.toISOString()
                : "—"}
            </div>
            <div>
              直近の同期:{" "}
              {latestSync
                ? `${latestSync.status} (${latestSync.trigger}) / ${latestSync.recordsImported}件`
                : "—"}
            </div>
            {latestSync?.errorMessage ? (
              <div className="mt-1 text-red-600">{latestSync.errorMessage}</div>
            ) : null}
            <div>
              更新:{" "}
              {hpConnection[0]?.updatedAt
                ? hpConnection[0].updatedAt.toISOString()
                : "—"}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

