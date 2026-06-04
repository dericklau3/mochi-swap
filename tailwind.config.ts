import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mochi: {
          bg: "#fbf7ff",
          surface: "#ffffff",
          warm: "#f6efff",
          ink: "#25104f",
          text: "#4d3a75",
          muted: "#7c6c9b",
          border: "#e6d8f7",
          accent: "#8b5cf6",
          pink: "#ef61b7",
          teal: "#28d8c6"
        }
      },
      boxShadow: {
        mochi: "0 24px 64px rgba(65, 24, 132, 0.14)",
        ring: "0 0 0 1px #e6d8f7"
      },
      borderRadius: {
        card: "28px"
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', "ui-monospace", "Menlo", "monospace"]
      }
    }
  },
  plugins: []
} satisfies Config;
