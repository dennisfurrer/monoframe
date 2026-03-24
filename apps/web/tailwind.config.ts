import type { Config } from "tailwindcss";
import webConfig from "@monoframe/tailwind-config/web";

export default {
  ...webConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../packages/ui-atoms/src/**/*.{ts,tsx}",
    "../../packages/ui-molecules/src/**/*.{ts,tsx}",
  ],
  theme: {
    ...webConfig.theme,
    extend: {
      ...webConfig.theme?.extend,
      fontFamily: {
        sans: ["var(--font-sora)", "Sora", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
    },
  },
} satisfies Config;
