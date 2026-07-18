---
name: Dubzy
description: A calm localization studio for turning finished videos into multilingual versions.
colors:
  gallery-ground: "#f5f4f0"
  studio-surface: "#ffffff"
  quiet-panel: "#efeee9"
  strong-panel: "#e6e4dd"
  structural-line: "#dedcd5"
  editorial-ink: "#11110f"
  supporting-ink: "#555550"
  quiet-ink: "#91908a"
  translation-blue: "#536aa7"
  translation-blue-deep: "#425789"
  success: "#4b705d"
  warning: "#8b6c35"
  failure: "#a64139"
  selection: "#eef0f6"
  video-canvas: "#171715"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(3rem, 7vw, 5.8rem)"
    fontWeight: 400
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.25
rounded:
  square: "0px"
  control: "6px"
  panel: "8px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.editorial-ink}"
    textColor: "{colors.studio-surface}"
    typography: "{typography.title}"
    rounded: "{rounded.square}"
    padding: "12px 16px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.translation-blue-deep}"
    textColor: "{colors.studio-surface}"
  button-secondary:
    backgroundColor: "{colors.studio-surface}"
    textColor: "{colors.editorial-ink}"
    typography: "{typography.title}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.gallery-ground}"
    textColor: "{colors.editorial-ink}"
    rounded: "{rounded.control}"
    padding: "12px"
  workspace-panel:
    backgroundColor: "{colors.studio-surface}"
    textColor: "{colors.editorial-ink}"
    rounded: "{rounded.square}"
---

# Design System: Dubzy

## 1. Overview

**Creative North Star: "The Localization Studio"**

Dubzy feels like a calm, polished studio where finished work is prepared for a new audience. The public experience uses an editorial serif and generous composition to frame the creator's work; authenticated surfaces become denser, quieter, and operational without losing the same material language.

The system is refined and restrained, built from pale neutral work surfaces, strong ink, crisp rules, and a muted translation blue reserved for state and focus. It explicitly rejects generic AI SaaS presentation, intimidating editor complexity, and overly playful consumer styling.

**Key Characteristics:**

- Editorial at the brand edge; precise and compact inside the product.
- Flat surfaces separated by tonal shifts and crisp one-pixel rules.
- Square structural containers paired with gently curved controls.
- Translation blue used for meaning, never decoration.
- Motion limited to clear feedback and short, purposeful transitions.

## 2. Colors

The palette resembles a quiet gallery workspace: neutral enough to foreground video, with blue and semantic colors carrying operational meaning.

### Primary

- **Translation Blue** (`#536aa7`): Focus outlines, active processing, and meaningful state emphasis.
- **Deep Translation Blue** (`#425789`): Hover and pressed treatment when a blue action is required.

### Neutral

- **Gallery Ground** (`#f5f4f0`): The application canvas and page background.
- **Studio Surface** (`#ffffff`): Forms, dialogs, and content surfaces that need separation from the canvas.
- **Quiet Panel** (`#efeee9`): Selected, hovered, or secondary work areas.
- **Strong Panel** (`#e6e4dd`): Stronger tonal separation used sparingly.
- **Structural Line** (`#dedcd5`): Dividers and one-pixel container boundaries.
- **Editorial Ink** (`#11110f`): Primary copy and the default high-contrast action fill.
- **Supporting Ink** (`#555550`): Secondary copy, metadata, and inactive utility actions.
- **Quiet Ink** (`#91908a`): Tertiary metadata only; never body copy on the page canvas.

### Tertiary

- **Success** (`#4b705d`): Completed jobs and positive status.
- **Warning** (`#8b6c35`): Pending states that require patience rather than action.
- **Failure** (`#a64139`): Failed jobs and destructive emphasis.

### Named Rules

**The One Signal Rule.** Translation Blue is reserved for focus, active processing, and selected state; it never decorates neutral surfaces.

**The Creator First Rule.** Video and creator content supply visual richness. Product chrome remains restrained around it.

## 3. Typography

**Display Font:** Instrument Serif (with Georgia fallback)  
**Body Font:** Instrument Sans (with system sans-serif fallback)  
**Label/Mono Font:** JetBrains Mono (with system monospace fallback)

**Character:** Instrument Serif gives the public surface a composed editorial voice. Instrument Sans keeps controls and workflows direct, while JetBrains Mono is restricted to identifiers and compact operational metadata.

### Hierarchy

- **Display** (400, `clamp(3rem, 7vw, 5.8rem)`, 0.94): Landing-page statements only; balance wrapping and never exceed `-0.04em` tracking.
- **Headline** (400, 2.25rem, 1.1): Brand-supporting statements and authentication headings.
- **Title** (600, 0.875rem, 1.25): Product section titles, field emphasis, and primary controls.
- **Body** (400, 1rem, 1.75): Explanatory copy, capped near 70 characters per line.
- **Label** (500, 0.75rem, 1.25): IDs, timestamps, and concise operational metadata.

### Named Rules

**The Two Registers Rule.** Serif belongs to brand expression and major entry moments; it is forbidden in routine controls, tables, labels, and task UI.

**The Metadata Rule.** Monospace communicates machine-derived information. It never substitutes for the interface's primary voice.

## 4. Elevation

Dubzy is flat by default. Depth comes from canvas-to-surface tonal changes, one-pixel structural lines, and overlays with explicit modal purpose. Shadows are exceptional: dialogs and transient snackbars may lift above the task surface, but ordinary forms, rows, and buttons remain shadowless.

### Shadow Vocabulary

- **Transient Lift** (`0 18px 48px rgba(21,23,19,0.16)`): Snackbars and temporary feedback only.
- **Administrative Offset** (`10px 10px 0 rgba(21,23,19,0.12)`): The existing admin sign-in panel only; do not spread this expressive exception into the workspace.

### Named Rules

**The Flat-by-Default Rule.** If an element can be separated with a surface shift or one-pixel rule, a shadow is forbidden.

## 5. Components

### Buttons

- **Shape:** Product CTAs are square (`0px`); dialog and authentication controls use a gentle curve (`6px`) where they sit beside rounded inputs.
- **Primary:** Editorial Ink fill with Studio Surface text and compact `12px 16px` padding.
- **Hover / Focus:** Hover deepens the fill within 160–200ms. Keyboard focus always uses a visible 2px Translation Blue outline with 3px offset.
- **Secondary:** Transparent or Studio Surface with a Structural Line border; hover strengthens the border to Editorial Ink.

### Chips

- **Style:** Status chips are compact inline labels with a 6px circular signal and no capsule background.
- **State:** Processing uses Translation Blue; completed, pending, and failed use their semantic colors. Text always accompanies color.

### Cards / Containers

- **Corner Style:** Workspace structures are square (`0px`); dialogs and isolated administrative panels may use `8px`.
- **Background:** Studio Surface over Gallery Ground, with Quiet Panel for selected or interactive subregions.
- **Shadow Strategy:** None at rest; follow the Flat-by-Default Rule.
- **Border:** One-pixel Structural Line boundaries organize forms, rows, and regions.
- **Internal Padding:** Compact `12px`–`16px` for task UI; `24px`–`40px` for entry and marketing surfaces.

### Inputs / Fields

- **Style:** Gallery Ground fill, Structural Line border, gently curved `6px` corners, and `12px` internal padding.
- **Focus:** Border shifts to Translation Blue with a restrained 2px pale-blue focus ring.
- **Error / Disabled:** Errors use explicit failure text in addition to color. Disabled fields reduce opacity and keep their shape and label visible.

### Navigation

- **Style:** A quiet 56px top bar with the compact waveform mark, small sans-serif labels, and a single structural divider. Hover changes text contrast; the product avoids decorative navigation treatments.
- **Mobile treatment:** Preserve the brand and primary action, reduce secondary labels, and maintain a minimum 44px touch target for essential actions.

### Video Dropzone

The signature work surface is a large, calm target rather than a decorative upload card. It uses tonal response for hover, drag, and selection; file type, limit, filename, size, and removal remain visible without modal interruption.

## 6. Do's and Don'ts

### Do:

- **Do** use Gallery Ground, Studio Surface, and one-pixel Structural Lines to create hierarchy before introducing elevation.
- **Do** keep Translation Blue scarce and meaningful: focus, active processing, and selected state.
- **Do** pair every status color with a text label or icon so state never depends on color alone.
- **Do** use Instrument Serif to frame creator-facing brand moments and Instrument Sans throughout task workflows.
- **Do** keep product transitions between 150ms and 250ms and honor reduced-motion preferences.

### Don't:

- **Don't** make Dubzy resemble a generic AI SaaS template.
- **Don't** turn the workflow into an intimidating professional editing suite.
- **Don't** introduce overly playful consumer-app styling.
- **Don't** add rounded cards, decorative shadows, gradients, or glass effects to make empty space feel designed.
- **Don't** use Translation Blue as decoration or use Quiet Ink for body copy.
- **Don't** place serif typography in buttons, fields, tables, or routine product labels.
