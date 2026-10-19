import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthorizationError } from "@/lib/auth/guards";

type DownloadClient = Pick<SupabaseClient, "rpc" | "storage">;

export async function createAuthorizedEvidenceDownload(
  supabase: DownloadClient,
  evidenceId: string,
) {
  const { data, error } = await supabase.rpc("authorize_case_evidence_download", {
    p_evidence_id: evidenceId,
  });
  const access = Array.isArray(data) ? data[0] : data;

  if (error || !access?.storage_path || !access?.original_filename) {
    throw new AuthorizationError("Staff access to this evidence is required.");
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("documents")
    .createSignedUrl(access.storage_path, 60, { download: access.original_filename });
  if (signError || !signed?.signedUrl) {
    throw new Error("The download could not be prepared.");
  }
  return signed.signedUrl;
}
