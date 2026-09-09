import type { Config } from "tailwindcss";
import webConfig from "@monoframe/tailwind-config/web";

export default {
  ...webConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../../packages/ui-atoms/src/**/*.{ts,tsx}",
    "../../../packages/ui-molecules/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
