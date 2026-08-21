import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { sectionCQuestions } from "@/lib/disclosure-schema";
import type { getDealStateById } from "@/lib/disclosure-store";

const itemFieldMap: Record<string, string[]> = {
  Range: ["Range"],
  Oven: ["Oven"],
  Microwave: ["Microwave"],
  Dishwasher: ["Dishwasher"],
  "Trash Compactor": ["TrashCompactor"],
  "Garbage Disposal": ["GarbageDisposal"],
  "Washer/Dryer Hookups": ["WasherDryerHookups"],
  "Rain Gutters": ["RainGutters"],
  "Burglar Alarms": ["BurglarAlarms"],
  "Carbon Monoxide Device(s)": ["CarbonMonoxideDevices"],
  "Smoke Detector(s)": ["SmokeDetectors"],
  "Fire Alarm": ["FireAlarm"],
  "TV Antenna": ["TVAntenna"],
  "Satellite Dish": ["SatelliteDish"],
  Intercom: ["Intercom"],
  "Central Heating": ["CentralHeating"],
  "Central Air Conditioning": ["CentralAirConditioning"],
  "Evaporator Cooler(s)": ["EvaporatorCoolers"],
  "Wall/Window Air Conditioning": ["WallWindowAirConditioning"],
  Sprinklers: ["Sprinklers"],
  "Public Sewer System": ["PublicSewerSystem"],
  "Septic Tank": ["SepticTank"],
  "Sump Pump": ["SumpPump"],
  "Water Softener": ["WaterSoftener"],
  "Patio/Decking": ["PatioDecking"],
  "Built-in Barbecue": ["BuiltinBarbecue"],
  Gazebo: ["Gazebo"],
  "Security Gate(s)": ["SecurityGates"],
  "Attached Garage": ["Garage", "Attached"],
  "Detached Garage": ["Garage", "NoAttachedGarage"],
  Carport: ["Carport"],
  "Automatic Garage Door Opener(s)": ["AutomaticGarageDoorOpeners"],
  "Hot Tub/Spa": ["HotTubSpa"],
  "Child Resistant Barrier": ["ChildResistantBarrier"],
  "Window Screens": ["WindowScreens"],
  "Window Security Bars": ["WindowSecurityBars"],
  "Water-Conserving Plumbing Fixtures": ["WaterConservingPlumbingFixtures"],
};

const defectFieldMap: Record<string, string> = {
  "Interior Walls": "InteriorWalls",
  Ceilings: "Ceilings",
  Floors: "Floors",
  "Exterior Walls": "ExteriorWalls",
  Insulation: "Insulation",
  "Roof(s)": "Roofs2",
  Windows: "Windows",
  Doors: "Doors",
  Foundation: "Foundation",
  "Slab(s)": "Slabs",
  Driveways: "Driveways",
  Sidewalks: "Sidewalks",
  "Walls/Fences": "WallsFences",
  "Electrical Systems": "Electrical Systems",
  "Plumbing/Sewers/Septics": "PlumbingSewersSeptics",
  Other: "Other2",
};

function splitIntoLines(text: string, limit = 95) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (`${current} ${word}`.trim().length > limit) {
      lines.push(current.trim());
      current = word;
    } else {
      current = `${current} ${word}`;
    }
  }

  if (current.trim()) {
    lines.push(current.trim());
  }

  return lines;
}

function sellerInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function generateTdsPdf(
  state: NonNullable<Awaited<ReturnType<typeof getDealStateById>>>,
  options?: { flatten?: boolean },
) {
  const filePath = path.join(process.cwd(), "public/forms/loqol-ca-tds.pdf");
  const bytes = await readFile(filePath);
  const pdf = await PDFDocument.load(bytes);
  const form = pdf.getForm();
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  const fillText = (fieldName: string, value: string) => {
    if (!value) {
      return;
    }

    try {
      form.getTextField(fieldName).setText(value);
    } catch {}
  };

  const fillCheck = (fieldName: string, checked: boolean) => {
    try {
      const field = form.getCheckBox(fieldName);
      if (checked) {
        field.check();
      } else {
        field.uncheck();
      }
    } catch {}
  };

  const { deal, answers } = state;
  const property = answers.property;
  const inventory = answers.sectionAInventory;
  const sectionB = answers.sectionB;
  const sectionAOperability = answers.sectionAOperability;

  fillCheck("PropertyTypeDuplexTriplexFourplex", property.duplex);
  fillCheck("OnlyUnits", property.unitsOnly);
  fillText("UnitsNumber", property.unitNumbers);
  fillCheck("SellerIsOccupying", property.sellerOccupancy === "yes");
  fillCheck("SellerNotOccupying", property.sellerOccupancy === "no");
  fillText("PropertyAddress", deal.propertyAddress);
  fillText("Property Address_2", deal.propertyAddress);
  fillText("Date", property.disclosureDate);
  fillText("Date_4", property.disclosureDate);
  fillText("Date_5", property.disclosureDate);
  fillText("Date_6", property.disclosureDate);
  fillText("Date_9", property.disclosureDate);
  fillText("Date_10", property.disclosureDate);
  fillText("Date_11", property.disclosureDate);
  fillText("Date_12", property.disclosureDate);
  fillText("Seller_3", deal.seller1Name);
  fillText("Seller_4", deal.seller2Name ?? "");
  fillText("SellersInitialsPage1", sellerInitials(deal.seller1Name));
  fillText("Sellers Initials", sellerInitials(deal.seller1Name));
  fillText("Date_3", property.disclosureDate);
  fillText("SellersDatePage1", property.disclosureDate);

  for (const item of inventory.items) {
    for (const fieldName of itemFieldMap[item] ?? []) {
      fillCheck(fieldName, true);
    }
  }

  fillCheck("PoolSpaHeater", inventory.poolHeaterType !== "");
  fillCheck("Gas", inventory.poolHeaterType === "gas");
  fillCheck("Solar", inventory.poolHeaterType === "solar");
  fillCheck("Electric", inventory.poolHeaterType === "electric");
  fillCheck("Gas2", inventory.waterHeaterType === "gas");
  fillCheck("Electric2", inventory.waterHeaterType === "electric");
  fillCheck("City", inventory.waterSupply === "city");
  fillCheck("Well", inventory.waterSupply === "well");
  fillCheck("PrivateUtility", inventory.waterSupply === "private");
  fillText("UtilityOther", inventory.utilityOther);
  fillCheck("Utility", inventory.gasSupply === "utility");
  fillCheck("BottledTank", inventory.gasSupply === "bottled");
  fillText("NumberRemoteControlsDigit", inventory.remoteControls);
  fillCheck("RemoteControlsYes", inventory.remoteControls.trim().length > 0);
  fillText("ExhaustFanRooms", inventory.exhaustFanRooms);
  fillText("220VoltWiringRooms", inventory.wiring220Rooms);
  fillText("FireplaceRooms", inventory.fireplaceRooms);
  fillCheck("KnowledgeYes", sectionAOperability.answer === true);
  fillCheck("KnowledgeNo", sectionAOperability.answer === false);
  fillText("YesNotWorkingDescription", sectionAOperability.detail);

  fillCheck("DefectsYes", sectionB.answer === true);
  fillCheck("DefectsNo", sectionB.answer === false);
  for (const item of sectionB.items) {
    const fieldName = defectFieldMap[item];
    if (fieldName) {
      fillCheck(fieldName, true);
    }
  }
  fillText("Other2Describe", sectionB.otherDescription);
  const sectionBLines = splitIntoLines(sectionB.explanation, 110);
  fillText("Describe1", sectionBLines[0] ?? "");
  fillText("Describe2", sectionBLines[1] ?? "");
  fillText("Describe3", sectionBLines[2] ?? "");

  for (const question of sectionCQuestions) {
    const answer = answers.sectionC[question.key];
    const prefix = question.key.split(".")[1];
    const base = prefix.replace("q", "");
    const yesField = [
      "AwareHazardsYes",
      "SharedYes",
      "AffectedInterestYes",
      "RoomAdditionsYes",
      "RoomAdditionsCodeYes",
      "FillYes",
      "SettlingYes",
      "FloodingYes",
      "DamageYes",
      "ZoningYes",
      "NoiseYes",
      "CCRYes",
      "HOAAuthorityYes",
      "CommonYes",
      "AbatementYes",
      "LawsuitsYes",
    ][Number(base) - 1];
    const noField = [
      "AwareHazardsNo",
      "SharedNo",
      "AffectedInterestNo",
      "RoomAdditionsNo",
      "RoomAdditionsCodeNo",
      "FillNo",
      "SettlingNo",
      "FloodingNo",
      "DamageNo",
      "ZoningNo",
      "NoiseNo",
      "CCRNo",
      "HOAAuthorityNo",
      "CommonNo",
      "AbatementNo",
      "LawsuitsNo",
    ][Number(base) - 1];

    fillCheck(yesField, answer.answer === true);
    fillCheck(noField, answer.answer === false);
  }

  const sectionCExplanation = sectionCQuestions
    .map((question) => {
      const answer = answers.sectionC[question.key];
      if (!answer?.detail.trim()) {
        return null;
      }
      return `${question.number}. ${answer.detail.trim()}`;
    })
    .filter(Boolean)
    .join(" ");

  const sectionCLines = splitIntoLines(sectionCExplanation, 110);
  fillText("IfYesExplain1", sectionCLines[0] ?? "");
  fillText("IfYesExplain2", sectionCLines[1] ?? "");
  fillText("IfYesExplain3", sectionCLines[2] ?? "");
  fillText("IfYesExplain4", sectionCLines[3] ?? "");
  fillText("IfYesExplain5", sectionCLines[4] ?? "");

  const firstPage = pdf.getPages()[0];
  // The source PDF has fixed bracketed placeholders for these four values.
  // Mask only the placeholder areas so the surrounding legal language remains intact.
  const overlayPlaceholder = (
    value: string,
    x: number,
    y: number,
    width: number,
    size: number,
  ) => {
    if (!value) {
      return;
    }

    firstPage.drawRectangle({
      x: x - 1,
      y: y - 2,
      width: width + 2,
      height: 14,
      color: rgb(1, 1, 1),
    });
    firstPage.drawText(value, { x, y, size, font });
  };

  overlayPlaceholder(property.city || deal.city, 490, 699, 29, 5.2);
  overlayPlaceholder(property.county || deal.county, 28, 687, 45, 5.2);
  overlayPlaceholder(
    property.description || deal.propertyDescription,
    346,
    687,
    110,
    5.2,
  );
  overlayPlaceholder(property.disclosureDate || "", 209, 662, 33, 6.5);

  if (options?.flatten) {
    form.flatten();
  }

  return Buffer.from(await pdf.save());
}
