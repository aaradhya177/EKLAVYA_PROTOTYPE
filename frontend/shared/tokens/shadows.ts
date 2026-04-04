export const webShadows = {
  sm: "0 2px 8px rgba(38, 33, 92, 0.08)",
  md: "0 8px 20px rgba(38, 33, 92, 0.12)",
  lg: "0 18px 40px rgba(38, 33, 92, 0.18)"
} as const;

export const nativeShadows = {
  sm: {
    shadowColor: "#26215C",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  md: {
    shadowColor: "#26215C",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5
  },
  lg: {
    shadowColor: "#26215C",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8
  }
} as const;

export const shadows = {
  web: webShadows,
  native: nativeShadows
} as const;

export type ShadowTokens = typeof shadows;
