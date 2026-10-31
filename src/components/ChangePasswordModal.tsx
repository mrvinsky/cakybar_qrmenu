"use client";

import { useState } from "react";
import { changeOwnPasswordAction } from "@/app/actions/auth";

export function ChangePasswordModal() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (newPassword !== confirmPassword) {
      setMsg({ type: "err", text: "Nove lozinke se ne podudaraju." });
      return;
    }
    setLoading(true);
    try {
      const res = await changeOwnPasswordAction(currentPassword, newPassword);
      if ("error" in res && res.error) {
        setMsg({ type: "err", text: res.error });
      } else {
        setMsg({ type: "ok", text: "Lozinka je uspješno promijenjena!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setOpen(false);
          setMsg(null);
        }, 1200);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMsg(null);
          setOpen(true);
        }}
        className="btn-ghost w-full text-xs"
      >
        🔑 Promijeni lozinku
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="card w-full max-w-sm space-y-3.5 border-zinc-700 bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h2 className="text-base font-bold">Promjena sopstvene lozinke</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="label">Trenutna lozinka *</label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Nova lozinka (min 6 znakova) *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Potvrdi novu lozinku *</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input"
              />
            </div>

            {msg && (
              <p
                className={`text-xs font-medium ${
                  msg.type === "ok" ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {msg.text}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="btn-ghost text-xs"
              >
                Otkaži
              </button>
              <button disabled={loading} className="btn text-xs">
                {loading ? "Čuvam..." : "Sačuvaj lozinku"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
