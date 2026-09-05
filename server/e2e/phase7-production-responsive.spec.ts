import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

const uiBaseUrl = process.env.UI_BASE_URL;
const uiQuery = process.env.UI_BASE_QUERY || "";
const password = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-E2E-A";
const roles = {
  teacher: "teacher.e2e.a@example.com",
  student: "student.e2e.a1@example.com",
  parent: "parent.e2e.a@example.com",
} as const;
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 768, height: 900 },
  { name: "mobile", width: 390, height: 844 },
] as const;
const routesByRole = {
  teacher: ["/dashboard", "/teacher-workspace", "/teacher-homework", "/portal-timetable", "/portal-notices"],
  student: ["/dashboard", "/student-workspace", "/portal-attendance", "/portal-results", "/portal-fees", "/portal-timetable", "/portal-notices"],
  parent: ["/dashboard", "/parent-workspace", "/portal-attendance", "/portal-results", "/portal-fees", "/portal-timetable", "/portal-notices"],
} as const;

function uiUrl(path: string): string {
  return `${uiBaseUrl}${path}${uiQuery}`;
}

test.describe("Phase 7 authenticated responsive browser acceptance", () => {
  test.skip(!uiBaseUrl || !password, "UI_BASE_URL and E2E_FIXTURE_PASSWORD are required");
  test.describe.configure({ mode: "serial" });

  async function login(page: Page, email: string) {
    await page.goto(uiUrl("/login"), { waitUntil: "domcontentloaded" });
    await page.getByLabel("School Code (optional for Super Admin)").fill(schoolCode);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/dashboard(?:\?.*)?$/, { timeout: 20_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  }

  async function navigateSpa(page: Page, route: string) {
    await page.evaluate((path) => {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, route);
    await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), { timeout: 15_000 });
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
  }

  async function assertOverflow(page: Page) {
    const result = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(result.scrollWidth, `horizontal overflow: ${JSON.stringify(result)}`).toBeLessThanOrEqual(result.width + 1);
  }

  async function assertFocus(page: Page) {
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    let visibleFocus = false;
    for (let i = 0; i < 30; i += 1) {
      await page.keyboard.press("Tab");
      visibleFocus = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || active === document.body) return false;
        const rect = active.getBoundingClientRect();
        const style = getComputedStyle(active);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      });
      if (visibleFocus) break;
    }
    expect(visibleFocus).toBe(true);
  }

  async function authenticatedContext(browser: Browser, email: string): Promise<BrowserContext> {
    const context = await browser.newContext({ viewport: viewports[0] });
    await login(await context.newPage(), email);
    return context;
  }

  for (const [role, email] of Object.entries(roles) as Array<[keyof typeof roles, string]>) {
    test(`${role} remains usable at all required viewports`, async ({ browser }) => {
      const context = await authenticatedContext(browser, email);
      const page = context.pages()[0];
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const route of routesByRole[role]) {
          await navigateSpa(page, route);
          await expect(page.locator("body")).not.toContainText("Application error");
          await assertOverflow(page);
        }
        await assertFocus(page);
      }
      await page.evaluate(() => {
        window.history.pushState({}, "", "/exams");
        window.dispatchEvent(new PopStateEvent("popstate"));
      });
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
      await context.close();
    });
  }
});
