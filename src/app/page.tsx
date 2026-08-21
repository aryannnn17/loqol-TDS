import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(240,181,101,0.16),_transparent_30%),linear-gradient(180deg,#fffdf7_0%,#f6f1e5_45%,#f1ede3_100%)] px-6 py-12 text-stone-900">
      <div className="mx-auto max-w-6xl rounded-[2rem] border border-stone-200/80 bg-white/80 p-8 shadow-[0_30px_80px_rgba(92,68,32,0.10)] backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Loqol demo</p>
        <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-display)] text-6xl leading-tight">
          One answer model, two completion paths, and a filled TDS waiting on the other side.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-stone-700">
          Start as the agent to create and review a deal, or jump straight into the seeded seller experience. The design goal is simple: fast taps for mechanical questions, voice support where the legal language gets human.
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/login" className="rounded-full bg-stone-950 px-5 py-3 font-medium text-white transition hover:bg-stone-800">
            Open agent workspace
          </Link>
          <Link
            href="/seller/seller_demo_wm0KYwU4uYj0gQ5Xk3At4mWJxGc7Zx5L"
            className="rounded-full border border-stone-300 px-5 py-3 font-medium text-stone-800 transition hover:border-amber-400 hover:bg-amber-50"
          >
            Open seller dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
