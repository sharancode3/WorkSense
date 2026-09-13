import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: "var(--color-canvas)",
        surface: {
          DEFAULT: "var(--color-surface)",
          secondary: "var(--color-surface-secondary)",
          tertiary: "var(--color-surface-tertiary)",
        },
        content: {
          primary: "var(--color-text-primary)",
          secondary: "var(--color-text-secondary)",
          muted: "var(--color-text-muted)",
        },
        brand: {
          primary: {
            DEFAULT: "var(--color-brand-primary)",
            hover: "var(--color-brand-primary-hover)",
            soft: "var(--color-brand-primary-soft)",
          },
          accent: {
            DEFAULT: "var(--color-brand-accent)",
            hover: "var(--color-brand-accent-hover)",
            soft: "var(--color-brand-accent-soft)",
          },
        },
        boundary: {
          subtle: "var(--color-border-subtle)",
          strong: "var(--color-border-strong)",
        },
        status: {
          success: {
            DEFAULT: "var(--color-success)",
            bg: "var(--color-success-bg)",
            border: "var(--color-success-border)",
          },
          warning: {
            DEFAULT: "var(--color-warning)",
            bg: "var(--color-warning-bg)",
            border: "var(--color-warning-border)",
          },
          danger: {
            DEFAULT: "var(--color-danger)",
            bg: "var(--color-danger-bg)",
            border: "var(--color-danger-border)",
          },
          info: {
            DEFAULT: "var(--color-info)",
            bg: "var(--color-info-bg)",
            border: "var(--color-info-border)",
          },
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-outfit)", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "10px",
        full: "9999px",
      },
      boxShadow: {
        none: "none",
        subtle: "none",
        card: "none",
        dialog: "none",
      },
    },
  },
  plugins: [],
};

export default config;
