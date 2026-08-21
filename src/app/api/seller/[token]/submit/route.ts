import { getDealStateByToken, markDealSubmitted } from "@/lib/disclosure-store";
import { serializeSellerState } from "@/lib/seller-state";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const state = await getDealStateByToken(token);

  if (!state) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const nextState = await markDealSubmitted(state.deal.id);
  return Response.json(nextState ? serializeSellerState(nextState) : null);
}
