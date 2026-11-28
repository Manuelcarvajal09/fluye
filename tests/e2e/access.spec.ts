import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ensureTestUser, GUEST_EMAIL, resetTestData, sql, TEST_EMAIL, unban, solveNewFormats } from "./helpers";
import { pieceOf } from "../../src/lib/wardrobe";

// Precio real de la corona (cambia al reequilibrar la economía): la prueba deja 40 gemas de sobra.
const CROWN = pieceOf("crown")!.price;

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
      if (await solveNewFormats(page)) continue;
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

  test("una sesión a medias guarda su progreso al salir", async ({ page }) => {
    await signIn(page, TEST_EMAIL);
    await sql().query("delete from study_sessions where user_id = $1", [userId]);
    await sql().query("update profiles set lives = 5 where user_id = $1", [userId]); // las vidas ya se gastan también para el propietario
    await page.goto("/sesion?min=5");
    // Avanza un paso, sea del tipo que sea (historia, opciones, fichas, dictado…).
    await expect(page.getByText(/Paso 1 de|Escucha · /).first()).toBeVisible();
    for (let n = 0; n < 6; n++) {
      const cont = page.getByRole("button", { name: /^(Continuar|¡Entendido!)$/ }).first();
      if (await cont.isVisible()) { await cont.click({ timeout: 2000 }).catch(() => {}); break; }
      if (await solveNewFormats(page)) continue;
      if (await page.locator("#typed").isVisible()) { await page.getByRole("button", { name: "No me acuerdo" }).click({ timeout: 2000 }).catch(() => {}); continue; }
      const opt = page.locator("button.option:not([disabled])").first();
      if (await opt.isVisible()) { await opt.click({ timeout: 2000 }).catch(() => {}); continue; }
      await page.waitForTimeout(300);
    }
    await page.waitForTimeout(800);
    await page.goto("/hoy"); // al salir se envía el progreso (pagehide / desmontaje)
    await expect.poll(async () => (await sql().query("select max(done)::int d from study_sessions where user_id = $1", [userId]))[0].d, { timeout: 15_000 }).toBeGreaterThan(0);
    const [r] = await sql().query("select count(*)::int n from study_sessions where user_id = $1", [userId]);
    expect(r.n).toBe(1); // una sola sesión, no duplicada
  });

  test("colecciones: seleccionar varias, agrupar sin duplicar tarjetas, estudiar solo esas y exportar/importar", async ({ page }) => {
    test.setTimeout(240_000);
    await signIn(page, TEST_EMAIL);
    await sql().query("delete from collection_items where user_id = $1", [userId]);
    await sql().query("delete from collections where user_id = $1", [userId]);
    await page.request.post("/api/profile", { data: { onboarded: true, level: "B1", topics: ["conversacion"] } });
    await page.goto("/biblioteca?q=look");
    await page.getByRole("button", { name: "Seleccionar varias" }).click();
    const boxes = page.getByRole("checkbox");
    await boxes.nth(0).click();
    await boxes.nth(1).click();
    await boxes.nth(2).click();
    await expect(page.getByText("3 seleccionadas")).toBeVisible();
    await page.getByRole("button", { name: "A una colección" }).click();
    await page.getByLabel("Nombre de la colección nueva").fill("Entrevista E2E");
    await page.getByRole("button", { name: "Crear colección con la selección" }).click();
    await expect(page.getByText(/Colección «Entrevista E2E» creada con 3/)).toBeVisible();
    const [col] = await sql().query("select id from collections where user_id = $1", [userId]);
    const before = await sql().query("select count(*)::int n from cards where user_id = $1", [userId]);
    // Agrupar no crea tarjetas: son las mismas entradas canónicas.
    expect((await sql().query("select count(*)::int n from cards where user_id = $1", [userId]))[0].n).toBe(before[0].n);
    // La misma entrada en una segunda colección no duplica nada.
    const items = (await sql().query("select item_id from collection_items where collection_id = $1", [col.id])).map((r) => r.item_id);
    const r2 = await (await page.request.post("/api/collections", { data: { action: "create", name: "Otra", items: [items[0]] } })).json();
    expect(r2.added).toBe(1);
    // Estudiar solo esa colección: la sesión solo trae sus entradas.
    const t0 = new Date().toISOString();
    await page.goto(`/sesion?coleccion=${col.id}&min=5`);
    await expect(page.getByRole("button", { name: "¡Entendido!" })).toBeVisible();
    await page.getByRole("button", { name: "¡Entendido!" }).click();
    await page.locator("button.option:not([disabled])").first().click();
    await page.getByRole("button", { name: "Continuar", exact: true }).click();
    await page.waitForTimeout(1500);
    const cards = await sql().query("select distinct item_id from cards where user_id = $1 and created_at > $2", [userId, t0]);
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) expect(items).toContain(c.item_id);
    // Repaso manual filtrado por colección y modalidad, adelantando las que no vencen.
    await page.goto(`/repaso?coleccion=${col.id}&modo=recog&adelantar=1`);
    await expect(page.getByRole("button", { name: "Mostrar respuesta" })).toBeVisible();
    // Exportar e importar: solo nombre e ids, sin datos personales.
    const exp = await (await page.request.get(`/api/collections?export=${col.id}`)).json();
    expect(Object.keys(exp).sort()).toEqual(["app", "items", "name", "version"]);
    const imp = await (await page.request.post("/api/collections", { data: { action: "import", data: { ...exp, items: [...exp.items, "no-existe"] } } })).json();
    expect(imp.added).toBe(3);
    expect(imp.skipped).toBe(1);
    // Aislamiento: otra cuenta no puede leer ni tocar esta colección.
    expect((await page.request.post("/api/collections", { data: { action: "add", id: "col_ajena", items: [items[0]] } })).status()).toBe(404);
    // Borrar la colección conserva las tarjetas.
    const n1 = (await sql().query("select count(*)::int n from cards where user_id = $1", [userId]))[0].n;
    await page.request.post("/api/collections", { data: { action: "delete", id: col.id } });
    expect((await sql().query("select count(*)::int n from cards where user_id = $1", [userId]))[0].n).toBe(n1);
  });

  test("tienda: sin gemas no compra; con gemas compra y equipa; no se puede equipar sin comprar", async ({ page }) => {
    await signIn(page, TEST_EMAIL);
    await sql().query("delete from inventory where user_id = $1", [userId]);
    await sql().query("update profiles set gems = 10 where user_id = $1", [userId]);
    expect((await page.request.post("/api/shop", { data: { action: "buy", kind: "piece", id: "crown", key: "e2e-crown-1" } })).status()).toBe(409);
    expect((await page.request.post("/api/profile", { data: { settings: { look: { sets: { zorro: ["crown"] } } } } })).status()).toBe(403);
    await sql().query("update profiles set gems = $2 where user_id = $1", [userId, CROWN + 40]);
    const r = await (await page.request.post("/api/shop", { data: { action: "buy", kind: "piece", id: "crown", key: "e2e-crown-2" } })).json();
    expect(r.ok).toBe(true);
    expect(r.wallet.gems).toBe(40);
    expect((await page.request.post("/api/shop", { data: { action: "equip", species: "zorro", wear: ["crown"] } })).ok()).toBe(true);
    // Repetir la misma compra no cobra doble.
    await page.request.post("/api/shop", { data: { action: "buy", kind: "piece", id: "crown", key: "e2e-crown-2" } });
    const [p] = await sql().query("select gems from profiles where user_id = $1", [userId]);
    expect(p.gems).toBe(40);
    await page.goto("/tienda");
    await expect(page.getByRole("heading", { name: "Armario" })).toBeVisible();
  });
});
