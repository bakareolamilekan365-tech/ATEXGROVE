import test from "node:test";
import assert from "node:assert/strict";
import { validateStagingEnvironment } from "../scripts/staging-preflight.mjs";

const stagingRef = "rogovqltseeqdugsjood";
const productionRef = "caueewwwnzwtuaiuabdt";
const valid = {
  SITE_ID: "c36c8384-8a73-42df-a19f-b2debd6c7ea5",
  STAGING_SUPABASE_PROJECT_REF: stagingRef,
  PRODUCTION_SUPABASE_PROJECT_REF: productionRef,
  NEXT_PUBLIC_SUPABASE_URL: `https://${stagingRef}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-publishable-value",
  SUPABASE_SERVICE_ROLE_KEY: "test-server-only-value",
  NEXT_PUBLIC_PRIVATE_PREVIEW: "true",
  CONTEXT: "deploy-preview",
};

test("allows a separately identified staging project with private preview enabled", () => {
  assert.deepEqual(validateStagingEnvironment(valid), []);
});

test("rejects accidentally targeting the existing production project", () => {
  const bad = { ...valid, NEXT_PUBLIC_SUPABASE_URL: `https://${productionRef}.supabase.co` };
  assert.ok(validateStagingEnvironment(bad).some((m) => m.includes("exact approved staging")));
});

test("rejects identical declared staging and production project refs", () => {
  const bad = { ...valid, STAGING_SUPABASE_PROJECT_REF: productionRef, NEXT_PUBLIC_SUPABASE_URL: `https://${productionRef}.supabase.co` };
  assert.ok(validateStagingEnvironment(bad).some((m) => m.includes("must differ")));
});

test("rejects missing or malformed project refs and URLs", () => {
  const bad = { ...valid, STAGING_SUPABASE_PROJECT_REF: "", PRODUCTION_SUPABASE_PROJECT_REF: "", NEXT_PUBLIC_SUPABASE_URL: "not a URL" };
  assert.ok(validateStagingEnvironment(bad).length >= 3);
});

test("rejects missing staging keys without revealing values", () => {
  const bad = { ...valid, NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "" };
  const errors = validateStagingEnvironment(bad);
  assert.equal(errors.length, 2);
  assert.ok(errors.every((e) => !e.includes("test-server-only-value")));
});

test("rejects public registration flag and unsupported deploy context", () => {
  const bad = { ...valid, NEXT_PUBLIC_PRIVATE_PREVIEW: "false", CONTEXT: "unknown" };
  assert.equal(validateStagingEnvironment(bad).length, 2);
});

test("rejects malformed project origins, including path or query suffixes", () => {
  const bad = { ...valid, NEXT_PUBLIC_SUPABASE_URL: `https://${stagingRef}.supabase.co/rest/v1?key=test` };
  assert.ok(validateStagingEnvironment(bad).some((m) => m.includes("exact approved staging")));
});
// These are edge-case regressions for the existing validator, not deployment tests.
// The supported production Netlify context still points to the approved staging project.
test("rejects malformed refs with field-specific validation messages", () => {
  const malformed = [
    ["empty", ""],
    ["whitespace", " \t "],
    ["short", "abc"],
    ["uppercase", "A".repeat(20)],
    ["punctuation", "a".repeat(19) + "-"],
    ["overlength", "a".repeat(21)],
  ];
  for (const [label, value] of malformed) {
    for (const field of ["STAGING_SUPABASE_PROJECT_REF", "PRODUCTION_SUPABASE_PROJECT_REF"]) {
      const errors = validateStagingEnvironment({ ...valid, [field]: value });
      assert.ok(
        errors.some((message) => message.includes(field) && message.includes("20-character")),
        label + " ref should fail for " + field,
      );
    }
  }
});

test("rejects malformed, credential-bearing, or lookalike Supabase origins", () => {
  const origin = "https://" + stagingRef + ".supabase.co";
  const invalidOrigins = [
    ["insecure HTTP", "http://" + stagingRef + ".supabase.co"],
    ["non-root path", origin + "/rest/v1"],
    ["query string", origin + "/?test=1"],
    ["fragment", origin + "/#fragment"],
    ["username/password", "https://synthetic-user:synthetic-pass@" + stagingRef + ".supabase.co"],
    ["nondefault port", origin + ":8443"],
    ["lookalike hostname", origin + ".example.invalid"],
    ["unapproved hostname", "https://anotherproject.supabase.co"],
    ["trailing dot in hostname", origin + "."],
    ["invalid URL", "not-an-origin"],
  ];
  for (const [label, value] of invalidOrigins) {
    const errors = validateStagingEnvironment({ ...valid, NEXT_PUBLIC_SUPABASE_URL: value });
    assert.ok(
      errors.some((message) => message.includes("NEXT_PUBLIC_SUPABASE_URL")),
      label + " origin must be rejected",
    );
  }
});

test("rejects whitespace-only credential values independently", () => {
  for (const field of ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
    for (const value of ["", "  ", "\t\n"]) {
      const errors = validateStagingEnvironment({ ...valid, [field]: value });
      assert.ok(errors.some((message) => message.includes(field)), field + " must be nonblank");
    }
  }
});

test("accepts the private-preview flag only as the exact string true", () => {
  for (const value of [undefined, "", "false", "TRUE", "True", "true ", " true", "1", true]) {
    const errors = validateStagingEnvironment({ ...valid, NEXT_PUBLIC_PRIVATE_PREVIEW: value });
    assert.ok(
      errors.some((message) => message.includes("NEXT_PUBLIC_PRIVATE_PREVIEW")),
      "Flag must reject " + String(value),
    );
  }
});

test("reports multiple invalid settings without including any supplied dummy secrets", () => {
  const publishable = "synthetic-publishable-secret-marker";
  const server = "synthetic-server-secret-marker";
  const errors = validateStagingEnvironment({
    ...valid,
    SITE_ID: "wrong-site",
    STAGING_SUPABASE_PROJECT_REF: "X".repeat(20),
    NEXT_PUBLIC_SUPABASE_URL: "https://synthetic-user:synthetic-pass@invalid.example.invalid",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishable,
    SUPABASE_SERVICE_ROLE_KEY: server,
    NEXT_PUBLIC_PRIVATE_PREVIEW: "FALSE",
    CONTEXT: "unsupported",
  });
  const joined = errors.join("\n");
  assert.ok(errors.length >= 5);
  for (const secret of [publishable, server, "synthetic-user", "synthetic-pass"]) {
    assert.ok(!joined.includes(secret), "Validation failures must not leak dummy credentials");
  }
});

