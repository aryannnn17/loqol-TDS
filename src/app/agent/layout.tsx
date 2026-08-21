import Link from "next/link";
import { logoutAction } from "@/app/agent/actions";
import { requireAgent } from "@/lib/auth";

export default async function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agent = await requireAgent();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <Link href="/agent" className="text-lg font-semibold tracking-[0.2em] text-amber-300 uppercase">
              Loqol
            </Link>
            <p className="text-sm text-stone-400">
              Agent workspace for {agent.name}
            </p>
          </div>
          <form action={logoutAction}>
            <button className="rounded-full border border-white/15 px-4 py-2 text-sm text-stone-200 transition hover:border-amber-300 hover:text-white">
              Log out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}

