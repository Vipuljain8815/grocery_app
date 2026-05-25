export const theme = {
  colors: {
    primary: '#10B981', // Fresh Emerald Green
    primaryDark: '#059669',
    primaryLight: '#D1FAE5',
    secondary: '#F59E0B', // Warm amber for accents/promos
    background: '#F9FAFB', // Very subtle off-white
    surface: '#FFFFFF', // Pure white for cards
    surfaceDark: '#F3F4F6', // Slightly darker for pressed states or secondary cards
    text: '#111827', // Almost black for high readability
    textSecondary: '#6B7280', // Soft gray for descriptions
    border: '#E5E7EB',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    transparent: 'transparent',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radii: {
    sm: 8,
    md: 12,
    lg: 20, // Modern large rounded corners
    xl: 28,
    pill: 9999,
  },
  shadows: {
    none: {
      elevation: 0,
      shadowOpacity: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 24,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.08,
      shadowRadius: 32,
      elevation: 8,
    },
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '800' as const, color: '#111827', letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700' as const, color: '#111827', letterSpacing: -0.3 },
    h3: { fontSize: 18, fontWeight: '600' as const, color: '#111827' },
    bodyLg: { fontSize: 16, fontWeight: '500' as const, color: '#374151' },
    body: { fontSize: 15, fontWeight: '400' as const, color: '#4B5563' },
    bodySm: { fontSize: 13, fontWeight: '500' as const, color: '#6B7280' },
    caption: { fontSize: 11, fontWeight: '600' as const, color: '#9CA3AF', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  },
};
