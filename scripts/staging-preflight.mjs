import { fileURLToPath, URL } from "node:url";
import { resolve } from "node:path";
import process from "node:process";
import console from "node:console";

// Build-time safety gate only. This does not verify credentials, provision infrastructure,
// apply SQL migrations, or prove that Supabase Auth sign-up is disabled.
const approvedNetlifySiteId = "c36c8384-8a73-42df-a19f-b2debd6c7ea5";
const approvedStagingRef = "rogovqltseeqdugsjood";
const existingHostedRef = "caueewwwnzwtuaiuabdt";

export function validateStagingEnvironment(env) {
  const failures = [];
  const stagingRef = (env.STAGING_SUPABASE_PROJECT_REF || "").trim();
  const productionRef = (env.PRODUCTION_SUPABASE_PROJECT_REF || "").trim();
  const validRef = /^[a-z0-9]{20}$/;

  if (!validRef.test(stagingRef)) failures.push("Set STAGING_SUPABASE_PROJECT_REF to the approved 20-character staging project ref.");
  if (!validRef.test(productionRef)) failures.push("Set PRODUCTION_SUPABASE_PROJECT_REF to the existing hosted project's 20-character ref.");
  if (stagingRef && productionRef && stagingRef === productionRef) failures.push("Staging and production project refs must differ.");
  if (stagingRef === existingHostedRef) failures.push("The existing hosted Supabase project cannot be used as staging.");

  const urlString = (env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
  try {
    const url = new URL(urlString);
    if (url.protocol !== "https:" ||
        url.hostname !== `${stagingRef}.supabase.co` ||
        url.username || url.password || url.port || url.pathname !== "/" ||
        url.search || url.hash) {
      failures.push("NEXT_PUBLIC_SUPABASE_URL must be the exact approved staging Supabase project origin.");
    }
  } catch {
    failures.push("NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS Supabase project URL.");
  }

  if (!(env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim()) failures.push("Set the staging NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  if (!(env.SUPABASE_SERVICE_ROLE_KEY || "").trim()) failures.push("Set the staging SUPABASE_SERVICE_ROLE_KEY in server-only Netlify environment settings.");
  if (env.NEXT_PUBLIC_PRIVATE_PREVIEW !== "true") failures.push("NEXT_PUBLIC_PRIVATE_PREVIEW must be true for staging.");
  if (env.CONTEXT === "production") {
    if (env.SITE_ID !== approvedNetlifySiteId) {
      failures.push("Production-context staging builds require the approved Netlify SITE_ID.");
    } else if (stagingRef !== approvedStagingRef || productionRef !== existingHostedRef) {
      failures.push("Production-context staging builds require the approved Supabase project refs.");
    }
  } else if (env.CONTEXT !== "deploy-preview" && env.CONTEXT !== "branch-deploy") {
    failures.push("Unsupported Netlify deployment context for staging.");
  }
  return failures;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = validateStagingEnvironment(process.env);
  if (failures.length) {
    console.error("Staging preflight FAILED (configuration names only; no credential values):");
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log("Staging preflight PASSED. Project isolation and private-preview flags are consistent.");
    console.log("This does not confirm account restrictions, database migrations, deployment, or storage access.");
  }
}
