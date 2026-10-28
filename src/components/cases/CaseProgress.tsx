import type { VerificationCaseStatus } from "@/types/verification";
import styles from "./case-workflow.module.css";

const standardSteps = ["Submitted", "Assigned", "In review", "Your reply", "Closed"] as const;

function activeStep(status: VerificationCaseStatus) {
  if (status === "assigned") return 1;
  if (status === "in_review") return 2;
  if (status === "needs_customer_info") return 3;
  if (status === "closed" || status === "cancelled") return 4;
  return 0;
}

export function CaseProgress({ status, compact = false }: Readonly<{ status: VerificationCaseStatus; compact?: boolean }>) {
  const current = activeStep(status);
  const steps = status === "draft" ? ["Draft", ...standardSteps.slice(1)] : standardSteps;
  return (
    <ol className={`${styles.progress} ${compact ? styles.progressCompact : ""}`} aria-label="Case progress">
      {steps.map((step, index) => (
        <li key={step} className={index <= current ? styles.progressReached : ""} aria-current={index === current ? "step" : undefined}>
          <span aria-hidden="true" />
          <strong>{index + 1}. {step}</strong>
          {!compact ? <small>{index < current ? "Done" : index === current ? "Current" : "Later"}</small> : null}
        </li>
      ))}
    </ol>
  );
}
