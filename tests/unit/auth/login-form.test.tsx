import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ values: [] as unknown[], cursor: 0, reference: { current: false } }));
const auth = vi.hoisted(() => ({ signIn: vi.fn() }));

vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof import("react")>(),
  useRef: () => state.reference,
  useState: (initial: unknown) => {
    const index = state.cursor++;
    if (!(index in state.values)) state.values[index] = initial;
    return [state.values[index], (value: unknown) => {
      state.values[index] = typeof value === "function" ? (value as (current: unknown) => unknown)(state.values[index]) : value;
    }];
  },
}));
vi.mock("@/lib/auth/password-sign-in", () => ({ signInWithFreshNavigation: auth.signIn }));
vi.mock("@/lib/supabase/client", () => ({ createSupabaseClient: () => ({ auth: {} }) }));

import { LoginForm } from "@/components/auth/LoginForm";

type Element = ReactElement<Record<string, unknown>>;
function elements(node: unknown): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!node || typeof node !== "object" || !("props" in node)) return [];
  const element = node as Element;
  return [element, ...elements(element.props.children)];
}
function render() {
  state.cursor = 0;
  return elements(LoginForm({ registrationEnabled: true }));
}

describe("LoginForm pending authentication", () => {
  beforeEach(() => {
    state.values = [];
    state.cursor = 0;
    state.reference.current = false;
    auth.signIn.mockReset();
    vi.stubGlobal("window", { location: { search: "", assign: vi.fn() } });
  });

  it("allows only one submission and disables conflicting navigation while pending", async () => {
    let finish: ((value: { destination: string; error: null }) => void) | undefined;
    auth.signIn.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const form = render().find(({ type }) => type === "form")!;
    const event = { preventDefault: vi.fn(), currentTarget: {} };
    const first = (form.props.onSubmit as (event: unknown) => Promise<void>)(event);
    const second = (form.props.onSubmit as (event: unknown) => Promise<void>)(event);
    expect(auth.signIn).toHaveBeenCalledOnce();

    const pending = render();
    const registration = pending.find(({ props }) => props.href === "/register")!;
    expect(registration.props).toMatchObject({ "aria-disabled": true, tabIndex: -1 });
    const click = { preventDefault: vi.fn() };
    (registration.props.onClick as (event: unknown) => void)(click);
    expect(click.preventDefault).toHaveBeenCalledOnce();

    finish?.({ destination: "/dashboard", error: null });
    await Promise.all([first, second]);
  });

  it("uses stable, accessible eye icons without changing the typed password", () => {
    state.values[1] = "secret-value";
    let tree = render();
    const toggle = tree.find(({ type, props }) => type === "button" && props["aria-label"] === "Show password")!;
    expect(toggle.props.children).toBeTruthy();
    (toggle.props.onClick as () => void)();
    tree = render();
    const password = tree.find(({ type, props }) => type === "input" && props.id === "password")!;
    const updatedToggle = tree.find(({ type, props }) => type === "button" && props["aria-label"] === "Hide password")!;
    expect(password.props).toMatchObject({ type: "text", value: "secret-value", autoComplete: "current-password" });
    expect(updatedToggle.props["aria-pressed"]).toBe(true);
  });
});
