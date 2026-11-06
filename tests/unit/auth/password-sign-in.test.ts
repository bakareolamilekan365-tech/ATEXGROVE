import { describe, expect, it, vi } from "vitest";
import { signInErrorMessage, signInWithFreshNavigation } from "@/lib/auth/password-sign-in";

describe("signInWithFreshNavigation", () => {
  it("performs one fresh navigation to a safe next destination after successful sign-in", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });
    const navigate = vi.fn();

    await expect(
      signInWithFreshNavigation(
        { signInWithPassword },
        { email: "demo@example.test", password: "test-password" },
        "/ops/cases?status=assigned",
        navigate,
      ),
    ).resolves.toEqual({ destination: "/ops/cases?status=assigned", error: null });

    expect(signInWithPassword).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/ops/cases?status=assigned");
  });

  it("does not navigate after failed sign-in", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    const navigate = vi.fn();

    await expect(
      signInWithFreshNavigation(
        { signInWithPassword },
        { email: "demo@example.test", password: "wrong-password" },
        "/dashboard",
        navigate,
      ),
    ).resolves.toEqual({ destination: null, error: "Incorrect email or password. Please try again." });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("reports a navigation failure instead of leaving the form indefinitely busy", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ error: null });

    const result = await signInWithFreshNavigation(
      { signInWithPassword },
      { email: "demo@example.test", password: "test-password" },
      "/dashboard",
      () => {
        throw new Error("navigation blocked");
      },
    );

    expect(result.error).toContain("next page could not be opened");
    expect(result.destination).toBeNull();
  });
});

describe("signInErrorMessage", () => {
  it("does not reveal whether an email exists", () => {
    expect(signInErrorMessage({ message: "Invalid login credentials", status: 400 })).toBe("Incorrect email or password. Please try again.");
  });
  it("keeps rate limits, unverified email and connectivity distinct", () => {
    expect(signInErrorMessage({ message: "rate limited", status: 429 })).toContain("Too many attempts");
    expect(signInErrorMessage({ message: "Email not confirmed", status: 400 })).toContain("verify your email");
    expect(signInErrorMessage({ message: "Failed to fetch" })).toContain("could not connect");
  });
  it("does not expose unknown provider details", () => {
    expect(signInErrorMessage({ message: "internal token: private" })).not.toContain("private");
  });
});
