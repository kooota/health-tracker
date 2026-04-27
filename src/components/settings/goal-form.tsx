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
        <div className="text-sm font-medium">開始日</div>
        <input
          name="startDate"
          type="date"
          defaultValue={initialGoal?.startDate ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
          required
        />
      </label>

      <label className="block">
        <div className="text-sm font-medium">期限</div>
        <input
          name="targetDate"
          type="date"
          defaultValue={initialGoal?.targetDate ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
          required
        />
      </label>

      <label className="block">
        <div className="text-sm font-medium">目標体重(kg)</div>
        <input
          name="targetWeight"
          type="number"
          inputMode="decimal"
          step="0.1"
          defaultValue={initialGoal?.targetWeight ?? ""}
          className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
          required
        />
      </label>

      <div className="sm:col-span-3 flex flex-wrap items-center gap-2">
        <button
          type="submit"
          disabled={status === "saving"}
          className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {status === "saving" ? "保存中..." : "保存"}
        </button>
        <div className="text-xs text-zinc-500">
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
        <div className="sm:col-span-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          保存しました（画面を更新すると反映されます）
        </div>
      ) : null}

      {status === "error" ? (
        <div className="sm:col-span-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </form>
  );
}

