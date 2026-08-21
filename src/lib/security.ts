import { createHash, randomBytes } from "node:crypto";

export const APP_SECRET =
  process.env.APP_SECRET ?? "loqol-dev-secret-change-before-production";

export function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function createSellerToken() {
  return randomBytes(24).toString("base64url");
}

export function formatDateInput(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

