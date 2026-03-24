import type { Config } from "tailwindcss";

/**
 * Monoframe Tailwind Base Configuration
 *
 * Colors use CSS custom properties for runtime theme switching.
 * Define values in globals.css under :root and [data-theme="..."] selectors.
 */
export default {
  darkMode: ["class"],
  content: ["src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic - Status
        success: {
          DEFAULT: "var(--color-success)",
          muted: "var(--color-success-muted)",
        },
        danger: {
          DEFAULT: "var(--color-danger)",
          muted: "var(--color-danger-muted)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          muted: "var(--color-warning-muted)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          muted: "var(--color-info-muted)",
        },

        // Brand
        accent: {
          DEFAULT: "var(--color-accent)",
          muted: "var(--color-accent-muted)",
          hover: "var(--color-accent-hover)",
        },

        // Surfaces
        bg: {
          deep: "var(--color-bg-deep)",
          primary: "var(--color-bg-primary)",
          secondary: "var(--color-bg-secondary)",
          tertiary: "var(--color-bg-tertiary)",
          elevated: "var(--color-bg-elevated)",
        },

        // Borders
        border: {
          DEFAULT: "var(--color-border-default)",
          muted: "var(--color-border-muted)",
          strong: "var(--color-border-strong)",
        },

        // Text
        text: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
          inverse: "var(--color-text-inverse)",
          "on-accent": "var(--color-text-on-accent)",
        },
      },

      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["IBM Plex Mono", "Fira Code", "monospace"],
      },

      fontSize: {
        xs: ["11px", { lineHeight: "16px" }],
        sm: ["12px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "20px" }],
        lg: ["16px", { lineHeight: "24px" }],
        xl: ["18px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["32px", { lineHeight: "40px" }],
      },

      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
      },

      letterSpacing: {
        tight: "-0.025em",
        normal: "0",
        wide: "0.05em",
      },

      spacing: {
        "0": "0",
        "1": "0.25rem",
        "2": "0.5rem",
        "3": "0.75rem",
        "4": "1rem",
        "5": "1.25rem",
        "6": "1.5rem",
        "8": "2rem",
        "10": "2.5rem",
        "12": "3rem",
        "16": "4rem",
      },

      borderRadius: {
        none: "0",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "9999px",
      },

      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },

      transitionDuration: {
        fast: "100ms",
        normal: "150ms",
        slow: "300ms",
      },

      transitionTimingFunction: {
        DEFAULT: "ease-out",
      },

      zIndex: {
        base: "0",
        dropdown: "10",
        sticky: "20",
        modal: "30",
        popover: "40",
        toast: "50",
      },

      animation: {
        spin: "spin 0.75s linear infinite",
        pulse: "pulse 1.5s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "slide-in-top": "slide-in-top 0.3s ease-out",
      },

      keyframes: {
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        pulse: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-in-top": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
} satisfies Config;
