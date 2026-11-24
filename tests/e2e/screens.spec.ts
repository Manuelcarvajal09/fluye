import { clerk, clerkSetup, setupClerkTestingToken } from "@clerk/testing/playwright";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { TEST_EMAIL } from "./helpers";

const VIEWPORTS = process.env.QUICK ? [{ name: "pc", width: 1440, height: 900 }] : [
  { name: "iphone", width: 390, height: 844 },
  { name: "ipad", width: 820, height: 1180 },
  { name: "ipad-h", width: 1180, height: 820 },
  { name: "pc", width: 1440, height: 900 },
  { name: "ultrawide-29", width: 2560, height: 1080 },
  { name: "ultrawide-34", width: 3440, height: 1440 },
];
const PAGES = ["/hoy", "/biblioteca/colecciones", "/biblioteca/palabras", "/repaso?adelantar=1", "/explorar", "/rutas", "/rutas/cafe", "/perfil", "/tienda", "/admin", "/musica", "/biblioteca?tag=real", "/sesion?mision=cafe-a&min=15", "/repaso", "/biblioteca", "/biblioteca/pv-give-up", "/sonidos", "/sonidos/snd-th-voiceless", "/progreso", "/ajustes", "/sesion?min=5", "/practicar", "/practicar/test", "/practicar/roleplay/rp-new-neighbour", "/practicar/gramatica/gr-present-simple", "/practicar/corrige", "/biblioteca?tag=tv", "/biblioteca/con-wanna"];

test.beforeAll(async () => {
  await clerkSetup();
});

test("pantallas responsive sin desbordes y sin violaciones graves de accesibilidad", async ({ page }) => {
  test.setTimeout(900_000);
  await setupClerkTestingToken({ page });
  await page.goto("/");
  await clerk.signIn({ page, emailAddress: TEST_EMAIL });
  const problems: string[] = [];
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const path of PAGES) {
      if (vp.name.startsWith("ultrawide") && path.startsWith("/sonidos/")) continue;
      await page.goto(path);
      await page.waitForLoadState("load");
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (overflow > 1) problems.push(`${vp.name} ${path}: desborde horizontal de ${overflow}px`);
      const slug = path.replace(/[/?=]/g, "_");
      await page.screenshot({ path: `test-results/screens/${vp.name}${slug}.png`, fullPage: false });
      if (vp.name === "iphone" || vp.name === "pc") {
        for (const theme of ["light", "dark"]) {
          await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
          await page.waitForTimeout(900); // deja terminar las transiciones de color
          const axe = await new AxeBuilder({ page }).exclude(".cl-rootBox").exclude("[data-clerk-component]").withTags(["wcag2a", "wcag2aa"]).analyze();
          for (const v of axe.violations.filter((v) => v.impact === "critical" || v.impact === "serious"))
            problems.push(`${vp.name} ${theme} ${path}: ${v.id} (${v.nodes.length}) ${v.nodes[0]?.target.join(" ")} :: ${(v.nodes[0]?.failureSummary ?? "").replace(/\s+/g, " ").slice(0, 220)}`);
        }
        await page.evaluate(() => (document.documentElement.dataset.theme = "light"));
      }
    }
  }
  console.log(problems.join("\n") || "sin problemas");
  expect(problems).toEqual([]);
});
