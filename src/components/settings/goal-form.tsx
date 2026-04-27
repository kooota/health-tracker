"use client";

import { useState } from "react";

type Goal = {
  startDate: string;
  targetDate: string;
  startWeight: number;
  targetWeight: number;
};

export default function GoalForm({
  initialGoal,
  latestWeight,
}: {
  initialGoal: Goal | null;
  latestWeight: { value: number; measuredAt: string } | null;
}) {
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setStatus("saving");
    setError(null);

    const payload = {
      startDate: String(formData.get("startDate") ?? ""),
      targetDate: String(formData.get("targetDate") ?? ""),
      targetWeight: Number(formData.get("targetWeight")),
    };

    const res = await fetch("/api/goals/current", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      setError(text || "保存に失敗しました");
      setStatus("error");
      return;
    }

    setStatus("ok");
  }

  return (
    <form
      action={async (fd) => {
        await onSubmit(fd);
      }}
      className="mt-4 grid gap-3 sm:grid-cols-3"
    >
      <label className="block">
        <div className="text-sm font-medium text-slate-600">開始日</div>
        <input
          name="startDate"
          type="date"
          defaultValue={initialGoal?.startDate ?? ""}
          className="mt-1 w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 outline-none focus:border-sky-200 focus:bg-white focus:shadow-[0_0_0_4px_rgba(191,219,254,0.35)]"
          required
        />
      </label>

      <label className="block">
        <div className="text-sm font-medium text-slate-600">期限</div>
        <input
          name="targetDate"
          type="date"
          defaultValue={initialGoal?.targetDate ?? ""}
          className="mt-1 w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 outline-none focus:border-sky-200 focus:bg-white focus:shadow-[0_0_0_4px_rgba(191,219,254,0.35)]"
          required
        />
      </label>

      <label className="block">
        <div className="text-sm font-medium text-slate-600">目標体重(kg)</div>
        <input
          name="targetWeight"
          type="number"
          inputMode="decimal"
          step="0.1"
          defaultValue={initialGoal?.targetWeight ?? ""}
          className="mt-1 w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 outline-none focus:border-sky-200 focus:bg-white focus:shadow-[0_0_0_4px_rgba(191,219,254,0.35)]"
          required
        />
      </label>

      <div className="sm:col-span-3 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-full bg-[linear-gradient(135deg,#f9a8d4_0%,#93c5fd_100%)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(147,197,253,0.28)] hover:-translate-y-0.5 hover:brightness-105 disabled:translate-y-0 disabled:opacity-60"
        >
          {status === "saving" ? "保存中..." : "保存"}
        </button>
        <div className="text-xs text-slate-500">
          開始時体重は、保存時点の最新体重をスナップショットします。
          {latestWeight ? (
            <>
              {" "}
              （最新: {latestWeight.value.toFixed(1)}kg / {latestWeight.measuredAt}）
            </>
          ) : null}
        </div>
      </div>

      {status === "ok" ? (
        <div className="sm:col-span-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          保存しました（画面を更新すると反映されます）
        </div>
      ) : null}

      {status === "error" ? (
        <div className="sm:col-span-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </div>
      ) : null}
    </form>
  );
}
