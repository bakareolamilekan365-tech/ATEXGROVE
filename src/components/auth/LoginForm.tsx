"use client";

import Link from "next/link";
import { FormEvent, MouseEvent, useRef, useState } from "react";
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
  const submissionInFlight = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionInFlight.current) return;
    submissionInFlight.current = true;
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
      submissionInFlight.current = false;
      return;
    }
  }

  function preventNavigationWhileSigningIn(event: MouseEvent<HTMLAnchorElement>) {
    if (!submissionInFlight.current) return;
    event.preventDefault();
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} aria-busy={isSubmitting}>
      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isSubmitting} />
      </div>
      <div className="form-field">
        <label htmlFor="password">Password</label>
        <div className="password-field">
          <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isSubmitting} />
          <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((shown) => !shown)} disabled={isSubmitting}>
            {showPassword ? (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.5 10.5 0 0 1 12 4c5.4 0 9 5.2 9 5.2a14.5 14.5 0 0 1-2.2 2.6M6.2 6.2C4.2 7.5 3 9.2 3 9.2s3.6 5.2 9 5.2c1 0 1.9-.2 2.8-.5" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.6-5.2 9-5.2 9 5.2 9 5.2-3.6 5.2-9 5.2S3 12 3 12Z" /><circle cx="12" cy="12" r="2.4" /></svg>
            )}
          </button>
        </div>
      </div>
      {error ? <p className="form-message form-message--error" role="alert">{error}</p> : null}
      <button className="button button--primary button--full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
      <div className="auth-form__links">
        <Link href="/forgot-password" aria-disabled={isSubmitting} tabIndex={isSubmitting ? -1 : undefined} onClick={preventNavigationWhileSigningIn}>Forgot password?</Link>
        {registrationEnabled ? <Link href="/register" aria-disabled={isSubmitting} tabIndex={isSubmitting ? -1 : undefined} onClick={preventNavigationWhileSigningIn}>Create account</Link> : null}
      </div>
      {previewWarning ? <p className="preview-warning">Do not upload real documents.</p> : null}
    </form>
  );
}
