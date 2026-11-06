import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { AppearanceSettings } from "@/components/layout/ThemeSwitcher";
import styles from "@/components/cases/case-workflow.module.css";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/guards";

type Workspace = "customer" | "staff";

async function account(workspace: Workspace) {
  const context = workspace === "staff" ? await requireStaff() : null;
  const supabase = context?.supabase ?? await createSupabaseServerClient();
  const user = context?.user ?? (await supabase.auth.getUser()).data.user;
  if (!user) redirect("/login");
  const { data: profile, error } = await supabase.from("profiles").select("full_name, phone, location_text, bio").eq("user_id", user.id).maybeSingle();
  return { user, profile, error, staff: context?.staff, base: workspace === "staff" ? "/ops" : "/dashboard" };
}

export async function AccountProfilePage({ workspace }: { workspace: Workspace }) {
  const { user, profile, error, base } = await account(workspace);
  return <main className={styles.shell}>
    {error || !profile ? <p className={styles.error} role="alert">Your profile could not be loaded. Refresh this page or try again later.</p> :
      <ProfileForm title="Your profile" initial={{ fullName: profile.full_name ?? "", phone: profile.phone ?? "", locationText: profile.location_text ?? "", bio: profile.bio ?? "" }} email={user.email} returnTo={base === "/ops" ? "/ops/cases" : "/dashboard"} settingsHref={`${base}/settings`} />}
  </main>;
}

export async function AccountSettingsPage({ workspace }: { workspace: Workspace }) {
  const { user, profile, error, staff, base } = await account(workspace);
  return <main className={styles.shell}>
    <div className={styles.headerRow}><div><p className={styles.eyebrow}>Account</p><h1>Settings</h1><p className={styles.muted}>Your account details and appearance preferences.</p></div><Link className={styles.link} href={`${base}/profile`}>Edit profile</Link></div>
    {error || !profile ? <p className={styles.error} role="alert">Your account details could not be loaded. Refresh to try again.</p> :
      <div className={styles.stack}>
        <section className={styles.panel}><h2>Account information</h2><dl className="account-details"><div><dt>Name</dt><dd>{profile.full_name || "Not recorded"}</dd></div><div><dt>Email</dt><dd>{user.email || "Not recorded"}</dd></div>{staff ? <><div><dt>Department</dt><dd>{staff.department}</dd></div><div><dt>Staff role</dt><dd>{staff.is_lead ? "Department lead" : "Staff member"}</dd></div></> : null}</dl><p className={styles.muted}>Staff permissions are assigned by an authorized administrator and cannot be edited here.</p><Link className={styles.link} href={`${base}/profile`}>Edit contact and profile details</Link></section>
        <section className={styles.panel}><h2>Appearance</h2><p className={styles.muted}>Choose a theme or follow your device setting.</p><AppearanceSettings /></section>
        <Link className={styles.link} href={base === "/ops" ? "/ops/cases" : "/dashboard"}>Return to workspace</Link>
      </div>}
  </main>;
}
