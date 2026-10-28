"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/components/cases/case-workflow.module.css";
import { createSupabaseClient } from "@/lib/supabase/client";

export function ProfileForm({
  title = "Complete your profile",
  returnTo = "/dashboard",
}: Readonly<{ title?: string; returnTo?: string }>) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [locationText, setLocationText] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase.from("profiles").select("full_name, phone, location_text, bio").eq("user_id", user.id).maybeSingle();
      setFullName(data?.full_name ?? user.user_metadata?.full_name ?? "");
      setPhone(data?.phone ?? "");
      setLocationText(data?.location_text ?? "");
      setBio(data?.bio ?? "");
    };
    void loadProfile();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null, location_text: locationText.trim() || null, bio: bio.trim() || null })
      .eq("user_id", user.id);
    if (updateError) {
      setError("We could not save your profile. Please try again.");
      setSaving(false);
      return;
    }
    router.push(returnTo);
    router.refresh();
  }

  return (
    <section className={styles.panel} aria-labelledby="profile-title">
      <h1 id="profile-title">{title}</h1>
      <p className={styles.muted}>These details personalize your account; they do not constitute professional or legal verification.</p>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}><label htmlFor="profile-full-name">Full name</label><input id="profile-full-name" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /></div>
        <div className={styles.field}><label htmlFor="profile-phone">Phone</label><input id="profile-phone" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="profile-location">Location</label><input id="profile-location" autoComplete="address-level2" value={locationText} onChange={(event) => setLocationText(event.target.value)} /></div>
        <div className={styles.field}><label htmlFor="profile-bio">Short bio</label><textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={4} /></div>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
        <p className={styles.muted}>Atexgrove is a demo prototype. Use test details only and don&apos;t enter real land documents or sensitive personal data. A full privacy policy will be published before real use.</p>
      </form>
    </section>
  );
}
