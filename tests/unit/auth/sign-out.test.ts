import { beforeEach, describe, expect, it, vi } from "vitest";

const { signOut, requireAuthenticatedUser, redirect } = vi.hoisted(() => ({
  signOut: vi.fn(),
  requireAuthenticatedUser: vi.fn(),
  redirect: vi.fn(),
}));
vi.mock("@/lib/auth/guards", () => ({ requireAuthenticatedUser }));
vi.mock("next/navigation", () => ({ redirect }));

import { signOutAction } from "@/app/actions";

describe("local sign-out", () => {
  beforeEach(() => {
    signOut.mockReset();
    requireAuthenticatedUser.mockReset();
    redirect.mockReset();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  it("clears the local session and redirects to login", async () => {
    signOut.mockResolvedValue({ error: null });
    requireAuthenticatedUser.mockResolvedValue({ supabase: { auth: { signOut } } });
    redirect.mockImplementation(() => { throw new Error("redirect:/login"); });
    await expect(signOutAction()).rejects.toThrow("redirect:/login");
    expect(signOut).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(redirect).toHaveBeenCalledWith("/login");
  });

  it("does not claim sign-out succeeded when clearing the session fails", async () => {
    signOut.mockResolvedValue({ error: { message: "network failure" } });
    requireAuthenticatedUser.mockResolvedValue({ supabase: { auth: { signOut } } });
    redirect.mockImplementation((destination: string) => { throw new Error(`redirect:${destination}`); });
    await expect(signOutAction()).rejects.toThrow("redirect:/dashboard?signout=failed");
    expect(redirect).not.toHaveBeenCalledWith("/login");
  });
});
