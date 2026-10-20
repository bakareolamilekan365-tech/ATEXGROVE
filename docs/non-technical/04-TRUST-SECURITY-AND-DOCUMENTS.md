# Trust, security, and documents

## The central promise

Atexgrove should help people understand what is known, who supplied it, who reviewed it, and what remains uncertain. It must not turn an unverified claim into an official-looking fact.

## Different kinds of trust

Trust must not be compressed into one general "Verified" badge. Important information should show three separate things:

- **Source:** who or what supplied it, such as a customer, seller, professional, external provider or official source.
- **Review state:** not reviewed, under review, clarification required, reviewed, rejected or inconclusive.
- **Authority level:** user-submitted, automated check, Atexgrove review, professional review, authoritative third-party confirmation or official/statutory confirmation.

The outcome may separately say that information is consistent, contains a discrepancy, is confirmed within a stated scope or is not confirmed. These labels, limitations and dates must remain visible throughout the case and report.

## Access rules

A person should only see or change information allowed by their relationship to it. Examples include:

- a customer accessing their own case;
- an organization member accessing the organization's permitted work;
- assigned staff processing a case;
- an administrator performing only the duties granted to that administrator.

Being called an administrator must not automatically give unlimited access to everything.

## Organization protection

The security work prevents common abuses such as:

- creating an organization already marked as verified;
- creating an organization in another person's name;
- promoting oneself to platform administrator;
- allowing an organization administrator to silently remove or demote an owner;
- leaving an organization without any owner.

## Private documents

See [../STATUS.md](../STATUS.md) for the current hosted Storage policy and verification evidence. The product rule remains: documents are private, retrieval is authorized and audited, versions are preserved, and storage never makes evidence verified or official.

## Current security boundary

See [../STATUS.md](../STATUS.md) for the single current record of deployed security controls, accepted advisor items and remaining operational verification; none of that evidence is a production-readiness claim.

## Audit history

Sensitive actions should leave a useful history: who acted, what changed, when it happened, and which record was affected. The project will not attach custom database triggers to Supabase's managed Storage table. Document-related audit records will be created through the Atexgrove application workflow.

## Free-plan limitation

The first prototype remains on Supabase Free. The exact availability and cost of leaked-password protection must be confirmed in the connected Supabase dashboard before the finding is formally accepted as a plan limitation. Any future feature that requires a paid plan must be clearly labelled before it becomes a commitment.

## Real documents

The decision is to begin with synthetic or properly redacted evidence. Real customer documents may be accepted later only after Atexgrove has implemented and appropriately reviewed:

- a Privacy Notice and Terms of Service;
- explicit pilot/document-processing consent and a record of what was accepted;
- disclosure of essential cookies and opt-in choice for any optional cookies;
- minimum-necessary staff access;
- retention, deletion and backup-handling rules;
- complaints, data-request and security-incident processes; and
- clear professional, verification and authority limitations.

AI will not process real pilot documents. Storing or reviewing a document does not make it legally valid or officially confirmed.

