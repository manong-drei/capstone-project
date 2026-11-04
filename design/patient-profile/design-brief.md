# E-KALUSUGAN patient profile — design proposal

Initial concepts created November 4, 2026. The application has since been implemented with the user's requested simplification. The original images and the proposal below are retained as historical references, not the current implementation specification.

## Implemented revision

- One card combines the patient's name, record ID, registration type, date of birth, gender, mobile number, and address.
- Removed the Overview, Visit history, and Consultations tabs. There is no tab strip.
- Removed PhilHealth, emergency contact, and Today's visit from the profile.
- Kept Recent visits below the patient card, using a table on desktop/laptop and stacked visit items on mobile.
- Recent visits displays 10 records per page, with Previous/Next controls, a record range, and a page count. Pagination resets when opening another patient and uses the records already loaded.
- The back button sits to the right of the page title on desktop/laptop and below it on mobile, matching the other dashboard pages. It keeps the appropriate destination for each role.
- Reused the blue dashboard header, white cards, orange accent, existing account recovery, and eligible duplicate-record merge flow.
- Added doctor/admin profile routes and patient-name links. Doctor access follows the existing doctor's visit ownership rules and does not return account-recovery credentials. Staff/admin retain their existing account tools.
- Desktop uses four detail columns; smaller screens use two columns where space allows and one column at narrow widths. Long values wrap.

Current routes: `/doctor/patients/:id`, `/staff/patients/:id`, `/admin/patients/:id`. The existing staff profile URL remains usable by admins for compatibility.

Verified implementation screenshots: [Desktop](implemented-desktop.png), [Laptop](implemented-laptop.png), [Mobile](implemented-mobile.png). These use fictional test data. The images listed under Mockups below predate these changes.

Validation: the latest UI revision passes the production build, targeted lint, and 30 browser tests, including pagination at 1440, 1024, 390, and 320px. Server tests were not rerun for this UI-only revision; the previous run passed 13 server tests. The optional live-MySQL integration test was not run. No dependencies or database migrations were added.

## Mockups

- [Desktop — doctor example](patient-profile-desktop.png)
- [Laptop — staff example](patient-profile-laptop.png)
- [Mobile — admin example](patient-profile-mobile.png)

These are examples of one shared profile at different sizes. Device size does not determine the user's role: doctors, staff, and admins would each receive the responsive layout appropriate to their screen. The top navigation and available actions follow the signed-in role. All patient information is fictional sample data.

## Visual direction

Match the existing doctor and staff dashboards: blue top navigation, Poppins type, light gray page canvas, white cards with thin borders, 16px card corners, modest shadows, and orange accents. Retain existing dashboard branding when implementing; the emblem in these generated concepts is illustrative.

| Purpose | Color |
| --- | --- |
| Navigation | #1A3A8F → #1E4DB7 |
| Primary actions and active tab | #1E4DB7 |
| Card surface | #FFFFFF |
| Page canvas | #F1F5F9 |
| Queue emphasis and profile accent | #F97316 |
| Soft orange surface | #FFF7ED |
| Main text | #172B4D |
| Secondary text | #64748B |
| Dividers | #E2E8F0 |

Use explicit text labels alongside status colors. Patient names, addresses, and services must wrap.

## Shared information hierarchy

1. Return link to the originating dashboard or patient history.
2. Patient profile title and a compact identity card: initials, full name, registration type, patient ID, age, gender, contact number, and address.
3. Overview and Visit history sections, with role-specific Consultations or Account sections.
4. Today's visit: date, appointment/walk-in type, queue ticket, regular/priority classification, services, and explicit status.
5. Personal information: birth date, gender, contact details, address, and masked PhilHealth identifier.
6. Emergency contact: name and contact number.
7. Recent visits with a link to the complete patient history.

Keep account tools out of the main identity card. Avoid adding unsupported vitals, allergies, clinical scores, billing, or a fabricated next appointment. Clinical data belongs in authorized consultation details, rather than the general overview.

## Responsive behavior

| Target | Proposed behavior |
| --- | --- |
| Desktop, approximately 1440–1920px | Full existing role navigation. Wide identity card. Personal information and today's visit side by side, roughly 2:1. Full-width visit table below. |
| Laptop, approximately 1024–1439px | Smaller page gutters and denser spacing. Retain two content columns while fields can wrap. Compact navigation follows existing dashboard behavior. Secondary account card fits beneath the current visit. |
| Mobile, approximately 360–767px | Compact header and menu, 16px page gutters, single column. Identity then tabs, today's visit, personal information, emergency contact, and recent visits. Replace the visit table with stacked visit items. |
| Tablet and intermediate widths | Switch to a single column when two cards cannot maintain readable field widths. Do not simply shrink desktop text. |

Mobile personal information does not repeat the name, phone, and address already displayed in the identity card. All information remains available on every device. Use a minimum 44px action target, 14px body text, clear keyboard focus, and sufficient bottom spacing. Allow local tab scrolling at narrow widths without page overflow.

## Proposed role behavior

| Role | Shared patient details | Additional view/actions |
| --- | --- | --- |
| Doctor | Identity, contact, emergency contact, services, current visit, and history | Consultations tab; open authorized saved consultations. A waiting visit has View visit. Consultation entry becomes available through the existing serving-patient workflow. |
| Staff | Same shared patient details | Operational visit details, Account tab, account state, and existing identity-verified recovery workflow. Do not expose consultation notes by default. |
| Admin | Same shared patient details | Account tab and existing account-management/recovery actions. Keep clinical notes permission-controlled. |

These are proposed UI permissions, not an implemented access policy. Existing duplicate-record merge constraints should be preserved in any future Account screen: show the option only for an eligible unlinked, unarchived walk-in record and present its consequences before confirmation. The pictured registered patient is not eligible, so no merge control is shown.

The current patient detail route is shared by staff/admin. Doctor access and an appropriate entry point would need to be wired during a later implementation; this design does not change access checks. The concept's View visit and Manage account links indicate future interactions, not completed functionality.

## Intended detail states

- Overview: the supplied mockups.
- Visit history: complete dated list; desktop table and mobile cards, preserving queue, service, visit type, status, and a visit link.
- Consultations: doctor's authorized saved notes, diagnosis, and prescription/recommendations, using the current consultation structure.
- Account: eligible account state and in-person recovery entry. Verification and temporary credentials appear only inside the recovery flow.
- Missing information: show “Not recorded”; never substitute a fabricated value.
- No visits: “No visits recorded yet.”
- No current visit: “No active visit today.”
- Archived/merged record: identify the archive and link to the destination patient.
- Loading/error: retain the shared dashboard shell and use the existing loading and retry patterns.

## Deliverable notes

Generated with the built-in image-generation tool, then reviewed visually. The mobile design was refined to a narrow 1:3 canvas with stacked information and readable visit items. These are static concept images; exact spacing and responsive interaction would be verified during implementation.

The exact prompt set, including the final mobile refinement, is in [generation-prompts.md](generation-prompts.md).

