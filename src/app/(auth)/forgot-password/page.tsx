"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { FormCard } from "@/components/ui/FormCard";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSending(true);
    try {
      const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`;
      const { error: resetError } = await createSupabaseClient().auth.resetPasswordForEmail(email, { redirectTo });
      if (resetError) { setError("We could not start password recovery. Please try again."); return; }
      // Keep this message identical for known and unknown addresses.
      setSubmitted(true);
    } catch { setError("We could not connect. Check your connection and try again."); }
    finally { setSending(false); }
  }

  return (
    <FormCard eyebrow="Account recovery" title="Forgot password" intro="Enter your account email. We return the same response whether or not the address is registered.">
      {submitted ? (
        <p className="form-message form-message--success" role="status">If an account exists for that email, a recovery link is on its way.</p>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field"><label htmlFor="recovery-email">Email</label><input id="recovery-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
          {error ? <p className="form-message form-message--error" role="alert">{error}</p> : null}
          <button className="button button--primary button--full" type="submit" disabled={sending}>{sending ? "Sending…" : "Send recovery link"}</button>
        </form>
      )}
      <p><Link href="/login">Back to sign in</Link></p>
    </FormCard>
  );
}
