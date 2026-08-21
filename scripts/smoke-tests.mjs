import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const token = "seller_demo_wm0KYwU4uYj0gQ5Xk3At4mWJxGc7Zx5L";
const port = process.env.PORT ?? "3137";
const baseUrl = process.env.SMOKE_BASE_URL ?? `http://127.0.0.1:${port}`;

let server;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function waitForServer(url) {
  const deadline = Date.now() + 20_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {}

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function fetchText(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  return { response, text };
}

async function main() {
  if (!process.env.SMOKE_BASE_URL) {
    assert(
      existsSync(".next/BUILD_ID"),
      "Run `npm run build` before `npm test`, or set SMOKE_BASE_URL to test a deployed app.",
    );

    server = spawn("npm", ["run", "start", "--", "-p", port], {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
        LOQOL_BOOTSTRAP_RUNTIME_DB:
          process.env.LOQOL_BOOTSTRAP_RUNTIME_DB ?? "true",
      },
      stdio: "ignore",
    });

    await waitForServer(baseUrl);
  }

  const home = await fetchText("/");
  assert(home.response.ok, "Homepage loads");
  assert(home.text.includes("Loqol demo"), "Homepage renders expected copy");

  const seller = await fetchText(`/seller/${token}`);
  assert(seller.response.ok, "Seeded seller dashboard loads");
  assert(seller.text.includes("Seller dashboard"), "Seller dashboard renders");
  assert(seller.text.includes("35"), "Seeded progress renders");

  const invalid = await fetchText("/api/seller/invalid-token/submit", {
    method: "POST",
  });
  assert(invalid.response.status === 404, "Invalid seller token is rejected");
  assert(invalid.text.includes("Not found"), "Invalid-token response is explicit");

  console.log("Smoke tests passed");
}

main()
  .finally(() => {
    server?.kill();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
