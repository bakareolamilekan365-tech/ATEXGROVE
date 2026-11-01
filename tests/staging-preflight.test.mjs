import test from "node:test";
import assert from "node:assert/strict";
import { validateStagingEnvironment } from "../scripts/staging-preflight.mjs";

const stagingRef = "aaaaaaaaaaaaaaaaaaaa";
const productionRef = "bbbbbbbbbbbbbbbbbbbb";
const valid = {
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

test("rejects public registration flag and production deploy context", () => {
  const bad = { ...valid, NEXT_PUBLIC_PRIVATE_PREVIEW: "false", CONTEXT: "production" };
  assert.equal(validateStagingEnvironment(bad).length, 2);
});

test("rejects malformed project origins, including path or query suffixes", () => {
  const bad = { ...valid, NEXT_PUBLIC_SUPABASE_URL: `https://${stagingRef}.supabase.co/rest/v1?key=test` };
  assert.ok(validateStagingEnvironment(bad).some((m) => m.includes("exact approved staging")));
});
