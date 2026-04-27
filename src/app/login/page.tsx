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
    <div className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">
            Health Tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
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
            <div className="text-sm font-medium">ユーザー名</div>
            <input
              name="username"
              type="text"
              autoComplete="username"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
              required
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium">パスワード</div>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none ring-emerald-500 focus:ring-2"
              required
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {pending ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-4 text-xs text-zinc-500">
          ※ v1は単一管理者アカウントのみ対応
        </p>
      </div>
    </div>
  );
}

