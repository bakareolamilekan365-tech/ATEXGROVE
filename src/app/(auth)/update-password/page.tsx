"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FormCard } from "@/components/ui/FormCard";
import { createSupabaseClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    if (password.length < 8 || password !== confirmation) {
      setError("Use at least 8 characters and make both passwords match.");
      return;
    }
    const { error: updateError } = await createSupabaseClient().auth.updateUser({ password });
    if (updateError) {
      setError("This recovery link is invalid or expired. Request a new one.");
      return;
    }
    setMessage("Password updated. You can now sign in with your new password.");
    setTimeout(() => router.push("/login"), 800);
  }

  return (
    <FormCard eyebrow="Account recovery" title="Set a new password" intro="Use at least eight characters and enter the same password twice.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-field"><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
        <div className="form-field"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
        {message ? <p className="form-message form-message--success" role="status">{message}</p> : null}
        {error ? <p className="form-message form-message--error" role="alert">{error}</p> : null}
        <button className="button button--primary button--full" type="submit">Update password</button>
      </form>
    </FormCard>
  );
}
