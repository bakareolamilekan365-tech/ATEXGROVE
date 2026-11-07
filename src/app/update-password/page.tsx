"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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
    <main>
      <h1>Set a new password</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="new-password">New password</label>
        <input id="new-password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
        <label htmlFor="confirm-password">Confirm new password</label>
        <input id="confirm-password" type="password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
        {message ? <p role="status">{message}</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit">Update password</button>
      </form>
    </main>
  );
}
