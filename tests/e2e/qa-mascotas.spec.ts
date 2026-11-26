import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { test } from "@playwright/test";
import { TEST_EMAIL } from "./helpers";

/**
 * Genera las hojas de contacto de la auditoría de mascotas (docs/qa/hojas/). No es una prueba: solo corre con
 * FLUYE_QA=1 (que también habilita la página /qa/mascotas en el servidor local).
 *   FLUYE_QA=1 npx playwright test --project=qa-mascotas
 */
const PETS = ["zorro", "gato", "perro", "castor", "oso", "panda", "buho", "conejo", "nutria", "ciervo", "panda-rojo", "ajolote"];
const SHEETS: [string, number][] = [
  ["pieces", 130],
  ["poses", 130],
  ["headface", 110],
  ["bodyneck", 110],
  ["chest", 110],
  ["hair", 110],
];

test.skip(process.env.FLUYE_QA !== "1", "Solo para la auditoría visual (FLUYE_QA=1)");

test("hojas de contacto de mascotas", async ({ page }) => {
  test.setTimeout(3_600_000);
  await clerkSetup();
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });
  await page.setViewportSize({ width: 1700, height: 1000 });
  const only = process.env.QA_PETS?.split(",") ?? PETS;
  const sheets = process.env.QA_SHEETS?.split(",") ?? SHEETS.map((s) => s[0]);
  for (const pet of only)
    for (const [sheet, size] of SHEETS.filter((s) => sheets.includes(s[0])))
      for (const bg of sheet === "pieces" || sheet === "poses" ? ["light", "dark"] : ["light"]) {
        await page.goto(`/qa/mascotas?pet=${pet}&sheet=${sheet}&bg=${bg}&size=${size}`);
        await page.waitForLoadState("networkidle");
        await page.evaluate(async () => {
          await Promise.all([...document.images].map((i) => (i.complete ? null : new Promise((r) => (i.onload = i.onerror = r)))));
        });
        await page.screenshot({ path: `docs/qa/hojas/${pet}/${sheet}-${bg}.png`, fullPage: true });
      }
});
