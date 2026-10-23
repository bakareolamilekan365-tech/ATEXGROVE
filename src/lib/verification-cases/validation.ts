import { z } from "zod";
import { verificationCaseStatuses } from "@/types/verification";
import { fctAreaCouncils, listedAreasFor } from "@/lib/verification-cases/abuja-locations";

export const newVerificationCaseSchema = z.object({
  idempotencyKey: z.string().uuid("Refresh the page and try again."),
  siteDescription: z
    .string()
    .trim()
    .min(10, "Describe the plot in at least 10 characters.")
    .max(2000, "Keep the plot description under 2,000 characters."),
  areaLga: z.enum(fctAreaCouncils.map((council) => council.name) as [string, ...string[]]),
  areaName: z.string().trim().min(2).max(120),
  areaIsListed: z.boolean(),
  addressLine: z.string().trim().min(3).max(500),
  notes: z
    .string()
    .trim()
    .max(4000, "Keep notes under 4,000 characters."),
  contactPreference: z.enum(["email", "phone", "whatsapp"]),
  contactPhone: z.string().trim().max(24),
  contactPhoneConsent: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.areaIsListed && !listedAreasFor(data.areaLga).includes(data.areaName)) {
    ctx.addIssue({ code: "custom", path: ["areaName"], message: "Choose an area from the starter list or select that it is not listed." });
  }
  if (data.contactPreference === "email") {
    if (data.contactPhone || data.contactPhoneConsent) ctx.addIssue({ code: "custom", path: ["contactPhone"], message: "Phone details are only used for phone or WhatsApp contact." });
    return;
  }
  const normalized = data.contactPhone.replace(/[\s()-]/g, "");
  if (!/^(?:0[789]\d{9}|\+234[789]\d{9})$/.test(normalized)) {
    ctx.addIssue({ code: "custom", path: ["contactPhone"], message: "Enter a valid Nigerian mobile number." });
  }
  if (!data.contactPhoneConsent) ctx.addIssue({ code: "custom", path: ["contactPhoneConsent"], message: "Please give consent to use this number for your request." });
});

export const assignmentSchema = z.object({
  caseId: z.string().uuid(),
  assigneeUserId: z.string().uuid(),
  note: z
    .string()
    .trim()
    .min(2, "Add a short assignment note.")
    .max(2000, "Keep the assignment note under 2,000 characters."),
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
