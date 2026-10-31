"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={action} className="card w-full max-w-sm space-y-4">
        <div>
          <a href="/" className="text-2xl font-bold text-amber-500">BarOS</a>
          <p className="text-sm text-zinc-400">Prijavite se na svoj nalog</p>
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="input" autoComplete="username" />
        </div>
        <div>
          <label className="label">Lozinka</label>
          <input name="password" type="password" required className="input" autoComplete="current-password" />
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" name="remember" /> Zapamti me
        </label>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        <button className="btn w-full" disabled={pending}>
          {pending ? "Prijava..." : "Prijavi se"}
        </button>
      </form>
    </main>
  );
}
