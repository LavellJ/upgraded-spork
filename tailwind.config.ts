import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './client/src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 6px 18px rgba(0,0,0,.06)',
        'card-dark': '0 6px 18px rgba(0,0,0,.35)',
      },
      colors: {
        // mapped to CSS variables; do not hardcode in components
        bg: {
          page: 'rgb(var(--bg-page))',
          card: 'rgb(var(--bg-card))',
          soft: 'rgb(var(--bg-soft))',
          // Legacy compatibility
          subtle: 'rgb(var(--bg-soft))',
          // TP5 theme tokens
          base: 'rgb(var(--bg-base) / <alpha-value>)',
          elev: 'rgb(var(--bg-elev) / <alpha-value>)',
        },
        fg: {
          DEFAULT: 'rgb(var(--fg-default))',
          muted: 'rgb(var(--fg-muted))',
          subtle: 'rgb(var(--fg-subtle))',
          inverse: 'rgb(var(--fg-inverse))',
          // Legacy compatibility
          default: 'rgb(var(--fg-default))',
          // TP5 theme tokens
          base: 'rgb(var(--fg-base) / <alpha-value>)',
        },
        brand: {
          DEFAULT: 'rgb(var(--brand))',
          600: 'rgb(var(--brand-600))',
          700: 'rgb(var(--brand-700))',
          // TP5 theme tokens
          500: 'rgb(var(--brand-500) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        positive: 'rgb(var(--positive))',
        warning: 'rgb(var(--warning))',
        danger: 'rgb(var(--danger))',
        // TP5 status tokens
        success: { 500: 'rgb(var(--success-500) / <alpha-value>)' },
        warn: { 500: 'rgb(var(--warn-500) / <alpha-value>)' },
        
        // Legacy shadcn/ui colors for compatibility
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        body: ["var(--font-body)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-sans)"],
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "float": "float 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        "parallax": "parallax 20s linear infinite",
        "gradient-shift": "gradient-shift 20s ease infinite",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%": { transform: "translateY(-10px) rotate(1deg)" },
          "66%": { transform: "translateY(5px) rotate(-1deg)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.8", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.02)" },
        },
        "parallax": {
          "0%": { transform: "translateX(-100px)" },
          "100%": { transform: "translateX(100px)" },
        },
        "gradient-shift": {
          "0%": { "background-position": "0% 50%" },
          "50%": { "background-position": "100% 50%" },
          "100%": { "background-position": "0% 50%" },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    function ({ addUtilities }) {
      addUtilities({
        '.focus-ring': {
          outline: '2px solid transparent',
          outlineOffset: '2px',
          boxShadow: '0 0 0 3px rgba(34, 197, 94, .45)',
        },
      })
    },
  ],
} satisfies Config