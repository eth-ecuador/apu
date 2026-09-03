/**
 * APU Brand Colors
 * From official brand kit
 */

export const brandColors = {
  // Primary Brand Colors
  brandViolet: '#493FEE',      // Main brand color
  violetTint: '#958FEC',        // Secondary/tint
  ink: '#131313',               // Text primary
  paper: '#F5F5F5',             // Background

  // UI States
  pressed: '#372DD6',           // Interactive pressed state
  wash: '#EDECEFC',             // Light backgrounds
  borde: '#E4E3EB',             // Borders
  textoTenue: '#65C7A',         // Muted text

  // Semantic Colors
  success: '#1F9E6E',           // Success states
  warning: '#C77A16',           // Warning states
  error: '#D7263D',             // Error states

  // Dark Mode
  darkBg: '#131313',
  darkText: '#F5F5F5',
  darkAccent: '#B6B4C2',
} as const;

export type BrandColor = keyof typeof brandColors;
