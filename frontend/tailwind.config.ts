import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAFA",
        surface: "#FFFFFF",
        "surface-2": "#F4F4F5",
        ink: {
          DEFAULT: "#0B0B0F",
          muted: "#52525B",
          subtle: "#A1A1AA",
        },
        border: {
          subtle: "#E4E4E7",
          strong: "#D4D4D8",
        },
        accent: {
          DEFAULT: "#5B4DF5",
          hover: "#4840D6",
          secondary: "#8B5CF6",
        },
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        highlight: {
          bg: "#FEF3C7",
          text: "#92400E",
        },
        "active-segment": {
          bg: "#EEF2FF",
          border: "#5B4DF5",
        },
        promo: {
          bg: "#EEF0FF",
        },
        "free-tier": {
          bg: "#FEF3C7",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SF Mono",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        sm: "0 1px 2px rgba(0,0,0,0.04)",
        md: "0 2px 6px rgba(0,0,0,0.06)",
        lg: "0 8px 24px rgba(0,0,0,0.10)",
        pop: "0 16px 40px rgba(0,0,0,0.16)",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;