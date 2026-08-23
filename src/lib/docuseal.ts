import "server-only";

import type { getDealStateById } from "@/lib/disclosure-store";
import { generateTdsPdf } from "@/lib/pdf";

const DOCUSEAL_BASE_URL =
  process.env.DOCUSEAL_BASE_URL ?? "https://api.docuseal.com";

type SignatureField = {
  type: string;
  role: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type DocusealSubmitter = {
  role?: string;
  submission_id?: number | string;
  slug?: string;
  embed_src?: string;
};

const signatureFields: SignatureField[] = [
  { type: "initials", role: "Seller 1", page: 1, x: 0.66, y: 0.055, width: 0.12, height: 0.02 },
  { type: "initials", role: "Seller 2", page: 1, x: 0.79, y: 0.055, width: 0.12, height: 0.02 },
  { type: "initials", role: "Seller 1", page: 2, x: 0.66, y: 0.055, width: 0.12, height: 0.02 },
  { type: "initials", role: "Seller 2", page: 2, x: 0.79, y: 0.055, width: 0.12, height: 0.02 },
  { type: "initials", role: "Seller 1", page: 3, x: 0.66, y: 0.055, width: 0.12, height: 0.02 },
  { type: "initials", role: "Seller 2", page: 3, x: 0.79, y: 0.055, width: 0.12, height: 0.02 },
  { type: "signature", role: "Seller 1", page: 3, x: 0.12, y: 0.11, width: 0.28, height: 0.03 },
  { type: "date", role: "Seller 1", page: 3, x: 0.74, y: 0.11, width: 0.16, height: 0.03 },
  { type: "signature", role: "Seller 2", page: 3, x: 0.12, y: 0.085, width: 0.28, height: 0.03 },
  { type: "date", role: "Seller 2", page: 3, x: 0.74, y: 0.085, width: 0.16, height: 0.03 },
];

async function docusealFetch(path: string, body: unknown) {
  const response = await fetch(`${DOCUSEAL_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": process.env.DOCUSEAL_KEY ?? "",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export async function createDocusealDraft(
  state: NonNullable<Awaited<ReturnType<typeof getDealStateById>>>,
) {
  if (!process.env.DOCUSEAL_KEY) {
    return {
      ok: false as const,
      reason:
        "DOCUSEAL_KEY is not configured yet. The local PDF preview still works, but the signature handoff is disabled until a sandbox key is added.",
    };
  }

  const filledPdf = await generateTdsPdf(state, { flatten: true });
  const template = await docusealFetch("/templates/pdf", {
    name: `Loqol TDS - ${state.deal.title}`,
    documents: [
      {
        name: "loqol-ca-tds.pdf",
        file: filledPdf.toString("base64"),
        fields: signatureFields,
      },
    ],
  });

  const submitters = [
    {
      role: "Seller 1",
      name: state.deal.seller1Name,
      email: state.deal.seller1Email,
    },
  ];

  if (state.deal.seller2Email && state.deal.seller2Name) {
    submitters.push({
      role: "Seller 2",
      name: state.deal.seller2Name,
      email: state.deal.seller2Email,
    });
  }

  const submission = await docusealFetch("/submissions", {
    template_id: template.id,
    send_email: false,
    submitters,
  }) as DocusealSubmitter[];

  const seller1Submitter = submission.find(
    (submitter) => submitter.role === "Seller 1",
  );

  return {
    ok: true as const,
    templateId: String(template.id),
    submissionId: String(
      seller1Submitter?.submission_id ?? submission[0]?.submission_id ?? "",
    ),
    embedUrl: seller1Submitter?.embed_src ?? null,
  };
}
