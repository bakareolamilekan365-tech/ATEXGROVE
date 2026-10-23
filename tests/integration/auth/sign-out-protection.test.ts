import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getUser = vi.hoisted(() => vi.fn());
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: { getUser } }),
}));

import { updateSupabaseSession } from "@/lib/supabase/middleware";

describe("protected route after sign-out", () => {
  beforeEach(() => {
    getUser.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  it("redirects a request without a session to login and prevents cached case data", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const response = await updateSupabaseSession(new NextRequest("https://example.test/dashboard/cases/123"));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
