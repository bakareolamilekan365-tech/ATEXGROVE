import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export class EvidencePathLookupError extends Error {
  constructor() {
    super("Registered evidence path lookup failed.");
    this.name = "EvidencePathLookupError";
  }
}

/**
 * Checks global path uniqueness without exposing another customer's evidence.
 * The database UNIQUE constraint remains the final race-condition safeguard.
 */
export async function isEvidenceStoragePathRegistered(storagePath: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("case_evidence")
    .select("id")
    .eq("storage_path", storagePath)
    .limit(1)
    .maybeSingle();

  if (error) throw new EvidencePathLookupError();
  return Boolean(data);
}
