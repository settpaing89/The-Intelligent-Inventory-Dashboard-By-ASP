/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      // Color tokens transcribed verbatim from DESIGN.md's frontmatter
      // `colors:` block (the Material3-style token set), plus a handful of
      // additional named tokens for literal hex values that DESIGN.md's
      // prose (Components/Elevation sections) specifies but that aren't
      // part of that structured token block. See SYSTEM_DESIGN.md's
      // Revision Log for how ambiguities/conflicts between the two were
      // resolved (e.g. two different "background" hex values were given).
      colors: {
        surface: '#f8f9ff',
        'surface-dim': '#cbdbf5',
        'surface-bright': '#f8f9ff',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#eff4ff',
        'surface-container': '#e5eeff',
        'surface-container-high': '#dce9ff',
        'surface-container-highest': '#d3e4fe',
        'on-surface': '#0b1c30',
        'on-surface-variant': '#43474e',
        'inverse-surface': '#213145',
        'inverse-on-surface': '#eaf1ff',
        outline: '#74777f',
        'outline-variant': '#c4c6cf',
        'surface-tint': '#455f87',
        primary: '#022448',
        'on-primary': '#ffffff',
        'primary-container': '#1e3a5f',
        'on-primary-container': '#8aa4cf',
        'inverse-primary': '#adc8f5',
        secondary: '#006a61',
        'on-secondary': '#ffffff',
        'secondary-container': '#86f2e4',
        'on-secondary-container': '#006f66',
        tertiary: '#3b1c00',
        'on-tertiary': '#ffffff',
        'tertiary-container': '#5a2e00',
        'on-tertiary-container': '#f08921',
        error: '#ba1a1a',
        'on-error': '#ffffff',
        'error-container': '#ffdad6',
        'on-error-container': '#93000a',
        'primary-fixed': '#d5e3ff',
        'primary-fixed-dim': '#adc8f5',
        'on-primary-fixed': '#001c3b',
        'on-primary-fixed-variant': '#2d486d',
        'secondary-fixed': '#89f5e7',
        'secondary-fixed-dim': '#6bd8cb',
        'on-secondary-fixed': '#00201d',
        'on-secondary-fixed-variant': '#005049',
        'tertiary-fixed': '#ffdcc3',
        'tertiary-fixed-dim': '#ffb77d',
        'on-tertiary-fixed': '#2f1500',
        'on-tertiary-fixed-variant': '#6e3900',
        background: '#f8f9ff',
        'on-background': '#0b1c30',
        'surface-variant': '#d3e4fe',
        // Additional literal hex values named only in DESIGN.md's prose,
        // not present in the frontmatter token block:
        'page-bg': '#FAFBFC', // "Elevation & Depth" > Level 0 (Base)
        'card-border': '#E2E8F0', // Level 1 surface border / "Dashboard Cards" border
        'table-header': '#F1F5F9', // "Data Tables" header tint
        'table-hover': '#F8FAFC', // "Data Tables" row hover tint
        'input-border': '#CBD5E1', // "Input Fields" border
        'badge-aging': '#D97706', // "Badges" Aging background
        'badge-critical': '#DC2626', // "Badges" Critical background
        'badge-healthy': '#0D9488', // "Badges" Healthy/New background
      },
      // Rounding scale transcribed verbatim from DESIGN.md's `rounded:`
      // frontmatter block. This intentionally overrides Tailwind's stock
      // rounded-* values (e.g. rounded-lg is 1rem here, not Tailwind's
      // default 0.5rem) so the named scale matches DESIGN.md exactly.
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
        // "Shapes": badges use 6px rounding, a value the named scale above
        // doesn't otherwise produce (sm=4px, DEFAULT=8px, md=12px).
        badge: '0.375rem',
      },
      // Spacing scale transcribed verbatim from DESIGN.md's `spacing:`
      // frontmatter block (base and sm are both 8px in the source file —
      // kept as given, not deduplicated).
      spacing: {
        base: '8px',
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        gutter: '24px',
        margin: '32px',
      },
      // Shadow tokens from "Elevation & Depth" > Shadow Specification.
      // Not explicitly listed among the theme keys to extend, but added
      // for the same reason as colors/radius/spacing: Dashboard Cards and
      // ActionLogDrawer both need these exact values, and centralizing
      // them here avoids hardcoding raw shadow CSS per component.
      boxShadow: {
        'elevation-low': '0 1px 3px rgba(0,0,0,0.1)',
        'elevation-high':
          '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
    },
  },
}
