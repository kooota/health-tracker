import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import LogoutButton from "@/components/logout-button";
import { getHealthPlanetConnection, getCurrentGoal, getLatestWeight, getSeriesSince } from "@/lib/dashboard/queries";
import WeightChart from "@/components/charts/weight-chart";
import StepsChart from "@/components/charts/steps-chart";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  const conn = await getHealthPlanetConnection();
  const goal = await getCurrentGoal();

  const connectionId = conn?.id ?? null;
  const latestWeight = connectionId ? await getLatestWeight(connectionId) : null;

  const since = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
  const series = connectionId ? await getSeriesSince(connectionId, since) : [];

  const currentWeight = latestWeight?.value ?? null;
  const targetWeight = goal?.targetWeight ?? null;
  const startWeight = goal?.startWeight ?? null;

  const diffToTarget =
    currentWeight != null && targetWeight != null ? currentWeight - targetWeight : null;
  const diffFromStart =
    currentWeight != null && startWeight != null ? currentWeight - startWeight : null;

  const today = new Date();
  const remainingDays =
    goal?.targetDate
      ? Math.ceil((new Date(goal.targetDate).getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
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

  const stepsByDay = new Map<string, number>();
  for (const p of series) {
    if (p.metricType !== "steps") continue;
    const day = p.measurementDay ?? new Date(p.measuredAt).toISOString().slice(0, 10);
    stepsByDay.set(day, (stepsByDay.get(day) ?? 0) + p.value);
  }
  const stepsPoints = Array.from(stepsByDay.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, steps], idx, arr) => {
      const window = arr.slice(Math.max(0, idx - 6), idx + 1);
      const ma7 = window.length === 7 ? window.reduce((s, [, v]) => s + v, 0) / 7 : null;
      return { x: day.slice(5), steps, ma7 };
    });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            ダッシュボード
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            体重・体脂肪率・歩数（Health Planet）
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/settings"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50"
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
            className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
          >
            <div className="text-sm text-zinc-600">{c.title}</div>
            <div className="mt-2 text-xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium">体重</div>
          <div className="mt-2 text-sm text-zinc-600">
            {connectionId ? "直近約120日" : "未連携（設定で連携してください）"}
          </div>
          <div className="mt-4">
            {weightPoints.length > 0 ? (
              <WeightChart data={weightPoints} />
            ) : (
              <div className="mt-6 h-56 rounded-xl bg-zinc-50 grid place-items-center text-sm text-zinc-500">
                データがありません（同期してください）
              </div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium">歩数</div>
          <div className="mt-2 text-sm text-zinc-600">日別 + 7日移動平均</div>
          <div className="mt-4">
            {stepsPoints.length > 0 ? (
              <StepsChart data={stepsPoints} />
            ) : (
              <div className="mt-6 h-56 rounded-xl bg-zinc-50 grid place-items-center text-sm text-zinc-500">
                データがありません（同期してください）
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

