import { expect, test, type Page } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL || "admin@school.com";
const password = process.env.DEMO_ADMIN_PASSWORD?.replace(/^(\"|')(.*)\1$/, "$2");

const adminRoutes = [
  "/dashboard",
  "/students",
  "/attendance",
  "/timetable",
  "/fees",
  "/teachers",
  "/classes",
  "/exams",
  "/operations",
  "/reports",
  "/settings",
  "/staff",
] as const;

async function signIn(page: Page) {
  test.skip(!password, "DEMO_ADMIN_PASSWORD is required for authenticated E2E tests");
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password!);
  const loginResponse = page.waitForResponse(
    (response) => response.url().includes("/api/v1/auth/login") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in" }).click();
  expect((await loginResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function exerciseRoutes(page: Page) {
  const pageErrors: string[] = [];
  const serverErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.status() >= 500) serverErrors.push(`${response.status()} ${response.request().method()} ${response.url()}`);
  });

  for (const route of adminRoutes) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`${route.replace("/", "\\/")}$`));
    await expect(page.locator("main").first()).toBeVisible();
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth, `horizontal overflow on ${route}`).toBeLessThanOrEqual(viewportWidth + 1);
  }

  expect(pageErrors, "uncaught browser errors").toEqual([]);
  expect(serverErrors, "server 5xx responses").toEqual([]);
}

test.describe("flagship authenticated route smoke", () => {
  test("admin can open core management surfaces without runtime failures", async ({ page }) => {
    await signIn(page);
    await exerciseRoutes(page);
  });

  test("core management surfaces remain usable at mobile width", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);
    await exerciseRoutes(page);
  });
});
