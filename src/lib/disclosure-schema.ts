export const inventoryOptions = [
  "Range",
  "Oven",
  "Microwave",
  "Dishwasher",
  "Trash Compactor",
  "Garbage Disposal",
  "Washer/Dryer Hookups",
  "Rain Gutters",
  "Burglar Alarms",
  "Carbon Monoxide Device(s)",
  "Smoke Detector(s)",
  "Fire Alarm",
  "TV Antenna",
  "Satellite Dish",
  "Intercom",
  "Central Heating",
  "Central Air Conditioning",
  "Evaporator Cooler(s)",
  "Wall/Window Air Conditioning",
  "Sprinklers",
  "Public Sewer System",
  "Septic Tank",
  "Sump Pump",
  "Water Softener",
  "Patio/Decking",
  "Built-in Barbecue",
  "Gazebo",
  "Security Gate(s)",
  "Attached Garage",
  "Detached Garage",
  "Carport",
  "Automatic Garage Door Opener(s)",
  "Hot Tub/Spa",
  "Child Resistant Barrier",
  "Window Screens",
  "Window Security Bars",
  "Water-Conserving Plumbing Fixtures",
] as const;

export const sectionBDefectOptions = [
  "Interior Walls",
  "Ceilings",
  "Floors",
  "Exterior Walls",
  "Insulation",
  "Roof(s)",
  "Windows",
  "Doors",
  "Foundation",
  "Slab(s)",
  "Driveways",
  "Sidewalks",
  "Walls/Fences",
  "Electrical Systems",
  "Plumbing/Sewers/Septics",
  "Other",
] as const;

export const sectionCQuestions = [
  {
    key: "sectionC.q1",
    number: 1,
    title: "Environmental hazards",
    prompt:
      "Are you aware of asbestos, mold, lead-based paint, storage tanks, or other environmental hazards on the property?",
    helper:
      "This one works better in voice because homeowners often need examples before they know whether the answer is really yes.",
  },
  {
    key: "sectionC.q2",
    number: 2,
    title: "Shared features with neighbors",
    prompt:
      "Are there any shared walls, fences, driveways, or maintenance responsibilities with neighboring owners?",
    helper:
      "Shared-use questions often need a little context, especially when the seller thinks of something as informal or historical.",
  },
  {
    key: "sectionC.q3",
    number: 3,
    title: "Encroachments or easements",
    prompt:
      "Are you aware of encroachments, easements, or anything similar that affects your interest in the property?",
    helper:
      "This wording is legalistic, so the voice guide translates it into normal language before saving a structured answer.",
  },
  {
    key: "sectionC.q4",
    number: 4,
    title: "Alterations without permits",
    prompt:
      "Were any room additions, structural changes, or repairs made without the permits that should have been pulled?",
    helper:
      "This is a strong voice-first question because sellers often need to explain what they know, what predates them, and what paperwork they do or do not have.",
  },
  {
    key: "sectionC.q5",
    number: 5,
    title: "Alterations not to code",
    prompt:
      "Are you aware of any additions or repairs that are not in compliance with building codes?",
    helper:
      "This tends to need nuance because a seller may know something is imperfect without knowing the exact code status.",
  },
  {
    key: "sectionC.q6",
    number: 6,
    title: "Fill on the property",
    prompt:
      "Do you know whether any part of the property sits on fill, whether compacted or not?",
    helper:
      "Short question, but the voice path helps when a seller only has partial historical knowledge.",
  },
  {
    key: "sectionC.q7",
    number: 7,
    title: "Settling or soil movement",
    prompt:
      "Are you aware of settling, slippage, sliding, or any other soil problems?",
    helper:
      "The follow-up matters more than the yes/no, because buyers want the pattern and severity.",
  },
  {
    key: "sectionC.q8",
    number: 8,
    title: "Flooding, drainage, or grading",
    prompt:
      "Have you had flooding, drainage, or grading problems at the property?",
    helper:
      "Voice helps sellers describe timing and severity without forcing them into a text box too early.",
  },
  {
    key: "sectionC.q9",
    number: 9,
    title: "Major damage",
    prompt:
      "Has the property had major damage from fire, earthquake, flood, or landslide?",
    helper:
      "A simple tap gets the yes/no quickly, then the voice path can capture the story if the answer is yes.",
  },
  {
    key: "sectionC.q10",
    number: 10,
    title: "Zoning or setback issues",
    prompt:
      "Are you aware of zoning violations, nonconforming uses, or setback issues?",
    helper:
      "This is legal language, so the voice assistant reframes it in plain English before saving.",
  },
  {
    key: "sectionC.q11",
    number: 11,
    title: "Noise or nuisances",
    prompt:
      "Are there neighborhood noise problems or other nuisances a buyer should know about?",
    helper:
      "This is intentionally voice-first because sellers usually answer best by talking through normal, occasional, and unusual patterns.",
  },
  {
    key: "sectionC.q12",
    number: 12,
    title: "CC&Rs or deed restrictions",
    prompt:
      "Are there CC&Rs, deed restrictions, or other obligations tied to the property?",
    helper:
      "Sellers often know the HOA rules but not the legal labels, so voice lowers that barrier.",
  },
  {
    key: "sectionC.q13",
    number: 13,
    title: "HOA authority",
    prompt:
      "Is there a homeowners’ association or similar body with authority over the property?",
    helper:
      "Often a quick yes/no, but it stays in the voice queue because it naturally pairs with shared areas and restrictions.",
  },
  {
    key: "sectionC.q14",
    number: 14,
    title: "Common areas",
    prompt:
      "Are there common areas like pools, walkways, courts, or shared facilities tied to the property?",
    helper:
      "Good candidate for voice because sellers usually answer with examples, which helps the agent review later.",
  },
  {
    key: "sectionC.q15",
    number: 15,
    title: "Notices of abatement or citations",
    prompt:
      "Have there been any abatement notices or citations issued against the property?",
    helper:
      "This can feel intimidating, so the voice flow can reassure sellers that 'I’m not sure' is acceptable and worth flagging.",
  },
  {
    key: "sectionC.q16",
    number: 16,
    title: "Lawsuits or claims affecting the property",
    prompt:
      "Are there lawsuits or claims by or against the seller that threaten or affect this property or any common areas?",
    helper:
      "This is the most nuanced question in the packet, which is exactly where voice performs better than a cold legal checkbox.",
  },
] as const;

export const voiceFirstKeys = [
  "sectionA.operability",
  ...sectionCQuestions.map((question) => question.key),
];

export const answerSourceLabels = {
  FORM: "Form",
  VOICE: "Voice",
  AGENT_REVIEW: "Agent review",
  SYSTEM: "System",
} as const;

export type PropertyAnswer = {
  duplex: boolean;
  unitsOnly: boolean;
  unitNumbers: string;
  city: string;
  county: string;
  description: string;
  disclosureDate: string;
  sellerOccupancy: "yes" | "no" | "";
};

export type SectionAInventoryAnswer = {
  items: string[];
  poolHeaterType: "" | "gas" | "solar" | "electric";
  waterHeaterType: "" | "gas" | "solar" | "electric";
  waterSupply: "" | "city" | "well" | "private";
  utilityOther: string;
  gasSupply: "" | "utility" | "bottled";
  remoteControls: string;
  exhaustFanRooms: string;
  wiring220Rooms: string;
  fireplaceRooms: string;
};

export type BooleanDetailAnswer = {
  answer: boolean | null;
  detail: string;
};

export type SectionBAnswer = {
  answer: boolean | null;
  items: string[];
  otherDescription: string;
  explanation: string;
};

export type StructuredAnswers = {
  property: PropertyAnswer;
  sectionAInventory: SectionAInventoryAnswer;
  sectionAOperability: BooleanDetailAnswer;
  sectionB: SectionBAnswer;
  sectionC: Record<string, BooleanDetailAnswer>;
};

export function emptyPropertyAnswer(): PropertyAnswer {
  return {
    duplex: false,
    unitsOnly: false,
    unitNumbers: "",
    city: "",
    county: "",
    description: "",
    disclosureDate: "",
    sellerOccupancy: "",
  };
}

export function emptySectionAInventoryAnswer(): SectionAInventoryAnswer {
  return {
    items: [],
    poolHeaterType: "",
    waterHeaterType: "",
    waterSupply: "",
    utilityOther: "",
    gasSupply: "",
    remoteControls: "",
    exhaustFanRooms: "",
    wiring220Rooms: "",
    fireplaceRooms: "",
  };
}

export function emptyBooleanDetailAnswer(): BooleanDetailAnswer {
  return {
    answer: null,
    detail: "",
  };
}

export function emptySectionBAnswer(): SectionBAnswer {
  return {
    answer: null,
    items: [],
    otherDescription: "",
    explanation: "",
  };
}

export function emptyStructuredAnswers(): StructuredAnswers {
  return {
    property: emptyPropertyAnswer(),
    sectionAInventory: emptySectionAInventoryAnswer(),
    sectionAOperability: emptyBooleanDetailAnswer(),
    sectionB: emptySectionBAnswer(),
    sectionC: Object.fromEntries(
      sectionCQuestions.map((question) => [question.key, emptyBooleanDetailAnswer()]),
    ),
  };
}

