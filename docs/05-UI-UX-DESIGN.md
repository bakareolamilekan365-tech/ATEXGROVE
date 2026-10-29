# Atexgrove — UI/UX Specification

## Design character
Corporate, architectural, technical, trustworthy and modern.

## Palette direction

Status: pilot palette, existing web-ready Atexgrove logo assets and Figtree interface font accepted on 2026-10-14. A true editable logo vector remains desirable for professional print/large-format production but does not block the application.

- Deep navy/blue for navigation and primary actions
- Near-black/charcoal for text
- White, ivory or light grey for surfaces
- Forest green for confirmed/success states
- Warm gold for warnings and review-needed states
- Cool blue accents used sparingly

Use Figtree at weights 400, 500, 600, 700 and 800 for the application interface, matching the approved customer and staff dashboard references. Serve it through the application build rather than adding a browser-side Google Fonts stylesheet.

Avoid excessive gradients, gaming aesthetics, oversized illustrations, childish colors and generic real-estate template layouts.

For the controlled pilot, use an authenticated in-app notification centre plus email for important events such as action required or report ready. Email must not include sensitive document contents or detailed findings; it should direct the user back to the authenticated application. SMS and WhatsApp are future options requiring consent, provider and cost decisions.

## Layout
- Desktop-first information density with excellent tablet/mobile adaptation
- Clear page hierarchy
- Persistent global navigation
- Contextual secondary navigation inside projects
- Generous spacing
- Strong typography
- Functional cards and tables
- Maps used where spatial context matters

## Primary navigation

For the accepted controlled-pilot direction:

- Overview
- Verification cases
- Reports
- Documents
- Profile/settings

Staff with permission may additionally see a work queue, assignments, reviews and audit history. Land discovery, a standalone map, projects, professionals, properties and AI remain planned navigation until their connected data and authorization boundaries are implemented. A site-location map may appear inside a verification case without becoming a public marketplace.

Admin navigation appears only for authorized users and should expose only the responsibilities and scope granted to that administrator. Do not build one unrestricted admin interface.

## Dashboard behavior
The dashboard content should depend on role. Do not show identical dashboards to all account types.

### Approved customer design reference

[`references/ui/Customer dashboard v2.zip`](references/ui/Customer%20dashboard%20v2.zip) is the primary customer visual reference and supersedes `Customer dashboard-html.zip`. Its layout, spacing, customer actions, progress, document-history and activity-feed patterns apply only where real case, evidence and event records exist. Saved/pending evidence must remain visibly distinct from submitted evidence. Mockup names, case numbers, dates, documents and report concepts must never be hard-coded into the product.

### Approved staff design reference

[`references/ui/Staff dashboard.pdf`](references/ui/Staff%20dashboard.pdf) is the updated Verification Lead design reference. The November UI may adopt its professional layout, typography and visual hierarchy while exposing only behavior that exists and is authorized. Mockup concepts such as handovers, second-review approval, team workload/capacity, Staff ID login and authenticator status are **Planned**, not implementation evidence. Different staff responsibilities may later receive distinct content rather than one universal staff dashboard.

`Staff dashboard v2.zip` and `Staff dashboard.pdf` supersede `Staff work queue-html.zip` where they conflict. They are specifically Verification Lead references; Feasibility and Operations Lead experiences remain undefined beyond the real shared queue behavior currently implemented.

## Current shared UI foundation (repository branch, not deployment evidence)

### PR #33 account and progress corrections (2026-10-29)

The circular avatar uses first-name/surname initials and opens a compact account menu containing identity context, Profile, Settings and Sign out. It closes on outside interaction, Escape, navigation and sign-out. Customer and staff Profile pages load existing authorized `profiles` fields; Settings displays email and, for staff, read-only department/role. Profile editing cannot write staff permissions. The sticky header has one compact Light/Dark toggle; Settings has Light/Dark/System. Light is the default when no preference is saved, even on a dark-mode device. An explicitly saved System choice tracks operating-system changes. Light-mode circular controls use white surfaces; dark mode uses a contrasting dark surface.

Only one login request may be pending. While it is pending, login fields, visibility control and conflicting registration/recovery links are unavailable; a failed request restores them. This prevents page flashing or navigation races without changing Supabase authentication or safe `?next=` validation. Expected persistent Supabase sessions are not replaced with an unapproved idle timeout.

Compact progress has four reachable labels: Saved, Submitted, Reviewer assigned and In review. Only milestones supported by current case data or recorded status history are complete. Waiting on you is an amber note on the review milestone. Closed and Cancelled keep the journey visible, then explain the terminal outcome separately. Closure is administrative and must never imply successful land verification. Detailed history remains in the timeline.

Customer Home is an overview of real counts, drafts, action-required requests and customer-safe activity. My Cases is a separate customer-owned list with search and status filters. Discarded drafts are not presented as cancelled requests. Before a server draft exists, device recovery is limited to intent, relationship, area/LGA and site description, is keyed to the user for seven days, and never uploads a file or submits a case.

The current contact form stores one `contact_preference` and an optional consented phone number. Multiple methods, primary/fallback selection, communication-attempt records and fallback behavior are Planned backend work. Do not add a multi-select until its storage, authorization and tests are reviewed.

The `ui/align-approved-design` branch introduces a shared presentation foundation without changing authentication, authorization, case or evidence semantics:

- `SiteHeader` has signed-out, customer and staff states. Staff receive the real queue and the already-supported customer-workspace link, not invented Records, Team or handover routes.
- `LoginForm` is the single email/password form used by `/login`; the public landing page links to the dedicated sign-in and conditional registration routes instead of embedding authentication fields. It preserves full-document post-authentication navigation and safe `?next=` handling.
- `FormCard` standardizes `/login`, `/register`, `/forgot-password` and `/update-password` presentation.
- `PreviewBanner` uses the single `NEXT_PUBLIC_PRIVATE_PREVIEW` flag. When enabled, public registration controls disappear and `/register` explains that approved accounts are required. This is presentation only; Supabase registration policy must be configured separately.
- `ThemeSwitcher` offers a compact Light/Dark control in the header and full Light/Dark/System choices in Settings, stores only the display preference in browser storage, follows operating-system changes in System mode and uses an early inline initializer to reduce incorrect-theme flashing.
- Customer progress, waiting-on-customer actions, document history and activity use real workflow/evidence/event records. Authenticated Help and Profile pages stay inside the customer shell and use existing authorized profile fields.
- Staff tiles and board columns are computed from the seven existing workflow states. Awaiting assignment, In review and Waiting on client show at most five overview cards; Closed and Cancelled show at most three. Every group links to its complete authorized filtered list.
- Evidence upload forms render immediately below the selected one of the five supported categories, identify the selection and announce the chosen filename. Selection does not upload or submit a file; the existing secure direct-upload and explicit release boundaries remain unchanged.
- Dashboard, queue and case-detail loading routes use content-shaped, non-interactive skeletons with higher-contrast surfaces, a restrained reduced-motion-safe colour pulse and accessible loading announcements. Empty, error and successful states remain separate.
- The existing self-hosted Figtree dependency and approved SVG variants under `public/logo` remain the only font and brand sources. Desktop headers show the blue architectural mark with the wordmark; compact/mobile contexts use the mark. Dark theme uses a restrained light brand plate rather than recolouring the supplied blue assets. Construction imagery is never treated as a logo.
- The landing hero uses `public/images/atexgrove-built-environment-hero.webp`; the companion triptych is also stored as WebP. Each retains its original dimensions and is below 300 KB. Both are illustrative AI-generated images made by the project team; the exact tool/date are not recorded. Selected sections use IntersectionObserver-based reveals, but content is visible by default without JavaScript and reduced-motion removes transitions.

### Design tokens

Touched light and dark colours are centralized in `src/app/globals.css`: primary `#0048B0`, hover `#003A91`, primary tint `#E3EDFB`, page/surface/text pairs, and warm warning, customer-supplied, checked and verification semantic pairs. Cards use a 20px radius and the approved two-layer shadow; buttons/nav pills use 999px radii and a 44px minimum target. The interface uses no decorative gradients.

### Responsive and accessibility expectations

The customer container may grow to approximately 1680px with 28px desktop and 16px phone padding. Staff workspaces may grow to 1760px and use additional horizontal space for real queue columns rather than stretching prose. Authentication forms and long-form reading widths remain compact. Staff boards stack into sections on narrow screens. The minimum review widths are 1280px and 390px. Interactive controls need a visible three-pixel blue focus outline, 44px targets, semantic links/buttons/labels, non-colour status text and reduced-motion support.

### Explicitly deferred reference concepts

Handovers, second review, team capacity, Staff ID authentication, authenticator/MFA status, unsupported staff navigation, due dates and notifications remain unimplemented. Styling does not make these product features current.

## Project workspace
Use a persistent project header and tabs:
Overview | Land | Planning | Documents | Professionals | Feasibility

Planning should show a clearly marked “planned module” state until implemented.

## States every important screen needs
- Loading
- Empty
- Error
- Success
- Permission denied
- Not found

Never leave the user with a dead screen after an action.

## Trust-oriented information design

The interface must make the authority of information visible. For land, GIS, documents and verification records, show where relevant:

- verification type and status, rather than one generic “Verified” badge
- verification level/authority: user-submitted, automated, Atexgrove review, professional review, authoritative third party or official/statutory confirmation
- source, jurisdiction, collection/update date and provenance
- confidence, uncertainty, limitations and reviewer/date where available
- whether a capability is **Current Prototype**, **Planned** or **Future**

Atexgrove review must not look like government certification. A map polygon must not be labelled as a legal cadastral boundary without authoritative supporting records. Professional responsibility and Atexgrove platform responsibility should be distinct in copy, labels and assignment states.

## Authorization-aware UX

Document, project, organization and administrative screens should request data only after the server-side authorization decision. Permission-denied, expired-session, not-found and unavailable states must not reveal whether a protected object exists. Display controls according to granted permission for usability, but never treat the UI as the security boundary.

## Documents and private data

Document upload/download views should communicate status, version, reviewer and access scope. Use controlled retrieval for private files, do not display public-looking storage URLs, and make rejection, archive and retention states understandable without implying legal validity.

The case evidence form labels a separate Version 1 as **New document** and a linked correction as **Replacement version**. Replacement selection is limited to the latest version of the selected evidence type; the case page retains the visible version history. Timeline headings use event meaning: a status milestone shows the workflow state, an upload says **Document uploaded**, and a customer reply is shown as a reply rather than another status milestone. Internal notes remain staff-only. Do not imply that draft uploads are visible to staff before submission.

## AI surfaces (Future)

AI interfaces must clearly say when output is advisory. They should distinguish facts from estimates, show uncertainty, identify the source material considered, warn that uploaded content is untrusted, and direct consequential decisions to qualified professionals or official authorities. AI must not appear to approve land, title, planning or safety matters.

## Future mobile and field use

The future mobile client should share the web backend, authentication, authorization and business rules. Construction field workflows may add GPS, photos, document capture and local drafts. Offline capture → synchronization → conflict handling is future architecture, not current prototype behavior; mobile layouts should still preserve the same trust labels and permission boundaries.

## Accessibility
- Semantic HTML
- Form labels
- Keyboard support
- Visible focus states
- Sufficient contrast
- Helpful validation errors

### Shared select and case-form errors

The reusable `Select` control uses a rounded field and a white, softly elevated option panel that inherits the Figtree interface font. It accepts only its listed values: type-ahead moves the active option but never submits arbitrary text. Council and listed-area selection use this control; area selection stays disabled until a council is chosen, changing the council clears the area, and choosing “My area isn't listed” reveals a separate customer-entered field. The selected value is submitted through a hidden input.

The select exposes combobox/listbox semantics, expanded and active-descendant state, selected-option state, and a visible 3px `#0048B0` focus ring. Arrow keys, Home/End, Enter, Escape, pointer selection and outside-click dismissal are supported. Form validation errors must be plain, field-specific messages shown next to the input; associate help/errors using `aria-describedby`, set `aria-invalid`, focus the first invalid field, and preserve entered values after validation failure. Never expose raw schema/library messages.

For the new-case form, the application requires at least 10 characters for Address details (plot/house number, street and nearest landmark), with a 500-character maximum. The existing database constraint remains at 3 characters for compatibility; the stricter minimum is an application validation rule, not a migration or schema change.
