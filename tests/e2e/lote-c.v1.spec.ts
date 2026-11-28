import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import sharp from "sharp";
import { ensureTestUser, sql, TEST_EMAIL } from "./helpers";

/** Lote C (base de desarrollo, usuario de prueba): diario con foto, lectura con glosario y noticia del día. */
let userId = "";
const PHOTO = "test-results/diario-foto.png";
test.beforeAll(async () => {
  await clerkSetup();
  userId = await ensureTestUser();
  const q = sql();
  await q.query("insert into profiles (user_id, name, onboarded_at, level) values ($1, 'Prueba', now(), 'B1') on conflict (user_id) do update set onboarded_at = coalesce(profiles.onboarded_at, now())", [userId]);
  for (const t of ["journal_entries", "journal_photos", "reading_progress"]) await q.query(`delete from ${t} where user_id = $1`, [userId]);
  mkdirSync("test-results", { recursive: true });
  await sharp({ create: { width: 1600, height: 1000, channels: 3, background: "#3d9a5b" } }).png().toFile(PHOTO);
});

async function login(page: Page) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });
}

test("diario: ánimo, actividad, frase en inglés y foto; se guarda y se vuelve a abrir", async ({ page }) => {
  test.setTimeout(180_000);
  await login(page);
  await page.goto("/diario");
  await expect(page.getByRole("heading", { name: "Diario" })).toBeVisible();
  await page.getByRole("radio", { name: /Bien/ }).click();
  await page.getByRole("group", { name: "Qué hiciste" }).getByRole("button").first().click();
  await page.getByPlaceholder("Today I…").fill("Today I practiced English for twenty minutes.");
  await expect(page.getByText("Guardado")).toBeVisible({ timeout: 10_000 });
  await page.locator('input[type="file"]').setInputFiles(PHOTO);
  await expect(page.getByRole("img", { name: "Foto del diario" })).toBeVisible({ timeout: 15_000 });
  const [ph] = await sql().query("select size, w, h, mime from journal_photos where user_id = $1", [userId]);
  expect(ph.mime).toBe("image/webp");
  expect(Math.max(ph.w, ph.h)).toBeLessThanOrEqual(1280);
  expect(ph.size).toBeLessThanOrEqual(400_000);
  await page.reload();
  await expect(page.getByPlaceholder("Today I…")).toHaveValue("Today I practiced English for twenty minutes.");
  await expect(page.getByRole("radio", { name: /Bien/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("img", { name: "Foto del diario" })).toBeVisible();
  // La foto solo la sirve la API a su dueño.
  const src = await page.getByRole("img", { name: "Foto del diario" }).getAttribute("src");
  expect((await page.request.get(src!)).headers()["content-type"]).toBe("image/webp");
});

test("lectura: glosario al tocar, preguntas y XP la primera vez", async ({ page }) => {
  test.setTimeout(180_000);
  const r = (JSON.parse(readFileSync("src/generated/readings.json", "utf8")) as { id: string; glossary: { term: string; es: string }[]; questions: unknown[] }[]).find((x) => x.id === "lectura-edmonton-invierno")!;
  await login(page);
  await page.goto(`/lecturas/${r.id}`);
  const term = r.glossary[0];
  await page.getByRole("button", { name: new RegExp(`^${term.term}$`, "i") }).first().click();
  await expect(page.getByRole("dialog")).toContainText(term.es);
  await page.getByRole("button", { name: "Cerrar" }).click();
  const total = r.questions.length + 1;
  for (let i = 0; i < total; i++) await page.locator("fieldset").nth(i).locator("button.option").first().click();
  await page.getByRole("button", { name: "Guardar resultado" }).click();
  await expect(page.getByText(/\+\d+ XP/)).toBeVisible();
  const [row] = await sql().query("select score, total from reading_progress where user_id = $1 and reading_id = $2", [userId, r.id]);
  expect(row.total).toBe(total);
});

test("noticia de Canadá del día: texto con atribución a canada.ca", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);
  await page.goto("/noticias");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByText(/Copia de la versión publicada en/)).toBeVisible();
  const [n] = await sql().query("select url, array_length(array(select jsonb_array_elements(body)), 1) as parrafos from daily_news order by day desc limit 1");
  expect(n.url).toMatch(/^https:\/\/www\.canada\.ca\//);
  expect(Number(n.parrafos)).toBeGreaterThan(0);
});
