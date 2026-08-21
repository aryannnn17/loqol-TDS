import { requireAgent } from "@/lib/auth";
import { getDealStateById } from "@/lib/disclosure-store";
import { generateTdsPdf } from "@/lib/pdf";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dealId: string }> },
) {
  const agent = await requireAgent();
  const { dealId } = await params;
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });

  if (!deal || deal.agentId !== agent.id) {
    return new Response("Not found", { status: 404 });
  }

  const state = await getDealStateById(dealId);
  if (!state) {
    return new Response("Not found", { status: 404 });
  }

  const bytes = await generateTdsPdf(state);

  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="loqol-tds-${dealId}.pdf"`,
    },
  });
}

