import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
const PORT = 3100;
const BASE = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  // Barrera: sin base de desarrollo marcada y claves de prueba, no corre nada (ver scripts/lib/db-guard.mjs).
  globalSetup: "./tests/e2e/guard.global.ts",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: BASE, trace: "retain-on-failure", screenshot: "only-on-failure", permissions: ["microphone"] },
  projects: [
    { name: "setup", testMatch: /global\.setup\.ts/ },
    {
      name: "flujo",
      testMatch: /(flow|voice|access|v1|audio-hd)\.spec\.ts/,
      dependencies: ["setup"],
      // Micrófono falso que "habla" un audio de prueba, para probar el dictado de verdad.
      use: { ...devices["Desktop Chrome"], launchOptions: { args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--use-file-for-fake-audio-capture=tests/fixtures/speech.wav"] } },
    },
    { name: "armario", testMatch: /armario\.spec\.ts/, dependencies: ["setup"], use: { ...devices["Desktop Chrome"] } },
    { name: "qa-mascotas", testMatch: /qa-mascotas\.spec\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "pantallas", testMatch: /screens\.spec\.ts/, dependencies: ["flujo"], use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npm run start -- -p ${PORT}`, url: `${BASE}/manifest.webmanifest`, reuseExistingServer: true, timeout: 120_000 },
});
