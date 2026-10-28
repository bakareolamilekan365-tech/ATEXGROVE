# Curated system-design references

These external repositories are educational inputs for Atexgrove engineering discussions. They are not build specifications, accepted decisions or evidence of implementation. Apply the workflow and authority distinctions in the [reference index](../README.md) before adopting any idea.

## `liquidslr/system-design-notes`

Repository: [`liquidslr/system-design-notes`](https://github.com/liquidslr/system-design-notes)

Use this as an educational system-design reference for principles and trade-off analysis. Do not copy its architecture into Atexgrove.

### Priority chapters

1. **System Design Framework** — useful for separating requirements and assumptions, sketching a high-level design, choosing deep dives and recording trade-offs before implementation.
2. **Google Drive** — relevant to private evidence upload/download flows, metadata, immutable versions, failure handling and later large-file decisions; it does not describe Atexgrove's current implementation.
3. **S3-like Object Storage** — useful for reasoning about object persistence, metadata, versioning, upload correctness and conservative garbage collection without turning the preview into a custom storage platform.
4. **Back-of-the-Envelope Estimation** — helps make capacity, storage, request/load and growth-trigger assumptions explicit before paying for or adding infrastructure.
5. **Rate Limiter** — a later reference if measured abuse or request-control needs justify a rate-limiting design.
6. **Metrics Monitoring and Alerting System** — a future reference for operational visibility, actionable signals and alert ownership when the product reaches that stage.

### Later-use chapters

- **Scaling** — consult when measured demand exposes a concrete bottleneck; it is not permission to introduce premature distributed architecture.
- **Notification System** — relevant only when an accepted workflow needs reliable user or staff notifications.
- **Google Maps** — later GIS reasoning must still preserve Atexgrove's distinction between contextual maps, survey data and official boundaries.
- **Payment System** — future payment work must remain a separate reviewed domain with provider abstraction, verified webhooks and idempotency.

None of these systems is claimed as currently implemented by Atexgrove.

## `donnemartin/system-design-primer`

Repository: [`donnemartin/system-design-primer`](https://github.com/donnemartin/system-design-primer)

This repository is mainly useful for evaluating trade-offs and avoiding premature complexity.

### Priority sections

- [How to approach a system-design problem](https://github.com/donnemartin/system-design-primer#how-to-approach-a-system-design-interview-question) — a reusable way to clarify use cases, constraints and assumptions before selecting components.
- [Performance vs scalability](https://github.com/donnemartin/system-design-primer#performance-vs-scalability) — helps distinguish a measured performance problem from a genuine scaling requirement.
- [Availability vs consistency](https://github.com/donnemartin/system-design-primer#availability-vs-consistency) — supports explicit failure and data-correctness choices for evidence, status and audit workflows.
- [Database](https://github.com/donnemartin/system-design-primer#database) — useful for comparing persistence choices while retaining PostgreSQL/Supabase as the current architecture unless an accepted decision changes it.
- [Security](https://github.com/donnemartin/system-design-primer#security) — a checklist input for threat analysis, least privilege and defense in depth, not a substitute for Atexgrove's security specifications and tests.

### Later-use sections

- [Cache](https://github.com/donnemartin/system-design-primer#cache) — consider only when measurements identify repeat-read cost or latency worth the invalidation complexity.
- [Asynchronism](https://github.com/donnemartin/system-design-primer#asynchronism) — useful if accepted long-running work later needs background processing and explicit failure states.
- [Load balancer](https://github.com/donnemartin/system-design-primer#load-balancer) — relevant only when deployment topology and measured load require it.
- [REST](https://github.com/donnemartin/system-design-primer#representational-state-transfer-rest) and [RPC](https://github.com/donnemartin/system-design-primer#remote-procedure-call-rpc) — useful for evaluating service boundaries without forcing a microservice redesign.

## Licensing and reuse

- Prefer linking rather than copying external content.
- Do not copy diagrams or substantial text unless licensing and attribution requirements are explicitly satisfied.
- The System Design Primer uses [CC BY 4.0](https://github.com/donnemartin/system-design-primer/blob/master/LICENSE.txt), so copied or adapted material would require attribution.
- Keep use of `liquidslr/system-design-notes` link-based unless its licensing is clearly confirmed.

No external repository content is stored in Atexgrove through this index.
