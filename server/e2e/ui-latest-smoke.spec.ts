import { test, expect } from "@playwright/test";

const uiBaseUrl = process.env.UI_BASE_URL;
const schoolCode = process.env.E2E_SCHOOL_A_CODE || "SCH-PHASE1-A";
const principalEmail = "principal.a@phase1.example.com";
const principalPassword = process.env.E2E_FIXTURE_PASSWORD;

const routes = [
  ["Dashboard", "/dashboard"],
  ["Students", "/students"],
  ["Teachers", "/teachers"],
  ["Classes", "/classes"],
  ["Attendance", "/attendance"],
  ["Exams & Results", "/exams"],
  ["Fees", "/fees"],
  ["Reports", "/reports"],
  ["Settings", "/settings"],
] as const;

test.describe("latest UI smoke", () => {
  test.skip(!uiBaseUrl || !principalPassword, "UI_BASE_URL and E2E_FIXTURE_PASSWORD are required");

  test("login, responsive shell, and primary routes", async ({ page }) => {
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];

    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("requestfailed", (request) => {
      failedRequests.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || "failed"}`);
    });

    await page.goto(`${uiBaseUrl}/login`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
    await page.getByLabel("School Code (optional for Super Admin)").fill(schoolCode);
    await page.getByLabel("Email").fill(principalEmail);
    await page.getByLabel("Password").fill(principalPassword);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("main")).toBeVisible();

    for (const [name, route] of routes) {
      await page.goto(`${uiBaseUrl}${route}`, { waitUntil: "networkidle" });
      await expect(page).toHaveURL(new RegExp(`${route.replace("/", "\\/")}$`));
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.locator("body")).not.toContainText("Application error");
      await page.screenshot({ path: `test-results/ui-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`, fullPage: true });
    }

    expect(consoleErrors, `Browser console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
    expect(failedRequests, `Failed network requests:\n${failedRequests.join("\n")}`).toEqual([]);
  });

  test("mobile navigation shell remains usable", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${uiBaseUrl}/login`, { waitUntil: "networkidle" });
    await page.getByLabel("School Code (optional for Super Admin)").fill(schoolCode);
    await page.getByLabel("Email").fill(principalEmail);
    await page.getByLabel("Password").fill(principalPassword);
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    const menuButton = page.getByRole("button", { name: /open menu|menu/i }).first();
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.getByRole("navigation")).toBeVisible();
    await page.getByRole("link", { name: "Exams & Results" }).click();
    await expect(page).toHaveURL(/\/exams$/);
    await expect(page.getByRole("main")).toBeVisible();
  });
});
