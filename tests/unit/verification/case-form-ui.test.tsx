import { describe, expect, it } from "vitest";
import { findTypeaheadOption, nextSelectIndex, selectSubmittedValue } from "@/components/ui/Select";
import { mapCaseFormIssues } from "@/lib/verification-cases/form-errors";
import { caseLocationDisplay, LEGACY_LOCATION_NOTE } from "@/lib/verification-cases/location-display";
import { newVerificationCaseSchema } from "@/lib/verification-cases/validation";

const options = [{ value: "AMAC", label: "AMAC" }, { value: "Bwari", label: "Bwari" }, { value: "Kuje", label: "Kuje" }];

describe("case form UI helpers", () => {
  it("supports list keyboard navigation and type-ahead without committing free text", () => {
    expect(nextSelectIndex(0, "ArrowDown", 3)).toBe(1);
    expect(nextSelectIndex(0, "ArrowUp", 3)).toBe(2);
    expect(nextSelectIndex(2, "Home", 3)).toBe(0);
    expect(nextSelectIndex(0, "End", 3)).toBe(2);
    expect(findTypeaheadOption(options, "k")).toBe(2);
    expect(findTypeaheadOption(options, "unknown")).toBe(-1);
    expect(selectSubmittedValue(options, "AMAC")).toBe("AMAC");
    expect(selectSubmittedValue(options, "free text")).toBe("");
    expect(selectSubmittedValue(options, "unknown")).toBe("");
  });

  it("maps schema issues to field-specific plain messages, never raw schema text", () => {
    const result = newVerificationCaseSchema.safeParse({ areaLga: "Not a council", areaName: "", addressLine: "short" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const mapped = mapCaseFormIssues(result.error.issues);
    expect(mapped.fieldErrors.areaLga).toBe("Choose one of the six FCT area councils from the list.");
    expect(mapped.fieldErrors.areaName).toContain("area name");
    expect(mapped.fieldErrors.addressLine).toContain("at least 10 characters");
    expect(JSON.stringify(mapped)).not.toMatch(/Invalid option|expected|received/i);

    const emailWithPhone = newVerificationCaseSchema.safeParse({
      idempotencyKey: "11111111-1111-4111-8111-111111111111", siteDescription: "A valid plot description",
      areaLga: "Kuje", areaName: "Kuje", areaIsListed: true, addressLine: "Plot 1, near Kuje market",
      notes: "", contactPreference: "email", contactPhone: "08012345678", contactPhoneConsent: false,
    });
    expect(emailWithPhone.success).toBe(false);
    if (!emailWithPhone.success) {
      const emailMapped = mapCaseFormIssues(emailWithPhone.error.issues);
      expect(emailMapped.fieldErrors.contactPreference).toContain("Switch to email");
      expect(emailMapped.fieldErrors.contactPhone).toBeUndefined();
    }
  });

  it("shows council-only location and legacy note when detailed location is null", () => {
    expect(caseLocationDisplay(null, "Kuje")).toEqual({ heading: "Kuje, Abuja", legacy: true, note: LEGACY_LOCATION_NOTE });
    expect(caseLocationDisplay("Kuje", "Kuje")).toEqual({ heading: "Kuje, Kuje, Abuja", legacy: false, note: null });
  });
});
