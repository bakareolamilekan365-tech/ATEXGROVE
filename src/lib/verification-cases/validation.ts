import { z } from "zod";
import { verificationCaseStatuses } from "@/types/verification";

export const newVerificationCaseSchema = z.object({
  siteDescription: z
    .string()
    .trim()
    .min(10, "Describe the plot in at least 10 characters.")
    .max(2000, "Keep the plot description under 2,000 characters."),
  areaLga: z
    .string()
    .trim()
    .min(2, "Enter an Abuja area or LGA.")
    .max(120, "Keep the area or LGA under 120 characters."),
  notes: z
    .string()
    .trim()
    .max(4000, "Keep notes under 4,000 characters."),
  contactPreference: z.enum(["email", "phone", "whatsapp"]),
});

export const assignmentSchema = z.object({
  caseId: z.string().uuid(),
  assigneeUserId: z.string().uuid(),
  note: z
    .string()
    .trim()
    .min(2, "Add a short assignment note.")
    .max(2000, "Keep the assignment note under 2,000 characters."),
  customerVisible: z.boolean(),
});

export const statusTransitionSchema = z.object({
  caseId: z.string().uuid(),
  toStatus: z.enum(verificationCaseStatuses),
  staffNote: z
    .string()
    .trim()
    .min(2, "Add a note explaining this status change.")
    .max(2000, "Keep the status note under 2,000 characters."),
  customerMessage: z
    .string()
    .trim()
    .max(2000, "Keep the customer message under 2,000 characters."),
});

export function checkboxValue(value: FormDataEntryValue | null) {
  return value === "on" || value === "true";
}
