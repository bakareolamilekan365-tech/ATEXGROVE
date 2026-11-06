"use client";

import { ProblemState } from "@/components/ui/ProblemState";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <ProblemState status={500} onRetry={reset} />; }
