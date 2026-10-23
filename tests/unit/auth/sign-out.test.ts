import { describe, expect, it, vi } from "vitest";

const { signOut, requireAuthenticatedUser, redirect } = vi.hoisted(() => ({
  signOut: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@/lib/auth/guards", () => ({ requireAuthenticatedUser }));
vi.mock("next/navigation", () => ({ redirect }));

import { signOutAction } from "@/app/actions";

describe("local sign-out", () => {
  it("clears the local session and redirects to login", async () => {
    signOut.mockResolvedValue({ error: null });
    requireAuthenticatedUser.mockResolvedValue({ supabase: { auth: { signOut } } });
    redirect.mockImplementation(() => { throw new Error("redirect:/login"); });
    await expect(signOutAction()).rejects.toThrow("redirect:/login");
    expect(signOut).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(redirect).toHaveBeenCalledWith("/login");
  });
});
