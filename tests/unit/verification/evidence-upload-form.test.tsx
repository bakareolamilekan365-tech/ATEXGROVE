import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({ values: [] as unknown[], cursor: 0 }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useActionState: () => [{ error: null, success: null }, vi.fn()],
  useEffect: () => undefined,
  useMemo: (factory: () => unknown) => factory(),
  useRef: (initial: unknown) => ({ current: initial }),
  useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.values)) hooks.values[index] = initial;
    return [hooks.values[index], (value: unknown) => { hooks.values[index] = value; }];
  },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/app/dashboard/cases/[id]/actions", () => ({ finalizeCaseEvidenceUploadAction: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createSupabaseClient: vi.fn() }));
vi.mock("@/app/ops/cases/actions", () => ({ transitionVerificationCaseAction: vi.fn() }));
import { EvidenceUploadForm } from "@/components/cases/EvidenceUploadForm";
import { EvidenceChecklist } from "@/components/cases/EvidenceChecklist";
import { StatusTransitionForm } from "@/components/cases/StatusTransitionForm";

type Element = ReactElement<Record<string, unknown>>;
function elements(node: unknown): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as Element;
  return [element, ...elements(element.props.children)];
}
function nodeText(node: unknown): string {
  if (typeof node === "string") return node;
  return elements(node).flatMap((element) => element.props.children).map(nodeText).join(" ");
}
const existingEvidence = [{ id: "latest", evidenceType: "other" as const, version: 1, filename: "synthetic.pdf", supersedesEvidenceId: null }];
function render(defaultEvidenceType?: "title_deed_copy" | "survey_plan_copy" | "receipt" | "seller_id" | "other") {
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
  it("renders every selected category's form directly inside that category card", () => {
    const categories = [
      ["title_deed_copy", "Title deed copy"],
      ["survey_plan_copy", "Survey plan copy"],
      ["receipt", "Receipt"],
      ["seller_id", "ID of seller"],
      ["other", "Other"],
    ] as const;
    for (const [type, label] of categories) {
      hooks.values = [type];
      hooks.cursor = 0;
      const tree = elements(EvidenceChecklist({ caseId: "case", evidence: [] }));
      const card = tree.find(({ type: elementType, props }) => elementType === "li" && nodeText(props.children).includes(label))!;
      const form = elements(card).find(({ type: elementType }) => elementType === EvidenceUploadForm);
      expect(form?.props.defaultEvidenceType).toBe(type);
      expect(form?.props.caseId).toBe("case");
    }
  });

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
    for (const type of ["title_deed_copy", "survey_plan_copy", "receipt", "seller_id", "other"] as const) {
      hooks.values = [];
      expect(field(render(type), "evidenceType").value).toBe(type);
    }
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

  it("disables duplicate submission while upload or finalization is active", () => {
    hooks.values[1] = "uploading";
    let tree = render();
    expect(tree.find(({ type }) => type === "button")?.props).toMatchObject({ disabled: true });
    hooks.values[1] = "finalizing";
    tree = render();
    expect(tree.find(({ type }) => type === "button")?.props).toMatchObject({ disabled: true });
  });

  it("announces the selected filename", () => {
    const tree = render("receipt");
    const input = tree.find(({ type, props }) => type === "input" && props.type === "file")!;
    (input.props.onChange as (event: { target: { files: { name: string }[] } }) => void)({ target: { files: [{ name: "synthetic-receipt.pdf" }] } });
    const updated = render("receipt");
    expect(updated.some(({ props }) => props.role === "status" && String(props.children).includes("synthetic-receipt.pdf"))).toBe(true);
  });
});

it("offers staff closure/cancellation while waiting for a reply, with no resume option", () => {
  const tree = elements(StatusTransitionForm({ caseId: "case", currentStatus: "needs_customer_info" }));
  expect(tree.filter(({ type }) => type === "option").map(({ props }) => props.value)).toEqual(["", "closed", "cancelled"]);
});
