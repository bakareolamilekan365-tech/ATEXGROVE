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
  addressLine: z.string().trim().min(10, "Enter at least 10 characters for the address.").max(500, "Keep the address under 500 characters."),
  notes: z
    .string()
    .trim()
    .max(4000, "Keep notes under 4,000 characters."),
  contactPreference: z.enum(["email", "phone", "whatsapp"]),
  contactPhone: z.string().trim().max(24),
  contactPhoneConsent: z.boolean(),
  customerIntent: z.enum(["buying", "own_or_occupy", "developing", "representing_someone", "other"]),
  relationshipToLand: z.enum(["buyer", "owner", "occupier", "developer", "agent_or_representative", "other"]),
  actingFor: z.enum(["self", "another_person", "organisation"]),
  principalName: z.string().trim().max(200),
  authorityConfirmed: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.areaIsListed && !listedAreasFor(data.areaLga).includes(data.areaName)) {
    ctx.addIssue({ code: "custom", path: ["areaName"], message: "Choose an area from the starter list or select that it is not listed." });
  }
  if (data.contactPreference === "email") {
    if (data.contactPhone || data.contactPhoneConsent) ctx.addIssue({ code: "custom", path: ["contactPhone"], message: "Phone details are only used for phone or WhatsApp contact." });
  } else {
    const normalized = data.contactPhone.replace(/[\s()-]/g, "");
    if (!/^(?:0[789]\d{9}|\+234[789]\d{9})$/.test(normalized)) {
      ctx.addIssue({ code: "custom", path: ["contactPhone"], message: "Enter a valid Nigerian mobile number." });
    }
    if (!data.contactPhoneConsent) ctx.addIssue({ code: "custom", path: ["contactPhoneConsent"], message: "Please give consent to use this number for your request." });
  }
  if (data.customerIntent === "representing_someone" && data.actingFor === "self") {
    ctx.addIssue({
      code: "custom",
      path: ["actingFor"],
      message: "If you are representing someone, choose another person or an organisation.",
    });
  }
  if (data.actingFor === "self") {
    if (data.principalName || data.authorityConfirmed) ctx.addIssue({ code: "custom", path: ["actingFor"], message: "For a request for yourself, leave representation details blank." });
  } else {
    if (data.principalName.length < 1) ctx.addIssue({ code: "custom", path: ["principalName"], message: "Enter the person or organisation this request is for." });
    if (!data.authorityConfirmed) ctx.addIssue({ code: "custom", path: ["authorityConfirmed"], message: "Confirm that you are authorised to submit this request." });
  }
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
