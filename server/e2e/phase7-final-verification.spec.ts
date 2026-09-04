import { test, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";

const uiBaseUrl = process.env.UI_BASE_URL;
const apiBaseUrl = process.env.E2E_API_URL || "http://127.0.0.1:5000";
const password = process.env.E2E_FIXTURE_PASSWORD;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-E2E-A";

const ids = {
  studentA1: "67e000000000000000000051",
  studentA2: "67e000000000000000000052",
  studentB: "67e000000000000000000053",
};

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

test.describe("Phase 7 final authenticated acceptance", () => {
  test.skip(!uiBaseUrl || !password, "UI_BASE_URL and E2E_FIXTURE_PASSWORD are required");
  test.describe.configure({ mode: "serial" });

  async function login(page: Page, email: string) {
    let loginResponse: { url: string; status: number; body: string } | null = null;
    const listener = async (response: import("@playwright/test").Response) => {
      if (response.url().endsWith("/api/v1/auth/login")) loginResponse = { url: response.url(), status: response.status(), body: await response.text() };
    };
    page.on("response", listener);
    await page.goto(`${uiBaseUrl}/login`, { waitUntil: "domcontentloaded" });
    await page.getByLabel("School Code (optional for Super Admin)").fill(schoolCode);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password!);
    await page.getByRole("button", { name: "Sign In" }).click();
    try {
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
    } catch (error) {
      throw new Error(`${error instanceof Error ? error.message : String(error)}\nLogin response: ${JSON.stringify(loginResponse)}`);
    } finally {
      page.off("response", listener);
    }
    await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
    if (loginResponse && loginResponse.status >= 400) throw new Error(`Login API failed: HTTP ${loginResponse.status} ${loginResponse.body}`);
  }

  async function navigateSpa(page: Page, route: string) {
    await page.evaluate((path) => { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); }, route);
    await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), { timeout: 15_000 });
  }

  async function assertNoHorizontalOverflow(page: Page) {
    const overflow = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(overflow.scrollWidth, `horizontal overflow: ${JSON.stringify(overflow)}`).toBeLessThanOrEqual(overflow.viewport + 1);
  }

  async function assertKeyboardFocus(page: Page) {
    await page.locator("body").click({ position: { x: 5, y: 5 } });
    let found = false;
    for (let i = 0; i < 30; i += 1) {
      await page.keyboard.press("Tab");
      found = await page.evaluate(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || active === document.body) return false;
        const rect = active.getBoundingClientRect();
        const style = window.getComputedStyle(active);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      });
      if (found) break;
    }
    expect(found, "expected at least one visible keyboard-focusable target").toBe(true);
  }

  async function authenticatedContext(browser: Browser, email: string): Promise<BrowserContext> {
    const context = await browser.newContext({ viewport: viewports[0] });
    const page = await context.newPage();
    await login(page, email);
    return context;
  }

  for (const [role, email] of Object.entries(roles) as Array<[keyof typeof roles, string]>) {
    test(`${role}: desktop/tablet/mobile authenticated workflows`, async ({ browser }) => {
      const context = await authenticatedContext(browser, email);
      const page = context.pages()[0];
      const consoleErrors: string[] = [];
      page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        for (const route of routesByRole[role]) {
          await navigateSpa(page, route);
          await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
          await expect(page.locator("body")).not.toContainText("Application error");
          await assertNoHorizontalOverflow(page);
        }
        await assertKeyboardFocus(page);
      }

      await page.evaluate(() => { window.history.pushState({}, "", "/exams"); window.dispatchEvent(new PopStateEvent("popstate")); });
      await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
      expect(consoleErrors, `browser console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
      await context.close();
    });
  }

  test("parent can switch between both linked children and cannot select another tenant", async ({ browser }) => {
    const context = await authenticatedContext(browser, roles.parent);
    const page = context.pages()[0];
    await navigateSpa(page, "/parent-workspace");
    await expect(page.getByLabel("Choose a child")).toBeVisible({ timeout: 15_000 });
    const selector = page.getByLabel("Choose a child");
    await expect(selector.locator("option")).toHaveCount(2);
    await selector.selectOption(ids.studentA2);
    await expect(page).toHaveURL(new RegExp(`childId=${ids.studentA2}$`));
    await expect(page.locator("main")).toContainText("Anaya Fixture");
    const response = await page.request.get(`${apiBaseUrl}/api/v1/portal/parent/workspace?childId=${ids.studentB}`);
    expect([403, 404]).toContain(response.status());
    await context.close();
  });

  test("student self-scope, teacher assignment scope, and cross-tenant boundaries", async ({ browser }) => {
    const studentContext = await authenticatedContext(browser, roles.student);
    const studentPage = studentContext.pages()[0];
    const own = await studentPage.request.get(`${apiBaseUrl}/api/v1/students/${ids.studentA1}`);
    expect(own.status()).toBe(200);
    const sibling = await studentPage.request.get(`${apiBaseUrl}/api/v1/students/${ids.studentA2}`);
    expect([403, 404]).toContain(sibling.status());
    const foreign = await studentPage.request.get(`${apiBaseUrl}/api/v1/students/${ids.studentB}`);
    expect([403, 404]).toContain(foreign.status());
    await studentContext.close();

    const teacherContext = await authenticatedContext(browser, roles.teacher);
    const teacherPage = teacherContext.pages()[0];
    const assigned = await teacherPage.request.get(`${apiBaseUrl}/api/v1/students/${ids.studentA1}`);
    expect(assigned.status()).toBe(200);
    const foreignTeacher = await teacherPage.request.get(`${apiBaseUrl}/api/v1/students/${ids.studentB}`);
    expect([403, 404]).toContain(foreignTeacher.status());
    await teacherContext.close();
  });
});
