import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ensureTestUser, sql, TEST_EMAIL } from "./helpers";
import { buildIslands } from "../../src/lib/map-rules";
import lessons from "../../src/generated/lessons.json";
import routes from "../../src/generated/routes.json";
import roleplays from "../../src/generated/roleplays.json";
import readings from "../../src/generated/readings.json";

/** Lote D (base de desarrollo): mapa «Tu viaje» por islas, lección concreta desde el mapa y cofre de sección. */
let uid = "";
test.beforeAll(async () => {
  await clerkSetup();
  uid = await ensureTestUser();
  await sql().query("insert into profiles (user_id, name, onboarded_at, level) values ($1, 'Prueba', now(), 'B1') on conflict (user_id) do update set onboarded_at = coalesce(profiles.onboarded_at, now()), level = 'B1'", [uid]);
});
async function login(page: Page) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });
}
const tracks = routes.flatMap((r) => r.tracks.map((t) => ({ id: t.id, level: t.level, band: t.band, lessonId: t.lesson.id, routeId: r.id, routeTitle: r.title_es, minutes: t.minutes, interview: r.id.startsWith("entrevista-") })));
const empty = () => buildIslands({ lessons, tracks, roleplays, readings, done: new Set(), readDone: new Set(), claimed: new Set(), words: {} });

test("todas las islas de A1 a C2 se ven y una lección A1 se abre aunque seas B1", async ({ page }) => {
  test.setTimeout(150_000);
  await login(page);
  await page.goto("/mapa");
  await expect(page.getByRole("heading", { name: "Tu viaje" })).toBeVisible();
  for (const lv of ["A1", "A2", "B1", "B2", "C1", "C2"]) await expect(page.locator(`#isla-${lv}`)).toBeAttached();
  await expect(page.locator("#isla-B1")).toHaveAttribute("open", "");
  await page.locator("#isla-A1 summary").click();
  const first = empty()[0].sections[0].stops[0];
  await page.locator("#isla-A1").getByRole("link", { name: new RegExp(`Lección: ${first.title}`) }).click();
  await expect(page).toHaveURL(new RegExp(`leccion=${first.id}`));
  await expect(page.getByText("Escucha · A1")).toBeVisible({ timeout: 30_000 });
});

test("al terminar una sección su cofre se abre gratis una sola vez", async ({ page }) => {
  test.setTimeout(150_000);
  const q = sql();
  const sec = empty()[0].sections[0];
  const done = sec.stops.filter((s) => s.kind !== "reading").map((s) => (s.kind === "mission" || s.kind === "interview" ? tracks.find((t) => t.id === s.id)!.lessonId : s.id));
  const reads = sec.stops.filter((s) => s.kind === "reading").map((s) => s.id);
  await q.query("delete from wallet_events where user_id = $1 and key like 'map-chest:%'", [uid]);
  await q.query("delete from lesson_progress where user_id = $1 and lesson_id = any($2)", [uid, done]);
  for (const id of done) await q.query("insert into lesson_progress (user_id, lesson_id, score) values ($1, $2, 1)", [uid, id]);
  for (const id of reads) await q.query("insert into reading_progress (user_id, reading_id, score, total) values ($1, $2, 3, 3) on conflict do nothing", [uid, id]);
  const [{ gems: before }] = await q.query("select gems from profiles where user_id = $1", [uid]);
  try {
    await login(page);
    await page.goto("/mapa");
    await page.locator("#isla-A1 summary").click();
    await page.locator("#isla-A1").getByRole("button", { name: "Abrir gratis" }).first().click();
    await expect(page.getByRole("dialog", { name: "Abriendo cofre" })).toBeVisible();
    const rows = await q.query("select amount, reason from wallet_events where user_id = $1 and key = $2", [uid, `map-chest:${sec.id}`]);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(0);
    const [{ gems: after }] = await q.query("select gems from profiles where user_id = $1", [uid]);
    expect(after).toBeGreaterThanOrEqual(before); // gratis (y si sale repetido, devuelve gemas)
    const again = await page.request.post("/api/map", { data: { action: "chest", section: sec.id } });
    expect(again.status()).toBe(409);
    const notReady = await page.request.post("/api/map", { data: { action: "chest", section: "C1-1" } });
    expect(notReady.status()).toBe(409);
  } finally {
    await q.query("delete from lesson_progress where user_id = $1 and lesson_id = any($2)", [uid, done]);
    await q.query("delete from reading_progress where user_id = $1 and reading_id = any($2)", [uid, reads]);
  }
});
