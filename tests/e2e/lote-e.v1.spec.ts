import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ensureTestUser, GUEST_EMAIL, sql, TEST_EMAIL } from "./helpers";
import { PRICE } from "../../src/lib/wardrobe";

/** Lote E (base de desarrollo): temáticas legendarias y fondos. */
let ownerId = "";
test.beforeAll(async () => {
  await clerkSetup();
  ownerId = await ensureTestUser();
  await sql().query("insert into profiles (user_id, name, onboarded_at, level) values ($1, 'Prueba', now(), 'B1') on conflict (user_id) do update set onboarded_at = coalesce(profiles.onboarded_at, now())", [ownerId]);
});
async function login(page: Page, email: string) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: email });
}

test("propietario: aplica una temática (todas desbloqueadas) y se mantiene al recargar", async ({ page }) => {
  test.setTimeout(150_000);
  await login(page, TEST_EMAIL);
  await page.goto("/tienda?tab=temas");
  await expect(page.getByText("Tienes todas desbloqueadas.")).toBeVisible();
  const card = page.locator("li", { hasText: "Halloween" }).first();
  await card.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-pack", "halloween");
  await page.goto("/hoy");
  await expect(page.locator("html")).toHaveAttribute("data-theme-pack", "halloween");
  // Quitarla deja la app como siempre.
  await page.goto("/tienda?tab=temas");
  await page.locator("li", { hasText: "Halloween" }).first().getByRole("button", { name: /En uso/ }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme-pack", /.+/);
});

test("miembro: sin comprarla no puede aplicar una temática; compra un fondo y lo usa", async ({ page }) => {
  test.setTimeout(150_000);
  const q = sql();
  const g = await ensureTestUser(GUEST_EMAIL);
  await q.query("delete from members where email = $1 or user_id = $2", [GUEST_EMAIL, g]);
  await q.query("insert into members (email, user_id, status, activated_at) values ($1, $2, 'active', now())", [GUEST_EMAIL, g]);
  await q.query("delete from member_perks where user_id = $1", [g]);
  await q.query("delete from inventory where user_id = $1 and (item_id like 'theme-%' or item_id like 'bg-%')", [g]);
  await q.query("insert into profiles (user_id, name, onboarded_at, gems) values ($1, 'Invitada', now(), 500) on conflict (user_id) do update set onboarded_at = coalesce(profiles.onboarded_at, now()), gems = 500, settings = profiles.settings - 'themePack' - 'background'", [g]);
  try {
    await login(page, GUEST_EMAIL);
    const denied = await page.request.post("/api/shop", { data: { action: "appearance", themePack: "neon" } });
    expect(denied.status()).toBe(403);
    await page.goto("/tienda?tab=temas");
    await page.getByRole("button", { name: `Comprar fondo Rincón de café por ${PRICE[0]} gemas` }).click();
    await expect(page.getByText(/Fondo Rincón de café es tuya/)).toBeVisible();
    await page.locator("li", { hasText: "Rincón de café" }).first().getByRole("button", { name: "Usar" }).click();
    await expect(page.locator("li", { hasText: "Rincón de café" }).first().getByRole("button", { name: /En uso/ })).toBeVisible();
    const [p] = await q.query("select gems, settings->>'background' as bg from profiles where user_id = $1", [g]);
    expect(p.gems).toBe(500 - PRICE[0]);
    expect(p.bg).toBe("cafe");
  } finally {
    await q.query("delete from members where email = $1 or user_id = $2", [GUEST_EMAIL, g]);
  }
});
