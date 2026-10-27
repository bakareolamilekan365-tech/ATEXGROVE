import { describe, expect, it } from "vitest";
import { navigateAfterAuth, safeInternalPath } from "@/lib/auth/redirect";

describe("safeInternalPath", () => {
  it("allows relative in-app paths, including query strings", () => {
    expect(safeInternalPath("/update-password")).toBe("/update-password");
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
    expect(safeInternalPath("/dashboard/cases")).toBe("/dashboard/cases");
    expect(safeInternalPath("/ops/cases")).toBe("/ops/cases");
    expect(safeInternalPath("/dashboard?tab=land#top")).toBe("/dashboard?tab=land#top");
    expect(safeInternalPath("/dashboard?query=100%25&return=%2Fdashboard%2Fcases")).toBe(
      "/dashboard?query=100%25&return=%2Fdashboard%2Fcases",
    );
  });

  it("falls back for empty values", () => {
    expect(safeInternalPath(null)).toBe("/dashboard");
    expect(safeInternalPath(undefined)).toBe("/dashboard");
    expect(safeInternalPath("")).toBe("/dashboard");
  });

  it("rejects external and protocol-relative redirects", () => {
    expect(safeInternalPath("https://example.com")).toBe("/dashboard");
    expect(safeInternalPath("http://example.com")).toBe("/dashboard");
    expect(safeInternalPath("//example.com")).toBe("/dashboard");
    expect(safeInternalPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("rejects literal and encoded backslash or control-character bypasses", () => {
    expect(safeInternalPath("/\\example.com")).toBe("/dashboard");
    expect(safeInternalPath("/%5cexample.com")).toBe("/dashboard");
    expect(safeInternalPath("/%255cexample.com")).toBe("/dashboard");
    expect(safeInternalPath("/%2fexample.com")).toBe("/dashboard");
    expect(safeInternalPath("/\t/example.com")).toBe("/dashboard");
    expect(safeInternalPath("/\n/example.com")).toBe("/dashboard");
    expect(safeInternalPath("/\r/example.com")).toBe("/dashboard");
    expect(safeInternalPath("/%0a/example.com")).toBe("/dashboard");
  });

  it("rejects malformed and ambiguous encoding", () => {
    expect(safeInternalPath("/%")).toBe("/dashboard");
    expect(safeInternalPath("/%E0%A4%A")).toBe("/dashboard");
    expect(safeInternalPath("/%252525252fexample.com")).toBe("/dashboard");
  });

  it("rejects login and logout loops after URL normalization", () => {
    expect(safeInternalPath("/login")).toBe("/dashboard");
    expect(safeInternalPath("/login?next=/login")).toBe("/dashboard");
    expect(safeInternalPath("/account/../logout")).toBe("/dashboard");
  });

  it("honours a custom fallback", () => {
    expect(safeInternalPath("/\\example.com", "/login")).toBe("/login");
  });

  it("navigates once to a validated fresh-session destination", () => {
    const destinations: string[] = [];
    expect(navigateAfterAuth("/ops/cases?status=assigned", (path) => destinations.push(path))).toBe(
      "/ops/cases?status=assigned",
    );
    expect(destinations).toEqual(["/ops/cases?status=assigned"]);
  });

  it("uses the dashboard fallback before navigation when next is unsafe", () => {
    const destinations: string[] = [];
    navigateAfterAuth("//evil.example", (path) => destinations.push(path));
    expect(destinations).toEqual(["/dashboard"]);
  });
});
