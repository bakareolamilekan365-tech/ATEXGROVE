import { beforeEach, describe, expect, it, vi } from "vitest";
const { rpc, revalidatePath } = vi.hoisted(() => ({ rpc: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireAuthenticatedUser: async () => ({ supabase: { rpc }, user: { id: "owner" } }) }));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/case-evidence/stored-object", () => ({ verifyStoredEvidenceObject: vi.fn() }));
vi.mock("@/lib/case-evidence/registered-path", () => ({ isEvidenceStoragePathRegistered: vi.fn() }));
import { customerRespondToCaseAction } from "@/app/dashboard/cases/[id]/actions";
const initial = { error: null, success: null };
function form(message = "Requested pages are now ready.") {
  const data = new FormData();
  data.set("caseId", "11111111-1111-4111-8111-111111111111");
  data.set("message", message);
  data.set("requestEventId", "22222222-2222-4222-8222-222222222222");
  return data;
}
beforeEach(() => { vi.clearAllMocks(); rpc.mockResolvedValue({ data: "event", error: null }); });
describe("explicit customer response submission", () => {
  it("passes the displayed request token and message to the atomic release RPC", async () => {
    const result = await customerRespondToCaseAction(initial, form());
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).toHaveBeenCalledWith("customer_respond_to_case", {
      p_case_id: "11111111-1111-4111-8111-111111111111",
      p_message: "Requested pages are now ready.", p_request_event_id: "22222222-2222-4222-8222-222222222222",
    });
    expect(result.error).toBeNull();
    expect(result.success).toBe("Response submitted. Your documents are now available to the review team. They have not been authenticated.");
    expect(revalidatePath).toHaveBeenCalledWith("/ops/cases/11111111-1111-4111-8111-111111111111");
  });
  it("retains the existing required explanation", async () => {
    expect((await customerRespondToCaseAction(initial, form(""))).error).toBeTruthy();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("does not report release or refresh staff views on a stale/failed submission", async () => {
    rpc.mockResolvedValue({ error: { message: "private diagnostic" } });
    const result = await customerRespondToCaseAction(initial, form());
    expect(result.success).toBeNull();
    expect(result.error).not.toContain("private diagnostic");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
