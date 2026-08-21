import { AnswerSource } from "@/generated/prisma";
import {
  getDealStateByToken,
  recordVoiceTurn,
  saveAnswerPatches,
} from "@/lib/disclosure-store";
import { serializeSellerState } from "@/lib/seller-state";
import { respondToVoicePrompt } from "@/lib/voice-agent";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    token: string;
    questionKey: string;
    transcript: string;
  };

  const state = await getDealStateByToken(body.token);

  if (!state) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const currentValue =
    body.questionKey === "sectionA.operability"
      ? state.answers.sectionAOperability
      : state.answers.sectionC[body.questionKey];

  await recordVoiceTurn(state.deal.id, body.questionKey, "seller", body.transcript);

  const reply = respondToVoicePrompt({
    questionKey: body.questionKey,
    transcript: body.transcript,
    currentValue,
  });

  let nextState = state;
  if (reply.patch) {
    const saved = await saveAnswerPatches(state.deal.id, AnswerSource.VOICE, [reply.patch]);
    if (saved) {
      nextState = saved;
    }
  }

  await recordVoiceTurn(state.deal.id, body.questionKey, "assistant", reply.reply);

  return Response.json({
    reply: reply.reply,
    state: serializeSellerState(nextState),
  });
}
