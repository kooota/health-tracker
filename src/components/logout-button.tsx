"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="rounded-full border border-rose-200 bg-white/80 px-4 py-2 text-sm font-medium text-rose-500 shadow-sm shadow-rose-100/70 hover:-translate-y-0.5 hover:bg-rose-50"
    >
      ログアウト
    </button>
  );
}
