import Link from "next/link";
import { createDealAction } from "@/app/agent/actions";
import { requireAgent } from "@/lib/auth";
import { listDealsForAgent } from "@/lib/disclosure-store";
import { formatDateInput } from "@/lib/security";

export default async function AgentDashboardPage() {
  const agent = await requireAgent();
  const deals = await listDealsForAgent(agent.id);

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2rem] bg-white/6 p-7 shadow-[0_20px_50px_rgba(0,0,0,0.18)] ring-1 ring-white/10">
          <p className="text-sm uppercase tracking-[0.26em] text-amber-300">
            New seller request
          </p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-white">
            Create a deal and hand off the TDS without dumping the PDF on the seller.
          </h1>
          <form action={createDealAction} className="mt-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="title" placeholder="Deal title" className="rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 outline-none focus:border-amber-300" />
              <input name="propertyAddress" placeholder="Property address" className="rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 outline-none focus:border-amber-300" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="city" placeholder="City" className="rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 outline-none focus:border-amber-300" />
              <input name="county" placeholder="County" className="rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 outline-none focus:border-amber-300" />
            </div>
            <textarea name="propertyDescription" placeholder="Property description" rows={3} className="w-full rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 outline-none focus:border-amber-300" />
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="sellerName" placeholder="Primary seller name" className="rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 outline-none focus:border-amber-300" />
              <input name="sellerEmail" type="email" placeholder="Primary seller email" className="rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 outline-none focus:border-amber-300" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input name="seller2Name" placeholder="Second seller name (optional)" className="rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 outline-none focus:border-amber-300" />
              <input name="seller2Email" type="email" placeholder="Second seller email (optional)" className="rounded-2xl border border-white/10 bg-stone-900 px-4 py-3 outline-none focus:border-amber-300" />
            </div>
            <button className="rounded-full bg-amber-400 px-5 py-3 font-semibold text-stone-950 transition hover:bg-amber-300">
              Create seller deal
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] bg-white p-7 text-stone-900 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.26em] text-stone-500">
                Active deals
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl">
                What needs attention tonight
              </h2>
            </div>
            <p className="rounded-full bg-stone-100 px-4 py-2 text-sm text-stone-600">
              {deals.length} deal{deals.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {deals.map((deal) => (
              <Link
                key={deal.id}
                href={`/agent/deals/${deal.id}`}
                className="block rounded-[1.5rem] border border-stone-200 px-5 py-4 transition hover:border-amber-400 hover:bg-amber-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{deal.title}</p>
                    <p className="text-sm text-stone-600">{deal.propertyAddress}</p>
                    <p className="mt-1 text-sm text-stone-500">
                      {deal.sellerName} · {deal.sellerEmail}
                    </p>
                  </div>
                  <div className="min-w-48">
                    <div className="flex items-center justify-between text-sm text-stone-600">
                      <span>{deal.status.replaceAll("_", " ")}</span>
                      <span>{deal.progress.percent}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
                      <div
                        className="h-full rounded-full bg-amber-400"
                        style={{ width: `${deal.progress.percent}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-stone-500">
                      Last saved {deal.lastSavedAt ? formatDateInput(deal.lastSavedAt) : "not started"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
            {deals.length === 0 ? (
              <p className="rounded-[1.5rem] bg-stone-50 p-5 text-stone-600">
                No deals yet. Create one on the left and the seller workspace will be ready immediately.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}

