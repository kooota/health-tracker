"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    const username = String(formData.get("username") ?? "");
    const password = String(formData.get("password") ?? "");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (res?.error) {
      setError("ユーザー名またはパスワードが正しくありません。");
      setPending(false);
      return;
    }

    router.push(res?.url ?? "/dashboard");
  }

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(254,226,226,0.65),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(224,231,255,0.8),_transparent_34%),radial-gradient(circle_at_left,_rgba(220,252,231,0.7),_transparent_28%)]" />
      <div className="w-full max-w-sm rounded-[28px] border border-rose-100 bg-white/80 p-7 shadow-[0_24px_80px_rgba(244,114,182,0.12)] backdrop-blur">
        <div className="mb-6">
          <div className="mb-3 inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-500">
            Health Planet Dashboard
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-700">
            Health Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            ダッシュボードにアクセスするにはログインしてください。
          </p>
        </div>

        <form
          action={async (formData) => {
            await onSubmit(formData);
          }}
          className="space-y-4"
        >
          <label className="block">
            <div className="text-sm font-medium text-slate-600">ユーザー名</div>
            <input
              name="username"
              type="text"
              autoComplete="username"
              className="mt-1 w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 outline-none ring-0 placeholder:text-slate-300 focus:border-sky-200 focus:bg-white focus:shadow-[0_0_0_4px_rgba(191,219,254,0.35)]"
              required
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium text-slate-600">パスワード</div>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-2xl border border-rose-100 bg-white/90 px-4 py-3 outline-none ring-0 placeholder:text-slate-300 focus:border-sky-200 focus:bg-white focus:shadow-[0_0_0_4px_rgba(191,219,254,0.35)]"
              required
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-2xl bg-[linear-gradient(135deg,#f9a8d4_0%,#a5b4fc_100%)] px-3 py-3 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(165,180,252,0.35)] hover:-translate-y-0.5 hover:brightness-105 disabled:translate-y-0 disabled:opacity-60"
          >
            {pending ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-400">
          ※ v1は単一管理者アカウントのみ対応
        </p>
      </div>
    </div>
  );
}
