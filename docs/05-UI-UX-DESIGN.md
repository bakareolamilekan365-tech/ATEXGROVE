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
