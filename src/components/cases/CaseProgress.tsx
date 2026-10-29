import type { VerificationCaseStatus } from "@/types/verification";
import styles from "./case-workflow.module.css";

type Step = { status: VerificationCaseStatus; label: string };
const base: Step[] = [
  { status: "submitted", label: "Request received" },
  { status: "assigned", label: "Reviewer assigned" },
  { status: "in_review", label: "In review" },
];

export function progressSteps(status: VerificationCaseStatus, history: readonly VerificationCaseStatus[] = []) {
  if (status === "draft") return [{ status: "draft" as const, label: "Draft", state: "current" as const }, ...base.map((step) => ({ ...step, state: "later" as const }))];
  const steps: Step[] = [...base];
  if (status === "needs_customer_info") steps.push({ status: "needs_customer_info", label: "Your information needed" });
  if (status === "closed") steps.push({ status: "closed", label: "Closed" });
  if (status === "cancelled") steps.push({ status: "cancelled", label: "Cancelled" });
  return steps.map((step) => ({ ...step, state: step.status === status ? (status === "needs_customer_info" ? "attention" as const : status === "cancelled" ? "cancelled" as const : status === "closed" ? "completed" as const : "current" as const) : history.includes(step.status) ? "completed" as const : "later" as const }));
}

export function CaseProgress({ status, history = [], compact = false }: Readonly<{ status: VerificationCaseStatus; history?: readonly VerificationCaseStatus[]; compact?: boolean }>) {
  const steps = progressSteps(status, history);
  return <ol className={`${styles.progress} ${compact ? styles.progressCompact : ""}`} aria-label="Case progress">
    {steps.map((step, index) => <li key={step.status} className={step.state === "completed" ? styles.progressReached : step.state === "attention" ? styles.progressAttention : step.state === "cancelled" ? styles.progressCancelled : ""} aria-current={step.status === status ? "step" : undefined}>
      <span aria-hidden="true" /><strong>{index + 1}. {step.label}</strong>{!compact ? <small>{step.state === "completed" ? "Completed" : step.state === "attention" ? "Action required" : step.state === "cancelled" ? "Cancelled" : step.state === "current" ? "Current" : "Not reached"}</small> : null}
    </li>)}
  </ol>;
}
