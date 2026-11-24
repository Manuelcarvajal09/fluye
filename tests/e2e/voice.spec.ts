import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test, type Page } from "@playwright/test";
import { TEST_EMAIL } from "./helpers";

async function signIn(page: Page) {
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });
  // Deja la cuenta lista (sin depender de otros tests): perfil creado y bienvenida terminada.
  const r = await page.request.post("/api/profile", { data: { onboarded: true, level: "B1", topics: ["conversacion", "series"] } });
  expect(r.ok()).toBe(true);
}

test.describe("voz, dictado y personalización", () => {
  test.beforeEach(async ({ page }) => {
    // Registra cada reproducción de audio de la app (el elemento no está en el DOM).
    await page.addInitScript(() => {
      const w = window as unknown as { __plays: { src: string }[] };
      w.__plays = [];
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        w.__plays.push({ src: this.src.slice(0, 5) });
        return play.call(this);
      };
    });
  });

  test("las voces HD salen de los paquetes pre-generados (petición Range) y se reproducen", async ({ page }) => {
    await signIn(page);
    await page.goto("/ajustes");
    const bin = page.waitForResponse((r) => /\/audio\/af_heart-.*\.bin/.test(r.url()));
    await page.getByRole("button", { name: "Probar la voz Heart" }).click();
    const res = await bin;
    expect([200, 206]).toContain(res.status());
    await expect.poll(() => page.evaluate(() => (window as unknown as { __plays: { src: string }[] }).__plays.filter((p) => p.src === "blob:").length)).toBeGreaterThan(0);
  });

  test("dictado: graba, Whisper local transcribe y rellena la respuesta", async ({ page }) => {
    test.setTimeout(420_000);
    await signIn(page);
    await page.goto("/practicar/roleplay/rp-new-neighbour");
    const box = page.locator("#rp-answer");
    await page.getByRole("button", { name: "Hablar" }).click();
    await page.waitForTimeout(9000);
    await page.getByRole("button", { name: "Detener" }).click();
    await expect.poll(async () => (await box.inputValue()).toLowerCase(), { timeout: 360_000, intervals: [2000] }).toContain("forward");
  });

  test("personalizar mascota y color: se guarda y se pinta desde el servidor", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await signIn(page);
    await page.goto("/ajustes");
    await page.getByRole("radio", { name: /^Zorro/ }).click();
    await page.getByLabel("Nombre de tu compañero").fill("Chispa");
    await page.getByRole("radio", { name: /Océano/ }).click();
    // Accesorios combinables: uno de cabeza y uno de cara a la vez.
    await page.getByRole("tab", { name: "Cabeza" }).click();
    await page.getByRole("radio", { name: "Audífonos" }).click();
    await page.getByRole("tab", { name: "Cara" }).click();
    await page.getByRole("radio", { name: "Lentes" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-accent", "oceano");
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByRole("button", { name: /Guardado/ })).toBeVisible();
    await page.goto("/hoy");
    await expect(page.locator("html")).toHaveAttribute("data-accent", "oceano");
    await expect(page.getByRole("link", { name: /Chispa, tu compañero/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Tocar a Chispa/ })).toBeVisible();
  });
});
