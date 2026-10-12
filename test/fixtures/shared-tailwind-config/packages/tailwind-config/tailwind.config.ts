import type { Config } from "tailwindcss";

// Light and dark values are set in themes.css, as RGB channels.
export const theme = {
  extend: {
    colors: {
      "bg-default": "rgb(var(--bg-default, 255 255 255) / <alpha-value>)",
      "bg-subtle": "rgb(var(--bg-subtle, 245 245 245) / <alpha-value>)",
      "bg-error": "rgb(var(--bg-error, 254 226 226) / <alpha-value>)",

      "border-default": "rgb(var(--border-default, 212 212 212) / <alpha-value>)",

      "content-default": "rgb(var(--content-default, 64 64 64) / <alpha-value>)",
      "content-subtle": "rgb(var(--content-subtle, 115 115 115) / <alpha-value>)",
      "content-emphasis": "rgb(var(--content-emphasis, 23 23 23) / <alpha-value>)",

      "content-success": "rgb(var(--content-success, 22 163 74) / <alpha-value>)",
      "content-warning": "rgb(var(--content-warning, 202 138 4) / <alpha-value>)",
      "content-error": "rgb(var(--content-error, 220 38 38) / <alpha-value>)",
    },
  },
} satisfies Config["theme"];

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme,
};

export default config;
