import { test, expect } from "@playwright/test";

const uiBaseUrl = process.env.UI_BASE_URL;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const password = process.env.E2E_FIXTURE_PASSWORD;
const roles = [
  { name: "principal", email: "principal.a@phase1.example.com", canManage: true },
  { name: "teacher", email: "teacher.a@phase1.example.com", canManage: true },
  { name: "student", email: "student.a@phase1.example.com", canManage: false },
  { name: "parent", email: "parent.a@phase1.example.com", canManage: false },
] as const;
const pages = [
  ["Homework", "/homework"],
  ["Notices", "/notices"],
  ["Timetable", "/timetable"],
] as const;

async function login(page: any, email: string) {
  await page.goto(`${uiBaseUrl}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("School Code (optional for Super Admin)").fill(schoolCode);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 });
  await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
}

function attachDiagnostics(page: any, consoleErrors: string[], failedRequests: string[]) {
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("Failed to load resource:")) consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || "failed"}`);
  });
}

test.describe("Phase 6 authenticated UI", () => {
  test.skip(!uiBaseUrl || !password, "UI_BASE_URL and E2E_FIXTURE_PASSWORD are required");

  for (const role of roles) {
    test(`${role.name} sees consistent Phase 6 pages`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await login(page, role.email);

      const consoleErrors: string[] = [];
      const failedRequests: string[] = [];
      attachDiagnostics(page, consoleErrors, failedRequests);

      for (const [name, route] of pages) {
        await page.goto(`${uiBaseUrl}${route}`, { waitUntil: "domcontentloaded" });
        await expect(page).toHaveURL(new RegExp(`${route.replace("/", "\\/")}$`), { timeout: 15_000 });
        await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
        await expect(page.locator("body")).not.toContainText("Application error");
        if (role.canManage && role.name === "principal") {
          if (name === "Homework") await expect(page.getByRole("button", { name: /Assign Homework/i })).toBeVisible();
          if (name === "Notices") await expect(page.getByRole("button", { name: /Create Notice/i })).toBeVisible();
          if (name === "Timetable") await expect(page.getByRole("button", { name: /Add Period/i })).toBeVisible();
        }
        if (!role.canManage) {
          await expect(page.getByRole("button", { name: /Assign Homework|Create Notice|Add Period/i })).toHaveCount(0);
        }
        await page.screenshot({ path: `test-results/phase6-${role.name}-${name.toLowerCase()}.png`, fullPage: true });
      }

      expect(consoleErrors, `${role.name} console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
      expect(failedRequests, `${role.name} failed requests:\n${failedRequests.join("\n")}`).toEqual([]);
      await context.close();
    });
  }

  test("principal Phase 6 pages remain usable on mobile and management dialogs open", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await login(page, roles[0].email);

    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    attachDiagnostics(page, consoleErrors, failedRequests);

    for (const [name, route] of pages) {
      await page.goto(`${uiBaseUrl}${route}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator("main")).toBeVisible({ timeout: 15_000 });
      const dimensions = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
      expect(dimensions.width, `${name} horizontal overflow`).toBeLessThanOrEqual(dimensions.viewport + 1);
      const buttonName = name === "Homework" ? /Assign Homework/i : name === "Notices" ? /Create Notice/i : /Add Period/i;
      await page.getByRole("button", { name: buttonName }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }

    expect(consoleErrors, `Mobile console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
    expect(failedRequests, `Mobile failed requests:\n${failedRequests.join("\n")}`).toEqual([]);
    await context.close();
  });
});
