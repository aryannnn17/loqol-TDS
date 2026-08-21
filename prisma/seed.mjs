import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import {
  AnswerSource,
  DealStatus,
  PrismaClient,
} from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

const DEMO_TOKEN = "seller_demo_wm0KYwU4uYj0gQ5Xk3At4mWJxGc7Zx5L";

function hashToken(value) {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  const passwordHash = await bcrypt.hash("loqol-demo", 10);

  const agent = await prisma.agentUser.upsert({
    where: { email: "agent@loqol.demo" },
    update: { name: "Aryan Agent", passwordHash },
    create: {
      email: "agent@loqol.demo",
      name: "Aryan Agent",
      passwordHash,
    },
  });

  const seller = await prisma.seller.upsert({
    where: { email: "seller@loqol.demo" },
    update: { name: "Maya Seller", phone: "(415) 555-0199" },
    create: {
      name: "Maya Seller",
      email: "seller@loqol.demo",
      phone: "(415) 555-0199",
    },
  });

  const deal = await prisma.deal.upsert({
    where: { requestTokenHash: hashToken(DEMO_TOKEN) },
    update: {
      title: "Bernal Heights condo sale",
      propertyAddress: "1234 Valencia Street, San Francisco, CA 94110",
      city: "San Francisco",
      county: "San Francisco",
      propertyDescription: "Two-bedroom top-floor condo with deeded parking.",
      seller1Name: "Maya Seller",
      seller1Email: "seller@loqol.demo",
      seller2Name: "Jordan Seller",
      seller2Email: "jordan@loqol.demo",
      status: DealStatus.IN_PROGRESS,
      requestSentAt: new Date("2026-08-20T20:30:00.000Z"),
      sellerStartedAt: new Date("2026-08-20T21:00:00.000Z"),
      requestTokenExpiresAt: new Date("2026-12-31T23:59:59.000Z"),
      lastSavedAt: new Date("2026-08-20T22:15:00.000Z"),
      agentId: agent.id,
      sellerId: seller.id,
    },
    create: {
      title: "Bernal Heights condo sale",
      propertyAddress: "1234 Valencia Street, San Francisco, CA 94110",
      city: "San Francisco",
      county: "San Francisco",
      propertyDescription: "Two-bedroom top-floor condo with deeded parking.",
      seller1Name: "Maya Seller",
      seller1Email: "seller@loqol.demo",
      seller2Name: "Jordan Seller",
      seller2Email: "jordan@loqol.demo",
      status: DealStatus.IN_PROGRESS,
      requestSentAt: new Date("2026-08-20T20:30:00.000Z"),
      sellerStartedAt: new Date("2026-08-20T21:00:00.000Z"),
      requestTokenHash: hashToken(DEMO_TOKEN),
      requestTokenExpiresAt: new Date("2026-12-31T23:59:59.000Z"),
      lastSavedAt: new Date("2026-08-20T22:15:00.000Z"),
      agentId: agent.id,
      sellerId: seller.id,
    },
  });

  const starterAnswers = [
    {
      questionKey: "property",
      normalized: {
        duplex: false,
        unitsOnly: false,
        unitNumbers: "",
        city: "San Francisco",
        county: "San Francisco",
        description: "Two-bedroom top-floor condo with deeded parking.",
        disclosureDate: "2026-08-20",
        sellerOccupancy: "no",
      },
      source: AnswerSource.SYSTEM,
    },
    {
      questionKey: "sectionA.inventory",
      normalized: {
        items: [
          "Range",
          "Oven",
          "Dishwasher",
          "Garbage Disposal",
          "Washer/Dryer Hookups",
          "Smoke Detector(s)",
          "Carbon Monoxide Device(s)",
          "Central Heating",
          "Public Sewer System",
          "City",
          "Attached Garage",
          "Automatic Garage Door Opener(s)",
          "Water-Conserving Plumbing Fixtures",
        ],
        poolHeaterType: "",
        waterHeaterType: "gas",
        waterSupply: "city",
        utilityOther: "",
        gasSupply: "utility",
        remoteControls: "2",
        exhaustFanRooms: "kitchen and primary bath",
        wiring220Rooms: "laundry closet",
        fireplaceRooms: "",
      },
      source: AnswerSource.SYSTEM,
    },
    {
      questionKey: "sectionA.operability",
      normalized: {
        answer: true,
        detail:
          "The upstairs window security bar is missing a quick-release handle and one remote for the garage door opener is unreliable.",
      },
      source: AnswerSource.SYSTEM,
      rawText:
        "There are a couple things: one garage remote is flaky and a security bar upstairs doesn't have the quick release handle.",
    },
    {
      questionKey: "sectionB",
      normalized: {
        answer: true,
        items: ["Windows", "Doors"],
        otherDescription: "",
        explanation:
          "Primary bedroom window sticks during colder mornings and the rear patio door lock needs to be jiggled before it catches.",
      },
      source: AnswerSource.SYSTEM,
    },
    {
      questionKey: "sectionC.q4",
      normalized: {
        answer: true,
        detail:
          "A prior owner enclosed part of the sunroom before we bought the home. We do not have permit paperwork for that work.",
      },
      source: AnswerSource.VOICE,
      rawText:
        "Yes, there was an old sunroom enclosure before we owned it and we don't have the permit paperwork.",
    },
    {
      questionKey: "sectionC.q8",
      normalized: {
        answer: true,
        detail:
          "During heavy winter storms in 2023 and 2024, water pooled briefly near the rear steps before draining within a few hours.",
      },
      source: AnswerSource.VOICE,
      rawText:
        "Yes, in really heavy rain the back steps can puddle for a bit before it drains out.",
    },
    {
      questionKey: "sectionC.q11",
      normalized: {
        answer: true,
        detail:
          "Normal city and school pickup noise on weekday mornings. No unresolved complaints or police issues.",
      },
      source: AnswerSource.VOICE,
      rawText:
        "Just regular weekday traffic and school pickup noise in the morning, nothing beyond that.",
    },
  ];

  for (const answer of starterAnswers) {
    const exists = await prisma.answerRevision.findFirst({
      where: { dealId: deal.id, questionKey: answer.questionKey },
    });

    if (!exists) {
      await prisma.answerRevision.create({
        data: {
          dealId: deal.id,
          questionKey: answer.questionKey,
          normalized: JSON.stringify(answer.normalized),
          rawText: answer.rawText ?? null,
          source: answer.source,
        },
      });
    }
  }

  console.log("Demo agent: agent@loqol.demo / loqol-demo");
  console.log(`Demo seller link token: ${DEMO_TOKEN}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
