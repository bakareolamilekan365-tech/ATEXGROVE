"use client";

import Link from "next/link";

const copy: Record<number, { title: string; message: string }> = {
  401: { title: "Sign in required", message: "Please sign in to continue." },
  403: { title: "Access denied", message: "This action is not available to your account." },
  404: { title: "Page not found", message: "The page could not be found or may not be available to you." },
  408: { title: "Request timed out", message: "The request took too long. Check your connection and try again." },
  409: { title: "Details changed", message: "This information may be out of date. Refresh before trying again." },
  413: { title: "File too large", message: "Choose a file within the allowed size and try again." },
  429: { title: "Too many requests", message: "Please wait a little before trying again." },
  500: { title: "Something went wrong", message: "We could not complete this request. Your private details have not been shown here." },
  503: { title: "Temporarily unavailable", message: "This service is not available right now. Please try again later." },
};

export function ProblemState({ status, onRetry }: { status: number; onRetry?: () => void }) {
  const item = copy[status] ?? copy[500];
  return <main className="page-container page-main problem-page"><section className="content-card problem-card" role="alert">
    <div className="problem-mark" aria-hidden="true"><svg viewBox="0 0 64 64"><path d={status === 404 ? "M13 48V16h38v32H13Zm9-22h20M22 36h12" : status === 401 || status === 403 ? "M18 29h28v23H18V29Zm6 0v-8a8 8 0 0 1 16 0v8M32 39v6" : "M32 8 58 53H6L32 8Zm0 17v12m0 8h.01"} /></svg></div>
    <p className="eyebrow">Atexgrove · {status}</p><h1>{item.title}</h1><p>{item.message}</p>
    <div className="landing-actions">{onRetry ? <button className="button button--primary" type="button" onClick={onRetry}>Try again</button> : null}{status === 401 ? <Link className="button button--primary" href="/login">Sign in</Link> : null}<Link className="button button--secondary" href="/">Go home</Link></div>
  </section></main>;
}
