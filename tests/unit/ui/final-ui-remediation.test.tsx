import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createElement, isValidElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({ casesError: false, activityError: false, isLead: true, profileName: null as string | null }));

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const caseRow = {
  id: "11111111-1111-4111-8111-111111111111",
  case_number: "ATX-LV-2026-000001",
  workflow_status: "submitted",
  department: "Verification",
  area_name: "Garki",
  area_lga: "AMAC",
  site_description: "Synthetic test site description",
  is_demo_data: true,
};

function query(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "is", "neq", "in", "order", "limit"]) chain[method] = vi.fn(() => chain);
  chain.maybeSingle = vi.fn(async () => result);
  chain.then = (resolveResult: (value: typeof result) => unknown) => Promise.resolve(result).then(resolveResult);
  return chain;
}

function server() {
  return {
    auth: { getUser: async () => ({ data: { user: { id: "22222222-2222-4222-8222-222222222222" } } }) },
    from: (table: string) => table === "profiles"
      ? query({ data: fixture.profileName ? { full_name: fixture.profileName } : null, error: null })
      : table === "verification_cases"
        ? query({ data: fixture.casesError ? null : [caseRow], error: fixture.casesError ? { message: "synthetic query error" } : null })
        : query({ data: fixture.activityError ? null : [], error: fixture.activityError ? { message: "synthetic activity error" } : null }),
  };
}

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => server() }));
vi.mock("@/lib/auth/guards", () => ({
  AuthorizationError: class AuthorizationError extends Error {},
  requireStaff: async () => ({
    supabase: server(),
    staff: { user_id: "33333333-3333-4333-8333-333333333333", department: "Verification", is_lead: fixture.isLead },
  }),
}));

function content(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(content).join(" ");
  if (isValidElement<{ children?: ReactNode }>(node)) return content(node.props.children);
  return "";
}

describe("final UI remediation", () => {
  it("personalizes the welcome from the authorized profile without inventing case metrics", async () => {
    const { default: DashboardPage } = await import("@/app/dashboard/page");
    fixture.profileName = "Ola Bakare";
    fixture.casesError = false;
    const dashboard = content(await DashboardPage({ searchParams: Promise.resolve({}) }));
    expect(dashboard).toMatch(/Welcome\s*, Ola/);
    expect(dashboard).toContain("OB");
    expect(dashboard).toContain("1 request is currently in progress.");
    fixture.profileName = null;
  });
  it("does not present failed dashboard queries as successful empty states", async () => {
    const { default: DashboardPage } = await import("@/app/dashboard/page");
    fixture.casesError = true;
    fixture.activityError = false;
    const failedCases = content(await DashboardPage({ searchParams: Promise.resolve({}) }));
    expect(failedCases).toContain("We could not load your case summary. Refresh to try again.");
    expect(failedCases).not.toContain("You have no saved drafts.");
    expect(failedCases).not.toContain("No customer-visible activity yet.");

    fixture.casesError = false;
    fixture.activityError = true;
    const failedActivity = content(await DashboardPage({ searchParams: Promise.resolve({}) }));
    expect(failedActivity).toContain("Recent activity could not be loaded. Refresh to try again.");
    expect(failedActivity).not.toContain("No customer-visible activity yet.");
  });

  it("offers the existing assignment page only as a lead-facing queue label", async () => {
    const { default: CaseQueuePage } = await import("@/app/ops/cases/page");
    fixture.casesError = false;
    fixture.activityError = false;
    fixture.isLead = true;
    const leadView = content(await CaseQueuePage({ searchParams: Promise.resolve({}) }));
    expect(leadView).toContain("Assign case");

    fixture.isLead = false;
    const staffView = content(await CaseQueuePage({ searchParams: Promise.resolve({}) }));
    expect(staffView).toContain("Open case");
    expect(staffView).not.toContain("Assign case");

    fixture.casesError = true;
    const failedQueue = content(await CaseQueuePage({ searchParams: Promise.resolve({ status: "submitted" }) }));
    expect(failedQueue).toContain("The work queue could not be loaded.");
    expect(failedQueue).not.toContain("Showing 0 visible cases");
    fixture.casesError = false;
  });

  it("keeps the four-stage model while shortening only compact terminal presentation", async () => {
    const { CaseProgress } = await import("@/components/cases/CaseProgress");
    const compactClosed = renderToStaticMarkup(createElement(CaseProgress, { status: "closed", compact: true }));
    const compactCancelled = renderToStaticMarkup(createElement(CaseProgress, { status: "cancelled", compact: true }));
    const fullClosed = renderToStaticMarkup(createElement(CaseProgress, { status: "closed" }));
    expect(compactClosed).toContain("Closed does not confirm land verification.");
    expect(compactClosed).toContain("Reviewer assigned");
    expect(compactCancelled).not.toContain("This request was cancelled.");
    expect(fullClosed).toContain("This request has been closed.");
  });

  it("places phone consent before requesting the number without changing field names", () => {
    const source = readFileSync(resolve(process.cwd(), "src/components/cases/NewCaseForm.tsx"), "utf8");
    const consent = source.indexOf('id="contactPhoneConsent"');
    const phone = source.indexOf('id="contactPhone"');
    expect(consent).toBeGreaterThan(0);
    expect(phone).toBeGreaterThan(consent);
    expect(source).toContain('name="contactPhoneConsent"');
    expect(source).toContain('name="contactPhone"');
  });
});
