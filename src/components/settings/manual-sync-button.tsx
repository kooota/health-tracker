"use client";

import { useState } from "react";

export default function ManualSyncButton({ disabled }: { disabled?: boolean }) {
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
    setMessage("同期を開始しました（反映は少し待ってから更新してください）");
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={disabled || pending}
        onClick={() => void run()}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-60"
      >
        {pending ? "同期中..." : "手動同期"}
      </button>
      {message ? <div className="text-xs text-zinc-500">{message}</div> : null}
    </div>
  );
}

