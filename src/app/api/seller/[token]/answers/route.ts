import { AnswerSource } from "@/generated/prisma";
import { getDealStateByToken, saveAnswerPatches } from "@/lib/disclosure-store";
import { serializeSellerState } from "@/lib/seller-state";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const state = await getDealStateByToken(token);

  if (!state) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    source?: keyof typeof AnswerSource;
    patches: Array<{ key: string; value: unknown; rawText?: string | null }>;
  };

  const nextState = await saveAnswerPatches(
    state.deal.id,
    AnswerSource[body.source ?? "FORM"],
    body.patches,
  );

  return Response.json(nextState ? serializeSellerState(nextState) : null);
}
