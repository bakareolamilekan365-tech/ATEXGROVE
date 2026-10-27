import { describe, expect, it, vi } from "vitest";
import { signInWithFreshNavigation } from "@/lib/auth/password-sign-in";

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
    ).resolves.toEqual({ destination: null, error: "Invalid login credentials" });
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
