import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/logout-button";
import { getHealthPlanetConnection, getCurrentGoal, getLatestWeight, getSeriesSince } from "@/lib/dashboard/queries";
import WeightChart from "@/components/charts/weight-chart";
import BodyFatChart from "@/components/charts/body-fat-chart";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const conn = await getHealthPlanetConnection();
  const goal = await getCurrentGoal();

  const connectionId = conn?.id ?? null;
  const latestWeight = connectionId ? await getLatestWeight(connectionId) : null;

  const now = new Date();
  const since = new Date(now);
  since.setDate(since.getDate() - 120);
  const series = connectionId ? await getSeriesSince(connectionId, since) : [];

  const currentWeight = latestWeight?.value ?? null;
  const targetWeight = goal?.targetWeight ?? null;
  const startWeight = goal?.startWeight ?? null;

  const diffToTarget =
    currentWeight != null && targetWeight != null ? currentWeight - targetWeight : null;
  const diffFromStart =
    currentWeight != null && startWeight != null ? currentWeight - startWeight : null;

  const remainingDays =
    goal?.targetDate
      ? Math.ceil((new Date(goal.targetDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : null;

  const remainingWeeks =
    remainingDays != null ? Math.max(remainingDays / 7, 1 / 7) : null;

  const requiredPace =
    currentWeight != null &&
    targetWeight != null &&
    remainingWeeks != null &&
    remainingDays != null &&
    remainingDays > 0
      ? (targetWeight - currentWeight) / remainingWeeks
      : null;

  const weightPoints = series
    .filter((p) => p.metricType === "weight")
    .map((p) => ({
      x: new Date(p.measuredAt).toISOString().slice(5, 10),
      y: p.value,
      goal: targetWeight,
    }));

  const bodyFatPoints = series
    .filter((p) => p.metricType === "body_fat")
    .map((p) => ({
      x: new Date(p.measuredAt).toISOString().slice(5, 10),
      y: p.value,
    }));

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex rounded-full border border-sky-100 bg-white/75 px-3 py-1 text-xs font-medium text-sky-500 shadow-sm">
            Daily Overview
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-700">
            ダッシュボード
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            体重・体脂肪率（Health Planet）
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/settings"
            className="rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-medium text-sky-600 shadow-sm shadow-sky-100/70 hover:-translate-y-0.5 hover:bg-sky-50"
          >
            設定
          </a>
          <LogoutButton />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          {
            title: "現在体重",
            value: currentWeight != null ? `${currentWeight.toFixed(1)} kg` : "—",
          },
          {
            title: "目標との差",
            value: diffToTarget != null ? `${diffToTarget.toFixed(1)} kg` : "—",
          },
          {
            title: "開始時との差",
            value: diffFromStart != null ? `${diffFromStart.toFixed(1)} kg` : "—",
          },
          {
            title: "残り日数",
            value:
              remainingDays == null
                ? "—"
                : remainingDays > 0
                  ? `${remainingDays} 日`
                  : "期限超過",
          },
          {
            title: "必要ペース",
            value:
              requiredPace == null
                ? remainingDays != null && remainingDays <= 0
                  ? "期限超過"
                  : "—"
                : `${requiredPace.toFixed(2)} kg/週`,
          },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-[26px] border border-white/70 bg-white/80 p-5 shadow-[0_16px_48px_rgba(148,163,184,0.12)] backdrop-blur"
          >
            <div className="text-sm font-medium text-slate-500">{c.title}</div>
            <div className="mt-3 text-xl font-semibold text-slate-700">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_20px_60px_rgba(148,163,184,0.12)] backdrop-blur">
          <div className="text-sm font-semibold text-slate-700">体重</div>
          <div className="mt-2 text-sm text-slate-500">
            {connectionId ? "直近約120日" : "未連携（設定で連携してください）"}
          </div>
          <div className="mt-4">
            {weightPoints.length > 0 ? (
              <WeightChart data={weightPoints} />
            ) : (
              <div className="mt-6 grid h-56 place-items-center rounded-[22px] bg-rose-50/70 text-sm text-slate-500">
                データがありません（同期してください）
              </div>
            )}
          </div>
        </div>
        <div className="rounded-[28px] border border-white/70 bg-white/82 p-5 shadow-[0_20px_60px_rgba(148,163,184,0.12)] backdrop-blur">
          <div className="text-sm font-semibold text-slate-700">体脂肪率</div>
          <div className="mt-2 text-sm text-slate-500">直近約120日</div>
          <div className="mt-4">
            {bodyFatPoints.length > 0 ? (
              <BodyFatChart data={bodyFatPoints} />
            ) : (
              <div className="mt-6 grid h-56 place-items-center rounded-[22px] bg-emerald-50/70 text-sm text-slate-500">
                データがありません（同期してください）
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
