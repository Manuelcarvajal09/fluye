import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ensureTestUser, resetTestData, sql, TEST_EMAIL, solveNewFormats } from "./helpers";

async function signIn(page: Page) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });
}

/** Recorre una sesión completa respondiendo lo que aparezca en pantalla. */
async function playSession(page: Page) {
  const seen = new Set<string>();
  for (let n = 0; n < 250; n++) {
    if (await page.getByRole("heading", { name: "¡Sesión terminada!" }).isVisible()) return seen;
    const cont = page.getByRole("button", { name: "Continuar", exact: true });
    if (await cont.isVisible()) {
      seen.add((await page.locator("h1, h2").first().textContent({ timeout: 1000 }).catch(() => "")) ?? "");
      await cont.click({ timeout: 2000 }).catch(() => {});
      continue;
    }
    const ok = page.getByRole("button", { name: "¡Entendido!" });
    if (await ok.isVisible()) {
      seen.add("intro");
      await ok.click({ timeout: 2000 }).catch(() => {});
      continue;
    }
    const fmt = await solveNewFormats(page);
    if (fmt) {
      seen.add(fmt);
      continue;
    }
    const typed = page.locator("#typed");
    if (await typed.isVisible()) {
      seen.add("typed");
      await page.getByRole("button", { name: "No me acuerdo" }).click({ timeout: 2000 }).catch(() => {});
      continue;
    }
    const skip = page.getByRole("button", { name: "Ahora no puedo hablar" });
    if (await skip.isVisible()) {
      seen.add("speak");
      await skip.click({ timeout: 2000 }).catch(() => {});
      continue;
    }
    const option = page.locator("button.option:not([disabled])").first();
    if (await option.isVisible()) {
      await option.click({ timeout: 2000 }).catch(() => {});
      // Captura del primer acierto (para revisar las animaciones).
      if (!seen.has("shot") && (await page.getByText("+10 XP").isVisible().catch(() => false))) {
        seen.add("shot");
        await page.waitForTimeout(250);
        await page.screenshot({ path: "test-results/screens/acierto.png" });
      }
      continue;
    }
    await page.waitForTimeout(150);
  }
  throw new Error("La sesión no terminó");
}

test("registro → bienvenida → lección → progreso guardado → repasos al día siguiente", async ({ page }) => {
  test.setTimeout(600_000);
  const userId = await ensureTestUser();
  await resetTestData(userId); // independiente del orden de las pruebas
  await signIn(page);

  // Onboarding corto: nombre + nivel, áreas, minutos
  await page.goto("/hoy");
  await expect(page).toHaveURL(/\/bienvenida/);
  await page.getByRole("textbox").fill("Prueba");
  await page.getByRole("button", { name: /Me defiendo poco/ }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Biología y trabajo de campo" }).click();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "10 min" }).click();
  await page.getByRole("button", { name: "Empezar mi primera sesión" }).click();

  // Sesión: historia + preguntas + nuevas + producción
  await expect(page).toHaveURL(/\/sesion/);
  await expect(page.getByText(/Escucha · /).first()).toBeVisible();
  const seen = await playSession(page);
  expect(seen.has("intro")).toBe(true);
  await expect(page.getByText(/Tus repasos ya quedaron programados/)).toBeVisible();
  await page.waitForTimeout(1500);

  // Persistencia real en Postgres
  const q = sql();
  const [prof] = await q.query("select xp, level, topics, onboarded_at from profiles where user_id = $1", [userId]);
  expect(prof.level).toBe("A2");
  expect(prof.topics).toContain("biologia");
  expect(prof.xp).toBeGreaterThan(0);
  const cards = await q.query("select mode, due, state from cards where user_id = $1", [userId]);
  expect(cards.length).toBeGreaterThanOrEqual(12);
  expect(new Set(cards.map((c) => c.mode))).toEqual(new Set(["recog", "prod", "listen", "speak"]));
  const logs = await q.query("select count(*)::int as n from review_logs where user_id = $1", [userId]);
  expect(logs[0].n).toBeGreaterThan(5);
  const lessons = await q.query("select count(*)::int as n from lesson_progress where user_id = $1", [userId]);
  expect(lessons[0].n).toBe(1);

  // Panel con datos reales
  await page.getByRole("link", { name: "Volver a Hoy" }).click();
  await expect(page.getByRole("button", { name: "Comenzar mi sesión" }).or(page.getByRole("link", { name: "Comenzar mi sesión" }))).toBeVisible();

  // "Mañana": adelantamos el reloj moviendo los vencimientos 1 día hacia atrás
  await q.query("update cards set due = due - interval '1 day' where user_id = $1", [userId]);
  await page.goto("/repaso");
  await expect(page.getByRole("heading", { name: "Repaso" })).toBeVisible();
  await page.getByRole("button", { name: "Mostrar respuesta" }).click();
  await expect(page.getByRole("button", { name: /Bien/ })).toBeVisible();
  const before = await q.query("select count(*)::int as n from review_logs where user_id = $1", [userId]);
  await page.getByRole("button", { name: /Bien/ }).click();
  await page.waitForTimeout(1500);
  const after = await q.query("select count(*)::int as n from review_logs where user_id = $1", [userId]);
  expect(after[0].n).toBe(before[0].n + 1);

  // Segunda sesión: ya incluye repasos programados
  await page.goto("/sesion?min=5");
  await playSession(page);

  // Biblioteca, sonidos, progreso, ajustes y exportación
  await page.goto("/biblioteca?q=give%20up");
  await expect(page.getByRole("link", { name: /give up/ }).first()).toBeVisible();
  await page.goto("/sonidos");
  await page.getByRole("link", { name: /\/θ\// }).first().click();
  await expect(page.getByText("¿Qué palabra escuchaste?")).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await page.locator("button.option").first().click();
    await page.getByRole("button", { name: "Siguiente" }).click();
  }
  await expect(page.getByRole("button", { name: "Otra ronda" })).toBeVisible();
  await page.waitForTimeout(1000);
  const snd = await q.query("select perception_total from sound_progress where user_id = $1", [userId]);
  expect(snd[0].perception_total).toBe(10);

  await page.goto("/progreso");
  await expect(page.getByText("Aprendiendo", { exact: true }).first()).toBeVisible();
  const exp = await page.request.get("/api/data");
  expect(exp.ok()).toBe(true);
  const data = await exp.json();
  expect(data.cards.length).toBe(cards.length);
  // Importar el mismo respaldo no duplica ni retrocede
  const imp = await page.request.post("/api/data", { data });
  expect((await imp.json()).imported).toBe(cards.length);
  const cardsAfter = await q.query("select count(*)::int as n from cards where user_id = $1", [userId]);
  expect(cardsAfter[0].n).toBe(cards.length);

  // Practicar: gramática, corrige la frase y un roleplay completo
  await page.goto("/practicar/gramatica");
  await page.locator("a[href^=\"/practicar/gramatica/\"]").first().click();
  await expect(page.getByRole("heading", { name: "Practica" })).toBeVisible();
  await page.goto("/practicar/corrige");
  await page.locator("#fix").fill("I am 30 years old.");
  await page.getByRole("button", { name: "Comprobar" }).click();
  await expect(page.getByRole("button", { name: /Siguiente/ })).toBeVisible();
  await page.goto("/practicar");
  await page.locator("a[href^=\"/practicar/roleplay/\"]").first().click();
  for (let t = 0; t < 12; t++) {
    if (await page.getByText("Conversación terminada").isVisible()) break;
    await page.getByRole("button", { name: "No sé qué decir: muéstrame cómo" }).click();
    await page.getByRole("button", { name: /Siguiente turno|Terminar/ }).click();
  }
  await expect(page.getByText("Conversación terminada")).toBeVisible();
  await page.waitForTimeout(1200);
  const rp = await q.query("select count(*)::int n from lesson_progress where user_id = $1 and lesson_id like $2", [userId, "rp-%"]);
  expect(rp[0].n).toBe(1);

  const ics = await page.request.get("/api/reminder");
  expect(await ics.text()).toContain("RRULE:FREQ=DAILY");
});

test("las APIs rechazan peticiones sin sesión", async ({ request }) => {
  // Clerk responde 404/401 o redirige a /sign-in; nunca 200 con datos.
  const r = await request.post("/api/review", { data: { itemId: "pv-give-up", mode: "recog", grade: 3, correct: true }, maxRedirects: 0 });
  expect(r.status()).not.toBe(200);
  const d = await request.get("/api/data", { maxRedirects: 0 });
  expect(d.status()).not.toBe(200);
});

test("test de nivel completo: se califica en el servidor y ajusta el nivel", async ({ page }) => {
  test.setTimeout(600_000);
  const userId = await ensureTestUser();
  await signIn(page);
  // No depende de otros tests: deja la cuenta con la bienvenida terminada.
  expect((await page.request.post("/api/profile", { data: { onboarded: true, level: "B1", topics: ["conversacion"] } })).ok()).toBe(true);
  await page.goto("/practicar/test");
  await page.getByRole("button", { name: /Empezar|Continuar/ }).click();
  const total = Number((await page.getByText(/^\d+\/\d+$/).first().textContent())!.split("/")[1]);
  for (let i = 0; i < total; i++) {
    const opts = page.locator("button.option");
    await opts.first().waitFor();
    await opts.nth(i % 4).click();
  }
  await page.getByRole("button", { name: "Ver mi resultado" }).click();
  await expect(page.getByText("Tu nivel estimado")).toBeVisible();
  const [p] = await sql().query("select level, settings from profiles where user_id = $1", [userId]);
  expect(p.settings.placement.total).toBe(total);
  expect(p.level).toBe(p.settings.placement.level);
});
