import { theme } from "@acme/tailwind-config";
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}"],
  darkMode: "class",
  theme,
} satisfies Config;
