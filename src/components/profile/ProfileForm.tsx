"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "@/components/cases/case-workflow.module.css";
import { createSupabaseClient } from "@/lib/supabase/client";

export function ProfileForm({
  title = "Complete your profile",
  returnTo = "/dashboard",
  initial,
  email,
  settingsHref,
}: Readonly<{
  title?: string;
  returnTo?: string;
  initial?: { fullName: string; phone: string; locationText: string; bio: string };
  email?: string;
  settingsHref?: string;
}>) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [locationText, setLocationText] = useState(initial?.locationText ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (initial) return;
    let active = true;
    async function load() {
      try {
        const supabase = createSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (!user || authError) { window.location.assign("/login"); return; }
        const { data, error: profileError } = await supabase.from("profiles").select("full_name, phone, location_text, bio").eq("user_id", user.id).maybeSingle();
        if (!active) return;
        if (profileError || !data) { setError("Your profile could not be loaded. Refresh to try again."); return; }
        setFullName(data.full_name ?? user.user_metadata?.full_name ?? "");
        setPhone(data.phone ?? "");
        setLocationText(data.location_text ?? "");
        setBio(data.bio ?? "");
      } catch { if (active) setError("Your profile could not be loaded. Check your connection and try again."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [initial]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const supabase = createSupabaseClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        window.location.assign("/login");
        return;
      }
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() || null, phone: phone.trim() || null, location_text: locationText.trim() || null, bio: bio.trim() || null })
        .eq("user_id", user.id)
        .select("user_id")
        .maybeSingle();
      if (updateError || !data) {
        setError("We could not save your profile. Please try again.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("We could not connect. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.panel} aria-labelledby="profile-title">
      <div className={styles.cardHeader}>
        <div><h1 id="profile-title">{title}</h1><p className={styles.muted}>These details personalize your account; they do not verify your identity or professional status.</p></div>
        {settingsHref ? <Link className={styles.link} href={settingsHref}>Account settings</Link> : null}
      </div>
      {email ? <p><strong>Account email:</strong> {email} <span className={styles.muted}>(managed by sign-in)</span></p> : null}
      {loading ? <p role="status">Loading your profile…</p> : null}
      {!loading ? <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}><label htmlFor="profile-full-name">Full name</label><input id="profile-full-name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></div>
        <div className={styles.field}><label htmlFor="profile-phone">Phone</label><input id="profile-phone" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="profile-location">Location</label><input id="profile-location" autoComplete="address-level2" value={locationText} onChange={(event) => setLocationText(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="profile-bio">Short bio</label><textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={4} /></div>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {saved ? <p className={styles.success} role="status">Profile saved.</p> : null}
        <div className={styles.actions}><button type="submit" disabled={saving || loading || Boolean(error && !initial)}>{saving ? "Saving…" : "Save profile"}</button><Link className={styles.link} href={returnTo}>Return to workspace</Link></div>
        <p className={styles.muted}>Atexgrove is a demo prototype. Use test details only; do not enter real land documents or sensitive personal data.</p>
      </form> : null}
    </section>
  );
}
