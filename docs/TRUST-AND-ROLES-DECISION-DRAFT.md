# Trust labels and roles

Status: pilot direction accepted on 2026-10-14. Exact professional qualification criteria, named reviewers and the full permission matrix still require domain/legal input before real cases.

## 1. Information-source labels (from blueprint s.4)
Do not compress trust into one "Verified" badge. Show three separate dimensions where relevant:

1. **Source:** customer/seller supplied, professional supplied, authoritative third party, or official/statutory source.
2. **Review state:** not reviewed, under review, clarification required, reviewed, rejected, or inconclusive.
3. **Authority level:** user-submitted, automated check, Atexgrove review, professional review, authoritative third-party confirmation, or official/statutory confirmation.

An outcome may additionally state that information is consistent, contains a discrepancy, is confirmed within a stated scope, or is not confirmed. Each label needs source, date, reviewer, jurisdiction, scope and limitations where applicable.

Rules:

- An unreviewed document or AI output is never presented as official confirmation of ownership, title or approval.
- Atexgrove review does not become professional or statutory confirmation through wording or visual design.
- Unsupported or conflicting evidence remains inconclusive or awaiting confirmation.
- Every consequential review identifies the exact document version and evidence considered.

## 2. Professional verification labels (blueprint s.10)

The earlier labels `Fully Verified`, `Proven Professional` and `Emerging Professional` are not approved for use because they can combine identity, qualifications, experience and platform review into ambiguous claims. Professional status must instead identify the exact fact checked, source/register, reviewer, date, jurisdiction, expiry where applicable and limitations. The relevant regulator or professional body depends on the discipline.

Exact qualification and register-check rules remain open and require domain/legal review. A professional verification record never implies a guarantee of workmanship, honesty, legal outcome or future performance. The planned minimal review record [P-30](BACKLOG.md#p-30) is entered by staff and captures reviewer name, discipline, credential relied on, source and check date, assigned scope and decision; it is labelled “recorded by Atexgrove, not independently verified” and does not require an external login. Fuller expiry, re-verification and engagement workflows are later [P-31](BACKLOG.md#p-31) work.

## 3. Pilot review and assignment roles
Current schema: account_type in buyer, landowner, developer, professional, admin (self-selected except admin).
Principle: ROLE is not VERIFICATION is not PERMISSION.
The pilot has no established staff team yet. The founder/CTO may act as lead/operator, but the design must preserve separate responsibilities instead of creating an unrestricted admin shortcut.

- Customers may create cases; authorized staff may create assisted cases with customer consent and a recorded actor/channel.
- A human lead confirms assignments. Automation may recommend an assignee but cannot silently assign or approve a case.
- An assignee may decline when overloaded, with the reason recorded.
- Consequential conclusions require a second, discipline-appropriate reviewer: for example, a registered surveyor for survey matters, a qualified Nigerian legal practitioner for legal/title interpretation, or an appropriately qualified planner for planning matters.
- Official/statutory evidence is recorded as a separate authority level; it is not manufactured by two internal reviews.

The exact permission matrix and named/contracted reviewers remain open and must be settled before real cases.

## 4. Planned staff and professional operating model

Everything in this section is **Planned**, not implemented. See the linked [master backlog](BACKLOG.md) for triage and status.

- **Staff structure and authority — [S-24](BACKLOG.md#s-24), [S-64](BACKLOG.md#s-64):** distinguish departments from teams, define team membership and availability, and specify separate Team Lead and Department Lead scopes.
- **Staff lifecycle and access — [S-61](BACKLOG.md#s-61), [S-62](BACKLOG.md#s-62), [S-44](BACKLOG.md#s-44), [S-45](BACKLOG.md#s-45), [S-46](BACKLOG.md#s-46), [S-48](BACKLOG.md#s-48), [S-49](BACKLOG.md#s-49):** invite and offboard staff through authorized flows; define action-level permissions, access review, expiring elevation, second approval for sensitive actions and reasoned/audited overrides.
- **Assignment and collaboration — [S-a](BACKLOG.md#s-a), [S-26](BACKLOG.md#s-26), [S-c](BACKLOG.md#s-c), [S-72](BACKLOG.md#s-72), [S-73](BACKLOG.md#s-73), [S-74](BACKLOG.md#s-74):** capture conflicts, route accepted handovers, track due dates and internal targets, and keep staff discussion/tasks separate from customer-visible events.
- **Professional context and records — [P-10](BACKLOG.md#p-10), [P-11](BACKLOG.md#p-11), [P-12](BACKLOG.md#p-12), [P-30](BACKLOG.md#p-30), [P-31](BACKLOG.md#p-31), [P-33](BACKLOG.md#p-33):** keep professional capacity separate from staff permissions; the Phase 2/3 minimum is a staff-entered, explicitly unverified review record, while credential lifecycle and engagement workflow remain later work.
- **External professional access — [P-d](BACKLOG.md#p-d), [P-32](BACKLOG.md#p-32), [P-50](BACKLOG.md#p-50), [P-63](BACKLOG.md#p-63):** no external professional receives general case access. Any future access is per assignment, limited to selected documents, time-limited, immediately revocable and audited. No documents may be shared externally before the case-specific consent record and D readiness gate. The open Phase 3 decision is whether professionals log in or staff attach their reviews. Basic confidentiality acceptance is planned for Phase 3; final terms require lawyer review before real-user readiness.
- **Professional work lifecycle — [P-24](BACKLOG.md#p-24), [P-27](BACKLOG.md#p-27), [P-28](BACKLOG.md#p-28), [P-55](BACKLOG.md#p-55), [P-60](BACKLOG.md#p-60):** preserve versions and sign-offs, have staff check scope completion, allow correction and replacement, and end engagements without erasing history.

## 5. Real-document readiness

Synthetic or properly redacted evidence is the default for demonstrations and early workflow testing. Real documents are blocked until the Privacy Notice, Terms of Service, explicit consent record, cookie treatment, access controls, retention/deletion procedure, incident response, processor controls and appropriate Nigerian legal/privacy review are complete.

AI must not process real pilot documents. A synthetic demonstration may show an advisory draft, but it cannot change verification state or appear to authenticate evidence.
