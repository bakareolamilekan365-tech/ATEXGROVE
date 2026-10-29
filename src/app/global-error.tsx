"use client";

import "@fontsource-variable/figtree";
import "./globals.css";
import { ProblemState } from "@/components/ui/ProblemState";
import { THEME_INITIALIZER } from "@/lib/theme";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: THEME_INITIALIZER }} /></head><body><ProblemState status={500} onRetry={reset} /></body></html>; }
