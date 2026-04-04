export const colors = {
  primary: {
    50: "#EEEDFE",
    100: "#CECBF6",
    200: "#AFA9EC",
    400: "#7F77DD",
    600: "#534AB7",
    800: "#3C3489",
    900: "#26215C"
  },
  teal: {
    50: "#E1F5EE",
    100: "#9FE1CB",
    400: "#1D9E75",
    600: "#0F6E56",
    800: "#085041"
  },
  coral: {
    50: "#FAECE7",
    100: "#F5C4B3",
    400: "#D85A30",
    600: "#993C1D",
    800: "#712B13"
  },
  amber: {
    50: "#FAEEDA",
    100: "#FAC775",
    400: "#BA7517",
    600: "#854F0B",
    800: "#633806"
  },
  green: {
    50: "#EAF3DE",
    400: "#639922",
    600: "#3B6D11"
  },
  red: {
    50: "#FCEBEB",
    400: "#E24B4A",
    600: "#A32D2D"
  },
  gray: {
    50: "#F1EFE8",
    100: "#D3D1C7",
    200: "#B4B2A9",
    400: "#888780",
    600: "#5F5E5A",
    800: "#444441",
    900: "#2C2C2A"
  },
  white: "#FFFFFF",
  black: "#000000"
} as const;

export type ColorTokens = typeof colors;
