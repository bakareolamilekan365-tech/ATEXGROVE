import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AuthorizationError, requireStaff } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function OperationsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let context: Awaited<ReturnType<typeof requireStaff>>;
  try {
    context = await requireStaff();
  } catch (error) {
    if (error instanceof AuthorizationError) redirect("/dashboard");
    throw error;
  }

  const { data: profile } = await context.supabase.from("profiles").select("full_name").eq("user_id", context.user.id).maybeSingle();
  return <><SiteHeader state="staff" accountName={profile?.full_name ?? context.user.email} accountUserId={context.user.id} department={context.staff.department} isLead={context.staff.is_lead} current="queue" />{children}</>;
}
