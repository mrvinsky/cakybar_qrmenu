import { logoutAction } from "@/app/actions/auth";

export default function Suspended() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="card max-w-md space-y-3 text-center">
        <h1 className="text-xl font-bold text-red-400">Pristup suspendovan</h1>
        <p className="text-sm text-zinc-400">
          Pretplata za ovaj objekat nije aktivna. Kontaktirajte podršku platforme.
        </p>
        <form action={logoutAction}>
          <button className="btn-ghost">Odjava</button>
        </form>
      </div>
    </main>
  );
}
