import type { VerificationCase } from "@/types/verification";

export const customerIntentLabels: Record<NonNullable<VerificationCase["customer_intent"]>, string> = {
  buying: "Buying land",
  own_or_occupy: "Own or occupy land",
  developing: "Developing land",
  representing_someone: "Representing someone",
  other: "Other",
};

export const relationshipToLandLabels: Record<NonNullable<VerificationCase["relationship_to_land"]>, string> = {
  buyer: "Buyer",
  owner: "Owner",
  occupier: "Occupier",
  developer: "Developer",
  agent_or_representative: "Agent or representative",
  other: "Other",
};

export const actingForLabels: Record<NonNullable<VerificationCase["acting_for"]>, string> = {
  self: "Myself",
  another_person: "Another person",
  organisation: "Organisation",
};

export function formatCustomerIntent(value: VerificationCase["customer_intent"]) {
  return value ? customerIntentLabels[value] : "Not recorded";
}

export function formatRelationshipToLand(value: VerificationCase["relationship_to_land"]) {
  return value ? relationshipToLandLabels[value] : "Not recorded";
}

export function formatActingFor(
  value: VerificationCase["acting_for"],
  principalName: string | null,
) {
  if (!value) return "Not recorded";
  const label = actingForLabels[value];
  return value === "self" ? label : `${label}: ${principalName || "Not recorded"}`;
}

export function formatAuthorityConfirmation(
  value: boolean | null,
  actingFor: VerificationCase["acting_for"],
) {
  if (actingFor === "self") return "Not applicable — acting for self";
  if (value === null) return "Not recorded";
  return value ? "Confirmed by customer" : "Not applicable";
}
