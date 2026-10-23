import type { ZodIssue } from "zod";

export type CaseFormField = "areaLga" | "areaName" | "addressLine" | "siteDescription" | "notes" | "contactPreference" | "contactPhone" | "contactPhoneConsent";
export type CaseFieldErrors = Partial<Record<CaseFormField, string>>;

const messages: Record<CaseFormField, string> = {
  areaLga: "Choose one of the six FCT area councils from the list.",
  areaName: "Choose an area from the list, or mark that it isn’t listed and enter it.",
  addressLine: "Enter at least 10 characters: plot or house number, street, and a nearby landmark.",
  siteDescription: "Describe the plot in at least 10 characters.",
  notes: "Keep additional notes under 4,000 characters.",
  contactPreference: "Choose email, phone, or WhatsApp.",
  contactPhone: "Enter a valid Nigerian mobile number, or use email contact.",
  contactPhoneConsent: "Please confirm that the review team may use this number for this request.",
};

const knownFields = new Set<string>(Object.keys(messages));

export function mapCaseFormIssues(issues: readonly ZodIssue[]): { fieldErrors: CaseFieldErrors; formError: string | null } {
  const fieldErrors: CaseFieldErrors = {};
  let formError: string | null = null;
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (knownFields.has(key)) {
      let plainMessage = messages[key as CaseFormField];
      if (issue.code === "too_big") {
        const maximumMessages: Partial<Record<CaseFormField, string>> = {
          areaName: "Keep the area name under 120 characters.",
          addressLine: "Keep address details under 500 characters.",
          siteDescription: "Keep the plot description under 2,000 characters.",
          notes: "Keep additional notes under 4,000 characters.",
        };
        plainMessage = maximumMessages[key as CaseFormField] ?? plainMessage;
      }
      if (key === "areaName" && issue.code === "too_small") plainMessage = "Enter an area name with at least 2 characters.";
      if (key === "siteDescription" && issue.code === "too_small") plainMessage = "Describe the plot in at least 10 characters.";
      if (key === "addressLine" && issue.code === "too_small") plainMessage = messages.addressLine;
      const target = key === "contactPhone" && issue.code === "custom" && issue.message.includes("only used")
        ? "contactPreference"
        : key as CaseFormField;
      if (target === "contactPreference" && key === "contactPhone") plainMessage = "Switch to email contact to omit the phone number.";
      fieldErrors[target] ??= plainMessage;
    }
    else formError ??= "Some request details need attention. Review the form and try again.";
  }
  return { fieldErrors, formError };
}

export function messageForCaseField(field: CaseFormField) { return messages[field]; }
