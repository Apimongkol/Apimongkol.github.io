# Date-Rail Timeline Specification

> Status: `ready-for-agent`

## Problem Statement

On the portfolio profile page, the **Work Experience** and **Activities** sections currently display each entry's month/year at the top-right corner of its block, separated by horizontal dividers. While readable, this layout makes it harder for recruiters to scan chronological progression at a glance and visually distinguish the candidate's ongoing active role from completed past engagements.

## Solution

Upgrade both the **Work Experience** and **Activities** cards independently into vertical **Date-Rail Timelines** while keeping their separate bordered cards, section headings, and top-header jump links unchanged. On desktop viewports (`>= 640px`), each card presents a dedicated right-aligned date rail on the left, a thin vertical connecting axis with circular nodes in the middle, and the entry title and details on the right. On mobile viewports (`< 640px`), the layout collapses cleanly into a left vertical axis with the month/year stacked directly above each entry title and description. Entries remain in newest-first resume order, with the ongoing role (`2019 – Present`) marked by a solid corporate-blue active node and all past entries marked by quiet neutral outlined nodes.

## User Stories

1. As a finance recruiter on desktop, I want each Work Experience entry's timeframe (`2019 – Present`, `May 2023`) aligned in a dedicated left date rail next to a vertical timeline axis, so that I can scan the candidate's career duration and progression immediately.
2. As a finance recruiter on desktop, I want each Activity entry's month/year (`July 2024`, `May 2024`, `March 2023`) aligned in the same Date-Rail format inside the Activities card, so that both chronological sections share a cohesive, structured visual rhythm.
3. As a finance recruiter, I want Work Experience and Activities to remain separate cards with their existing top-header jump links (`Experience`, `Activities`), so that work history and extracurricular involvement stay clearly distinguished.
4. As a finance recruiter, I want entries in both timelines ordered newest-first, so that the candidate's most recent and relevant experience appears first.
5. As a finance recruiter, I want the candidate's ongoing active role (`2019 – Present`) highlighted with a solid corporate-blue node while completed roles and past activities use quiet neutral outlined nodes, so that current employment stands out immediately without noisy badges or animations.
6. As a finance recruiter, I want the vertical connecting line to stop cleanly at the final node of each timeline rather than trailing into empty space, so that each card looks deliberate and finished.
7. As a finance recruiter, I want all month/year timestamps rendered in tabular figures (`tabular-nums`) and right-aligned on desktop, so that dates line up cleanly along the vertical axis.
8. As a mobile recruiter (`390px` viewport), I want the Date-Rail layout to collapse into a left vertical axis with the month/year stacked neatly above each entry title and details, so that text never crowds or causes horizontal scrolling.
9. As a screen-reader or keyboard user, I want timeline entries structured with semantic ordered lists (`<ol>`) and `<time>` elements (with decorative lines and nodes hidden from assistive technology), so that chronological structure remains accessible.
10. As the portfolio owner, I want the timeline built purely with Tailwind CSS utilities and compiled into the standalone HTML page with zero runtime scripts or extra dependencies, so that the code stays simple and fast on GitHub Pages.
11. As the portfolio owner, I want the timeline to strictly preserve anti-slop visual discipline—no glowing dots, pulsing animations, decorative gradients, emoji labels, or uppercase tracked headings—so that the page maintains a calm, trustworthy finance aesthetic.

## Implementation Decisions

- **Independent Card Timelines**: Keep the Work Experience card and Activities card as separate sections with their existing section IDs and top-header navigation links. Replace the horizontal dividers inside each card with a vertical Date-Rail ordered list.
- **Responsive Date-Rail Grid**:
  - **Desktop (`>= 640px`)**: Use a three-column layout per timeline item—a fixed-width, right-aligned left column for the `<time>` label, a narrow center column for the `1px` vertical connecting line and `10px` circular node aligned to the entry title baseline, and a flexible right column for the entry heading and details.
  - **Mobile (`< 640px`)**: Collapse to a two-column layout—the vertical connecting line and node on the left, and the `<time>` label stacked directly above the entry heading and details on the right.
- **Node & Line Styling**:
  - Active ongoing role (`2019 – Present`): solid corporate-blue circular node with a crisp white halo ring so the vertical line does not bleed through.
  - Past roles and all activities (`May 2023`, `July 2024`, `May 2024`, `March 2023`): white-filled circular node with a neutral `2px` slate border and white halo ring.
  - Connecting line: `1px` neutral light-slate vertical line between consecutive items, omitted on the final item of each list.
- **Semantic & Accessible Markup**: Use `<ol>` / `<li>` for chronological items, `<time>` for date/period labels, and `aria-hidden="true"` on the decorative rail line and node container.
- **Build & Content Preservation**: Preserve all existing text, bullet points, and locations verbatim. Compile updated Tailwind CSS utilities into the standalone HTML output via the existing build step.

## Testing Decisions

- **Single Testing Seam (Existing Highest Seam)**: Verify all changes exclusively through the existing browser/HTTP acceptance seam—serving the built standalone HTML page over a local static HTTP server and inspecting it in Microsoft Edge via Playwright.
- **Behaviors Tested**:
  - **Desktop Date-Rail Geometry (`1280×800`)**: Every `<time>` element in Work Experience and Activities sits strictly to the left of its entry heading (`dateRect.right <= titleRect.left`), and all `<time>` elements within each section share a consistent right-edge alignment.
  - **Mobile Stacking (`390×844`)**: Every `<time>` element in Work Experience and Activities sits cleanly above its entry heading (`dateRect.bottom <= titleRect.top`) with zero horizontal overflow (`scrollWidth <= clientWidth`).
  - **Active vs. Past Visual Distinction**: The active role (`2019 – Present`) renders an active node with a distinct computed background color compared to past neutral nodes.
  - **Regression & Anti-Slop**: All existing portfolio acceptance tests (header jump links, PDF modal, Copy Email, images, anti-slop checks) continue to pass.

## Out of Scope

- Merging Work Experience and Activities into a single combined timeline.
- Converting Certificates or Academic Projects into timelines.
- Changing chronological ordering from newest-first to oldest-first.
- Adding scroll-triggered animations, pulsing dots, glows, or custom JavaScript for timeline rendering.

## Further Notes

- All existing copy for Work Experience (2 roles) and Activities (3 entries) remains unchanged.
- Existing header jump links (`Experience`, `Activities`) must continue to scroll smoothly to their respective sections.
