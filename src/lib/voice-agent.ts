import { sectionCQuestions } from "@/lib/disclosure-schema";

const NO_PATTERNS = /\b(no|none|nope|not that i know|not aware)\b/i;
const YES_PATTERNS = /\b(yes|yeah|yep|i do|there is|there are|we have|i'm aware)\b/i;
const UNCERTAIN_PATTERNS = /\b(not sure|unsure|i think so|maybe|don't know|unknown)\b/i;

export function respondToVoicePrompt(input: {
  questionKey: string;
  transcript: string;
  currentValue: { answer: boolean | null; detail: string };
}) {
  const transcript = input.transcript.trim();

  if (!transcript) {
    return {
      reply:
        "I didn't catch anything yet. You can answer yes, no, or just talk through what you know.",
      patch: null,
    };
  }

  if (UNCERTAIN_PATTERNS.test(transcript)) {
    return {
      reply:
        "That's okay. I'll leave this unanswered for now so you can come back after you check notes or ask someone else.",
      patch: null,
    };
  }

  const isNo = NO_PATTERNS.test(transcript);
  const isYes = YES_PATTERNS.test(transcript);

  if (!isYes && !isNo && input.currentValue.answer === true && !input.currentValue.detail) {
    return {
      reply:
        "Perfect. I saved that explanation and you can move on whenever you're ready.",
      patch: {
        key: input.questionKey,
        value: {
          answer: true,
          detail: transcript,
        },
        rawText: transcript,
      },
    };
  }

  if (!isYes && !isNo) {
    const question = sectionCQuestions.find((item) => item.key === input.questionKey);
    return {
      reply:
        question?.helper ??
        "Take your time. A quick yes or no is fine, and if it's yes you can add the story in your own words.",
      patch: null,
    };
  }

  if (isNo) {
    return {
      reply: "Understood. I marked that as No.",
      patch: {
        key: input.questionKey,
        value: {
          answer: false,
          detail: "",
        },
        rawText: transcript,
      },
    };
  }

  const detail = transcript.replace(YES_PATTERNS, "").replace(/^[\s,.-]+/, "");

  if (!detail) {
    return {
      reply:
        "I marked that as Yes. Give me one or two sentences on what happened or what a buyer should know.",
      patch: {
        key: input.questionKey,
        value: {
          answer: true,
          detail: "",
        },
        rawText: transcript,
      },
    };
  }

  return {
    reply: "Thanks. I saved the Yes answer and your explanation together.",
    patch: {
      key: input.questionKey,
      value: {
        answer: true,
        detail,
      },
      rawText: transcript,
    },
  };
}

