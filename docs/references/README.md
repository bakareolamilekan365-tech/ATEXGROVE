# Atexgrove reference index

This directory keeps supporting material discoverable without confusing reference material with accepted architecture or implemented behavior.

## Reference categories

### Owner/domain references

[`owner/`](owner/) contains material supplied or approved for Atexgrove's product and domain direction. It provides context for requirements and decisions but does not override the current specifications, decision log or implementation.

### UI references

[`ui/`](ui/) contains dashboard, work-queue and visual-design references. These are design references only and must not be treated as evidence that a feature, control or workflow is implemented.

For current UI work, [`ui/Customer dashboard v2.zip`](ui/Customer%20dashboard%20v2.zip) supersedes `Customer dashboard-html.zip` as the customer visual reference. `Staff dashboard v2.zip` and `Staff dashboard.pdf` are the current **Verification Lead** visual references; they do not define Feasibility or Operations Lead behavior. The older customer and staff files remain historical references where they do not conflict with the current versions.

### Engineering/system-design references

[`system-design/`](system-design/) indexes selected external material used to reason about architecture, scalability, storage, reliability, security and trade-offs. External repositories are linked rather than copied.

> External references are non-authoritative. They do not automatically become Atexgrove requirements, architecture decisions or implementation commitments.

## Reference, decision, implementation and status

- **Reference** — external or supporting material used for learning and reasoning.
- **Decision** — an accepted Atexgrove choice recorded in [`../DECISIONS.md`](../DECISIONS.md).
- **Implementation** — behavior actually provided by repository code and reviewed database migrations.
- **Status** — current implementation, deployment and verification state recorded in [`../STATUS.md`](../STATUS.md).

This index does not duplicate the decision log or current status record.

## How Atexgrove uses references

```text
Learn
  ↓
Compare with Atexgrove requirements
  ↓
Evaluate alternatives and trade-offs
  ↓
Record accepted decision in DECISIONS.md
  ↓
Implement
  ↓
Test / verify
  ↓
Update STATUS.md and affected specs
```

Reading a reference never changes the project architecture by itself.

## Documentation-maintenance rule

When an architecture change is significant, record what changed, why it changed, alternatives considered, accepted trade-offs, failure and security implications, verification evidence and remaining limitations. Small code edits do not each require a formal architecture record.
