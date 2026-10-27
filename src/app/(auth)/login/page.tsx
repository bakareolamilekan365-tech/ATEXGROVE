"use client";

import { FormEvent, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase/client";
import { signInWithFreshNavigation } from "@/lib/auth/password-sign-in";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <main>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p>
        <a href="/register">Create an account</a>
      </p>
      <p>
        <a href="/forgot-password">Forgot your password?</a>
      </p>
    </main>
  );
}
