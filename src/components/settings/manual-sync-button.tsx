"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ManualSyncButton({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setPending(true);
    setMessage(null);
    const res = await fetch("/api/sync/manual", { method: "POST" });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      setMessage(text || "同期に失敗しました");
      setPending(false);
      return;
    }
    let imported = 0;
    try {
      const j = JSON.parse(text) as { recordsImported?: number; status?: string };
      if (typeof j.recordsImported === "number") imported = j.recordsImported;
    } catch {
      /* empty */
    }
    setMessage(
      imported > 0
        ? `同期が完了しました（取り込み ${imported} 件）`
        : "同期が完了しました（新しいデータはありませんでした）",
    );
    setPending(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => void run()}
        className="rounded-full border border-sky-100 bg-white/85 px-4 py-2 text-sm font-medium text-sky-600 shadow-sm shadow-sky-100/70 hover:-translate-y-0.5 hover:bg-sky-50 disabled:translate-y-0 disabled:opacity-60"
      >
        {pending ? "同期中..." : "手動同期"}
      </button>
      {message ? <div className="text-xs text-slate-500">{message}</div> : null}
    </div>
  );
}
