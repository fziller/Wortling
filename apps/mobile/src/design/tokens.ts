export const tokens = {
  palette: {
    primary: { 50: "#FFF1E8", 100: "#FFE0CC", 200: "#FFC39F", 500: "#FF6B35", 600: "#E95827", 700: "#C9421B" },
    neutral: { 0: "#FFFFFF", 50: "#FFFDF8", 100: "#F7F1E8", 200: "#E5D7C5", 500: "#74685B", 700: "#40372D", 900: "#17130D" },
    success: { 50: "#E8F7F1", 500: "#21A67A", 700: "#157454" },
    warning: { 50: "#FFF3D9", 500: "#D98500", 700: "#9C6100" },
    danger: { 50: "#FBEAE8", 500: "#C73E3A", 700: "#8E2B28" },
  },
  color: {
    ink: "#17130D",
    muted: "#74685B",
    paper: "#F7F1E8",
    card: "#FFF9EF",
    line: "#E5D7C5",
    primary: "#FF6B35",
    primaryDark: "#D94A1E",
    primaryLight: "#FFF1DF",
    secondary: "#246BFE",
    success: "#21A67A",
    warning: "#D98500",
    danger: "#C73E3A",
    shadow: "#2B1708"
  },
  surface: {
    canvas: "#F7F1E8",
    raised: "#FFFDF8",
    keyboard: "rgba(255, 253, 248, 0.94)",
    input: "rgba(255, 253, 248, 0.92)",
    subdued: "#FFF1E8",
  },
  text: {
    primary: "#17130D",
    secondary: "#74685B",
    inverse: "#FFFFFF",
    accent: "#C9421B",
  },
  border: {
    subtle: "#E5D7C5",
    strong: "#FFC39F",
  },
  radius: {
    sm: 10,
    md: 16,
    lg: 24,
    pill: 999
  },
  space: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 34
  },
  type: {
    title: 42,
    h1: 30,
    h2: 22,
    body: 17,
    small: 13
  },
  font: {
    ui: {
      regular: "InstrumentSans-Regular",
      medium: "InstrumentSans-Medium",
      semibold: "InstrumentSans-SemiBold",
      bold: "InstrumentSans-Bold",
    },
  },
  typography: {
    display: { fontWeight: "900" as const },
    displayTitle: { fontSize: 42, fontWeight: "900" as const, letterSpacing: -1.8 },
    uiBody: { fontFamily: "InstrumentSans-Regular", fontSize: 17, lineHeight: 24 },
    uiLabel: { fontFamily: "InstrumentSans-SemiBold", fontSize: 13, letterSpacing: 0.5 },
    uiControl: { fontFamily: "InstrumentSans-SemiBold", fontSize: 16 },
    uiNumeric: { fontFamily: "InstrumentSans-Bold", fontVariant: ["tabular-nums"] as const },
  },
  shadow: {
    raised: { color: "#2B1708", opacity: 0.09, radius: 18, offset: { width: 0, height: 9 }, elevation: 2 },
  },
  motion: {
    quick: 160,
    normal: 260,
    slow: 420
  }
} as const;
