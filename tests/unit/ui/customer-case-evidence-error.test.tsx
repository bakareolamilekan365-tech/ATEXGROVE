import { isValidElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({ evidenceFailure: true }));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));

const caseRow = {
  id: "11111111-1111-4111-8111-111111111111",
  customer_user_id: "22222222-2222-4222-8222-222222222222",
  workflow_status: "draft",
  discarded_at: null,
  case_number: null,
  area_name: "Garki",
  area_lga: "AMAC",
  area_is_listed: true,
  address_line: "Synthetic test address",
  is_demo_data: true,
  customer_intent: "buying",
  relationship_to_land: "buyer",
  acting_for: "self",
  authority_confirmed: false,
  principal_name: null,
  contact_preference: "email",
  created_at: "2026-11-06T10:00:00Z",
};

function query(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order"]) chain[method] = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => result);
  chain.then = (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: caseRow.customer_user_id } } }) },
    from: (table: string) => table === "verification_cases"
      ? query({ data: caseRow, error: null })
      : table === "case_status_events"
        ? query({ data: [], error: null })
        : query(fixture.evidenceFailure
          ? { data: null, error: { message: "synthetic evidence query failure" } }
          : { data: [], error: null }),
  }),
}));

function content(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(content).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return content(node.props.children);
  return "";
}

async function pageText() {
  const { default: CustomerCasePage } = await import("@/app/dashboard/cases/[id]/page");
  return content(await CustomerCasePage({ params: Promise.resolve({ id: caseRow.id }), searchParams: Promise.resolve({}) }));
}

describe("customer evidence history", () => {
  it("shows a recoverable error, not an empty history or upload checklist, when the evidence query fails", async () => {
    fixture.evidenceFailure = true;
    const text = await pageText();
    expect(text).toContain("We could not load your documents. Your files have not been changed.");
    expect(text).toContain("Retry loading documents");
    expect(text).not.toContain("No documents added.");
    expect(text).not.toContain("Document checklist");
    expect(text).not.toContain("Document history (0/10)");
  });

  it("shows the empty state only when the evidence query succeeds with no documents", async () => {
    fixture.evidenceFailure = false;
    const text = await pageText();
    expect(text).toContain("No documents added.");
    expect(text).toContain("Document checklist");
    expect(text).not.toContain("We could not load your documents.");
  });
});
