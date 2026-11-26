import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ensureTestUser, resetTestData, solveNewFormats, sql, TEST_EMAIL } from "./helpers";

/** Toda frase que suena en una sesión debe tener su clip HD: ninguna puede caer a la voz del dispositivo. */
let userId = "";
test.beforeAll(async () => {
  userId = await ensureTestUser();
  await resetTestData(userId);
  await sql().query("insert into profiles (user_id, name, onboarded_at, level) values ($1, 'Prueba', now(), 'B1') on conflict (user_id) do update set level = 'B1', onboarded_at = coalesce(profiles.onboarded_at, now())", [userId]);
});

async function watch(page: Page) {
  const misses: string[] = [];
  await page.exposeFunction("__fluyeMiss", (s: string) => misses.push(s));
  await page.addInitScript(() => {
    window.addEventListener("fluye:voice", (e) => {
      const d = (e as CustomEvent<{ fallback: boolean; voice: string; text: string }>).detail;
      if (d?.fallback) (window as unknown as { __fluyeMiss: (s: string) => void }).__fluyeMiss(`${d.voice} | ${d.text}`);
    });
  });
  return misses;
}

test("las sesiones solo usan voz HD", async ({ page }) => {
  test.setTimeout(420_000);
  const misses = await watch(page);
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });
  // Palabras del catálogo activadas como desde Biblioteca → Palabras: también deben sonar con voz HD.
  const learn = await page.request.post("/api/learn", { data: { action: "learn-next", count: 20 } });
  expect((await learn.json()).added).toBeGreaterThan(0);
  for (let round = 0; round < 2; round++) {
    await page.goto("/sesion?min=10");
    for (let n = 0; n < 160; n++) {
      if (await page.getByText(/sesión completada|¡Sesión lista|Terminaste/i).first().isVisible().catch(() => false)) break;
      for (const b of await page.getByRole("button", { name: /^Escuchar/ }).all()) await b.click({ timeout: 800 }).catch(() => {});
      if (await solveNewFormats(page)) { await page.waitForTimeout(200); }
      const cont = page.getByRole("button", { name: /^(Continuar|¡Entendido!|Siguiente|Empezar)$/ }).first();
      if (await cont.isVisible().catch(() => false)) { await cont.click({ timeout: 1500, force: true }).catch(() => {}); continue; }
      const opt = page.locator("button.option").first();
      if (await opt.isVisible().catch(() => false)) { await opt.click({ timeout: 1500, force: true }).catch(() => {}); continue; }
      const typed = page.locator("#typed");
      if (await typed.isVisible().catch(() => false)) { await typed.fill("x"); await typed.press("Enter"); continue; }
      const self = page.getByRole("button", { name: /Lo sabía|Bien|Otra vez|No lo sé|Saltar/ }).first();
      if (await self.isVisible().catch(() => false)) { await self.click({ timeout: 1500 }).catch(() => {}); continue; }
      await page.waitForTimeout(300);
    }
  }
  console.log(`frases sin HD: ${misses.length}\n${[...new Set(misses)].join("\n")}`);
  expect([...new Set(misses)]).toEqual([]);
});
