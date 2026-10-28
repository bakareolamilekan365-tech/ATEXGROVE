import { SiteHeader } from "@/components/layout/SiteHeader";
import { publicRegistrationEnabled } from "@/lib/config/private-preview";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle()
    : { data: null };
  return (
    <>
      <SiteHeader state={user ? "customer" : "signed-out"} accountName={profile?.full_name ?? user?.email} registrationEnabled={publicRegistrationEnabled()} />
      <div className="auth-page">{children}</div>
    </>
  );
}
