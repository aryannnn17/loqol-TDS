import "server-only";

import { AnswerSource, DealStatus } from "@/generated/prisma";
import {
  type BooleanDetailAnswer,
  type PropertyAnswer,
  type SectionAInventoryAnswer,
  type SectionBAnswer,
  answerSourceLabels,
  emptyBooleanDetailAnswer,
  emptyPropertyAnswer,
  emptySectionAInventoryAnswer,
  emptySectionBAnswer,
  emptyStructuredAnswers,
  sectionCQuestions,
  voiceFirstKeys,
} from "@/lib/disclosure-schema";
import { prisma } from "@/lib/prisma";
import { createSellerToken, formatDateInput, hashToken } from "@/lib/security";

type Patch = {
  key: string;
  value: unknown;
  rawText?: string | null;
};

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function buildStructuredAnswers(
  answerMap: Record<string, { normalized: string; source: AnswerSource; rawText: string | null }>,
) {
  const answers = emptyStructuredAnswers();

  answers.property = safeJsonParse<PropertyAnswer>(
    answerMap.property?.normalized,
    emptyPropertyAnswer(),
  );
  answers.sectionAInventory = safeJsonParse<SectionAInventoryAnswer>(
    answerMap["sectionA.inventory"]?.normalized,
    emptySectionAInventoryAnswer(),
  );
  answers.sectionAOperability = safeJsonParse<BooleanDetailAnswer>(
    answerMap["sectionA.operability"]?.normalized,
    emptyBooleanDetailAnswer(),
  );
  answers.sectionB = safeJsonParse<SectionBAnswer>(
    answerMap.sectionB?.normalized,
    emptySectionBAnswer(),
  );

  for (const question of sectionCQuestions) {
    answers.sectionC[question.key] = safeJsonParse<BooleanDetailAnswer>(
      answerMap[question.key]?.normalized,
      emptyBooleanDetailAnswer(),
    );
  }

  return answers;
}

function getProgress(answers: ReturnType<typeof buildStructuredAnswers>) {
  const checkpoints = [
    answers.property.sellerOccupancy !== "" && answers.property.disclosureDate !== "",
    answers.sectionAInventory.items.length > 0,
    answers.sectionAOperability.answer !== null,
    answers.sectionB.answer !== null,
    ...sectionCQuestions.map(
      (question) => answers.sectionC[question.key]?.answer !== null,
    ),
  ];

  const completed = checkpoints.filter(Boolean).length;
  const total = checkpoints.length;

  return {
    completed,
    total,
    percent: Math.round((completed / total) * 100),
  };
}

function getWarnings(answers: ReturnType<typeof buildStructuredAnswers>) {
  const warnings: Array<{ title: string; body: string; level: "info" | "warning" }> = [];
  const anySectionCYes = sectionCQuestions.some(
    (question) => answers.sectionC[question.key]?.answer === true,
  );

  if (answers.sectionAOperability.answer === false && (answers.sectionB.answer || anySectionCYes)) {
    warnings.push({
      title: "Possible contradiction",
      body:
        "Section A says nothing is out of operating condition, but later sections mention defects or known issues. That might be fine, but it deserves a quick review before sending.",
      level: "warning",
    });
  }

  if (
    answers.sectionB.answer === false &&
    (answers.sectionB.items.length > 0 || answers.sectionB.explanation.trim().length > 0)
  ) {
    warnings.push({
      title: "Section B needs cleanup",
      body:
        "The defects section is marked No, but it still includes checked components or an explanation. The app keeps both so nothing is lost, then flags it for review.",
      level: "warning",
    });
  }

  for (const question of sectionCQuestions) {
    const answer = answers.sectionC[question.key];

    if (answer.answer === true && !answer.detail.trim()) {
      warnings.push({
        title: `Follow-up needed for Question ${question.number}`,
        body:
          "This answer is marked Yes, but it still needs a short explanation before the final form will read clearly.",
        level: "info",
      });
    }
  }

  if (!answers.property.disclosureDate) {
    warnings.push({
      title: "Disclosure date still missing",
      body:
        "The TDS date is required before the filled PDF will look complete.",
      level: "info",
    });
  }

  return warnings;
}

function answerSummary(answers: ReturnType<typeof buildStructuredAnswers>) {
  const yesCount = sectionCQuestions.filter(
    (question) => answers.sectionC[question.key]?.answer === true,
  ).length;

  return {
    voiceFirstRemaining: voiceFirstKeys.filter((key) => {
      if (key === "sectionA.operability") {
        return answers.sectionAOperability.answer === null;
      }
      return answers.sectionC[key]?.answer === null;
    }).length,
    knownIssueCount: yesCount,
  };
}

export async function getAnswerMap(dealId: string) {
  const revisions = await prisma.answerRevision.findMany({
    where: { dealId },
    orderBy: { createdAt: "desc" },
  });

  return revisions.reduce<
    Record<string, { normalized: string; source: AnswerSource; rawText: string | null }>
  >((map, revision) => {
    if (!map[revision.questionKey]) {
      map[revision.questionKey] = {
        normalized: revision.normalized,
        source: revision.source,
        rawText: revision.rawText,
      };
    }
    return map;
  }, {});
}

export async function getDealStateById(dealId: string) {
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      agent: true,
      seller: true,
      voiceTurns: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!deal) {
    return null;
  }

  const answerMap = await getAnswerMap(deal.id);
  const answers = buildStructuredAnswers(answerMap);
  const progress = getProgress(answers);
  const warnings = getWarnings(answers);

  return {
    deal: {
      ...deal,
      disclosureDate: answers.property.disclosureDate,
    },
    answers,
    answerMap,
    progress,
    warnings,
    summary: answerSummary(answers),
    answerSources: Object.fromEntries(
      Object.entries(answerMap).map(([key, value]) => [key, answerSourceLabels[value.source]]),
    ),
  };
}

export async function getDealStateByToken(token: string) {
  const deal = await prisma.deal.findFirst({
    where: {
      requestTokenHash: hashToken(token),
      requestTokenExpiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!deal) {
    return null;
  }

  return getDealStateById(deal.id);
}

export async function saveAnswerPatches(
  dealId: string,
  source: AnswerSource,
  patches: Patch[],
) {
  const existingDeal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      sellerStartedAt: true,
      status: true,
    },
  });

  for (const patch of patches) {
    await prisma.answerRevision.create({
      data: {
        dealId,
        questionKey: patch.key,
        normalized: JSON.stringify(patch.value),
        rawText: patch.rawText ?? null,
        source,
      },
    });
  }

  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status:
        existingDeal?.status === DealStatus.SUBMITTED ||
        existingDeal?.status === DealStatus.READY_FOR_SIGNATURE ||
        existingDeal?.status === DealStatus.SIGNATURE_SENT
          ? existingDeal.status
          : DealStatus.IN_PROGRESS,
      sellerStartedAt: existingDeal?.sellerStartedAt ?? new Date(),
      lastSavedAt: {
        set: new Date(),
      },
    },
  });

  return getDealStateById(dealId);
}

export async function recordVoiceTurn(
  dealId: string,
  questionKey: string,
  speaker: "seller" | "assistant",
  transcript: string,
) {
  await prisma.voiceTurn.create({
    data: {
      dealId,
      questionKey,
      speaker,
      transcript,
    },
  });
}

export async function markDealSubmitted(dealId: string) {
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: DealStatus.SUBMITTED,
      sellerSubmittedAt: new Date(),
      lastSavedAt: new Date(),
    },
  });

  return getDealStateById(dealId);
}

export async function createDeal(input: {
  agentId: string;
  sellerName: string;
  sellerEmail: string;
  title: string;
  propertyAddress: string;
  city: string;
  county: string;
  propertyDescription: string;
  seller2Name?: string;
  seller2Email?: string;
}) {
  const seller = await prisma.seller.upsert({
    where: { email: input.sellerEmail.toLowerCase().trim() },
    update: {
      name: input.sellerName,
    },
    create: {
      name: input.sellerName,
      email: input.sellerEmail.toLowerCase().trim(),
    },
  });

  const deal = await prisma.deal.create({
    data: {
      agentId: input.agentId,
      sellerId: seller.id,
      title: input.title,
      propertyAddress: input.propertyAddress,
      city: input.city,
      county: input.county,
      propertyDescription: input.propertyDescription,
      seller1Name: input.sellerName,
      seller1Email: input.sellerEmail.toLowerCase().trim(),
      seller2Name: input.seller2Name?.trim() || null,
      seller2Email: input.seller2Email?.trim().toLowerCase() || null,
    },
  });

  await prisma.answerRevision.create({
    data: {
      dealId: deal.id,
      questionKey: "property",
      normalized: JSON.stringify({
        ...emptyPropertyAnswer(),
        city: input.city,
        county: input.county,
        description: input.propertyDescription,
        disclosureDate: formatDateInput(new Date()),
      }),
      source: AnswerSource.SYSTEM,
    },
  });

  return deal;
}

export async function sendDisclosureRequest(dealId: string) {
  const token = createSellerToken();
  const hashed = hashToken(token);

  const deal = await prisma.deal.update({
    where: { id: dealId },
    data: {
      status: DealStatus.REQUEST_SENT,
      requestTokenHash: hashed,
      requestTokenExpiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      requestSentAt: new Date(),
    },
  });

  return {
    token,
    dealId: deal.id,
    url: `/seller/${token}`,
  };
}

export async function listDealsForAgent(agentId: string) {
  const deals = await prisma.deal.findMany({
    where: { agentId },
    include: {
      seller: true,
      answerRevisions: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Promise.all(
    deals.map(async (deal) => {
      const state = await getDealStateById(deal.id);
      return {
        id: deal.id,
        title: deal.title,
        sellerName: deal.seller.name,
        sellerEmail: deal.seller.email,
        propertyAddress: deal.propertyAddress,
        status: deal.status,
        requestSentAt: deal.requestSentAt,
        lastSavedAt: deal.lastSavedAt,
        sellerSubmittedAt: deal.sellerSubmittedAt,
        progress: state?.progress ?? { completed: 0, total: 20, percent: 0 },
      };
    }),
  );
}
