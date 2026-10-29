"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signInWithFreshNavigation } from "@/lib/auth/password-sign-in";
import { createSupabaseClient } from "@/lib/supabase/client";

export function LoginForm({
  registrationEnabled,
  previewWarning = false,
}: Readonly<{
  registrationEnabled: boolean;
  previewWarning?: boolean;
}>) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const requestedPath = new URLSearchParams(window.location.search).get("next");
    const result = await signInWithFreshNavigation(
      createSupabaseClient().auth,
      { email, password },
      requestedPath,
      (destination) => window.location.assign(destination),
    );

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div className="form-field">
        <label htmlFor="password">Password</label>
        <div className="password-field"><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((shown) => !shown)}>{showPassword ? "Hide" : "Show"}</button></div>
      </div>
      {error ? <p className="form-message form-message--error" role="alert">{error}</p> : null}
      <button className="button button--primary button--full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
      <div className="auth-form__links">
        <Link href="/forgot-password">Forgot password?</Link>
        {registrationEnabled ? <Link href="/register">Create account</Link> : null}
      </div>
      {previewWarning ? <p className="preview-warning">Do not upload real documents.</p> : null}
    </form>
  );
}
