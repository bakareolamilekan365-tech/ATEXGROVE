import type { VerificationCaseStatus } from "@/types/verification";
import styles from "./case-workflow.module.css";

export type ProgressStageState = "done" | "current" | "attention" | "later";
export type ProgressStage = { key: "saved" | "submitted" | "review" | "finished"; label: string; state: ProgressStageState };
export type CaseProgressModel =
  | { kind: "stages"; stages: ProgressStage[]; note: string }
  | { kind: "terminal"; tone: "closed" | "cancelled"; label: string; description: string };

const stageLabels: Record<ProgressStage["key"], string> = {
  saved: "Saved",
  submitted: "Submitted",
  review: "In review",
  finished: "Finished",
};

export function caseProgressModel(
  status: VerificationCaseStatus,
  history: readonly VerificationCaseStatus[] = [],
): CaseProgressModel {
  if (status === "closed") {
    return {
      kind: "terminal",
      tone: "closed",
      label: "Closed",
      description: "This request has been closed. The review ended without a final land assessment.",
    };
  }
  if (status === "cancelled") {
    return {
      kind: "terminal",
      tone: "cancelled",
      label: "Cancelled",
      description: "This request was cancelled.",
    };
  }

  const currentStage: ProgressStage["key"] = status === "draft"
    ? "saved"
    : status === "submitted" || status === "assigned"
      ? "submitted"
      : "review";
  const submittedRecorded = history.includes("submitted") || status === "submitted";
  const stages = (Object.keys(stageLabels) as ProgressStage["key"][]).map((key): ProgressStage => {
    if (key === currentStage) {
      return { key, label: stageLabels[key], state: status === "needs_customer_info" ? "attention" : "current" };
    }
    if (key === "saved" && currentStage !== "saved") return { key, label: stageLabels[key], state: "done" };
    if (key === "submitted" && currentStage === "review" && submittedRecorded) return { key, label: stageLabels[key], state: "done" };
    return { key, label: stageLabels[key], state: "later" };
  });
  const note = status === "needs_customer_info"
    ? "Waiting on you. The review team needs more information."
    : status === "draft"
      ? "Your request is saved. Submit it when you're ready."
      : status === "submitted"
        ? "Your request has been received."
        : status === "assigned"
          ? "A reviewer has been assigned."
          : "Your request is being reviewed.";
  return { kind: "stages", stages, note };
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
  if (model.kind === "terminal") {
    return (
      <div className={`${styles.progressTerminalLabel} ${model.tone === "cancelled" ? styles.progressTerminalCancelled : styles.progressTerminalClosed}`} role="status">
        <strong>{model.label}</strong>
        <span>{model.description}</span>
      </div>
    );
  }

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
    </div>
  );
}
