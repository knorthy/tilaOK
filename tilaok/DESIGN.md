---
name: tilaOK
description: Poultry Respiratory Sound Monitor. A crisp, neutral dashboard where only the flock's state carries colour.
colors:
  bg: "#fafafa"
  surface: "#ffffff"
  subtle: "#f0f0f0"
  line: "#e4e4e4"
  fg: "#0a0a0a"
  muted: "#5e5e5e"
  healthy: "#15803d"
  healthy-bg: "#f0fdf4"
  healthy-line: "#bbe5c8"
  alert: "#c81e1e"
  alert-bg: "#fef2f2"
  alert-line: "#f5c2c2"
  warn: "#9a5b06"
  warn-bg: "#fffbeb"
  warn-line: "#f1dca4"
  noise: "#6b7280"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 4.5vw, 2.75rem)"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.333
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.5
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.333
  numeral:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.333
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  mono-label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.333
    fontFeature: "tnum"
rounded:
  tick: "2px"
  sm: "4px"
  md: "6px"
  xl: "12px"
  full: "9999px"
spacing:
  hairline-gap: "2px"
  xs: "6px"
  sm: "12px"
  md: "16px"
  panel: "20px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.bg}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.subtle}"
  select-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "0 36px 0 12px"
    height: "44px"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.panel}"
  status-band-healthy:
    backgroundColor: "{colors.healthy-bg}"
    textColor: "{colors.healthy}"
    rounded: "{rounded.xl}"
    padding: "32px"
  status-band-alert:
    backgroundColor: "{colors.alert-bg}"
    textColor: "{colors.alert}"
    rounded: "{rounded.xl}"
    padding: "32px"
  status-band-warn:
    backgroundColor: "{colors.warn-bg}"
    textColor: "{colors.warn}"
    rounded: "{rounded.xl}"
    padding: "32px"
  status-band-idle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.fg}"
    rounded: "{rounded.xl}"
    padding: "32px"
  confidence-track:
    backgroundColor: "{colors.subtle}"
    rounded: "{rounded.full}"
    height: "10px"
  history-tick:
    rounded: "{rounded.tick}"
    height: "36px"
---

# Design System: tilaOK

## Overview

**Creative North Star: "The Barn Wall Gauge"**

tilaOK is a single-question instrument: is the flock OK right now? The system is the category-standard dashboard played straight, held to the polish of Vercel and Linear. A near-white neutral ground, 1px hairlines, ink-black controls and Geist type do the structural work. Colour is withheld from chrome so that when it appears, it means something about the birds: green for healthy, red for respiratory sounds, amber for caution, cool grey for background noise.

Density is calm and generous at the top and tighter below. One large status line, readable from across a poultry house, sits in a full-width band. Supporting evidence (confidence bars, a 60-reading history strip, a timestamped log, the session report) lives in hairline panels underneath. Light is the default because the page is read in daylight on a propped phone; dark follows the system setting with the same roles remapped.

The world refuses decoration: no gradients, no glow, no drop shadows and no imitation IoT hardware chrome.

**Key Characteristics:**
- Neutral chrome; chroma reserved for flock state.
- Every state is a word plus an icon plus a colour, never colour alone.
- Geist for language, Geist Mono with tabular figures for every number and timestamp.
- Flat surfaces with 1px hairline borders; depth by tonal fill, not shadow.
- One motion moment: the status colour field changes once, smoothly, when the state flips.

## Colors

A neutral grey scale for the whole interface, plus four state families that each come as ink, wash and line.

### Primary
- **Barn Ink** (fg): the primary action fill (Start listening), headings, body text, the slider thumb ring, the focus outline and the threshold tick (at 50% opacity). The primary action is ink, not a state colour.

### Secondary (state families)
- **Flock Green** (healthy, with healthy-bg wash and healthy-line border): healthy status band and verdict, healthy bars, ticks, swatches, "Alert cleared" log dots, and the "OK" in the wordmark. Also tints text selection at 28%.
- **Respiratory Red** (alert, with alert-bg wash and alert-line border): the alert band and verdict, unhealthy bars and ticks, alert log text, and a non-zero Alerts count in the report.
- **Caution Amber** (warn, with warn-bg wash and warn-line border): "a few unhealthy sounds, no alert" verdicts and the could-not-start error state. Never used for chrome.
- **Static Grey** (noise): background-noise bars, ticks and swatches, and start/stop log dots. A cool grey so it reads as a class, not as disabled text.

### Neutral
- **Daylight Ground** (bg): the page background.
- **Paper** (surface): panels, the idle status band, the secondary button and the select field.
- **Trough** (subtle): empty bar tracks, empty history ticks, the slider track, secondary-button hover.
- **Hairline** (line): every 1px border and divider, plus the scrollbar thumb.
- **Field Grey** (muted): helper text, panel notes, stat labels, timestamps.

Dark mode is a token remap under `prefers-color-scheme: dark`, not a separate palette (values in the sidecar): near-black ground, lighter state inks, deep low-chroma washes.

### Named Rules
**The State-Only Colour Rule.** Chroma belongs to the flock's state. Buttons, panels, borders and type stay neutral; the only exception is the "OK" in the wordmark, which is brand, in Flock Green.

**The Word-and-Icon Rule.** A state colour never appears without a word next to it. The status band and verdict pair each tone with a stroke icon and a sentence; bars, ticks and dots always come with a labelled legend or row text.

**The Ink, Wash, Line Rule.** Each state family has exactly three roles: ink for text and marks, wash for the band fill, line for the band border. Do not invent a fourth tint.

## Typography

**Display Font:** Geist (with system-ui, sans-serif)
**Body Font:** Geist (with system-ui, sans-serif)
**Label/Mono Font:** Geist Mono (with ui-monospace, monospace)

**Character:** A precise, neutral grotesk with tight negative tracking at large sizes, paired with its own mono for figures so numbers sit in steady columns as they update.

### Hierarchy
- **Display** (600, clamp(1.75rem, 4.5vw, 2.75rem), 1.25, -0.03em, balanced wrap): the live status line only, in the tone's ink.
- **Headline** (600, 1.5rem, -0.02em): the session verdict and the wordmark (wordmark at -0.03em).
- **Title** (600, 15px): panel headings (Live confidence, Event log, Session report). Sub-section headings inside panels use 14px at 500.
- **Body** (400, 14px; 15-16px for the status detail line): rows, log entries, legends' parent text. Prose blocks use 1.625 line height and cap at 60-70ch.
- **Label** (400, 12px, muted): panel notes, stat labels, legends, helper copy. Sentence case, no tracking, no uppercase.
- **Numeral** (Geist Mono 500, 1.5rem rising to 1.875rem at 640px+, tabular, -0.025em): session timer, last-hour count, report stats.
- **Mono label** (Geist Mono 400, 12px, tabular): log timestamps, per-class reading counts. Percentages in rows use Geist Mono at 14px.

### Named Rules
**The Tabular Figures Rule.** Every number that can change (percent, time, count) is set in Geist Mono with tabular figures so it never jitters.

**The One Loud Line Rule.** Display size is reserved for the status answer. Nothing else on a surface competes with it.

## Layout

**One screen, no page scroll.** The page is exactly the viewport height (100dvh, capped at 1280px wide, 16px side gutters, 24px from 640px). The page never scrolls; panels scroll inside themselves. Windows shorter than 560px fall back to normal page scroll so nothing is cut off.

Top to bottom: a top bar (wordmark plus a muted descriptor on the left from 768px; a 300px mic select and a 208px primary button on the right, sharing one row on phones too, with the button label shortened to "Start / Stop / New"), the full-width status band, then the work area filling the remaining height. From 1024px the work area is three equal columns: Live confidence, Session report and Event log. Below 1024px the same three panels sit behind a Live / Report / Log tab bar and only the active one shows. Stopping a session switches to Report.

Vertical rhythm between blocks is 16px (12px on phones). Panels pad 20px; panel heads are 14px by 20px. The status band pads 16px on phones and 20px by 28px on desktop. Report stats are a 2-up grid divided by hairlines. Controls are 44px tall. "How it works / what it can and can't do" lives behind the chicken button, not on the page.

## Elevation & Depth

The system is flat. There are no drop shadows anywhere. Depth is conveyed by tone only: Paper panels on the Daylight Ground, 1px Hairline borders, and state washes that fill the status band and the report verdict row.

### Named Rules
**The Hairline Rule.** Separation is a 1px Hairline border or divider, never a shadow. If a surface needs more presence, give it a state wash, not elevation.

**The Single Flip Rule.** The status band and verdict row change background and border once, over 400ms with an expo-out curve, when the state changes. Bars ease their width over 220ms. The Stop button's recording dot pulses. All of it switches off under reduced motion.

## Shapes

Softly rounded, never pill-shaped containers. Panels and the status band use 12px corners with clipped overflow; controls use 6px (the focus outline matches at 6px, offset 2px). Data marks are rounder: bars, tracks and dots are fully rounded; history ticks are 2px; legend swatches 4px. Icons are one outlined set: 24px grid, 1.75px stroke, round caps and joins, 26px in status positions and 18px in buttons.

## Components

### Buttons
Plain and decisive; one primary per surface.
- **Shape:** gently rounded (6px), 44px tall, 20px horizontal padding, 500 weight, icon and label gap 8px.
- **Primary:** Barn Ink fill with Daylight Ground text and an 18px mic icon (Start listening / Start a new session).
- **Hover / Focus:** primary drops to 85% opacity; focus is a 2px ink outline at 2px offset. Disabled is 60% opacity.
- **Secondary:** the active Stop control. Paper fill, Hairline border, ink text, a pulsing 10px ink recording dot; hover fills Trough.

### Inputs / Fields
- **Select:** Paper fill, Hairline border, 6px corners, 44px tall, 15px text, a 16px grey chevron drawn at the right with 36px right padding. A muted 14px label sits 6px above.
- **Range slider:** 4px Trough track, fully rounded; 18px Paper thumb with a 2px ink ring. The current value reads in Geist Mono beside the label.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Paper.
- **Shadow Strategy:** none (see The Hairline Rule).
- **Border:** 1px Hairline; internal sections divided by Hairline rules.
- **Internal Padding:** 20px; head row 14px by 20px with a Title on the left and a muted Label note on the right.

### Navigation
- **Panel tabs (below 1024px only):** a segmented control in a Paper track with a Hairline border, 4px inset, three equal 36px tabs at 14px/500. The active tab is filled Barn Ink with Daylight Ground text; inactive tabs are muted, inking on hover. Built as role="tablist" with tabpanels.

### Chicken Button and About Panel
- **Button:** fixed 16px from the bottom-right corner, 56px circle, Paper fill, Hairline border, holding the tilaOK hen mark at 32px, an inline SVG redrawn from tilaOK.png that fills with the ink colour in light and dark. Hover fills Trough. It toggles the panel (aria-expanded).
- **Panel:** fixed above the button, up to 400px wide, 12px corners, Paper with a Hairline border (flat, like every surface), scrolling inside itself. Sections divided by Hairlines: How it works, What it can do (green dots), What it can't do (red dots), and the dataset credit at 12px. It closes on Escape, a click outside or the close button. It opens once with a 220ms rise-and-fade from its bottom-right corner, with no animation under reduced motion.

### Status Band (signature)
The answer to "is the flock OK?". Full width, 12px corners, the tone's wash and line, a 26px tone icon, the Display status line in the tone's ink, a muted detail sentence, and Numeral stats (timer, unhealthy sounds in the last hour) aligned right. After Stop it carries the session verdict. The idle tone is plain Paper with ink text.

### History Strip (signature)
Sixty equal ticks, 2px apart, 36px tall, one per reading, filled with the class colour (green, red, grey); unfilled slots show as Trough. Always followed by a legend with swatches and words.

### Confidence Bars
A three-column row: class name, a 10px fully rounded Trough track with a class-coloured fill, and a right-aligned Geist Mono percentage. The Unhealthy bar carries a 1px ink tick (50% opacity) at the alert threshold.

### Event Log
Newest-first list that fills its panel and scrolls inside it with a thin Hairline scrollbar, with 64px of end padding so the chicken button never covers the last row. Each row: Geist Mono timestamp, a 6px state dot, the event text; alert rows set the text in Respiratory Red at 500. Rows are divided by Hairlines.

## Do's and Don'ts

### Do:
- **Do** keep chrome neutral and let state colour appear only where it reports the flock (The State-Only Colour Rule).
- **Do** pair every state colour with a word and an icon or a labelled legend.
- **Do** set every changing number in Geist Mono with tabular figures.
- **Do** separate surfaces with 1px Hairline borders and 12px panel corners.
- **Do** make the primary action an ink fill (6px corners, 44px tall), full width on phones.
- **Do** change the status band's colour once per state change (400ms, expo-out) and drop all motion under reduced motion.
- **Do** define every colour as a token with a light value and a dark remap.

### Don't:
- **Don't** add drop shadows, gradients or glow; the world is flat by choice.
- **Don't** use green, red or amber for buttons, borders or decoration.
- **Don't** imitate IoT hardware chrome (LED panels, bezels, fake screens).
- **Don't** show any state by colour alone.
- **Don't** use display size for anything but the status answer.
