import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ensureTestUser, GUEST_EMAIL, resetTestData, sql, TEST_EMAIL, unban } from "./helpers";

async function signIn(page: Page, email: string) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
}

test.describe.serial("acceso solo con invitación", () => {
  let guestId = "";
  test.beforeAll(async () => {
    guestId = await ensureTestUser(GUEST_EMAIL);
    await unban(guestId);
    await resetTestData(guestId);
    await sql().query("delete from members where email = $1 or user_id = $2", [GUEST_EMAIL, guestId]);
  });
  test.afterAll(async () => {
    await unban(guestId);
    await sql().query("delete from members where email = $1 or user_id = $2", [GUEST_EMAIL, guestId]);
  });

  test("sin invitación: no entra ni por rutas directas ni por la API", async ({ page }) => {
    await signIn(page, GUEST_EMAIL);
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/sin-acceso/);
    for (const path of ["/progreso", "/admin", "/tienda", "/sesion"]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/sin-acceso/);
    }
    expect((await page.request.get("/api/data")).status()).toBe(401);
    expect((await page.request.post("/api/review", { data: { itemId: "pv-give-up", mode: "recog", grade: 3, correct: true } })).status()).toBe(401);
    expect((await page.request.get("/api/admin")).status()).toBe(404);
  });

  test("invitación caducada: sigue sin entrar", async ({ page }) => {
    await sql().query("insert into members (email, status, expires_at) values ($1, 'invited', now() - interval '1 day')", [GUEST_EMAIL]);
    await signIn(page, GUEST_EMAIL);
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/sin-acceso/);
    const [m] = await sql().query("select status from members where email = $1", [GUEST_EMAIL]);
    expect(m.status).toBe("expired");
  });

  test("invitación vigente: entra, se vincula a su cuenta y no ve el panel de administración", async ({ page }) => {
    await sql().query("update members set status = 'invited', expires_at = now() + interval '7 days', user_id = null where email = $1", [GUEST_EMAIL]);
    await signIn(page, GUEST_EMAIL);
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/bienvenida/);
    const [m] = await sql().query("select status, user_id from members where email = $1", [GUEST_EMAIL]);
    expect(m.status).toBe("active");
    expect(m.user_id).toBe(guestId);
    await page.request.post("/api/profile", { data: { onboarded: true } });
    expect((await page.goto("/admin"))?.status()).toBe(404);
    expect((await page.request.post("/api/admin", { data: { action: "invite", email: "nadie@example.com" } })).status()).toBe(404);
  });

  test("miembro desactivado: pierde el acceso aunque tenga la sesión abierta", async ({ page }) => {
    await signIn(page, GUEST_EMAIL);
    await page.request.post("/api/profile", { data: { onboarded: true } });
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/hoy/);
    await sql().query("update members set status = 'disabled' where email = $1", [GUEST_EMAIL]);
    await page.goto("/progreso");
    await expect(page).toHaveURL(/\/sin-acceso/);
    expect((await page.request.post("/api/session", { data: { id: "x-123456" } })).status()).toBe(401);
    // Su historial se conserva.
    const [p] = await sql().query("select count(*)::int n from profiles where user_id = $1", [guestId]);
    expect(p.n).toBe(1);
  });
});

test.describe.serial("propietario, intentos y tienda", () => {
  let userId = "";
  test.beforeAll(async () => {
    userId = await ensureTestUser();
  });

  test("el propietario ve el panel de administración (sin respuestas ni progreso ajeno)", async ({ page }) => {
    await signIn(page, TEST_EMAIL);
    await page.request.post("/api/profile", { data: { onboarded: true, level: "B1", topics: ["restaurantes"] } });
    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Administrar acceso" })).toBeVisible();
    const r = await page.request.get("/api/admin");
    const j = await r.json();
    expect(Object.keys(j.members[0] ?? { email: 1 })).not.toContain("xp");
    // Invitaciones duplicadas se rechazan (correo ya activo).
    await sql().query("insert into members (email, status, user_id) values ('dup+clerk_test@example.com', 'active', null) on conflict do nothing");
    expect((await page.request.post("/api/admin", { data: { action: "invite", email: "dup+clerk_test@example.com" } })).status()).toBe(409);
    await sql().query("delete from members where email = 'dup+clerk_test@example.com'");
  });

  test("un mismo intento enviado dos veces no duplica repaso ni puntos", async ({ page }) => {
    await signIn(page, TEST_EMAIL);
    await page.request.post("/api/learn", { data: { itemId: "pv-give-up", action: "learn" } });
    const body = { itemId: "pv-give-up", mode: "recog", grade: 3, correct: true, attemptId: `e2e-${Date.now()}`, firstTry: true };
    const before = await sql().query("select xp from profiles where user_id = $1", [userId]);
    const a = await (await page.request.post("/api/review", { data: body })).json();
    const b = await (await page.request.post("/api/review", { data: body })).json();
    expect(a.duplicate).toBe(false);
    expect(b.duplicate).toBe(true);
    const logs = await sql().query("select count(*)::int n from review_logs where user_id = $1 and attempt_id = $2", [userId, body.attemptId]);
    expect(logs[0].n).toBe(1);
    const after = await sql().query("select xp from profiles where user_id = $1", [userId]);
    expect(after[0].xp - before[0].xp).toBe(a.gained);
    // Ver la solución nunca cuenta como recuerdo.
    const rev = await (await page.request.post("/api/review", { data: { ...body, attemptId: `e2e-r-${Date.now()}`, revealed: true } })).json();
    expect(rev.grade).toBe(1);
  });

  test("misión temática completa con escucha, reparación y producción", async ({ page }) => {
    test.setTimeout(300_000);
    await signIn(page, TEST_EMAIL);
    await page.goto("/sesion?mision=cafe-a&min=15");
    await expect(page.getByText(/Escucha · /)).toBeVisible();
    await page.getByRole("button", { name: "Ver texto" }).click();
    let sawTask = false;
    let sawRepair = false;
    for (let n = 0; n < 200; n++) {
      if (await page.getByRole("heading", { name: "¡Sesión terminada!" }).isVisible()) break;
      if (await page.getByText("Frases para salvar la conversación").isVisible()) sawRepair = true;
      const model = page.getByRole("button", { name: "Ver un modelo" });
      if (await model.isVisible()) {
        sawTask = true;
        await model.click({ timeout: 2000 }).catch(() => {});
      }
      const cont = page.getByRole("button", { name: /^(Continuar|¡Entendido!)$/ }).first();
      if (await cont.isVisible()) {
        await cont.click({ timeout: 2000 }).catch(() => {});
        continue;
      }
      if (await page.locator("#typed").isVisible()) {
        await page.getByRole("button", { name: "No me acuerdo" }).click({ timeout: 2000 }).catch(() => {});
        continue;
      }
      const opt = page.locator("button.option:not([disabled])").first();
      if (await opt.isVisible()) {
        await opt.click({ timeout: 2000 }).catch(() => {});
        continue;
      }
      await page.waitForTimeout(150);
    }
    await expect(page.getByRole("heading", { name: "¡Sesión terminada!" })).toBeVisible();
    expect(sawRepair && sawTask).toBe(true);
    await expect(page.getByRole("link", { name: "Misión final: la conversación" })).toBeVisible();
    await page.waitForTimeout(1500);
    const lp = await sql().query("select count(*)::int n from lesson_progress where user_id = $1 and lesson_id = 'ls-cafe-a'", [userId]);
    expect(lp[0].n).toBe(1);
    const gems = await sql().query("select amount from gem_ledger where user_id = $1 and key = 'route:cafe-a'", [userId]);
    expect(gems.length).toBe(1);
    const tv = await sql().query("select count(*)::int n from listen_events where user_id = $1 and kind = 'transcript'", [userId]);
    expect(tv[0].n).toBeGreaterThan(0);
    const ss = await sql().query("select finished_at from study_sessions where user_id = $1 and kind = 'mission'", [userId]);
    expect(ss.some((r) => r.finished_at)).toBe(true);
  });

  test("tienda: sin gemas no compra; con gemas compra y equipa; no se puede equipar sin comprar", async ({ page }) => {
    await signIn(page, TEST_EMAIL);
    await sql().query("delete from inventory where user_id = $1", [userId]);
    await sql().query("update profiles set gems = 10 where user_id = $1", [userId]);
    expect((await page.request.post("/api/shop", { data: { action: "buy", itemId: "acc-crown" } })).status()).toBe(409);
    expect((await page.request.post("/api/profile", { data: { settings: { look: { accessory: "crown" } } } })).status()).toBe(403);
    await sql().query("update profiles set gems = 200 where user_id = $1", [userId]);
    const r = await (await page.request.post("/api/shop", { data: { action: "buy", itemId: "acc-crown" } })).json();
    expect(r.ok).toBe(true);
    expect(r.gems).toBe(50);
    expect((await page.request.post("/api/shop", { data: { action: "equip", look: { accessory: "crown" } } })).ok()).toBe(true);
    // Comprar dos veces lo mismo no cobra doble.
    await page.request.post("/api/shop", { data: { action: "buy", itemId: "acc-crown" } });
    const [p] = await sql().query("select gems from profiles where user_id = $1", [userId]);
    expect(p.gems).toBe(50);
    await page.goto("/tienda");
    await expect(page.getByRole("heading", { name: "Tienda" })).toBeVisible();
  });
});
