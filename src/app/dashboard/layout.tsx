import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle();

  return (
    <>
      <SiteHeader state="customer" accountName={profile?.full_name ?? user.email} accountUserId={user.id} current="cases" />
      {children}
    </>
  );
}
