export const verificationCaseStatuses = [
  "draft",
  "submitted",
  "assigned",
  "in_review",
  "needs_customer_info",
  "closed",
  "cancelled",
] as const;

export type VerificationCaseStatus =
  (typeof verificationCaseStatuses)[number];

export type StaffDepartment = "Verification" | "Feasibility" | "Operations";

export const caseStatusEventKinds = [
  "status_change",
  "staff_note",
  "customer_message",
  "information_requested",
  "customer_response",
  "document_uploaded",
] as const;

export type CaseStatusEventKind = (typeof caseStatusEventKinds)[number];

export type VerificationCase = {
  id: string;
  customer_user_id: string;
  created_by_user_id: string;
  creation_channel: "customer";
  jurisdiction: "Abuja/FCT";
  department: StaffDepartment;
  site_description: string;
  area_lga: string;
  area_name: string | null;
  area_is_listed: boolean | null;
  address_line: string | null;
  contact_phone: string | null;
  contact_phone_consent: boolean;
  customer_notes: string | null;
  contact_preference: "email" | "phone" | "whatsapp";
  current_stage: "Request received";
  workflow_status: VerificationCaseStatus;
  assigned_lead_user_id: string | null;
  idempotency_key: string | null;
  discarded_at: string | null;
  customer_intent: "buying" | "own_or_occupy" | "developing" | "representing_someone" | "other" | null;
  relationship_to_land: "buyer" | "owner" | "occupier" | "developer" | "agent_or_representative" | "other" | null;
  acting_for: "self" | "another_person" | "organisation" | null;
  principal_name: string | null;
  authority_confirmed: boolean | null;
  case_number: string | null;
  information_request_event_id: string | null;
  is_demo_data: boolean;
  created_at: string;
  updated_at: string;
};

export type CaseStatusEvent = {
  id: string;
  verification_case_id: string;
  actor_user_id: string;
  from_status: VerificationCaseStatus | null;
  to_status: VerificationCaseStatus;
  reason: string;
  customer_visible: boolean;
  event_kind: CaseStatusEventKind;
  response_to_event_id?: string | null;
  created_at: string;
};

export type StaffMember = {
  user_id: string;
  department: StaffDepartment;
  is_lead: boolean;
  active: boolean;
};

export type CaseEvidence = {
  id: string;
  verification_case_id: string;
  uploaded_by_user_id: string;
  evidence_type: "title_deed_copy" | "survey_plan_copy" | "receipt" | "seller_id" | "other";
  description: string;
  source: "customer_supplied";
  storage_path: string;
  original_filename: string;
  mime_type: "application/pdf" | "image/jpeg" | "image/png";
  size_bytes: number;
  version: number;
  supersedes_evidence_id: string | null;
  review_state: "received_unreviewed";
  submitted_at: string | null;
  submission_event_id: string | null;
  is_demo_data: true;
  created_at: string;
};
