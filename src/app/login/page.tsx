import Link from "next/link";
import { loginAction } from "@/app/login/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(240,181,101,0.16),_transparent_30%),linear-gradient(180deg,#fffdf7_0%,#f6f1e5_45%,#f1ede3_100%)] px-6 py-12 text-stone-900">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-stone-200/80 bg-white/70 p-8 shadow-[0_30px_80px_rgba(92,68,32,0.10)] backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Loqol take-home
          </p>
          <h1 className="mt-4 max-w-2xl font-[family-name:var(--font-display)] text-5xl leading-tight">
            A calmer disclosure flow for sellers doing paperwork after a long day.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-700">
            This prototype treats the California TDS like a conversation first and a PDF second. Mechanical inventory gets quick taps. Nuanced legal questions get voice support, plain-English framing, and room for follow-up.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-stone-950 p-5 text-stone-50">
              <p className="text-sm uppercase tracking-[0.24em] text-amber-300">
                Demo agent login
              </p>
              <p className="mt-4 text-xl font-semibold">agent@loqol.demo</p>
              <p className="mt-1 text-stone-300">Password: loqol-demo</p>
            </div>
            <div className="rounded-[1.5rem] border border-stone-200 bg-stone-50 p-5">
              <p className="text-sm uppercase tracking-[0.24em] text-stone-500">
                Demo seller link
              </p>
              <Link
                href="/seller/seller_demo_wm0KYwU4uYj0gQ5Xk3At4mWJxGc7Zx5L"
                className="mt-4 inline-flex rounded-full bg-amber-500 px-4 py-2 font-medium text-stone-950 transition hover:bg-amber-400"
              >
                Open seller dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200/80 bg-white p-8 shadow-[0_24px_60px_rgba(92,68,32,0.08)]">
          <h2 className="font-[family-name:var(--font-display)] text-3xl">Agent sign in</h2>
          <p className="mt-3 text-stone-600">
            Email/password auth is backed by a hashed credential in SQLite and a signed, httpOnly session cookie. Seller links are separate random tokens, so guessing an agent path or a deal id is not enough to get into the seller flow.
          </p>

          <form action={loginAction} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Email</span>
              <input
                name="email"
                type="email"
                defaultValue="agent@loqol.demo"
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">Password</span>
              <input
                name="password"
                type="password"
                defaultValue="loqol-demo"
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none transition focus:border-amber-500"
              />
            </label>
            {params.error === "invalid" ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                That email and password pair did not match the seeded demo account.
              </p>
            ) : null}
            <button className="w-full rounded-full bg-stone-950 px-5 py-3 font-medium text-white transition hover:bg-stone-800">
              Enter agent workspace
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

