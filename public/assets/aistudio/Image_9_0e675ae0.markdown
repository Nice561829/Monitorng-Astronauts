---
name: AeroHUD Telemetry
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353942'
  surface-container-lowest: '#0a0e16'
  surface-container-low: '#181c24'
  surface-container: '#1c2028'
  surface-container-high: '#262a33'
  surface-container-highest: '#31353e'
  on-surface: '#dfe2ee'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dfe2ee'
  inverse-on-surface: '#2c3039'
  outline: '#849495'
  outline-variant: '#3a494b'
  surface-tint: '#00dce6'
  primary: '#e0fdff'
  on-primary: '#00373a'
  primary-container: '#00f2fe'
  on-primary-container: '#006a70'
  inverse-primary: '#00696f'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#e1ffec'
  on-tertiary: '#003824'
  tertiary-container: '#67f4b7'
  on-tertiary-container: '#006e4b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ff6ff'
  primary-fixed-dim: '#00dce6'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f53'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0f131c'
  on-background: '#dfe2ee'
  surface-variant: '#31353e'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: 0em
  headline-md:
    fontFamily: Inter
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: 1.75rem
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.375rem
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: 0.01em
  telemetry-lg:
    fontFamily: JetBrains Mono
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.03em
  telemetry-md:
    fontFamily: JetBrains Mono
    fontSize: 1.125rem
    fontWeight: '500'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  telemetry-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.125rem
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.25rem
---

## Brand & Style

This design system delivers mission-critical telemetry, life-support biosignals, and spacecraft systems data for deep-space manned expeditions (Artemis, Mars Transit, and Surface Operations). The UI balances military-grade flight-instrument ergonomics with an atmospheric, futuristic heads-up display (HUD) aesthetic.

### Aesthetic Foundation
- **Tactical Sci-Fi HUD & Glassmorphism:** Ultra-deep, pure dark OLED grounds minimize cabin glare and optical fatigue during long-duration flight. Translucent smoked panels, subtle cyan edge illumination, and calibrated micro-borders evoke high-precision cockpit avionics.
- **Cognitive Ergonomics:** Designed for high-stress, low-g, or pressurized-suit environments. Information architecture prioritizes zero visual clutter, immediate status triage, high glanceability, and tactile certainty under cognitive fatigue.
- **Status-Driven Sensory Hierarchy:** Color is never purely decorative; it communicates operational reality, subsystem stability, warning states, and biological survival telemetry.

## Colors

The palette is engineered around dark adaptation, high visual acuity against OLED true blacks, and distinct semantic urgency tiers.

### Base Canvases & Structural Tiers
- **Void Obsidian (`#0B0F17`):** Primary canvas background. Preserves night-vision adaptations, optimizes micro-LED power draw, and provides maximum contrast for emissive readouts.
- **Deep Hull (`#111827`):** Base panel and card surface container tier.
- **Pressurized Slate (`#1F2937`):** Elevated container layer, interactive surface, and recessed trough state.
- **Telemetry Wireframe (`#374151`):** Subdued HUD structural dividers and inactive grid traces.

### Luminescent & Telemetry Accents
- **Primary Avionics Cyan (`#00F2FE`):** Main vector highlights, primary triggers, telemetry track lines, active selection states, and nominal sensor readouts.
- **Secondary Flux Indigo (`#6366F1`):** Deep navigational secondary layers, trajectory arcs, and orbital sub-channels.
- **Tertiary Bio-Vital Green (`#10B981`):** Astronaut baseline biometric stability (SpO2, heart rate, core temp, metabolic homeostasis).

### Critical Operational Diagnostics
- **Advisory Amber (`#F59E0B`):** Environmental drifts, consumables warnings, thruster thermal warnings, degradation alerts.
- **Abort Emergency Red (`#EF4444`):** Hull breach, life support failure, radiation storm spike, critical system casualty.
- **Atmospheric Neutral Tint (`#94A3B8`):** Nominal telemetry units, secondary metrics, and peripheral structural labels.

## Typography

The typographic hierarchy combines the legibility of **Inter** for structural headers and system messaging with the precision of **JetBrains Mono** for all numerical values, coordinates, countdown timers, and unit indicators.

### Implementation Rules
- **Monospaced Telemetry Precision:** Never render real-time fluctuating data, timestamps, mission elapsed time (MET), or physiological metrics in proportional fonts. Always pair `telemetry-*` with tabular figures (`tnum`) to eliminate layout jitter.
- **HUD Micro-Labels:** `label-caps` must always be rendered in full uppercase with expanded letter-spacing to ensure absolute glanceability across peripheral vision and through EVA helmet visors.
- **Scale Restraint:** Display sizes are reserved strictly for critical single-metric overviews (e.g., cabin atmospheric depressurization or delta-V burn countdowns).

## Layout & Spacing

A modular, dense 12-column grid provides deterministic spatial positioning required for telemetry clusters, multi-axial navigation readouts, and biometrics.

### Spatial Distribution
- **Desktop/Cockpit Displays (1200px+):** 12-column layout with 24px (`space-lg`) gutters and 40px (`margin-lg`) margin frame. Fixed diagnostic side-rails dock critical lifelines (O2, Heart Rate, Earth Latency) while central space handles situational 3D mapping and vector telemetry.
- **Flight Pad / Tablet (768px - 1199px):** 8-column layout with 16px (`gutter`) gutters and 24px margins. Subordinate modules fold into tabbed telemetry bays.
- **Glove & Mobile Viewports (<768px):** 4-column layout with 16px gutters and 16px margins. Telemetry ranks stack into high-touch vertical telemetry strips. Touch targets expand to a minimum 48px baseline to accommodate pressure suit gloves.

## Elevation & Depth

Visual hierarchy uses physical and optical depth cues suitable for heads-up displays, relying on luminance stacking, edge-lit diffraction, and translucent acrylic surfaces rather than daylight drop shadows.

### Atmospheric HUD Stacking
1. **Base Layer (Hull Canvas):** Solid `#0B0F17` without blur or glow.
2. **Telemetry Enclosures (Tier 1 Surface):** Smoked acrylic glass effect. `#111827` rendered at `85%` opacity with `backdrop-filter: blur(16px)`. Border is a crisp `1px` translucent edge line (`rgba(0, 242, 254, 0.15)`).
3. **Focused / Critical Overlays (Tier 2 Surface):** Elevated modules feature an active emissive neon border (`rgba(0, 242, 254, 0.6)`) backed by a diffused ambient photon halo: `box-shadow: 0 0 20px -2px rgba(0, 242, 254, 0.25)`.
4. **Emergency Overrides (Tier 3 Alert):** Pulsing red perimeter glow with `box-shadow: 0 0 28px 0px rgba(239, 68, 68, 0.4)` and a saturated backdrop shield (`rgba(17, 24, 39, 0.95)`).

## Shapes

The interface uses low-radius, high-precision geometry (`roundedness: 1` / 4px base radius) to evoke calibrated instrumentation panels, hardened field computers, and spaceframe construction.

### Geometric Rules
- **Modules & Data Cells:** 4px (`rounded-sm`) exterior corners provide a tactical, engineered silhouette while avoiding the clinical fatigue of razor-sharp right angles.
- **Flight Controls & Critical Action Triggers:** Standardized 4px base geometry. Status chips and telemetry tags may use chamfered/notched styling (`clip-path`) or soft 4px fillets.
- **Status Pills & Telemetry Badges:** Semi-capsular 8px (`rounded-lg`) curvature reserved strictly for real-time telemetry pills, online/offline status monitors, and latency tags to distinguish status data from structural cards.

## Components

### Telemetry & Flight Deck Cards
- **Base HUD Container:** Background of `#111827` at 85% opacity, backdrop blur of 16px, 1px border of `rgba(0, 242, 254, 0.15)`, and 4px border radius.
- **Header Line:** Sub-divided with a 1px border-bottom (`#1F2937`). Top label uses `label-caps` in `#94A3B8` paired with an active status beacon.
- **Telemetry Readout:** Primary numerical data displayed via `telemetry-lg` in `#00F2FE` with small scalar units (`m/s`, `kPa`, `bpm`) set in `telemetry-sm` in `#94A3B8`.

### Cockpit Status Chips
- **Nominal State:** Background of `rgba(0, 242, 254, 0.08)`, border of `rgba(0, 242, 254, 0.3)`, text in `JetBrains Mono` (`label-caps`) colored `#00F2FE`. Accompanied by a static 6px cyan circle beacon.
- **Warning State:** Background of `rgba(245, 158, 11, 0.1)`, border of `rgba(245, 158, 11, 0.4)`, text colored `#F59E0B`. Accompanied by an amber warning icon.
- **Emergency State:** Background of `rgba(239, 68, 68, 0.15)`, border of `#EF4444`, text colored `#EF4444`. Features an asynchronous 1Hz blinking red indicator beacon.

### Offline & Earth Comm Delay Pill
- **Structure:** Pill-shaped badge (`rounded-lg`) displaying link state and unidirectional radio packet transit delay.
- **Styling:** Dark acrylic fill `#111827`, hairline border `rgba(99, 102, 241, 0.35)`.
- **Content Formatting:**
  - Left indicator: Dimmed offline beacon (4px dot, `#6366F1`).
  - Signal tag: `label-caps` reading `EARTH COMM LATENCY`.
  - Latency value: `telemetry-sm` in bold amber or cyan tracking dynamic light-speed delay (e.g., `+00:14:22.4 RTT`).

### Action Triggers (Buttons)
- **Primary Telemetry Engage:** Solid `#00F2FE` surface, text rendered in `#0B0F17` (`Inter` 600 weight). On hover/active, an outer neon glow bloom emits (`box-shadow: 0 0 16px rgba(0, 242, 254, 0.5)`).
- **Secondary HUD Button:** Transparent container, 1px border of `#00F2FE` with 30% alpha, text in `#00F2FE`. Hover triggers subtle background fill of `rgba(0, 242, 254, 0.08)`.
- **Emergency Abort Action:** High-saturation `#EF4444` background, pure white text, permanent alert pulsing outer box-shadow.

### Inputs & Sensor Scrubbers
- **Inputs:** Dark field `#0B0F17` recessed inside panel cards. Border in `#1F2937`, focusing to `#00F2FE` with zero-latency glow feedback. Numerical inputs format strictly via `JetBrains Mono`.
- **Toggle Switches & Checkboxes:** Micro-mechanical toggle switches with solid binary tick response. Inactive slots set to `#1F2937`; active toggles fill with `#00F2FE` and a glowing 12px pill indicator.