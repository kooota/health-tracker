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
          <div className="inline-flex rounded-full border border-emerald-100 bg-white/75 px-3 py-1 text-xs font-medium text-emerald-500 shadow-sm">
            Customize
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-700">設定</h1>
          <p className="mt-1 text-sm text-slate-500">
            目標と同期状態の管理（v1）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/dashboard"
            className="rounded-full border border-emerald-100 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-600 shadow-sm shadow-emerald-100/70 hover:-translate-y-0.5 hover:bg-emerald-50"
          >
            ダッシュボードへ
          </a>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <section className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_20px_60px_rgba(148,163,184,0.12)] backdrop-blur">
          <h2 className="text-sm font-semibold text-slate-700">目標</h2>
          <p className="mt-1 text-sm text-slate-500">
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

        <section className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_20px_60px_rgba(148,163,184,0.12)] backdrop-blur">
          <h2 className="text-sm font-semibold text-slate-700">Health Planet</h2>
          <p className="mt-1 text-sm text-slate-500">
            {connected ? "連携済み" : "未連携"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/api/healthplanet/connect"
              className="rounded-full bg-[linear-gradient(135deg,#86efac_0%,#7dd3fc_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(125,211,252,0.3)] hover:-translate-y-0.5 hover:brightness-105"
            >
              {connected ? "再連携" : "連携する"}
            </a>
            <ManualSyncButton disabled={!connected} />
          </div>

          <div className="mt-4 text-xs text-slate-500">
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
              <div className="mt-1 text-rose-500">{latestSync.errorMessage}</div>
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
