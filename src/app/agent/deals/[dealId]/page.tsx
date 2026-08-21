import Link from "next/link";
import { createDocusealAction, sendDisclosureAction } from "@/app/agent/actions";
import { requireAgent } from "@/lib/auth";
import { getDealStateById } from "@/lib/disclosure-store";
import { sectionCQuestions } from "@/lib/disclosure-schema";
import { prisma } from "@/lib/prisma";

export default async function DealDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ dealId: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { dealId } = await params;
  const query = await searchParams;
  const agent = await requireAgent();
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });

  if (!deal || deal.agentId !== agent.id) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p>Deal not found.</p>
      </main>
    );
  }

  const state = await getDealStateById(dealId);
  if (!state) {
    return null;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link href="/agent" className="text-sm text-amber-300 transition hover:text-amber-200">
        ← Back to deals
      </Link>

      <div className="mt-6 grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div className="rounded-[2rem] bg-white p-7 text-stone-900 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <p className="text-sm uppercase tracking-[0.25em] text-stone-500">Seller overview</p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl">
              {state.deal.title}
            </h1>
            <p className="mt-2 text-stone-600">{state.deal.propertyAddress}</p>

            <div className="mt-6 rounded-[1.5rem] bg-stone-50 p-5">
              <div className="flex items-center justify-between text-sm text-stone-600">
                <span>Disclosure progress</span>
                <span>{state.progress.percent}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${state.progress.percent}%` }}
                />
              </div>
              <p className="mt-4 text-sm text-stone-600">
                Voice-first prompts remaining: {state.summary.voiceFirstRemaining}
              </p>
              <p className="text-sm text-stone-600">
                Known-issue answers marked Yes: {state.summary.knownIssueCount}
              </p>
            </div>

            <div className="mt-6 grid gap-3">
              <form action={sendDisclosureAction}>
                <input type="hidden" name="dealId" value={state.deal.id} />
                <button className="w-full rounded-full bg-stone-950 px-5 py-3 font-medium text-white transition hover:bg-stone-800">
                  Send or refresh seller request
                </button>
              </form>
              <form action={createDocusealAction}>
                <input type="hidden" name="dealId" value={state.deal.id} />
                <button className="w-full rounded-full border border-stone-300 px-5 py-3 font-medium text-stone-800 transition hover:border-amber-400 hover:bg-amber-50">
                  Generate DocuSeal draft
                </button>
              </form>
            </div>

            {query.sent ? (
              <div className="mt-5 rounded-[1.5rem] bg-emerald-50 p-5">
                <p className="text-sm font-medium text-emerald-900">Seller link ready</p>
                <p className="mt-2 break-all text-sm text-emerald-800">{query.sent}</p>
              </div>
            ) : null}

            {state.deal.docusealStatus ? (
              <div className="mt-5 rounded-[1.5rem] bg-stone-50 p-5 text-sm text-stone-700">
                <p className="font-medium text-stone-900">DocuSeal status</p>
                <p className="mt-2">{state.deal.docusealStatus}</p>
                {state.deal.docusealEmbedUrl ? (
                  <a
                    href={state.deal.docusealEmbedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-full bg-amber-400 px-4 py-2 font-medium text-stone-950"
                  >
                    Open signer embed
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] bg-white p-7 text-stone-900 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <p className="text-sm uppercase tracking-[0.25em] text-stone-500">Review notes</p>
            <div className="mt-4 space-y-3">
              {state.warnings.map((warning) => (
                <div
                  key={`${warning.title}-${warning.body}`}
                  className={`rounded-[1.25rem] p-4 ${
                    warning.level === "warning"
                      ? "bg-amber-50 text-amber-950"
                      : "bg-stone-50 text-stone-800"
                  }`}
                >
                  <p className="font-medium">{warning.title}</p>
                  <p className="mt-1 text-sm">{warning.body}</p>
                </div>
              ))}
              {state.warnings.length === 0 ? (
                <p className="rounded-[1.25rem] bg-emerald-50 p-4 text-sm text-emerald-900">
                  No contradictions are currently flagged. The packet is internally consistent so far.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-7 text-stone-900 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
            <p className="text-sm uppercase tracking-[0.25em] text-stone-500">Structured answers</p>
            <div className="mt-4 space-y-4 text-sm text-stone-700">
              <div>
                <p className="font-semibold text-stone-900">Section A inventory</p>
                <p className="mt-1">{state.answers.sectionAInventory.items.join(", ") || "Nothing selected yet."}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-900">Section B explanation</p>
                <p className="mt-1">{state.answers.sectionB.explanation || "No explanation yet."}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-900">Section C yes answers</p>
                <ul className="mt-2 space-y-2">
                  {sectionCQuestions
                    .filter((question) => state.answers.sectionC[question.key]?.answer === true)
                    .map((question) => (
                      <li key={question.key}>
                        <span className="font-medium text-stone-900">{question.number}. {question.title}:</span>{" "}
                        {state.answers.sectionC[question.key]?.detail || "Yes, but still needs detail."}
                      </li>
                    ))}
                  {sectionCQuestions.every(
                    (question) => state.answers.sectionC[question.key]?.answer !== true,
                  ) ? <li>No Section C yes answers yet.</li> : null}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-5 text-stone-900 shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between px-3 pb-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-stone-500">
                Filled TDS preview
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
                Generated from the shared answer model
              </h2>
            </div>
            <a
              href={`/api/deals/${state.deal.id}/pdf`}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium transition hover:border-amber-400 hover:bg-amber-50"
            >
              Open PDF
            </a>
          </div>
          <iframe
            title="Filled TDS preview"
            src={`/api/deals/${state.deal.id}/pdf`}
            className="min-h-[980px] w-full rounded-[1.5rem] border border-stone-200"
          />
        </section>
      </div>
    </main>
  );
}

