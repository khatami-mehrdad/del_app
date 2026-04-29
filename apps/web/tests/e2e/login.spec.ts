import { expect, test } from "@playwright/test";

test("root shows the sign-in form without a redirect splash", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Del" })).toBeVisible();
  await expect(page.getByText("Coach Dashboard")).toBeVisible();
  await expect(page.getByPlaceholder("Email")).toBeVisible();
  await expect(page.getByPlaceholder("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  await expect(page.getByText("Redirecting to sign in")).toHaveCount(0);
});

test("invalid sign-in recovers and shows an error", async ({ page }) => {
  await page.route("**/auth/v1/token?grant_type=password", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ error_description: "Invalid login credentials" }),
    });
  });

  await page.goto("/login");

  await page.getByPlaceholder("Email").fill("nobody@example.com");
  await page.getByPlaceholder("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("button", { name: "Sign in" })).toBeEnabled({
    timeout: 15_000,
  });
  await expect(page.getByText(/invalid|credential|failed/i)).toBeVisible();
});

test("public support pages render", async ({ page }) => {
  for (const path of ["/forgot-password", "/privacy", "/delete-account"]) {
    await page.goto(path);
    await expect(page.locator("body")).toContainText(/Del|privacy|delete|reset/i);
  }
});
