"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAgentSession, requireAgent } from "@/lib/auth";
import {
  createDeal,
  getDealStateById,
  sendDisclosureRequest,
} from "@/lib/disclosure-store";
import { createDocusealDraft } from "@/lib/docuseal";
import { getAppBaseUrl, sendDisclosureEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function logoutAction() {
  await clearAgentSession();
  redirect("/login");
}

export async function createDealAction(formData: FormData) {
  const agent = await requireAgent();

  const deal = await createDeal({
    agentId: agent.id,
    sellerName: String(formData.get("sellerName") ?? ""),
    sellerEmail: String(formData.get("sellerEmail") ?? ""),
    seller2Name: String(formData.get("seller2Name") ?? ""),
    seller2Email: String(formData.get("seller2Email") ?? ""),
    title: String(formData.get("title") ?? ""),
    propertyAddress: String(formData.get("propertyAddress") ?? ""),
    city: String(formData.get("city") ?? ""),
    county: String(formData.get("county") ?? ""),
    propertyDescription: String(formData.get("propertyDescription") ?? ""),
  });

  redirect(`/agent/deals/${deal.id}`);
}

export async function sendDisclosureAction(formData: FormData) {
  const agent = await requireAgent();
  const dealId = String(formData.get("dealId") ?? "");
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });

  if (!deal || deal.agentId !== agent.id) {
    redirect("/agent");
  }

  const request = await sendDisclosureRequest(dealId);
  const absoluteRequestUrl = `${getAppBaseUrl()}${request.url}`;
  const email = await sendDisclosureEmail({
    to: deal.seller1Email,
    sellerName: deal.seller1Name,
    dealTitle: deal.title,
    propertyAddress: deal.propertyAddress,
    requestUrl: absoluteRequestUrl,
  });

  const params = new URLSearchParams({
    sent: absoluteRequestUrl,
    email: email.ok ? "sent" : email.reason,
  });

  redirect(`/agent/deals/${dealId}?${params.toString()}`);
}

export async function createDocusealAction(formData: FormData) {
  const agent = await requireAgent();
  const dealId = String(formData.get("dealId") ?? "");
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });

  if (!deal || deal.agentId !== agent.id) {
    redirect("/agent");
  }

  const state = await getDealStateById(dealId);
  if (!state) {
    redirect("/agent");
  }

  const result = await createDocusealDraft(state);

  if (result.ok) {
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        status: "READY_FOR_SIGNATURE",
        docusealStatus: "drafted",
        docusealTemplateId: result.templateId,
        docusealSubmissionId: result.submissionId,
        docusealEmbedUrl: result.embedUrl,
      },
    });
  } else {
    await prisma.deal.update({
      where: { id: dealId },
      data: {
        docusealStatus: result.reason,
      },
    });
  }

  revalidatePath(`/agent/deals/${dealId}`);
  redirect(`/agent/deals/${dealId}`);
}
