import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ values: [] as unknown[], cursor: 0 }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useActionState: () => [{ error: null, success: null }, vi.fn()],
  useMemo: (factory: () => unknown) => factory(),
  useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.values)) hooks.values[index] = initial;
    return [hooks.values[index], (value: unknown) => { hooks.values[index] = value; }];
  },
}));
vi.mock("@/app/dashboard/cases/[id]/actions", () => ({ uploadCaseEvidenceAction: vi.fn() }));
vi.mock("@/app/ops/cases/actions", () => ({ transitionVerificationCaseAction: vi.fn() }));
import { EvidenceUploadForm } from "@/components/cases/EvidenceUploadForm";
import { StatusTransitionForm } from "@/components/cases/StatusTransitionForm";

type Element = ReactElement<Record<string, unknown>>;
function elements(node: unknown): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as Element;
  return [element, ...elements(element.props.children)];
}
const existingEvidence = [{ id: "latest", evidenceType: "other" as const, version: 1, filename: "synthetic.pdf", supersedesEvidenceId: null }];
function render(defaultEvidenceType?: "other") {
  hooks.cursor = 0;
  return elements(EvidenceUploadForm({ caseId: "case", existingEvidence, defaultEvidenceType }));
}
function field(tree: Element[], name: string, value?: string) {
  const element = tree.find(({ props }) => props.name === name && (value === undefined || props.value === value));
  if (!element) throw new Error(`Missing field ${name}`);
  return element.props;
}
function change(props: Record<string, unknown>, value: string) {
  (props.onChange as (event: { target: { value: string } }) => void)({ target: { value } });
}

beforeEach(() => { hooks.values = []; hooks.cursor = 0; });
describe("evidence upload category selection", () => {
  it("starts on the empty required placeholder and disables replacement until a type is selected", () => {
    const tree = render();
    expect(field(tree, "evidenceType")).toMatchObject({ required: true, value: "" });
    expect(tree.find(({ type, props }) => type === "option" && props.value === "")?.props.children).toBe("Select a document type");
    expect(field(tree, "uploadMode", "replacement").disabled).toBe(true);
    change(field(tree, "evidenceType"), "other");
    const selected = render();
    expect(field(selected, "evidenceType").value).toBe("other");
    expect(field(selected, "uploadMode", "replacement").disabled).toBe(false);
  });

  it("preserves an explicitly preselected checklist category", () => {
    expect(field(render("other"), "evidenceType").value).toBe("other");
  });

  it("clears the predecessor and replacement mode when the category becomes empty", () => {
    let tree = render("other");
    change(field(tree, "uploadMode", "replacement"), "replacement");
    tree = render("other");
    const predecessor = tree.find(({ type, props }) => type === "select" && props.id === "supersedesEvidenceId")!;
    change(predecessor.props, "latest");
    expect(field(render("other"), "supersedesEvidenceId").value).toBe("latest");
    change(field(render("other"), "evidenceType"), "");
    tree = render();
    expect(field(tree, "evidenceType").value).toBe("");
    expect(field(tree, "uploadMode", "new").checked).toBe(true);
    expect(field(tree, "uploadMode", "replacement").disabled).toBe(true);
    expect(field(tree, "supersedesEvidenceId").value).toBe("");
  });
});

it("offers staff closure/cancellation while waiting for a reply, with no resume option", () => {
  const tree = elements(StatusTransitionForm({ caseId: "case", currentStatus: "needs_customer_info" }));
  expect(tree.filter(({ type }) => type === "option").map(({ props }) => props.value)).toEqual(["", "closed", "cancelled"]);
});
