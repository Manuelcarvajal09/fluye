import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ensureTestUser, sql, TEST_EMAIL } from "./helpers";

/** Fluye 1.0: banco de palabras, «¿Por qué?», Inglés de series y página de phrasal verbs nuevos. */
let userId = "";
async function signIn(page: Page) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });
}

test.beforeAll(async () => {
  userId = await ensureTestUser();
  await sql().query("insert into profiles (user_id, name, onboarded_at, level) values ($1, 'Prueba', now(), 'B2') on conflict (user_id) do update set level = 'B2', onboarded_at = coalesce(profiles.onboarded_at, now())", [userId]);
  await sql().query("delete from lesson_progress where user_id = $1 and lesson_id like 'ser-%'", [userId]);
});

test("banco de palabras: construir la frase tocando fichas, quitar una y comprobar; «¿Por qué?» explica", async ({ page }) => {
  test.skip(process.env.FLUYE_QA !== "1", "Necesita FLUYE_QA=1 para forzar el formato");
  test.setTimeout(240_000);
  await signIn(page);
  await page.goto("/sesion?min=5&formato=build");
  // Avanza hasta el primer ejercicio de construir la frase.
  for (let n = 0; n < 40; n++) {
    if (await page.getByRole("heading", { name: "Construye la frase en inglés" }).isVisible()) break;
    const cont = page.getByRole("button", { name: "Continuar", exact: true });
    if (await cont.isVisible()) { await cont.click({ timeout: 2000, force: true }).catch(() => {}); continue; }
    const ok = page.getByRole("button", { name: "¡Entendido!" });
    if (await ok.isVisible()) { await ok.click({ timeout: 2000, force: true }).catch(() => {}); continue; }
    const opt = page.locator("button.option").first();
    if (await opt.isVisible()) { await opt.click({ timeout: 2000, force: true }).catch(() => {}); continue; }
    await page.waitForTimeout(300);
  }
  await expect(page.getByRole("heading", { name: "Construye la frase en inglés" })).toBeVisible();
  const tiles = page.getByRole("group", { name: "Palabras disponibles" }).getByRole("button");
  const n = await tiles.count();
  expect(n).toBeGreaterThan(3);
  await tiles.nth(0).click();
  await tiles.nth(1).click();
  // Quitar la última colocada (también con Retroceso).
  await page.keyboard.press("Backspace");
  await expect(page.getByRole("group", { name: "Palabras disponibles" }).getByRole("button", { disabled: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.locator(".feedback-panel")).toBeVisible();
  await page.screenshot({ path: "test-results/v1/banco-palabras.png" });
  await page.getByRole("button", { name: "¿Por qué?" }).click();
  await expect(page.locator(".why-panel")).toBeVisible();
  await page.screenshot({ path: "test-results/v1/por-que.png" });
});

test("Inglés de series: recorrido completo y comprensión guardada", async ({ page }) => {
  test.setTimeout(240_000);
  await signIn(page);
  await page.goto("/series");
  await expect(page.getByRole("heading", { name: "Inglés de series" })).toBeVisible();
  await page.screenshot({ path: "test-results/v1/series-lista.png", fullPage: true });
  await page.locator('a[href^="/series/ser-b2-"]').first().click();
  await page.getByRole("button", { name: /Escuchar la escena/ }).click();
  await page.getByRole("button", { name: "Detener" }).click().catch(() => {});
  await page.getByRole("button", { name: "Ya la escuché" }).click();
  await page.locator("button.option").first().click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator("button.spot-chip").first().click();
  await page.getByRole("button", { name: "Comprobar" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.locator("button.option").first().click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { name: "5. Ahora con subtítulos" })).toBeVisible();
  await page.getByRole("button", { name: "Ver traducción al español" }).click();
  await page.screenshot({ path: "test-results/v1/series-subtitulos.png" });
  await page.getByRole("button", { name: "Seguir" }).click();
  await page.locator("button.option").first().click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Ahora no puedo hablar" }).click();
  await page.getByRole("button", { name: "Escribir" }).click();
  await page.getByLabel("Tu respuesta").fill("Sorry, my bad. I'll fix it.");
  await page.getByRole("button", { name: "Ver respuestas naturales" }).click();
  await page.getByRole("button", { name: "Terminar" }).click();
  await expect(page.getByText(/Comprensión: \d de 4/)).toBeVisible();
  await page.screenshot({ path: "test-results/v1/series-resumen.png" });
  await expect.poll(async () => (await sql().query("select count(*)::int n from lesson_progress where user_id = $1 and lesson_id like 'ser-b2-%'", [userId]))[0].n).toBe(1);
});

test("phrasal verbs nuevos y C2 visibles en la biblioteca", async ({ page }) => {
  await signIn(page);
  await page.goto("/biblioteca/pv-brush-off");
  await expect(page.getByText("brush off").first()).toBeVisible();
  await page.goto("/biblioteca/pv-eke-out");
  await expect(page.getByText("C2").first()).toBeVisible();
});
