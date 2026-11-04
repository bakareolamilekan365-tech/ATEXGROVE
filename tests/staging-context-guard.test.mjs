import test from "node:test";
import assert from "node:assert/strict";
import { validateStagingEnvironment } from "../scripts/staging-preflight.mjs";

const approvedSiteId = "c36c8384-8a73-42df-a19f-b2debd6c7ea5";
const stagingRef = "rogovqltseeqdugsjood";
const hostedRef = "caueewwwnzwtuaiuabdt";
const syntheticPublishableKey = "synthetic-publishable-key";
const syntheticServerKey = "synthetic-server-key";
const supportedContexts = ["production", "deploy-preview", "branch-deploy"];

const valid = {
  SITE_ID: approvedSiteId,
  CONTEXT: "production",
  STAGING_SUPABASE_PROJECT_REF: stagingRef,
  PRODUCTION_SUPABASE_PROJECT_REF: hostedRef,
  NEXT_PUBLIC_SUPABASE_URL: `https://${stagingRef}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: syntheticPublishableKey,
  SUPABASE_SERVICE_ROLE_KEY: syntheticServerKey,
  NEXT_PUBLIC_PRIVATE_PREVIEW: "true",
};

test("allows the exact approved configuration in every supported context", () => {
  for (const context of supportedContexts) {
    assert.deepEqual(validateStagingEnvironment({ ...valid, CONTEXT: context }), []);
  }
});

test("rejects a different site in every supported context", () => {
  for (const context of supportedContexts) {
    assert.ok(validateStagingEnvironment({ ...valid, CONTEXT: context, SITE_ID: "00000000-0000-0000-0000-000000000000" }).length > 0);
  }
});

test("rejects a missing site ID in every supported context", () => {
  for (const context of supportedContexts) {
    assert.ok(validateStagingEnvironment({ ...valid, CONTEXT: context, SITE_ID: undefined }).length > 0);
  }
});

test("rejects the existing hosted project even when the staging declaration is changed", () => {
  const failures = validateStagingEnvironment({
    ...valid,
    STAGING_SUPABASE_PROJECT_REF: hostedRef,
    PRODUCTION_SUPABASE_PROJECT_REF: stagingRef,
    NEXT_PUBLIC_SUPABASE_URL: `https://${hostedRef}.supabase.co`,
  });
  assert.ok(failures.some((message) => message.includes("cannot be used as staging")));
});

test("rejects an alternative staging project in every supported context", () => {
  const otherRef = "cccccccccccccccccccc";
  for (const context of supportedContexts) {
    assert.ok(validateStagingEnvironment({
      ...valid,
      CONTEXT: context,
      STAGING_SUPABASE_PROJECT_REF: otherRef,
      NEXT_PUBLIC_SUPABASE_URL: `https://${otherRef}.supabase.co`,
    }).length > 0);
  }
});

test("rejects an incorrect existing-hosted project declaration in every supported context", () => {
  for (const context of supportedContexts) {
    assert.ok(validateStagingEnvironment({
      ...valid,
      CONTEXT: context,
      PRODUCTION_SUPABASE_PROJECT_REF: "dddddddddddddddddddd",
    }).length > 0);
  }
});

test("rejects missing credentials and disabled private preview", () => {
  assert.ok(validateStagingEnvironment({ ...valid, NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }).length > 0);
  assert.ok(validateStagingEnvironment({ ...valid, SUPABASE_SERVICE_ROLE_KEY: "" }).length > 0);
  assert.ok(validateStagingEnvironment({ ...valid, NEXT_PUBLIC_PRIVATE_PREVIEW: "false" }).length > 0);
});

test("continues to allow deploy-preview and branch-deploy staging contexts", () => {
  for (const context of ["deploy-preview", "branch-deploy"]) {
    assert.deepEqual(validateStagingEnvironment({ ...valid, CONTEXT: context }), []);
  }
});

test("rejects unknown or missing deployment contexts", () => {
  for (const context of ["dev", "other", undefined]) {
    assert.ok(validateStagingEnvironment({ ...valid, CONTEXT: context }).length > 0);
  }
});

test("validation errors never include credential values", () => {
  const failures = validateStagingEnvironment({
    ...valid,
    SITE_ID: "wrong-site",
    NEXT_PUBLIC_SUPABASE_URL: `https://${hostedRef}.supabase.co`,
    NEXT_PUBLIC_PRIVATE_PREVIEW: "false",
  });
  const text = failures.join("\n");
  assert.ok(failures.length > 0);
  assert.ok(!text.includes(syntheticPublishableKey));
  assert.ok(!text.includes(syntheticServerKey));
});
