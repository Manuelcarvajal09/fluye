import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test } from "@playwright/test";
import { ensureTestUser, GUEST_EMAIL, sql, TEST_EMAIL } from "./helpers";
import { addWeeks, leagueWeek } from "../../src/lib/league-rules";

/** Lote B (base de desarrollo, usuario de prueba): vidas que bloquean, vidas ilimitadas y cierre de liga. */
let userId = "";
test.beforeAll(async () => {
  await clerkSetup();
  userId = await ensureTestUser();
  const q = sql();
  await q.query("insert into profiles (user_id, name, onboarded_at, level) values ($1, 'Prueba', now(), 'B1') on conflict (user_id) do update set level = 'B1', onboarded_at = coalesce(profiles.onboarded_at, now())", [userId]);
  await q.query("delete from member_perks where user_id = $1", [userId]);
  await q.query("delete from league_members where user_id = $1", [userId]);
});
test.afterAll(async () => {
  await sql().query("update profiles set lives = 5 where user_id = $1", [userId]);
  await sql().query("delete from member_perks where user_id = $1", [userId]);
});

test("sin vidas (miembro): no hay lecciones nuevas, el repaso sigue; con el permiso, vidas ilimitadas", async ({ page }) => {
  test.setTimeout(180_000);
  const q = sql();
  // Cuenta de invitado como miembro activo normal (no propietaria) en la base de desarrollo.
  const guestId = await ensureTestUser(GUEST_EMAIL);
  await q.query("delete from members where email = $1 or user_id = $2", [GUEST_EMAIL, guestId]);
  await q.query("insert into members (email, user_id, status, activated_at) values ($1, $2, 'active', now())", [GUEST_EMAIL, guestId]);
  await q.query("delete from member_perks where user_id = $1", [guestId]);
  await q.query("insert into profiles (user_id, name, onboarded_at, level, lives, shield, lives_day) values ($1, 'Invitada', now(), 'A2', 0, 0, (now() at time zone 'America/Mexico_City')::date) on conflict (user_id) do update set onboarded_at = coalesce(profiles.onboarded_at, now()), lives = 0, shield = 0, lives_day = (now() at time zone profiles.tz)::date", [guestId]);
  try {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: GUEST_EMAIL });
    await page.goto("/sesion?min=5");
    await expect(page.getByRole("heading", { name: "Te quedaste sin vidas" })).toBeVisible();
    await page.getByRole("link", { name: "Repasar y recuperar vidas" }).click();
    await expect(page).toHaveURL(/repaso=1/);
    // El propietario le concede vidas ilimitadas: la sesión entra directo y el contador muestra ∞.
    await q.query("insert into member_perks (user_id, unlimited_lives) values ($1, true) on conflict (user_id) do update set unlimited_lives = true", [guestId]);
    await page.goto("/hoy");
    await expect(page.getByRole("link", { name: "Vidas ilimitadas" })).toBeVisible();
    await page.goto("/sesion?min=5");
    await expect(page.getByRole("heading", { name: "Te quedaste sin vidas" })).toHaveCount(0);
  } finally {
    await q.query("delete from member_perks where user_id = $1", [guestId]);
    await q.query("delete from members where email = $1 or user_id = $2", [GUEST_EMAIL, guestId]);
    await q.query("update profiles set lives = 5 where user_id = $1", [guestId]);
  }
});

test("propietario: sin vidas se bloquea como cualquiera; con el permiso activado ve ∞", async ({ page }) => {
  test.setTimeout(120_000);
  const q = sql();
  await q.query("delete from member_perks where user_id = $1", [userId]);
  await q.query("update profiles set lives = 0 where user_id = $1", [userId]);
  try {
    await setupClerkTestingToken({ page });
    await page.goto("/");
    await clerk.signIn({ page, emailAddress: TEST_EMAIL });
    await page.goto("/sesion?min=5");
    await expect(page.getByRole("heading", { name: "Te quedaste sin vidas" })).toBeVisible();
    await q.query("insert into member_perks (user_id, unlimited_lives) values ($1, true)", [userId]);
    await page.goto("/hoy");
    await expect(page.getByRole("link", { name: "Vidas ilimitadas" }).filter({ visible: true }).first()).toBeVisible();
    await page.goto("/sesion?min=5");
    await expect(page.getByRole("heading", { name: "Te quedaste sin vidas" })).toHaveCount(0);
  } finally {
    await q.query("delete from member_perks where user_id = $1", [userId]);
    await q.query("update profiles set lives = 5 where user_id = $1", [userId]);
  }
});

test("liga: alta semanal, cierre de la semana pasada con ascenso y premio una sola vez", async ({ page }) => {
  test.setTimeout(180_000);
  const q = sql();
  const week = leagueWeek();
  const prev = addWeeks(week, -1);
  // Semana pasada: en Semilla, con XP suficiente para subir (grupo pequeño → umbral).
  await q.query("delete from league_weeks where week = $1", [prev]);
  await q.query("delete from league_members where user_id = $1 and week = $2", [userId, week]);
  await q.query("delete from gem_ledger where user_id = $1 and key = $2", [userId, `league:${prev}`]);
  await q.query("insert into league_members (user_id, week, tier) values ($1, $2, 0) on conflict do nothing", [userId, prev]);
  await q.query("insert into daily_stats (user_id, day, xp) values ($1, $2, 400) on conflict (user_id, day) do update set xp = 400", [userId, prev]);
  const gems0 = (await q.query("select gems from profiles where user_id = $1", [userId]))[0].gems as number;
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });
  await page.goto("/amigos");
  await expect(page.getByRole("heading", { name: "Liga Brote" })).toBeVisible();
  await expect(page.getByText(/subiste de Semilla a Brote/)).toBeVisible();
  const [row] = await q.query("select result, xp from league_members where user_id = $1 and week = $2", [userId, prev]);
  expect(row.result).toBe("up");
  const gems1 = (await q.query("select gems from profiles where user_id = $1", [userId]))[0].gems as number;
  expect(gems1 - gems0).toBe(30);
  // Volver a entrar no vuelve a cerrar ni a pagar.
  await page.goto("/amigos");
  await page.goto("/perfil");
  await expect(page.locator("a.profile-stat:visible", { hasText: "Liga " }).first()).toBeVisible();
  const gems2 = (await q.query("select gems from profiles where user_id = $1", [userId]))[0].gems as number;
  expect(gems2).toBe(gems1);
});
