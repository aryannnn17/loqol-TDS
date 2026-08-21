"use client";

import { useRef, useState } from "react";
import type { SellerStateSnapshot } from "@/lib/seller-state";

type Question = {
  key: string;
  number: number;
  title: string;
  prompt: string;
  helper: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: {
    results: ArrayLike<ArrayLike<{ transcript: string }>>;
  }) => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function VoiceWorkspace({
  token,
  questions,
  state,
  onStateChange,
}: {
  token: string;
  questions: Question[];
  state: SellerStateSnapshot;
  onStateChange: (nextState: SellerStateSnapshot) => void;
}) {
  const [index, setIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [assistantReply, setAssistantReply] = useState(
    "Press record when you’re ready. I’ll save the same structured answer the form uses.",
  );
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const currentQuestion = questions[index];

  const currentAnswer =
    currentQuestion.key === "sectionA.operability"
      ? state.answers.sectionAOperability
      : state.answers.sectionC[currentQuestion.key];

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  function startListening() {
    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setAssistantReply(
        "This browser does not expose Web Speech recognition. You can still type your answer below and save it.",
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const nextTranscript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ");
      setTranscript(nextTranscript.trim());
    };
    recognition.onend = () => {
      setListening(false);
    };
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  async function submitTranscript() {
    if (!transcript.trim()) {
      setAssistantReply("Say a few words first, or type your answer in the transcript box.");
      return;
    }

    const response = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        questionKey: currentQuestion.key,
        transcript,
      }),
    });

    const data = (await response.json()) as {
      reply: string;
      state: SellerStateSnapshot;
    };

    setAssistantReply(data.reply);
    onStateChange(data.state);
    setTranscript("");
    speak(data.reply);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
      <aside className="rounded-[1.5rem] bg-stone-950 p-5 text-stone-50">
        <p className="text-sm uppercase tracking-[0.26em] text-amber-300">
          Voice-first queue
        </p>
        <div className="mt-4 space-y-2">
          {questions.map((question, questionIndex) => {
            const answer =
              question.key === "sectionA.operability"
                ? state.answers.sectionAOperability
                : state.answers.sectionC[question.key];

            return (
              <button
                key={question.key}
                type="button"
                onClick={() => setIndex(questionIndex)}
                className={`w-full rounded-[1.25rem] px-4 py-3 text-left transition ${
                  questionIndex === index
                    ? "bg-amber-400 text-stone-950"
                    : "bg-white/6 text-stone-200 hover:bg-white/10"
                }`}
              >
                <p className="text-sm font-semibold">
                  {question.key === "sectionA.operability"
                    ? "Section A follow-up"
                    : `Question ${question.number}`}
                </p>
                <p className="mt-1 text-sm">
                  {question.title}
                </p>
                <p className="mt-2 text-xs opacity-80">
                  {answer?.answer === null
                    ? "Not answered"
                    : answer.answer
                      ? "Yes saved"
                      : "No saved"}
                </p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="rounded-[1.5rem] border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Current prompt</p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-stone-900">
              {currentQuestion.key === "sectionA.operability"
                ? "Anything not in operating condition?"
                : `${currentQuestion.number}. ${currentQuestion.title}`}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => speak(currentQuestion.prompt)}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 transition hover:border-amber-400 hover:bg-amber-50"
          >
            Read prompt aloud
          </button>
        </div>

        <div className="mt-5 rounded-[1.25rem] bg-stone-50 p-5">
          <p className="text-lg text-stone-800">{currentQuestion.prompt}</p>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            {currentQuestion.helper}
          </p>
        </div>

        <div className="mt-5 rounded-[1.25rem] bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-950">Assistant reply</p>
          <p className="mt-2 text-sm leading-7 text-amber-900">
            {assistantReply || currentQuestion.helper}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            className={`rounded-full px-5 py-3 font-medium transition ${
              listening
                ? "bg-rose-100 text-rose-900"
                : "bg-stone-950 text-white hover:bg-stone-800"
            }`}
          >
            {listening ? "Stop recording" : "Start recording"}
          </button>
          <button
            type="button"
            onClick={submitTranscript}
            className="rounded-full border border-stone-300 px-5 py-3 font-medium text-stone-800 transition hover:border-amber-400 hover:bg-amber-50"
          >
            Save transcript
          </button>
        </div>

        <textarea
          value={transcript}
          onChange={(event) => setTranscript(event.target.value)}
          rows={5}
          placeholder="You can type here instead of speaking if you want to finish this question another way."
          className="mt-5 w-full rounded-[1.25rem] border border-stone-300 bg-white px-4 py-3 text-stone-900 outline-none focus:border-amber-500"
        />

        <div className="mt-5 rounded-[1.25rem] border border-stone-200 p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-stone-500">Structured answer on file</p>
          <p className="mt-3 text-sm text-stone-700">
            {currentAnswer?.answer === null
              ? "Not answered yet."
              : currentAnswer.answer
                ? `Yes — ${currentAnswer.detail || "waiting on explanation"}`
                : "No"}
          </p>
        </div>
      </section>
    </div>
  );
}
