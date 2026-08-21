import type {
  BooleanDetailAnswer,
  SectionAInventoryAnswer,
} from "@/lib/disclosure-schema";
import type { getDealStateById } from "@/lib/disclosure-store";

export type SellerStateSnapshot = {
  deal: {
    id: string;
    title: string;
    propertyAddress: string;
    seller1Name: string;
    sellerSubmittedAt?: string | null;
  };
  answers: {
    property: {
      duplex: boolean;
      unitsOnly: boolean;
      unitNumbers: string;
      city: string;
      county: string;
      description: string;
      disclosureDate: string;
      sellerOccupancy: "yes" | "no" | "";
    };
    sectionAInventory: SectionAInventoryAnswer;
    sectionAOperability: BooleanDetailAnswer;
    sectionB: {
      answer: boolean | null;
      items: string[];
      otherDescription: string;
      explanation: string;
    };
    sectionC: Record<string, BooleanDetailAnswer>;
  };
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
  warnings: Array<{ title: string; body: string; level: "info" | "warning" }>;
};

export function serializeSellerState(
  state: NonNullable<Awaited<ReturnType<typeof getDealStateById>>>,
): SellerStateSnapshot {
  return {
    deal: {
      id: state.deal.id,
      title: state.deal.title,
      propertyAddress: state.deal.propertyAddress,
      seller1Name: state.deal.seller1Name,
      sellerSubmittedAt: state.deal.sellerSubmittedAt?.toISOString() ?? null,
    },
    answers: state.answers,
    progress: state.progress,
    warnings: state.warnings,
  };
}

