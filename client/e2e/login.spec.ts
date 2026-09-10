import { expect, test } from "@playwright/test";

const email = process.env.E2E_ADMIN_EMAIL || "admin@school.com";
const password = process.env.DEMO_ADMIN_PASSWORD?.replace(/^([\"'])(.*)\1$/, "$2");

test.describe("authentication", () => {
  test("platform admin can sign in from the local login page", async ({ page }) => {
    test.skip(!password, "DEMO_ADMIN_PASSWORD is required for the local authenticated E2E test");

    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password!);

    const loginResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/v1/auth/login") && response.request().method() === "POST",
    );

    await page.getByRole("button", { name: "Sign in" }).click();

    const loginResponse = await loginResponsePromise;
    expect(loginResponse.status()).toBe(200);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByText(/Good to see you|Overview/).first()).toBeVisible();
  });
});
