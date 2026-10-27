import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const auth = vi.hoisted(() => ({
  getUser: vi.fn(),
  setAll: null as null | ((cookies: { name: string; value: string; options: { path: string } }[], headers: Record<string, string>) => void),
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: { cookies: { setAll: typeof auth.setAll } },
  ) => {
    auth.setAll = options.cookies.setAll;
    return { auth: { getUser: auth.getUser } };
  },
}));

import { updateSupabaseSession } from "@/lib/supabase/middleware";

describe("protected route after sign-out", () => {
  beforeEach(() => {
    auth.getUser.mockReset();
    auth.setAll = null;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("redirects a request without a session to login and prevents cached case data", async () => {
    auth.getUser.mockResolvedValue({ data: { user: null } });
    const response = await updateSupabaseSession(new NextRequest("https://example.test/dashboard/cases/123"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("preserves refreshed session cookies and cache headers on a redirect", async () => {
    auth.getUser.mockImplementation(async () => {
      auth.setAll?.(
        [{ name: "sb-session", value: "refreshed", options: { path: "/" } }],
        {
          "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
          Expires: "0",
          Pragma: "no-cache",
        },
      );
      return { data: { user: { id: "user-1" } } };
    });

    const response = await updateSupabaseSession(new NextRequest("https://example.test/login"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.test/dashboard");
    expect(response.cookies.get("sb-session")?.value).toBe("refreshed");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("pragma")).toBe("no-cache");
  });
});
