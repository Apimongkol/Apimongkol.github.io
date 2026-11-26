# Portfolio Profile Website Specification

> Status: `ready-for-agent`

## Problem Statement

Apimongkol Somjai is a fourth-year Finance and Investment student at Ubon Ratchathani University seeking a finance, credit analysis, or data analytics internship. Currently, his credentials are scattered across a static PDF resume, four separate certificate PDFs (with mixed English and Thai filenames), a profile portrait, and a raw profile metadata file. Recruiters and hiring managers have no single, clean, web-accessible place to review his background, verify his credentials, inspect his certificates, and download his CV quickly from either desktop or mobile.

## Solution

Create a calm, high-craft personal portfolio profile website in English, hosted on GitHub Pages as a standalone compiled HTML page styled with Tailwind CSS. Taking structural inspiration from a two-column profile layout (full-width minimalist cover banner, overlapping circular avatar, structured left sidebar with contact and skill metadata, and clean bordered content cards on the right), the site presents Apimongkol's professional summary, work experience, verified certificates, activities, and tools/skills in one scannable page. Recruiters can preview the CV and every certificate directly inside an embedded PDF modal (with mobile-friendly open-in-new-tab, download, and external credential verification actions) and copy his email address in one click.

## User Stories

1. As a finance recruiter, I want to immediately see Apimongkol Somjai's full name (spelled accurately as "Apimongkol Somjai"), academic degree, university, and internship objective above the fold, so that I can verify his relevance for an internship role within seconds.
2. As a finance recruiter, I want a clean, distraction-free minimal top header with section jump links (About, Experience, Certificates, Activities) and a direct Download CV button, so that I can navigate quickly without unnecessary web-app clutter.
3. As a finance recruiter, I want a calm, minimalist light cover banner paired with an overlapping circular portrait photo, so that the profile feels polished, trustworthy, and tailored to a finance candidate rather than generic or overly flashy.
4. As a finance recruiter, I want a primary CV action button positioned prominently directly beneath the candidate's name in the left sidebar, so that I can preview or download his resume immediately.
5. As a finance recruiter, I want a structured About card in the left sidebar showing his degree ("B.B.A. Finance & Investment"), university ("Ubon Ratchathani University"), availability status ("Seeking Finance Internship"), and location ("Ubon Ratchathani, Thailand"), so that I can confirm core eligibility facts at a glance.
6. As a finance recruiter, I want to see the candidate's email address and phone number in a dedicated Contact section in the left sidebar, so that I can reach out to schedule an interview.
7. As a finance recruiter, I want a one-click Copy button next to the email address with brief visual confirmation feedback, so that I can paste his email into my recruiting tool without manual text selection errors.
8. As a finance recruiter, I want the email and phone number to also work as standard mailto and tel links, so that I can initiate contact directly from my device.
9. As a finance recruiter, I want to view categorized Tools and Skills in the left sidebar (technical tools: Microsoft Excel, Power BI, SQL, IBM SPSS, Microsoft PowerPoint, Microsoft Word; finance and analytical skills: Financial Data Analysis, Expense & Cost Analysis, Managerial Accounting; personal skills: Problem Solving, Time Management, Adaptability), so that I can evaluate his technical and analytical fit quickly.
10. As a finance recruiter, I want to read a concise Professional Summary card at the top of the right-hand main column, so that I understand his career focus in financial analysis, credit analysis, and data analytics.
11. As a finance recruiter, I want to review his Work Experience in a clean bordered card listing role title, organization context, date range, and concise responsibility bullet points for both "Finance Assistant (Family-Owned Fuel Station)" (2019 – Present) and "Part-Time Server Restaurant" (May 2023), so that I can assess his practical accountability and work ethic.
12. As a finance recruiter, I want to browse all four earned certificates in a dedicated Certificates card showing title, issuing organization, and issue date where applicable ("Microsoft Excel Proficiency Assessment" from Ubon Ratchathani University on 20 March 2026, plus Common-learn certificates for "Data Analytics For Business", "Data Governance For People", and "Prompt Engineering"), so that I can verify his continuous learning in Excel, data analytics, data governance, and AI tools.
13. As a finance recruiter, I want to click any certificate row to open an embedded PDF preview modal right on the page, so that I can inspect the official document without losing my place on the profile.
14. As a finance recruiter, I want to click the Preview CV action to view the candidate's full PDF resume inside the same embedded PDF preview modal, so that I can inspect the formatted CV before downloading it.
15. As a mobile recruiter, I want clear "Open in New Tab" and "Download PDF" actions inside the PDF preview modal, so that I can still view or save any document smoothly even if my mobile browser does not render inline PDF iframes.
16. As a finance recruiter, I want a "Verify Credential" link on each of the three Common-learn certificates (accessible from the certificate entry and/or inside its preview modal) that opens the official Common-learn verification URL in a new tab, so that I can independently confirm authenticity.
17. As a finance recruiter, I want certificates that do not have an external verification URL (specifically the Ubon Ratchathani University Excel certificate) to omit the verification button cleanly, so that there are never broken or misleading links.
18. As a finance recruiter, I want to close the PDF preview modal by clicking the Close button, clicking the dimmed backdrop outside the modal, or pressing the Escape key, so that dismissing a document feels natural and effortless.
19. As a keyboard user, I want background page scrolling to pause while the PDF modal is open and keyboard focus to return cleanly to the triggering element when the modal closes, so that navigation stays predictable and accessible.
20. As a finance recruiter, I want to see the candidate's extracurricular Activities in a bordered card covering the "Financial Study Tour" (Bank of Thailand and Stock Exchange of Thailand, May 2024), "Volunteer – 26th Education Fair" (July 2024), and "19th Political Science Community Development" (Volunteer Camp at Ban Samrong School, Ubon Ratchathani, March 2023), so that I can gauge his engagement, teamwork, and exposure to real financial institutions.
21. As a finance recruiter on a smartphone or tablet, I want the two-column desktop layout to gracefully stack into a single clean vertical column with zero horizontal overflow, so that all text, buttons, and cards remain comfortable to read and tap.
22. As a finance recruiter, I want every certificate document—even those whose underlying filenames contain Thai characters, spaces, em-dashes, or parentheses—to load reliably without broken URLs when hosted on GitHub Pages.
23. As the portfolio owner, I want no empty or "Coming Soon" Works/Projects section shown while my works folder is empty, so that my portfolio looks complete and intentional today.
24. As the portfolio owner, I want the page structure and markup organized cleanly so that adding a Works/Projects card later requires minimal effort without redesigning the page.
25. As the portfolio owner, I want the site built into a standalone HTML page with compiled Tailwind CSS inlined directly into the document (no runtime Tailwind CDN script), so that it loads fast on GitHub Pages and works reliably out of the box.
26. As the portfolio owner, I want the source code to stay simple, well-structured, and easy to read with a single straightforward build command, so that I can edit text or add new experience and certificates myself in the future.
27. As a visitor with a slow connection, I want the page to use lightweight system/clean typography, crisp vector icons, and properly sized static images so that the portfolio renders almost instantaneously.

## Implementation Decisions

- **Language and Positioning**: All visible website copy is written in clear, professional English aligned with the CV and targeted at finance, credit analysis, and data analytics internship recruiters. The candidate's first name is standardized to "Apimongkol Somjai" (correcting the typo in the raw profile YAML).
- **Layout Architecture**: Adopt the asymmetric two-column profile layout from the reference design:
  - A minimal sticky or static top header bar containing the candidate's name, smooth-scroll section links (About, Experience, Certificates, Activities), and a primary Download CV button. No faux application chrome (no fake Jira menus, search bars, or trial badges).
  - A full-width, calm minimalist light cover banner generated specifically for this profile (evoking serene sunlit water or soft architectural light) serving as the single rich visual focal point on the page.
  - A circular portrait avatar overlapping the bottom-left edge of the cover banner with a crisp white ring border.
  - A left sidebar column (~280–320px on desktop) containing the candidate's name, subtitle/status, primary CV CTA button, and clean bordered cards for About, Contact (with Copy Email interaction), and Tools & Skills.
  - A right main content column containing vertically stacked, light bordered cards for Professional Summary, Work Experience, Certificates, and Activities.
  - Responsive breakpoint collapses the two columns into a single well-spaced vertical flow on smaller viewports.
- **Visual Craft Direction**: Follow disciplined anti-slop UI craft—quiet chrome, crisp white surfaces with subtle 1px neutral borders, tinted slate/warm neutrals, and one restrained corporate finance blue accent color. Avoid decorative purple gradients, glowing effects, pulsing animations, gradient text, or emoji labels. Use clean, consistent monochrome line icons for metadata and document rows.
- **Content Scope & Data Normalization**:
  - Omit the Works/Projects section for now since no project deliverables exist yet, while keeping section markup modular so a Works card can be appended cleanly later.
  - Include all verified content from the CV, profile YAML, and the four certificate PDFs (with chronological ordering where appropriate, newest first within Experience and Activities).
  - Preserve original user PDF files untouched and ensure all document URLs referenced by links and the modal iframe are properly percent-encoded so special characters, spaces, and Thai filenames resolve reliably on GitHub Pages.
- **Document Preview Modal Module**:
  - Implement a lightweight, vanilla JavaScript modal controller embedded directly in the standalone page (no heavy frontend framework).
  - Interface contract: any interactive trigger element declares document metadata (document title, subtitle/issuer, encoded PDF URL, download filename, and optional external verification URL). Activating the trigger populates and opens the shared modal dialog.
  - The modal renders an embedded PDF `<iframe>`, header with document title and close button, and action bar containing "Open in New Tab", "Download", and conditional "Verify Credential" (rendered only when a verification URL is provided).
  - Manage accessibility state cleanly: `role="dialog"`, `aria-modal="true"`, Escape-key dismissal, backdrop-click dismissal, body scroll lock while open, clearing `iframe` `src` on close, and restoring focus to the invoking trigger.
- **Copy Email Interaction**:
  - Lightweight vanilla JavaScript click handler using the Clipboard API (with a graceful fallback if unavailable) that updates the button label/state briefly (e.g., "Copied") before resetting.
- **Build & Packaging Architecture**:
  - Use Tailwind CSS compiled via a simple, readable build workflow that outputs a standalone HTML page with compiled CSS inlined into a `<style>` block (eliminating any runtime Tailwind CDN script dependency).
  - Reference static assets (portrait photo, generated cover banner, CV PDF, and four certificate PDFs) via relative paths so the entire repository deploys directly to GitHub Pages with zero server-side requirements.
  - Keep code simple, flat, semantic, and easy to read per project rules.

## Testing Decisions

- **What Makes a Good Test**: Tests verify only external, user-visible behavior and HTTP/DOM contracts—never internal CSS class names, private helper functions, or source-file implementation details.
- **Single Testing Seam (Highest Seam)**: All verification runs against **the built standalone HTML page served over a local static HTTP server and rendered in a real browser** (mirroring GitHub Pages deployment). This single end-to-end seam covers build output integrity, asset delivery, DOM rendering, interactive behaviors, and responsive layout together:
  - **Build & Standalone Verification**: Confirm the build completes cleanly and the generated standalone HTML contains inlined compiled CSS with no external Tailwind CDN runtime script.
  - **Content & Static Asset Resolution**: Verify all expected profile sections, corrected candidate name ("Apimongkol Somjai"), two work experiences, four certificates, three activities, and tools/skills render visibly; confirm portrait and cover images load successfully (`naturalWidth > 0`); verify all five relative PDF asset URLs (CV and four certificates) return HTTP 200; verify the three Common-learn verification URLs are present.
  - **Interactive Behavior Verification**:
    - Clicking each certificate row and the Preview CV action opens the modal dialog with the matching encoded PDF URL loaded in the `<iframe>`, accurate title, and functional "Open in New Tab" / "Download" links.
    - Confirm "Verify Credential" is visible and points to the right URL for the three Common-learn certificates, and hidden for the Ubon Ratchathani University Excel certificate and CV.
    - Confirm closing the modal via close button, backdrop click, and `Escape` key hides the dialog cleanly.
    - Confirm clicking the Copy Email button triggers visual copied feedback.
  - **Responsive Layout Verification**: Render at desktop (`1280px`) and mobile (`390px`) viewports and confirm zero horizontal overflow (`scrollWidth <= clientWidth`).
- **Prior Art**: This is a greenfield static repository with no pre-existing test suite; this browser/HTTP static-site verification establishes the single clean test seam for the project.

## Out of Scope

- A Works / Projects showcase section (deferred until actual project files or case studies are added).
- Multi-language support or Thai/English language switcher (site is English-only).
- Fake Jira-style application navigation bars, workspace pickers, or client-side search/filtering chrome.
- Converting certificate PDFs into pre-rendered raster thumbnail images (the embedded PDF iframe modal with open/download fallbacks is used instead).
- Additional social media profiles (LinkedIn, GitHub, LINE) beyond the provided email and phone number.
- Contact form backend, analytics tracking, CMS integration, or dark-mode toggle.
- Automated CI/CD deployment pipelines or issue tracker integration.

## Further Notes

- **Name Typo Note**: The raw profile YAML currently spells the first name as `Apimongkok`, whereas the CV PDF, email address, and certificates correspond to `Apimongkol Somjai`. The implementation should use `Apimongkol Somjai` consistently across the website (and optionally fix the typo in the YAML if desired).
- **Certificate Metadata Summary**:
  - *Microsoft Excel Proficiency Assessment* — Faculty of Management Science, Ubon Ratchathani University, 20 March 2026 (no external verify URL).
  - *Data Analytics For Business* — Common-learn (public verify URL present on certificate).
  - *Data Governance For People* — Common-learn (public verify URL present on certificate).
  - *Prompt Engineering* — Common-learn (public verify URL present on certificate).
- **Mobile PDF Iframe Caveat**: Mobile Safari and Android Chrome frequently do not render multi-page PDFs inline inside `<iframe>` elements. Keeping prominent "Open PDF in New Tab" and "Download" buttons in the modal header/footer ensures recruiters on phones always have an immediate, frictionless path to view every document.
- **Visual Asset Generation**: Generating a bespoke, serene minimalist light cover image (matching the calm tonal balance of the reference design) is part of delivering this spec and should be sized/compressed appropriately for fast GitHub Pages loading.
