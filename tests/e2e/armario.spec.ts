import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { ensureTestUser, sql, TEST_EMAIL } from "./helpers";

/** Segunda cuenta de prueba (modo test de Clerk: no envía correos) para amistades y regalos. */
const FRIEND_EMAIL = "fluye-e2e-amigo+clerk_test@example.com";
const SHOTS = "test-results/armario";
const ITEM = (JSON.parse(readFileSync("src/generated/items.json", "utf8")) as { id: string }[])[0].id;

let A = "";
let B = "";

async function login(browser: Browser, email: string, viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
  return page;
}
const api = async (page: Page, url: string, data: unknown) => {
  const r = await page.request.post(url, { data });
  return { status: r.status(), ...(await r.json().catch(() => ({}))) } as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
};
const profile = async (id: string) => (await sql().query("select coins, gems, lives, shield, boosts, settings from profiles where user_id = $1", [id]))[0] as { coins: number; gems: number; lives: number; shield: number; boosts: number; settings: { look?: { sets?: Record<string, string[]> } } };
const key = () => crypto.randomUUID();

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  await clerkSetup();
  A = await ensureTestUser(TEST_EMAIL);
  B = await ensureTestUser(FRIEND_EMAIL);
  const q = sql();
  // La segunda cuenta es miembro activo solo en la base de desarrollo.
  await q.query("insert into members (email, user_id, status) values ($1, $2, 'active') on conflict (email) do update set user_id = $2, status = 'active'", [FRIEND_EMAIL, B]);
  for (const id of [A, B]) {
    for (const t of ["wallet_events", "inventory", "gem_ledger"]) await q.query(`delete from ${t} where user_id = $1`, [id]);
    await q.query("delete from friendships where user_a = $1 or user_b = $1", [id]);
    await q.query("delete from gifts where from_user = $1 or to_user = $1", [id]);
  }
  await q.query("insert into profiles (user_id, name, onboarded_at) values ($1, 'Amiga', now()) on conflict (user_id) do nothing", [B]);
  await q.query("insert into profiles (user_id, name, onboarded_at) values ($1, 'Prueba', now()) on conflict (user_id) do update set onboarded_at = coalesce(profiles.onboarded_at, now())", [A]);
  await q.query("update profiles set coins = 2000, gems = 60, lives = 5, shield = 0, boosts = 2, lives_day = null, friend_code = null, settings = settings - 'look' where user_id = any($1)", [[A, B]]);
});

test("armario: probar, comprar, guardar un conjunto por mascota y validar en el servidor", async ({ browser }) => {
  test.setTimeout(240_000);
  const page = await login(browser, TEST_EMAIL);
  await page.goto("/tienda");
  await expect(page.getByRole("heading", { name: "Armario" })).toBeVisible();
  // Flor y lentes son de inicio.
  await page.getByRole("button", { name: "Cara", exact: true }).click();
  await expect(page.locator(".item-card", { hasText: "Lentes redondos" }).getByText("Tuya")).toBeVisible();
  // Probar sin comprar: no se puede guardar.
  await page.getByRole("button", { name: "Cabeza", exact: true }).click();
  await page.getByRole("button", { name: "Probar Corona", exact: true }).click();
  await expect(page.getByRole("button", { name: "Guardar conjunto" })).toBeDisabled();
  await page.screenshot({ path: `${SHOTS}/pc_armario-probando.png` });
  // Comprar la gorra y guardar gorra + lentes.
  await page.getByRole("button", { name: "Quitar Corona", exact: true }).click();
  const before = (await profile(A)).coins;
  await page.getByRole("button", { name: "Comprar Gorra violeta por 35 monedas" }).click();
  await expect(page.getByText("¡Gorra violeta es tuya!")).toBeVisible();
  expect((await profile(A)).coins).toBe(before - 35);
  await page.getByRole("button", { name: "Cara", exact: true }).click();
  await page.getByRole("button", { name: "Probar Lentes redondos" }).click();
  await page.getByRole("button", { name: "Guardar conjunto" }).click();
  await expect(page.getByText("Conjunto guardado")).toBeVisible();
  expect((await profile(A)).settings.look?.sets?.zorro?.sort()).toEqual(["cap", "glasses"]);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/pc_armario-guardado.png` });
  // El servidor rechaza equipar lo que no es tuyo y no cobra dos veces la misma compra.
  expect((await api(page, "/api/shop", { action: "equip", species: "zorro", wear: ["crown"] })).status).toBe(403);
  expect((await api(page, "/api/shop", { action: "equip", species: "ajolote", wear: [] })).status).toBe(403);
  const k = key();
  const c0 = (await profile(A)).coins;
  expect((await api(page, "/api/shop", { action: "buy", kind: "piece", id: "bowtie", key: k })).ok).toBe(true);
  await api(page, "/api/shop", { action: "buy", kind: "piece", id: "bowtie", key: k });
  expect((await profile(A)).coins).toBe(c0 - 65);
  // Las piezas de logro no se compran.
  expect((await api(page, "/api/shop", { action: "buy", kind: "piece", id: "racha-360", key: key() })).ok).toBe(false);
  // Otra mascota conserva su propio conjunto.
  expect((await api(page, "/api/shop", { action: "buy", kind: "pet", id: "conejo", key: key() })).ok).toBe(true);
  expect((await api(page, "/api/shop", { action: "equip", species: "conejo", wear: ["flower"] })).ok).toBe(true);
  const sets = (await profile(A)).settings.look?.sets ?? {};
  expect(sets.conejo).toEqual(["flower"]);
  expect(sets.zorro?.sort()).toEqual(["cap", "glasses"]);
  await page.goto("/tienda?tab=mascotas");
  await page.screenshot({ path: `${SHOTS}/pc_mascotas.png` });
  await page.context().close();
});

test("cofres: cobran una vez, salen vacíos y repetidos, y la cuenta de monedas cuadra", async ({ browser }) => {
  test.setTimeout(300_000);
  const page = await login(browser, TEST_EMAIL);
  await sql().query("update profiles set coins = 3000 where user_id = $1", [A]);
  const start = (await profile(A)).coins;
  const seen = { empty: 0, new: 0, dup: 0 };
  let refunds = 0;
  for (let n = 0; n < 45; n++) {
    const r = await api(page, "/api/shop", { action: "chest", chest: "semilla", key: key() });
    expect(r.ok).toBe(true);
    seen[r.outcome as keyof typeof seen]++;
    refunds += r.refund;
    if (r.outcome === "dup") expect(r.refund).toBe(10);
    if (r.outcome === "empty") expect(r.refund).toBe(0);
  }
  expect(seen.empty).toBeGreaterThan(0);
  expect(seen.dup).toBeGreaterThan(0);
  expect((await profile(A)).coins).toBe(start - 45 * 20 + refunds);
  // Repetir la misma clave no vuelve a cobrar.
  const k = key();
  const c0 = (await profile(A)).coins;
  await api(page, "/api/shop", { action: "chest", chest: "aurora", key: k });
  const again = await api(page, "/api/shop", { action: "chest", chest: "aurora", key: k });
  expect(again.ok).toBe(false);
  const after = (await profile(A)).coins;
  expect(c0 - after).toBeLessThanOrEqual(34);
  // Interfaz: un cofre real y el modo de prueba con vacío, repetido y legendario.
  await page.goto("/tienda?tab=cofres");
  await page.getByRole("button", { name: /Abrir Cofre brote por 28 monedas/ }).click();
  await expect(page.getByRole("button", { name: "Seguir" })).toBeEnabled({ timeout: 8000 });
  await page.screenshot({ path: `${SHOTS}/pc_cofre-real.png` });
  await page.getByRole("button", { name: "Seguir" }).click();
  await page.getByText("Modo de prueba").click();
  for (const [value, name] of [["empty", "vacio"], ["dup-1", "repetido"], ["new-3", "legendario"]]) {
    await page.locator("select").nth(1).selectOption(value);
    await page.getByRole("button", { name: "Ver animación" }).click();
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `${SHOTS}/pc_cofre-${name}-durante.png` });
    await expect(page.getByRole("button", { name: "Seguir" })).toBeEnabled({ timeout: 8000 });
    await page.screenshot({ path: `${SHOTS}/pc_cofre-${name}.png` });
    await page.getByRole("button", { name: "Seguir" }).click();
  }
  await page.context().close();
});

test("amistad y los tres regalos entre dos cuentas, cobrados y entregados una sola vez", async ({ browser }) => {
  test.setTimeout(300_000);
  const a = await login(browser, TEST_EMAIL);
  const b = await login(browser, FRIEND_EMAIL, { width: 390, height: 844 });
  await a.goto("/amigos");
  const code = (await a.locator("code").first().textContent())!.trim();
  await b.goto("/amigos");
  await b.getByLabel("Agregar una amistad").fill(code);
  await b.getByRole("button", { name: "Agregar" }).click();
  await expect(b.getByText(/Solicitud enviada/)).toBeVisible();
  await a.reload();
  await a.getByRole("button", { name: "Aceptar" }).click();
  await expect(a.getByRole("heading", { name: "Tus amistades" })).toBeVisible();
  await expect(a.locator("li", { hasText: "Amiga" }).first()).toBeVisible();
  // Logro de primera amistad, para las dos cuentas.
  for (const id of [A, B]) expect((await sql().query("select 1 from inventory where user_id = $1 and item_id = 'pz-primera-amistad'", [id])).length).toBe(1);

  const gemsA0 = (await profile(A)).gems;
  const boostsA0 = (await profile(A)).boosts;
  const gemsB0 = (await profile(B)).gems;
  const boostsB0 = (await profile(B)).boosts;
  const livesB0 = (await profile(B)).lives;
  const sends = [
    { kind: "letter", amount: 0, message: "¡Vas increíble! Sigue así." },
    { kind: "gems", amount: 4, message: "" },
    { kind: "boost", amount: 1, message: "" },
  ];
  for (const s of sends) {
    const k = key();
    const r1 = await api(a, "/api/gifts", { action: "send", to: B, key: k, ...s });
    const r2 = await api(a, "/api/gifts", { action: "send", to: B, key: k, ...s });
    expect(r1.ok).toBe(true);
    expect(r2.duplicate).toBe(true);
  }
  expect((await profile(A)).gems).toBe(gemsA0 - 4);
  expect((await profile(A)).boosts).toBe(boostsA0 - 1);
  // Envío animado desde la interfaz (carta).
  await a.goto("/amigos");
  await a.getByRole("button", { name: "Enviar regalo a Amiga" }).click();
  await a.getByLabel("Tu carta").fill("Nos vemos en la clasificación.");
  await a.getByRole("button", { name: "Enviar", exact: true }).click();
  await a.waitForTimeout(1200);
  await a.screenshot({ path: `${SHOTS}/pc_regalo-enviando.png` });
  await expect(a.getByRole("button", { name: "Seguir" })).toBeVisible({ timeout: 8000 });
  await a.getByRole("button", { name: "Seguir" }).click();

  // B abre los tres regalos de la API en su buzón (móvil) y agradece.
  await b.goto("/amigos");
  const ids = (await sql().query("select id, kind from gifts where to_user = $1 order by sent_at", [B])) as { id: string; kind: string }[];
  expect(ids).toHaveLength(4);
  for (const label of ["Carta de Prueba", "Gemas de Prueba", "Potenciador de Prueba"]) {
    await b.getByRole("button", { name: new RegExp(label) }).first().click();
    await b.waitForTimeout(1500);
    await b.screenshot({ path: `${SHOTS}/iphone_regalo-${label.split(" ")[0].toLowerCase()}-abriendo.png` });
    await expect(b.getByRole("button", { name: "Seguir" })).toBeVisible({ timeout: 8000 });
    await b.screenshot({ path: `${SHOTS}/iphone_regalo-${label.split(" ")[0].toLowerCase()}.png` });
    await b.getByRole("dialog").getByRole("button", { name: "¡Gracias!", exact: true }).click();
    await expect(b.getByRole("dialog").getByText("Agradeciste: ¡Gracias!")).toBeVisible();
    await b.getByRole("button", { name: "Seguir" }).click();
  }
  // Abrir de nuevo no vuelve a pagar.
  for (const g of ids) await api(b, "/api/gifts", { action: "open", id: g.id }); // la carta que quedaba sin abrir
  for (const g of ids) expect((await api(b, "/api/gifts", { action: "open", id: g.id })).first).toBe(false);
  const pb = await profile(B);
  expect(pb.gems).toBe(gemsB0 + 4);
  expect(pb.boosts).toBe(boostsB0 + 1);
  expect(pb.lives).toBe(Math.min(livesB0 + 1, 7));
  // Agradecer dos veces no cuenta.
  await api(b, "/api/gifts", { action: "thank", id: ids[0].id, thanks: "fiesta" });
  expect((await api(b, "/api/gifts", { action: "thank", id: ids[0].id, thanks: "abrazo" })).ok).toBe(false);
  // El remitente ve la reacción.
  await a.goto("/amigos");
  await expect(a.getByText("Amiga: ¡Gracias!").first()).toBeVisible();
  await a.screenshot({ path: `${SHOTS}/pc_amigos.png`, fullPage: true });
  await b.screenshot({ path: `${SHOTS}/iphone_amigos.png`, fullPage: true });
  await a.context().close();
  await b.context().close();
});

test("vidas: protección con gemas, pérdida sin bloquear y recuperación practicando", async ({ browser }) => {
  test.setTimeout(240_000);
  const page = await login(browser, TEST_EMAIL);
  await sql().query("update profiles set lives = 1, shield = 0, gems = 20 where user_id = $1", [A]);
  const k = key();
  expect((await api(page, "/api/shop", { action: "shield", key: k })).ok).toBe(true);
  await api(page, "/api/shop", { action: "shield", key: k });
  expect((await profile(A)).gems).toBe(15);
  const wrong = (n: number) => api(page, "/api/review", { itemId: ITEM, mode: "recog", grade: 1, correct: false, isNew: n === 0, attemptId: `e2e-life-${Date.now()}-${n}`, ctx: "lesson" });
  expect((await wrong(0)).life.change).toBe("shielded");
  expect((await wrong(1)).life.change).toBe("lost");
  const third = await wrong(2);
  expect(third.life.change).toBe("none");
  expect(third.life.lives).toBe(0);
  let gained = null;
  for (let n = 0; n < 8; n++) {
    const r = await api(page, "/api/review", { itemId: ITEM, mode: "recog", grade: 3, correct: true, attemptId: `e2e-prac-${Date.now()}-${n}`, kind: "self", ctx: "practice" });
    if (r.life) gained = r.life;
  }
  expect(gained?.change).toBe("gained");
  expect((await profile(A)).lives).toBe(1);
  for (const vp of [
    { name: "iphone", width: 390, height: 844 },
    { name: "pc", width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(vp);
    for (const path of ["/tienda", "/tienda?tab=vidas", "/tienda?tab=cofres", "/tienda?tab=movimientos", "/perfil", "/hoy"]) {
      await page.goto(path);
      await page.waitForTimeout(900);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${vp.name} ${path}`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: `${SHOTS}/${vp.name}${path.replace(/[/?=]/g, "_")}.png` });
    }
  }
  await page.context().close();
});
