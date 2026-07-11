---
name: Automotive Enterprise
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#43474e'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777f'
  outline-variant: '#c4c6cf'
  surface-tint: '#455f87'
  primary: '#022448'
  on-primary: '#ffffff'
  primary-container: '#1e3a5f'
  on-primary-container: '#8aa4cf'
  inverse-primary: '#adc8f5'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#3b1c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#5a2e00'
  on-tertiary-container: '#f08921'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#adc8f5'
  on-primary-fixed: '#001c3b'
  on-primary-fixed-variant: '#2d486d'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system establishes a **Corporate/Modern** aesthetic tailored for the high-stakes, data-dense environment of automotive dealership management. The visual narrative focuses on reliability, precision, and clarity, ensuring that complex inventory data is digestible at a glance.

The target audience consists of dealership managers and inventory specialists who require a tool that feels like a high-performance instrument rather than a consumer app. The UI is characterized by a "utilitarian elegance"—using generous whitespace to reduce cognitive load while maintaining a structured, professional rigor. The emotional response should be one of confidence and control, achieved through a cool-toned palette and a strict adherence to a systematic layout.

## Colors

The color palette is functionally driven to provide immediate status communication:

*   **Primary (Deep Blue):** Used for core navigation, primary actions, and structural headers to instill a sense of institutional trust.
*   **Secondary (Teal):** Dedicated to positive growth, healthy stock levels, and completed actions.
*   **Tertiary (Amber):** Used exclusively for "Aging" stock warnings and cautionary metrics requiring attention.
*   **Critical (Red):** Reserved for urgent inventory alerts, overdue actions, or financial discrepancies.
*   **Background & Neutrals:** A crisp #FAFBFC foundation provides high contrast for data. We use a slate-tinted neutral scale for borders and secondary text to maintain the "cool" professional tone.

## Typography

The typography utilizes **Inter** for its exceptional legibility in data-heavy interfaces and its neutral, systematic character. 

Hierarchy is established through weight and subtle shifts in gray-scale values rather than excessive size changes. 
- **Tabular Data:** Use `body-sm` with tabular lining figures for inventory lists to ensure numbers align vertically.
- **Labels:** Uppercase styles are reserved for small category labels and table headers to distinguish them from actionable content.
- **Mobile Scaling:** On devices, `display-lg` scales down to 24px to maintain readability without overwhelming the viewport.

## Layout & Spacing

The design system employs a **12-column fluid grid** for the main dashboard content, transitioning to a single-column layout for mobile. 

The layout relies on a **8px linear scale** to drive consistency. 
- **Containers:** Dashboard cards use `lg` (24px) internal padding to provide a "breathable" feel amidst dense data.
- **Tables:** Row heights are set to 48px to balance information density with touch-targets and visual scanning.
- **Sidebars:** Fixed at 280px on desktop to house secondary filtering and global navigation, collapsing to a hamburger menu on tablet/mobile.

## Elevation & Depth

To maintain a clean, professional look, depth is communicated through **Tonal Layering** supplemented by **Ambient Shadows**.

1.  **Level 0 (Base):** #FAFBFC background.
2.  **Level 1 (Cards/Surface):** Pure white (#FFFFFF) containers with a subtle 1px border (#E2E8F0) and the primary soft shadow.
3.  **Level 2 (Dropdowns/Modals):** High elevation with a more pronounced shadow to separate temporary interaction layers from the data beneath.

**Shadow Specification:** 
- `elevation-low`: 0 1px 3px rgba(0,0,0,0.1) — used for standard cards.
- `elevation-high`: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05) — used for modals and tooltips.

## Shapes

The shape language utilizes a tiered rounding system to indicate the hierarchy of elements:

- **Cards & Major Containers:** 12px (`rounded-lg`) provides a modern, slightly softened frame for data.
- **Buttons & Inputs:** 8px (Standard) ensures these interaction points feel substantial and distinct.
- **Badges & Small Status Tags:** 6px (Soft) allows these elements to feel integrated into the text flow without being perfectly circular or overly sharp.

## Components

### Buttons
- **Primary:** Deep Blue (#1E3A5F) background with white text. 8px radius.
- **Secondary:** Transparent with a 1px border of the Primary color.
- **Action (Log Action):** Uses the Primary blue to drive the "next step" in the inventory workflow.

### Data Tables
- Header rows feature a light gray tint (#F1F5F9) with `label-md` text.
- Alternate row striping is avoided; instead, use 1px subtle bottom borders.
- Hover states on rows should use a very faint blue tint (#F8FAFC).

### Badges (Status Tags)
- **Aging:** Amber (#D97706) background with high-contrast dark amber text.
- **Critical:** Red (#DC2626) background with white text.
- **Healthy/New:** Teal (#0D9488) background with white text.
- All badges use 6px rounding and `label-sm` typography.

### Input Fields
- White background with a 1px #CBD5E1 border.
- 8px border radius.
- On focus, the border transitions to Primary Blue (#1E3A5F) with a 2px outer glow of the same color at 10% opacity.

### Dashboard Cards
- Pure white background.
- 12px radius.
- Includes a 1px #E2E8F0 border and `elevation-low`.
- Header section of cards should use `headline-sm` with 24px bottom padding.