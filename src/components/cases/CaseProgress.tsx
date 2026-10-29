import type { VerificationCaseStatus } from "@/types/verification";
import styles from "./case-workflow.module.css";

export type ProgressStageState = "done" | "current" | "attention" | "later";
export type ProgressStage = { key: "saved" | "submitted" | "assigned" | "review"; label: string; state: ProgressStageState };
export type CaseProgressOutcome = { tone: "closed" | "cancelled"; label: string; description: string };
export type CaseProgressModel = { stages: ProgressStage[]; note: string; outcome?: CaseProgressOutcome };

const stageLabels: Record<ProgressStage["key"], string> = {
  saved: "Saved",
  submitted: "Submitted",
  assigned: "Reviewer assigned",
  review: "In review",
};

export function caseProgressModel(
  status: VerificationCaseStatus,
  history: readonly VerificationCaseStatus[] = [],
): CaseProgressModel {
  const currentStage: ProgressStage["key"] | null = status === "draft"
    ? "saved"
    : status === "submitted"
      ? "submitted"
      : status === "assigned"
        ? "assigned"
        : status === "in_review" || status === "needs_customer_info"
          ? "review"
          : null;
  const hasReached = (key: ProgressStage["key"]) => {
    if (key === "saved") return status !== "draft";
    if (key === "submitted") return history.includes("submitted") || ["assigned", "in_review", "needs_customer_info"].includes(status);
    if (key === "assigned") return history.includes("assigned") || ["in_review", "needs_customer_info"].includes(status);
    return history.includes("in_review") || history.includes("needs_customer_info");
  };
  const stages = (Object.keys(stageLabels) as ProgressStage["key"][]).map((key): ProgressStage => {
    if (key === currentStage) {
      return { key, label: stageLabels[key], state: status === "needs_customer_info" ? "attention" : "current" };
    }
    if (hasReached(key)) return { key, label: stageLabels[key], state: "done" };
    return { key, label: stageLabels[key], state: "later" };
  });
  const outcome = status === "closed"
    ? { tone: "closed" as const, label: "Closed", description: "This request has been closed. The review ended without a final land assessment." }
    : status === "cancelled"
      ? { tone: "cancelled" as const, label: "Cancelled", description: "This request was cancelled." }
      : undefined;
  const note = outcome
    ? "Recorded milestones are shown above. The outcome does not confirm that the land was verified."
    : status === "needs_customer_info"
    ? "Waiting on you. The review team needs more information."
    : status === "draft"
      ? "Your request is saved. Submit it when you're ready."
      : status === "submitted"
        ? "Your request has been received."
        : status === "assigned"
          ? "A reviewer has been assigned."
          : "Your request is being reviewed.";
  return { stages, note, outcome };
}

export function CaseProgress({
  status,
  history = [],
  compact = false,
}: Readonly<{
  status: VerificationCaseStatus;
  history?: readonly VerificationCaseStatus[];
  compact?: boolean;
}>) {
  const model = caseProgressModel(status, history);
  return (
    <div className={compact ? styles.progressCompact : undefined}>
      <ol className={styles.progress} aria-label="Case progress">
        {model.stages.map((stage) => (
          <li
            key={stage.key}
            className={stage.state === "done" ? styles.progressReached : stage.state === "attention" ? styles.progressAttention : ""}
            aria-current={stage.state === "current" || stage.state === "attention" ? "step" : undefined}
          >
            <span aria-hidden="true" />
            <strong>{stage.label}</strong>
            {!compact ? <small>{stage.state === "done" ? "Recorded" : stage.state === "attention" ? "Action required" : stage.state === "current" ? "Current stage" : "Not reached"}</small> : null}
          </li>
        ))}
      </ol>
      <p className={`${styles.progressNote} ${status === "needs_customer_info" ? styles.progressNoteAttention : ""}`}>{model.note}</p>
      {model.outcome ? (
        <div className={`${styles.progressTerminalLabel} ${model.outcome.tone === "cancelled" ? styles.progressTerminalCancelled : styles.progressTerminalClosed}`} role="status">
          <strong>{model.outcome.label}</strong>
          <span>{model.outcome.description}</span>
        </div>
      ) : null}
    </div>
  );
}
