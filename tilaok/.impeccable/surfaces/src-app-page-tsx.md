---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: []
---

# Surface brief: home (/)

Scope: the single page of tilaOK. Visitor mode: Operate. The farmer starts listening, glances at the status from a distance, and reads the session report when they stop.
Constraints: everything in PRODUCT.md "Capabilities and Constraints"; built code-first.

## Direction contract

THESIS: One question answered before anything else: is the flock OK right now? A crisp, Vercel/Linear-grade dashboard played straight. It refuses decoration, gradients, glow and fake IoT chrome.

OWN-WORLD: Light by default, because the page is read in a daylight poultry house on a propped phone; dark follows the system setting. Neutral near-white ground with 1px hairline borders and no drop shadows. Geist for UI and Geist Mono for numbers and timestamps (tabular). State colours do the work: green for healthy, red for respiratory sounds, slate for background noise. Each state always comes with a word and an icon, never colour alone.

STORY: The farmer picks a mic and presses Start. Status turns green "Flock sounds healthy", or red "Respiratory sounds detected" only after sustained evidence (3 of the last 5). They read the confidence bars, the recent-history strip and the log. They press Stop and get a session report with a verdict.

FIRST VIEWPORT: Top bar: tilaOK wordmark at left; mic select and the primary Start/Stop button at right. Below it, a full-width status band with the large state line, a one-line reason and the session timer. Under the band, two columns: left has live confidence (three bars plus a 60-reading history strip); right has unhealthy-in-last-hour, the threshold slider and the event log. The session report follows, then a short "how it works / limits" footer. Adaptations made in the build: the mic select and Start/Stop sit in their own row under the wordmark, so on phones the primary button is full-width and in thumb reach, and the select is capped at 360px on desktop. Unhealthy-in-last-hour sits in the status band, so the second most glanced-at number is next to the answer. The threshold slider lives in Live confidence, next to the threshold tick it moves. After Stop, the band carries the session verdict. Revision (user request, 2026-10-22): the page is one screen with no page scroll. The top bar holds the wordmark and controls. Under the status band, three equal columns hold Live confidence, Session report and Event log, each scrolling inside itself; below 1024px they become Live / Report / Log tabs. The footer copy moved into a panel opened by a chicken button in the bottom-right corner (how it works, what it can do, what it can't do).

FORM: Category standard (canon), benchmark Vercel/Linear. seed: b8df5ce036146ac2

Signature move: the history strip, one thin tick per prediction coloured by class, with alert windows underlined. The status band's colour field transitions once when the state changes.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
