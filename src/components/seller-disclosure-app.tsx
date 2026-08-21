"use client";

import { useState, useTransition } from "react";
import { VoiceWorkspace } from "@/components/voice-workspace";
import {
  inventoryOptions,
  sectionBDefectOptions,
  sectionCQuestions,
  type BooleanDetailAnswer,
  type SectionAInventoryAnswer,
} from "@/lib/disclosure-schema";
import type { SellerStateSnapshot } from "@/lib/seller-state";

function yesNoValue(value: boolean | null) {
  if (value === true) {
    return "yes";
  }
  if (value === false) {
    return "no";
  }
  return "";
}

export function SellerDisclosureApp({
  token,
  initialState,
}: {
  token: string;
  initialState: SellerStateSnapshot;
}) {
  const [state, setState] = useState(initialState);
  const [activeTab, setActiveTab] = useState<"dashboard" | "form" | "voice" | "review">(
    "dashboard",
  );
  const [statusText, setStatusText] = useState("Saved");
  const [isPending, startTransition] = useTransition();

  async function savePatches(
    patches: Array<{ key: string; value: unknown; rawText?: string | null }>,
    source: "FORM" | "VOICE" = "FORM",
  ) {
    setStatusText("Saving...");
    const response = await fetch(`/api/seller/${token}/answers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patches, source }),
    });

    const nextState = (await response.json()) as SellerStateSnapshot;
    setState(nextState);
    setStatusText("Saved");
  }

  async function submitDisclosure() {
    setStatusText("Submitting...");
    const response = await fetch(`/api/seller/${token}/submit`, {
      method: "POST",
    });
    const nextState = (await response.json()) as SellerStateSnapshot;
    setState(nextState);
    setStatusText("Submitted");
    setActiveTab("review");
  }

  function toggleInventoryItem(item: string) {
    const current = state.answers.sectionAInventory.items;
    const nextItems = current.includes(item)
      ? current.filter((entry) => entry !== item)
      : [...current, item];

    const nextValue = {
      ...state.answers.sectionAInventory,
      items: nextItems,
    };

    setState((previous) => ({
      ...previous,
      answers: {
        ...previous.answers,
        sectionAInventory: nextValue,
      },
    }));

    startTransition(() => {
      void savePatches([{ key: "sectionA.inventory", value: nextValue }]);
    });
  }

  function updateInventoryField<K extends keyof SectionAInventoryAnswer>(
    key: K,
    value: SectionAInventoryAnswer[K],
  ) {
    const nextValue = {
      ...state.answers.sectionAInventory,
      [key]: value,
    };

    setState((previous) => ({
      ...previous,
      answers: {
        ...previous.answers,
        sectionAInventory: nextValue,
      },
    }));
  }

  function updateSectionCAnswer(key: string, answer: BooleanDetailAnswer) {
    setState((previous) => ({
      ...previous,
      answers: {
        ...previous.answers,
        sectionC: {
          ...previous.answers.sectionC,
          [key]: answer,
        },
      },
    }));
  }

  const navItems = [
    ["dashboard", "Overview"],
    ["form", "Quick form"],
    ["voice", "Voice guide"],
    ["review", "Review"],
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="rounded-[2rem] border border-stone-200/80 bg-white/85 p-7 shadow-[0_24px_70px_rgba(87,64,25,0.10)] backdrop-blur">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.26em] text-amber-700">
              Seller dashboard
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl leading-tight text-stone-950">
              Finish the TDS without getting buried in the TDS.
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-700">
              You can tap through the fast questions, talk through the awkward ones, and switch back and forth without losing anything.
            </p>
          </div>
          <div className="min-w-72 rounded-[1.5rem] bg-stone-950 p-5 text-stone-50">
            <div className="flex items-center justify-between text-sm text-stone-300">
              <span>Progress</span>
              <span>{state.progress.percent}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{ width: `${state.progress.percent}%` }}
              />
            </div>
            <p className="mt-4 text-sm text-stone-300">
              {state.progress.completed} of {state.progress.total} checkpoints complete
            </p>
            <p className="mt-2 text-sm text-stone-400">
              Save status: {isPending ? "Saving..." : statusText}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {navItems.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={`rounded-full px-5 py-3 text-sm font-medium transition ${
                activeTab === value
                  ? "bg-stone-950 text-white"
                  : "border border-stone-300 text-stone-700 hover:border-amber-400 hover:bg-amber-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "dashboard" ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <div className="rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_rgba(87,64,25,0.08)]">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">How this is organized</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-[1.5rem] bg-stone-50 p-5">
                <p className="font-semibold text-stone-900">Tap-first</p>
                <p className="mt-2 text-sm leading-7 text-stone-700">
                  Section A inventory and Section B component checklists are quicker when you can just tap what applies.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-amber-50 p-5">
                <p className="font-semibold text-amber-950">Voice-first</p>
                <p className="mt-2 text-sm leading-7 text-amber-900">
                  Section C and the “anything not working” follow-up use voice because the legal wording is stressful and the explanation matters as much as the yes/no.
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-stone-200 p-5">
              <p className="font-semibold text-stone-900">What happens if you close the tab?</p>
              <p className="mt-2 text-sm leading-7 text-stone-700">
                Every save writes to the server immediately, so you can leave halfway through and come back to the same seller link later.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_rgba(87,64,25,0.08)]">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Things to review</p>
            <div className="mt-5 space-y-3">
              {state.warnings.map((warning) => (
                <div
                  key={`${warning.title}-${warning.body}`}
                  className={`rounded-[1.5rem] p-4 ${
                    warning.level === "warning"
                      ? "bg-amber-50 text-amber-950"
                      : "bg-stone-50 text-stone-800"
                  }`}
                >
                  <p className="font-medium">{warning.title}</p>
                  <p className="mt-2 text-sm leading-7">{warning.body}</p>
                </div>
              ))}
              {state.warnings.length === 0 ? (
                <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-sm leading-7 text-emerald-900">
                  Nothing contradictory is flagged right now. If you are unsure on any question, it is better to leave it unfinished than to force a guess.
                </div>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "form" ? (
        <section className="mt-8 space-y-6">
          <div className="rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_rgba(87,64,25,0.08)]">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Property basics</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Disclosure date</span>
                <input
                  type="date"
                  value={state.answers.property.disclosureDate}
                  onChange={(event) => {
                    const nextValue = {
                      ...state.answers.property,
                      disclosureDate: event.target.value,
                    };
                    setState((previous) => ({
                      ...previous,
                      answers: { ...previous.answers, property: nextValue },
                    }));
                    startTransition(() => {
                      void savePatches([{ key: "property", value: nextValue }]);
                    });
                  }}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Seller occupancy</span>
                <select
                  value={state.answers.property.sellerOccupancy}
                  onChange={(event) => {
                    const nextValue = {
                      ...state.answers.property,
                      sellerOccupancy: event.target.value as "yes" | "no" | "",
                    };
                    setState((previous) => ({
                      ...previous,
                      answers: { ...previous.answers, property: nextValue },
                    }));
                    startTransition(() => {
                      void savePatches([{ key: "property", value: nextValue }]);
                    });
                  }}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500"
                >
                  <option value="">Choose one</option>
                  <option value="yes">Seller occupies the property</option>
                  <option value="no">Seller does not occupy the property</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_rgba(87,64,25,0.08)]">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Section A · What is at the property?</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {inventoryOptions.map((item) => {
                const checked = state.answers.sectionAInventory.items.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleInventoryItem(item)}
                    className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                      checked
                        ? "border-amber-400 bg-amber-50 text-amber-950"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Water heater type</span>
                <select
                  value={state.answers.sectionAInventory.waterHeaterType}
                  onChange={(event) => {
                    updateInventoryField("waterHeaterType", event.target.value as SectionAInventoryAnswer["waterHeaterType"]);
                    startTransition(() => {
                      void savePatches([
                        {
                          key: "sectionA.inventory",
                          value: {
                            ...state.answers.sectionAInventory,
                            waterHeaterType: event.target.value,
                          },
                        },
                      ]);
                    });
                  }}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500"
                >
                  <option value="">Unknown / not listed</option>
                  <option value="gas">Gas</option>
                  <option value="solar">Solar</option>
                  <option value="electric">Electric</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Water supply</span>
                <select
                  value={state.answers.sectionAInventory.waterSupply}
                  onChange={(event) => {
                    updateInventoryField("waterSupply", event.target.value as SectionAInventoryAnswer["waterSupply"]);
                    startTransition(() => {
                      void savePatches([
                        {
                          key: "sectionA.inventory",
                          value: {
                            ...state.answers.sectionAInventory,
                            waterSupply: event.target.value,
                          },
                        },
                      ]);
                    });
                  }}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500"
                >
                  <option value="">Choose one</option>
                  <option value="city">City</option>
                  <option value="well">Well</option>
                  <option value="private">Private utility / other</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_rgba(87,64,25,0.08)]">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Section A follow-up</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Is anything from Section A not in operating condition?
                </span>
                <select
                  value={yesNoValue(state.answers.sectionAOperability.answer)}
                  onChange={(event) => {
                    const nextValue = {
                      ...state.answers.sectionAOperability,
                      answer:
                        event.target.value === ""
                          ? null
                          : event.target.value === "yes",
                    };
                    setState((previous) => ({
                      ...previous,
                      answers: { ...previous.answers, sectionAOperability: nextValue },
                    }));
                    startTransition(() => {
                      void savePatches([{ key: "sectionA.operability", value: nextValue }]);
                    });
                  }}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500"
                >
                  <option value="">Choose one</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>
            <textarea
              rows={4}
              value={state.answers.sectionAOperability.detail}
              onChange={(event) => {
                const nextValue = {
                  ...state.answers.sectionAOperability,
                  detail: event.target.value,
                };
                setState((previous) => ({
                  ...previous,
                  answers: { ...previous.answers, sectionAOperability: nextValue },
                }));
              }}
              onBlur={() =>
                startTransition(() => {
                  void savePatches([
                    {
                      key: "sectionA.operability",
                      value: state.answers.sectionAOperability,
                    },
                  ]);
                })
              }
              placeholder="If yes, describe what is not working."
              className="mt-4 w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_rgba(87,64,25,0.08)]">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Section B · Significant defects or malfunctions</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Are you aware of any significant defects?</span>
                <select
                  value={yesNoValue(state.answers.sectionB.answer)}
                  onChange={(event) => {
                    const nextValue = {
                      ...state.answers.sectionB,
                      answer:
                        event.target.value === ""
                          ? null
                          : event.target.value === "yes",
                    };
                    setState((previous) => ({
                      ...previous,
                      answers: { ...previous.answers, sectionB: nextValue },
                    }));
                    startTransition(() => {
                      void savePatches([{ key: "sectionB", value: nextValue }]);
                    });
                  }}
                  className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500"
                >
                  <option value="">Choose one</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sectionBDefectOptions.map((item) => {
                const checked = state.answers.sectionB.items.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      const nextItems = checked
                        ? state.answers.sectionB.items.filter((entry) => entry !== item)
                        : [...state.answers.sectionB.items, item];
                      const nextValue = {
                        ...state.answers.sectionB,
                        items: nextItems,
                      };
                      setState((previous) => ({
                        ...previous,
                        answers: { ...previous.answers, sectionB: nextValue },
                      }));
                      startTransition(() => {
                        void savePatches([{ key: "sectionB", value: nextValue }]);
                      });
                    }}
                    className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${
                      checked
                        ? "border-amber-400 bg-amber-50 text-amber-950"
                        : "border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            <textarea
              rows={4}
              value={state.answers.sectionB.explanation}
              onChange={(event) => {
                setState((previous) => ({
                  ...previous,
                  answers: {
                    ...previous.answers,
                    sectionB: {
                      ...previous.answers.sectionB,
                      explanation: event.target.value,
                    },
                  },
                }));
              }}
              onBlur={() =>
                startTransition(() => {
                  void savePatches([{ key: "sectionB", value: state.answers.sectionB }]);
                })
              }
              placeholder="Explain what is wrong and what a buyer should know."
              className="mt-4 w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500"
            />
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_rgba(87,64,25,0.08)]">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Section C · Full manual path</p>
            <div className="mt-5 space-y-4">
              {sectionCQuestions.map((question) => {
                const answer = state.answers.sectionC[question.key];
                return (
                  <div key={question.key} className="rounded-[1.5rem] border border-stone-200 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="max-w-3xl">
                        <p className="font-semibold text-stone-900">
                          {question.number}. {question.prompt}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-stone-600">
                          {question.helper}
                        </p>
                      </div>
                      <select
                        value={yesNoValue(answer.answer)}
                        onChange={(event) => {
                          const nextValue = {
                            ...answer,
                            answer:
                              event.target.value === ""
                                ? null
                                : event.target.value === "yes",
                          };
                          updateSectionCAnswer(question.key, nextValue);
                          startTransition(() => {
                            void savePatches([{ key: question.key, value: nextValue }]);
                          });
                        }}
                        className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500"
                      >
                        <option value="">Choose one</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <textarea
                      rows={3}
                      value={answer.detail}
                      onChange={(event) =>
                        updateSectionCAnswer(question.key, {
                          ...answer,
                          detail: event.target.value,
                        })
                      }
                      onBlur={() =>
                        startTransition(() => {
                          void savePatches([
                            {
                              key: question.key,
                              value: state.answers.sectionC[question.key],
                            },
                          ]);
                        })
                      }
                      placeholder="If yes, explain in plain English."
                      className="mt-4 w-full rounded-[1.25rem] border border-stone-300 bg-stone-50 px-4 py-3 outline-none focus:border-amber-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === "voice" ? (
        <section className="mt-8 rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_rgba(87,64,25,0.08)]">
          <VoiceWorkspace
            token={token}
            questions={[
              {
                key: "sectionA.operability",
                number: 0,
                title: "Anything not in operating condition",
                prompt:
                  "Is anything from the inventory list not in operating condition? If yes, tell me what it is and what a buyer should know.",
                helper:
                  "This is better as voice because sellers usually remember details as they talk, not when they stare at a blank explanation field.",
              },
              ...sectionCQuestions,
            ]}
            state={state}
            onStateChange={setState}
          />
        </section>
      ) : null}

      {activeTab === "review" ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_rgba(87,64,25,0.08)]">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Ready to submit?</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-stone-950">
              You can still switch back and edit anything.
            </h2>
            <p className="mt-4 text-stone-700">
              Submission marks this packet as ready for the agent review and document generation step. It does not prevent future edits in this demo.
            </p>
            <button
              type="button"
              onClick={() => {
                startTransition(() => {
                  void submitDisclosure();
                });
              }}
              className="mt-6 rounded-full bg-stone-950 px-5 py-3 font-medium text-white transition hover:bg-stone-800"
            >
              Submit disclosure answers
            </button>
            {state.deal.sellerSubmittedAt ? (
              <p className="mt-4 rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Submitted successfully. The agent can now review your answers and generate the filled TDS.
              </p>
            ) : null}
          </div>

          <div className="rounded-[2rem] bg-white p-7 shadow-[0_24px_60px_rgba(87,64,25,0.08)]">
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Summary</p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-stone-700">
              <div>
                <p className="font-semibold text-stone-900">Occupancy</p>
                <p>{state.answers.property.sellerOccupancy || "Not answered yet"}</p>
              </div>
              <div>
                <p className="font-semibold text-stone-900">Section A follow-up</p>
                <p>
                  {state.answers.sectionAOperability.answer === null
                    ? "Unanswered"
                    : state.answers.sectionAOperability.answer
                      ? `Yes — ${state.answers.sectionAOperability.detail || "needs detail"}`
                      : "No"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-stone-900">Section B</p>
                <p>
                  {state.answers.sectionB.answer === null
                    ? "Unanswered"
                    : state.answers.sectionB.answer
                      ? `Yes — ${state.answers.sectionB.explanation || "needs explanation"}`
                      : "No"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-stone-900">Section C yes items</p>
                <ul className="mt-2 space-y-1">
                  {sectionCQuestions
                    .filter((question) => state.answers.sectionC[question.key]?.answer === true)
                    .map((question) => (
                      <li key={question.key}>
                        {question.number}. {question.title}
                      </li>
                    ))}
                  {sectionCQuestions.every(
                    (question) => state.answers.sectionC[question.key]?.answer !== true,
                  ) ? <li>None marked Yes so far.</li> : null}
                </ul>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
