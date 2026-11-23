import { clerkSetup } from "@clerk/testing/playwright";
import { test as setup } from "@playwright/test";
import { ensureTestUser, resetTestData } from "./helpers";

setup("preparar Clerk y usuario de prueba", async () => {
  await clerkSetup();
  const id = await ensureTestUser();
  await resetTestData(id);
  process.env.E2E_USER_ID = id;
});
