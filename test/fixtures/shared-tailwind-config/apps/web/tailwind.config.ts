import sharedConfig from "@acme/tailwind-config/tailwind.config";
import type { Config } from "tailwindcss";

const config: Pick<Config, "presets"> = {
  presets: [
    {
      ...sharedConfig,
      content: ["./app/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
      theme: {
        extend: {
          ...sharedConfig?.theme?.extend,
          animation: {
            "text-appear": "text-appear 0.15s ease",
          },
        },
      },
    },
  ],
};

export default config;
