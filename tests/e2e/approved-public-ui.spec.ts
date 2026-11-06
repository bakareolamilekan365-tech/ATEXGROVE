import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";
import { tmpdir } from "node:os";

const evidencePath = (name: string) => join(tmpdir(), `atexgrove-pr33-${name}.png`);

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

test("shared auth background stays decorative and forms remain usable at mobile and desktop widths", async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/login", "/register", "/forgot-password", "/update-password"]) {
      await page.goto(route);
      await expect(page.locator(".form-card")).toBeVisible();
      const background = await page.locator(".auth-page").evaluate((element) => {
        const decoration = getComputedStyle(element, "::before");
        return { image: decoration.backgroundImage, blur: decoration.filter };
      });
      expect(background.image).toContain("atexgrove-built-environment-hero.webp");
      expect(background.blur).toContain("blur(");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  }

  await page.evaluate(() => localStorage.setItem("atexgrove-theme", "dark"));
  await page.goto("/login");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".form-card")).toBeVisible();
});

async function verifySlowSignIn(page: Page, registrationEnabled: boolean) {
  let requests = 0;
  await page.route("**/auth/v1/token**", async (route) => {
    requests += 1;
    await new Promise((resolve) => setTimeout(resolve, 600));
    await route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "invalid_grant", error_description: "Invalid login credentials" }) });
  });
  await page.goto("/login");
  const createAccount = page.getByRole("link", { name: "Create account" });
  if (registrationEnabled) await expect(createAccount).toBeVisible();
  else await expect(createAccount).toHaveCount(0);
  await page.getByLabel("Email").fill("synthetic@example.test");
  await page.getByLabel("Password", { exact: true }).fill("not-a-real-password");
  const submit = page.getByRole("button", { name: "Sign in" });
  await submit.dblclick();
  await expect(page.getByRole("button", { name: "Signing in..." })).toBeDisabled();
  if (registrationEnabled) {
    await expect(createAccount).toHaveAttribute("aria-disabled", "true");
  } else {
    await expect(createAccount).toHaveCount(0);
  }
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("alert")).toBeVisible();
  expect(requests).toBe(1);
}

test("slow sign-in with public registration prevents duplicate submission and conflicting navigation", async ({ page }) => {
  test.skip(process.env.E2E_REGISTRATION_ENABLED === "false", "Run with public registration enabled.");
  await verifySlowSignIn(page, true);
});

test("slow sign-in in restricted preview prevents duplicate submission", async ({ page }) => {
  test.skip(process.env.E2E_REGISTRATION_ENABLED !== "false", "Run with E2E_REGISTRATION_ENABLED=false and restricted preview.");
  await verifySlowSignIn(page, false);
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

test("compact mobile navigation, scroll header and error styling work without layout overflow", async ({ page }) => {
  page.on("pageerror", (error) => console.error(`Public-page client error: ${error.message}`));
  for (const width of [320, 360, 390, 428, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Abuja");
    const menu = page.getByRole("button", { name: "Menu" });
    await expect(menu).toBeVisible();
    if (width === 390) await page.screenshot({ path: evidencePath("landing-hero-390"), fullPage: false });
    await menu.click();
    if (width === 390) await page.screenshot({ path: evidencePath("mobile-navigation-open-390"), fullPage: false });
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    const navigation = page.getByRole("navigation", { name: "Main navigation" });
    await expect(navigation.getByRole("link", { name: "Home" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await menu.click();
    await page.mouse.click(5, 830);
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) {
      await page.screenshot({ path: evidencePath("mobile-navigation-390"), fullPage: false });
      await page.getByRole("button", { name: "Switch to dark appearance" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await page.screenshot({ path: evidencePath("mobile-dark-390"), fullPage: false });
      await page.emulateMedia({ reducedMotion: "reduce" });
      const transition = await page.locator(".theme-toggle").evaluate((element) => getComputedStyle(element).transitionDuration);
      expect(parseFloat(transition)).toBeLessThanOrEqual(0.001);
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.getByRole("button", { name: "Switch to light appearance" }).click();
    }
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.screenshot({ path: evidencePath("landing-hero-1440"), fullPage: false });
  await expect(page.locator(".site-header")).not.toHaveClass(/site-header--scrolled/);
  await page.locator("#how-it-works").scrollIntoViewIfNeeded();
  await expect(page.locator(".site-header")).toHaveClass(/site-header--scrolled/);
  await page.screenshot({ path: evidencePath("scrolled-header-1440"), fullPage: false });
  await page.locator(".landing-section--photo").scrollIntoViewIfNeeded();
  await expect(page.locator(".boundary-grid")).toHaveClass(/scroll-reveal--visible/);
  await expect.poll(() => page.locator(".boundary-grid").evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
  await page.screenshot({ path: evidencePath("supporting-section-1440"), fullPage: false });
  const boundaryImage = await page.locator(".landing-section--photo").evaluate((element) => getComputedStyle(element, "::before").backgroundImage);
  expect(boundaryImage).toContain("atexgrove-built-environment-triptych.webp");
});

test("unknown public page uses the branded 404 state", async ({ page }) => {
  await page.goto("/info/not-a-page", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".problem-mark")).toBeVisible();
  await page.screenshot({ path: evidencePath("branded-404-1440"), fullPage: false });
});

test("invalid login shows a restrained alert without provider text", async ({ page }) => {
  await page.route("**/auth/v1/token**", (route) => route.fulfill({ status: 400, contentType: "application/json", body: JSON.stringify({ error: "invalid_grant", error_description: "Invalid login credentials" }) }));
  await page.goto("/login");
  await page.getByLabel("Email").fill("synthetic@example.test");
  await page.getByLabel("Password", { exact: true }).fill("incorrect-placeholder");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".auth-form [role='alert']")).toContainText("Incorrect email or password. Please try again.");
  await page.screenshot({ path: evidencePath("login-error-1440"), fullPage: false });
});

test("landing content reveals on scroll without hiding essential content before JavaScript", async ({ page }) => {
  await page.goto("/");
  const workflow = page.locator("#how-it-works .scroll-reveal");
  await workflow.scrollIntoViewIfNeeded();
  await expect(workflow).toHaveClass(/scroll-reveal--visible/);
  await expect(workflow.getByRole("heading", { name: "Start and review a request" })).toBeVisible();
});
