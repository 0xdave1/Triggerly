export const colors = {
  background: "#050805",
  backgroundAlt: "#070A08",
  surface: "#0B0F0C",
  surfaceMuted: "#101510",
  surfaceRaised: "#111A13",
  text: "#D7FBE0",
  textMuted: "#6D756D",
  border: "rgba(80, 255, 120, 0.18)",
  borderStrong: "rgba(20, 248, 117, 0.44)",
  primary: "#00FF66",
  primaryDark: "#14F875",
  success: "#49FF9A",
  cyan: "#18D8FF",
  warning: "#FFB82E",
  danger: "#FF4D4D",
  black: "#020402",
  scanline: "rgba(215, 251, 224, 0.035)",
  glow: "rgba(0, 255, 102, 0.26)"
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32
};

export const radii = {
  sm: 10,
  md: 16,
  lg: 22
};

export const typography = {
  title: 30,
  section: 18,
  body: 16,
  small: 13,
  mono:
    "JetBrains Mono, IBM Plex Mono, Space Mono, SF Mono, Menlo, Consolas, monospace",
  letterSpacing: 1.6
};

export const glows = {
  primary: {
    shadowColor: colors.primary,
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8
  },
  cyan: {
    shadowColor: colors.cyan,
    shadowOpacity: 0.2,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6
  }
};
