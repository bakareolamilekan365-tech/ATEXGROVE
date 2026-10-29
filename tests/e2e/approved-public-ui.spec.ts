import { expect, test } from "@playwright/test";

test("public navigation leads to honest information pages", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Abuja");
  await page.getByRole("link", { name: "Privacy Policy" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Privacy Policy" })).toBeVisible();
  await expect(page.getByText("Under construction")).toBeVisible();
  const missing = await page.goto("/info/not-a-page");
  expect(missing?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("auth presentation keeps password managers and visibility control", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toHaveCount(0);
  const password = page.getByLabel("Password", { exact: true });
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show password" }).click();
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Hide password" }).click();
  await expect(password).toHaveAttribute("type", "password");
  await expect(page.getByRole("link", { name: /Back to home/ })).toBeVisible();
});

test("slow sign-in prevents duplicate submission and conflicting registration navigation", async ({ page }) => {
  let requests = 0;
  await page.route("**/auth/v1/token**", async (route) => {
    requests += 1;
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "invalid_grant", error_description: "Invalid login credentials" }) });
  });
  await page.goto("/login");
  await page.getByLabel("Email").fill("synthetic@example.test");
  await page.getByLabel("Password", { exact: true }).fill("not-a-real-password");
  const submit = page.getByRole("button", { name: "Sign in" });
  await submit.dblclick();
  await expect(page.getByRole("button", { name: "Signing in..." })).toBeDisabled();
  await expect(page.getByRole("link", { name: "Create account" })).toHaveAttribute("aria-disabled", "true");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("alert")).toBeVisible();
  expect(requests).toBe(1);
});

test("theme starts light, respects manual choices and follows the device only in System mode", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Switch to dark appearance" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light appearance" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.mouse.move(0, 0);
  await expect(page.getByRole("button", { name: "Switch to dark appearance" })).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.evaluate(() => { localStorage.setItem("atexgrove-theme", "system"); window.dispatchEvent(new Event("storage")); });
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("mobile public page has no horizontal overflow and respects reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Log in", exact: true }).first()).toBeVisible();
  const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(size.scroll).toBeLessThanOrEqual(size.viewport);
  const animation = await page.locator(".feature-card").first().evaluate((element) => getComputedStyle(element).animationDuration);
  expect(animation).not.toBe("0.55s");
});

test("landing content reveals on scroll without hiding essential content before JavaScript", async ({ page }) => {
  await page.goto("/");
  const workflow = page.locator("#how-it-works .scroll-reveal");
  await workflow.scrollIntoViewIfNeeded();
  await expect(workflow).toHaveClass(/scroll-reveal--visible/);
  await expect(workflow.getByRole("heading", { name: "Start and review a request" })).toBeVisible();
});
