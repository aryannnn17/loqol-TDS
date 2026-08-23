import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { AnswerSource, DealStatus, PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaRuntimeBootstrap?: Promise<void>;
};

const basePrisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function shouldBootstrapRuntimeDb() {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  return (
    databaseUrl.startsWith("file:") &&
    (process.env.LOQOL_BOOTSTRAP_RUNTIME_DB === "true" ||
      process.env.VERCEL === "1")
  );
}

async function createRuntimeSchema(client: PrismaClient) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS "AgentUser" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "Seller" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS "Deal" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "propertyAddress" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "county" TEXT NOT NULL,
      "propertyDescription" TEXT NOT NULL,
      "seller1Name" TEXT NOT NULL,
      "seller1Email" TEXT NOT NULL,
      "seller2Name" TEXT,
      "seller2Email" TEXT,
      "status" TEXT NOT NULL DEFAULT 'DRAFT',
      "docusealStatus" TEXT,
      "docusealTemplateId" TEXT,
      "docusealSubmissionId" TEXT,
      "docusealEmbedUrl" TEXT,
      "requestTokenHash" TEXT,
      "requestTokenExpiresAt" DATETIME,
      "requestSentAt" DATETIME,
      "sellerStartedAt" DATETIME,
      "sellerSubmittedAt" DATETIME,
      "lastSavedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      "agentId" TEXT NOT NULL,
      "sellerId" TEXT NOT NULL,
      CONSTRAINT "Deal_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AgentUser" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Deal_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "AnswerRevision" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "questionKey" TEXT NOT NULL,
      "normalized" TEXT NOT NULL,
      "rawText" TEXT,
      "source" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dealId" TEXT NOT NULL,
      CONSTRAINT "AnswerRevision_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "VoiceTurn" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "questionKey" TEXT NOT NULL,
      "speaker" TEXT NOT NULL,
      "transcript" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "dealId" TEXT NOT NULL,
      CONSTRAINT "VoiceTurn_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "AgentUser_email_key" ON "AgentUser"("email")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Seller_email_key" ON "Seller"("email")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Deal_requestTokenHash_key" ON "Deal"("requestTokenHash")`,
    `CREATE INDEX IF NOT EXISTS "AnswerRevision_dealId_questionKey_createdAt_idx" ON "AnswerRevision"("dealId", "questionKey", "createdAt" DESC)`,
    `CREATE INDEX IF NOT EXISTS "VoiceTurn_dealId_createdAt_idx" ON "VoiceTurn"("dealId", "createdAt" ASC)`,
  ];

  for (const statement of statements) {
    await client.$executeRawUnsafe(statement);
  }
}

async function seedRuntimeDemo(client: PrismaClient) {
  const demoToken = "seller_demo_wm0KYwU4uYj0gQ5Xk3At4mWJxGc7Zx5L";
  const passwordHash = await bcrypt.hash("loqol-demo", 10);

  const agent = await client.agentUser.upsert({
    where: { email: "agent@loqol.demo" },
    update: { name: "Aryan Agent", passwordHash },
    create: {
      email: "agent@loqol.demo",
      name: "Aryan Agent",
      passwordHash,
    },
  });

  const seller = await client.seller.upsert({
    where: { email: "seller@loqol.demo" },
    update: { name: "Maya Seller", phone: "(415) 555-0199" },
    create: {
      name: "Maya Seller",
      email: "seller@loqol.demo",
      phone: "(415) 555-0199",
    },
  });

  const deal = await client.deal.upsert({
    where: { requestTokenHash: hashToken(demoToken) },
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
      requestTokenHash: hashToken(demoToken),
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
    const exists = await client.answerRevision.findFirst({
      where: { dealId: deal.id, questionKey: answer.questionKey },
    });

    if (!exists) {
      await client.answerRevision.create({
        data: {
          dealId: deal.id,
          questionKey: answer.questionKey,
          normalized: JSON.stringify(answer.normalized),
          rawText: "rawText" in answer ? answer.rawText : null,
          source: answer.source,
        },
      });
    }
  }
}

async function ensureRuntimeDatabase(client: PrismaClient) {
  if (!shouldBootstrapRuntimeDb()) {
    return;
  }

  globalForPrisma.prismaRuntimeBootstrap ??= (async () => {
    await createRuntimeSchema(client);
    await seedRuntimeDemo(client);
  })();

  await globalForPrisma.prismaRuntimeBootstrap;
}

const prismaWithBootstrap = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ args, query }) {
        await ensureRuntimeDatabase(basePrisma);
        return query(args);
      },
    },
  },
});

export const prisma = shouldBootstrapRuntimeDb()
  ? (prismaWithBootstrap as PrismaClient)
  : basePrisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = basePrisma;
}
