import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        sans: ["Source Sans 3", "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        burgundy: {
          DEFAULT: "hsl(var(--burgundy))",
          light: "hsl(var(--burgundy-light))",
          dark: "hsl(var(--burgundy-dark))",
        },
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
        },
        ivory: "hsl(var(--ivory))",
        cream: "hsl(var(--cream))",
        stone: "hsl(var(--stone))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%, 100%": { filter: "drop-shadow(0 0 5px hsl(var(--gold) / 0.5))" },
          "50%": { filter: "drop-shadow(0 0 20px hsl(var(--gold) / 0.8))" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        // ===== HERO BANNER ANIMATION PACKAGES =====
        // Package 1: "Subtle Glow" - Very subtle opacity pulse for logo
        "glow-subtle": {
          "0%, 100%": { opacity: "0.92" },
          "50%": { opacity: "1" },
        },
        // Package 2: "Text Shimmer Gold" - Golden text shimmer for title
        "text-shimmer-gold": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        // Package 3: "Soft Float" - Gentle upward float for subtitle
        "float-soft": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        // Package 1 Alternative: "Pulse Slow" - Ultra-slow pulse for logo
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        // Package 2 Alternative: "Glow Text" - Subtle text glow effect
        "glow-text": {
          "0%, 100%": { filter: "drop-shadow(0 0 6px rgba(251,191,36,0.25))" },
          "50%": { filter: "drop-shadow(0 0 16px rgba(251,191,36,0.45))" },
        },
        // ===== BADGES & DECORATIVE ANIMATIONS =====
        // Badge: Rainbow pulse effect
        "badge-pulse": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(251, 191, 36, 0.7)" },
          "50%": { boxShadow: "0 0 0 6px rgba(251, 191, 36, 0)" },
        },
        // Badge: Color rotation for gradient badges
        "badge-color-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        // Logo: 3D star rotation effect
        "star-rotate-3d": {
          "0%": { transform: "rotateX(0deg) rotateY(0deg) rotateZ(0deg)" },
          "50%": { transform: "rotateX(10deg) rotateY(15deg) rotateZ(5deg)" },
          "100%": { transform: "rotateX(0deg) rotateY(0deg) rotateZ(0deg)" },
        },
        // Logo: Gentle sparkle/twinkle effect
        "sparkle": {
          "0%, 100%": { opacity: "1", filter: "drop-shadow(0 0 0px rgba(251, 191, 36, 0.5))" },
          "50%": { opacity: "0.8", filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        float: "float 6s ease-in-out infinite",
        glow: "glow 3s ease-in-out infinite",
        shimmer: "shimmer 3s infinite",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        // ===== HEADER ANIMATIONS =====
        "glow-subtle": "glow-subtle 4s ease-in-out infinite",
        "text-shimmer-gold": "text-shimmer-gold 8s ease-in-out infinite",
        "float-soft": "float-soft 6s ease-in-out infinite",
        "pulse-slow": "pulse-slow 5s ease-in-out infinite",
        "glow-text": "glow-text 4s ease-in-out infinite",
        // ===== BADGE & DECORATIVE ANIMATIONS =====
        "badge-pulse": "badge-pulse 2s infinite",
        "badge-color-shift": "badge-color-shift 6s ease infinite",
        "star-rotate-3d": "star-rotate-3d 6s ease-in-out infinite",
        sparkle: "sparkle 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
