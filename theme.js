// Athletiq design system: a small, restrained set of colours, spacing and type sizes.
// Every screen/component imports from here so the whole app stays consistent.

export const colors = {
  background: '#F5F6F3', // very light warm neutral
  surface: '#FFFFFF', // cards and inputs
  ink: '#0E0F0C', // near-black: primary text, primary buttons
  inkSurface: '#252720',
  inkBorder: '#3C3E36',
  muted: '#6B6F66', // secondary text
  placeholder: '#9A9E94',
  border: '#E2E4DD', // subtle borders
  track: '#E9EBE4', // segmented control / empty bar background
  accent: '#C8F31D', // electric lime (use on dark surfaces or as a graphic accent)
  danger: '#B42318',
  dangerTint: '#FEF3F2',
};

// 4-point spacing scale. Use these instead of random numbers.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const radius = { sm: 12, md: 16, lg: 20, pill: 999 };

export const type = {
  brand: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 34, letterSpacing: -0.5 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 }, // small uppercase label
  label: { fontSize: 12, fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '500' },
  body: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12 },
  metric: { fontSize: 52, fontWeight: '800', letterSpacing: -1 },
  button: { fontSize: 17, fontWeight: '700' },
};

// Minimum comfortable touch target.
export const TOUCH = 48;
