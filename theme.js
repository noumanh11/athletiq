// Athletiq design system: a small, restrained set of colours, spacing and type sizes.
// Every screen/component imports from here so the whole app stays consistent.

export const colors = {
  background: '#F5F6F3', // very light warm neutral (screen background)
  surface: '#FFFFFF', // cards and inputs
  ink: '#0E0F0C', // near-black: primary text, primary buttons, dark cards
  inkSurface: '#252720', // raised block inside a dark card
  inkBorder: '#3C3E36', // divider inside a dark card
  inkMuted: '#B8BCB0', // secondary text on dark surfaces
  muted: '#6B6F66', // secondary text
  placeholder: '#9A9E94',
  border: '#E2E4DD', // subtle borders
  track: '#E9EBE4', // segmented control / empty bar background
  accent: '#C8F31D', // electric lime (use on dark surfaces or as a graphic accent)
  accentTint: '#EEFBC4',
  success: '#2F7D32',
  successTint: '#E8F5E4',
  warning: '#B54708',
  warningTint: '#FFF1D9',
  danger: '#B42318',
  dangerTint: '#FEF3F2',
  overlay: 'rgba(14, 15, 12, 0.48)', // behind sheets and dialogs
};

// 4-point spacing scale. Use these instead of random numbers.
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };

export const radius = { xs: 8, sm: 12, md: 16, lg: 20, pill: 999 };

export const type = {
  brand: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  title: { fontSize: 28, fontWeight: '800', lineHeight: 34, letterSpacing: -0.5 },
  heading: { fontSize: 20, fontWeight: '800', letterSpacing: -0.2 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2 }, // small uppercase label
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1 }, // uppercase caption inside cards
  label: { fontSize: 12, fontWeight: '600' },
  value: { fontSize: 16, fontWeight: '500' },
  body: { fontSize: 14, lineHeight: 20 },
  caption: { fontSize: 12 },
  stat: { fontSize: 22, fontWeight: '700' },
  number: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  metric: { fontSize: 52, fontWeight: '800', letterSpacing: -1 },
  button: { fontSize: 17, fontWeight: '700' },
};

export const iconSize = { sm: 16, md: 20, lg: 22, xl: 28 };

// Only used on floating elements (tab bar, sheets). Cards use borders, not shadows.
export const shadow = {
  floating: { shadowColor: colors.ink, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -4 }, elevation: 12 },
};

// Animation durations in ms. Keep motion short and purposeful.
export const duration = { fast: 150, base: 240, slow: 420, stagger: 50 };

// Minimum comfortable touch target.
export const TOUCH = 48;
