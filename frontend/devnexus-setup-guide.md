# DevNexus — Hướng Dẫn Setup Theme & Scale UI với v0.dev

> **Mục tiêu:** Sau khi đọc xong guide này, bạn có thể:
> 1. Setup theme đúng chuẩn để code từ v0.dev paste vào chạy luôn
> 2. Generate hàng chục page bằng v0 mà giao diện vẫn đồng bộ 100%

---

## Mục lục

1. [Tại sao cần setup đúng cách](#1-tại-sao-cần-setup-đúng-cách)
2. [Kiến trúc theme](#2-kiến-trúc-theme)
3. [Bước 1 — Cài dependencies còn thiếu](#3-bước-1--cài-dependencies-còn-thiếu)
4. [Bước 2 — Replace globals.css](#4-bước-2--replace-globalscss)
5. [Bước 3 — Replace tailwind.config.ts](#5-bước-3--replace-tailwindconfigts)
6. [Bước 4 — Kiểm tra theme-provider.tsx](#6-bước-4--kiểm-tra-theme-providertsx)
7. [Bước 5 — Kiểm tra layout.tsx](#7-bước-5--kiểm-tra-layouttsx)
8. [Checklist kiểm tra sau setup](#8-checklist-kiểm-tra-sau-setup)
9. [Cách dùng với v0.dev](#9-cách-dùng-với-v0dev)
10. [Workflow scale UI — nhiều page, đồng bộ 100%](#10-workflow-scale-ui--nhiều-page-đồng-bộ-100)
11. [Khi v0 generate sai — cách fix nhanh](#11-khi-v0-generate-sai--cách-fix-nhanh)
12. [Quick reference](#12-quick-reference)

---

## 1. Tại sao cần setup đúng cách

### Vấn đề

v0.dev generate code dùng **shadcn/ui convention** — tức là nó viết ra những class như:

```jsx
<div className="bg-background text-foreground border-border">
  <p className="text-muted-foreground">...</p>
  <Button variant="default">Submit</Button>
```

Những class `bg-background`, `text-foreground`, `text-muted-foreground` này **không phải Tailwind mặc định** — chúng chỉ hoạt động nếu `tailwind.config.ts` của bạn có mapping chúng vào CSS variables.

Nếu không setup đúng → paste code từ v0 vào → màu sắc vỡ hoàn toàn.

### Giải pháp

Setup một lần đúng cách theo kiến trúc bên dưới → mọi code từ v0 paste vào đều nhận đúng màu DevNexus tự động, không cần sửa gì.

---

## 2. Kiến trúc theme

```
globals.css                    tailwind.config.ts
┌─────────────────────┐        ┌──────────────────────────────┐
│  :root {            │        │  colors: {                   │
│    --background:    │───────▶│    background: "hsl(var(...))"│
│    --foreground:    │        │    foreground: "hsl(var(...))"│
│    --primary:       │        │    primary: { DEFAULT, ... } │
│    --muted:         │        │    muted: { DEFAULT, ... }   │
│    --border: ...    │        │    border: "hsl(var(...))"   │
│  }                  │        │  }                           │
│                     │        └──────────────────────────────┘
│  .dark {            │                      │
│    --background:    │                      ▼
│    --foreground:    │        v0 code: bg-background ✅
│    ...              │        v0 code: text-foreground ✅
│  }                  │        v0 code: border-border ✅
└─────────────────────┘        Custom: bg-page ✅  card ✅  btn-ai ✅
```

**Nguyên tắc cốt lõi:** CSS variables trong `globals.css` là nguồn gốc duy nhất của màu sắc. `tailwind.config.ts` ánh xạ chúng thành Tailwind classes. Utility classes tự viết (`bg-page`, `card`, `btn-ai`...) đều reference vars — không hardcode màu.

---

## 3. Bước 1 — Cài dependencies còn thiếu

Vì đã có shadcn rồi, chỉ cần kiểm tra và cài những gì thiếu:

```bash
# Kiểm tra những gì đã có
cat package.json | grep -E "next-themes|geist|tailwindcss-animate"

# Cài nếu thiếu
npm install next-themes
npm install geist

# Tailwind plugins (cần cho shadcn components hoạt động đầy đủ)
npm install -D tailwindcss-animate
npm install -D @tailwindcss/typography
npm install -D @tailwindcss/forms
```

> **Lưu ý:** `tailwindcss-animate` là bắt buộc — shadcn/ui dùng nó cho accordion,
> dialog, dropdown. Thiếu cái này nhiều component sẽ không có animation.

---

## 4. Bước 2 — Replace globals.css

Thay thế **toàn bộ** nội dung `app/globals.css` bằng file bên dưới.

> ⚠️ Đây là file quan trọng nhất. Không merge với file cũ — replace hoàn toàn.

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================================
   DEVNEXUS — globals.css

   Kiến trúc:
   1. shadcn/ui CSS variables  ← v0.dev đọc vào đây
   2. DevNexus custom tokens   ← AI, glow, shadow extras
   3. Base element styles
   4. Utility classes          ← map ngược lại shadcn vars
   5. Animations
   ============================================================ */


/* ============================================================
   LAYER 1 — SHADCN/UI CSS VARIABLES
   Format: HSL không có hsl() wrapper — shadcn convention bắt buộc.
   Tailwind đọc: bg-background = hsl(var(--background))
   ============================================================ */

@layer base {

  /* -------- LIGHT MODE -------- */
  :root {
    --background:             210 40% 98%;   /* gray-50   */
    --foreground:             222 47% 11%;   /* slate-900 */
    --card:                   0 0% 100%;     /* white     */
    --card-foreground:        222 47% 11%;   /* slate-900 */
    --popover:                0 0% 100%;
    --popover-foreground:     222 47% 11%;
    --primary:                239 84% 67%;   /* indigo-500 */
    --primary-foreground:     0 0% 100%;
    --secondary:              210 40% 96%;   /* gray-100 */
    --secondary-foreground:   222 47% 11%;
    --muted:                  210 40% 96%;   /* gray-100 */
    --muted-foreground:       215 16% 47%;   /* slate-500 */
    --accent:                 239 100% 97%;  /* indigo-50 */
    --accent-foreground:      239 84% 67%;
    --destructive:            0 84% 60%;     /* red-500 */
    --destructive-foreground: 0 0% 100%;
    --border:                 214 32% 91%;   /* gray-200 */
    --input:                  214 32% 91%;
    --ring:                   239 84% 67%;   /* indigo-500 */
    --radius:                 0.75rem;

    /* DevNexus shadow tokens */
    --shadow-card:     0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
    --shadow-elevated: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
    --shadow-ai:       0 0 15px rgba(16,185,129,0.25);
    --shadow-ai-md:    0 0 20px rgba(16,185,129,0.15);
    --shadow-ai-lg:    0 0 25px rgba(16,185,129,0.2);
    --shadow-primary:  0 0 20px rgba(99,102,241,0.35);
  }

  /* -------- DARK MODE -------- */
  .dark {
    --background:             222 47% 4%;    /* slate-950 */
    --foreground:             210 40% 98%;   /* slate-50  */
    --card:                   222 47% 7%;    /* slate-900 */
    --card-foreground:        210 40% 98%;
    --popover:                222 47% 7%;
    --popover-foreground:     210 40% 98%;
    --primary:                239 100% 76%;  /* indigo-400 */
    --primary-foreground:     222 47% 4%;
    --secondary:              217 33% 17%;   /* slate-800 */
    --secondary-foreground:   210 40% 98%;
    --muted:                  217 33% 17%;   /* slate-800 */
    --muted-foreground:       215 20% 65%;   /* slate-400 */
    --accent:                 217 33% 17%;
    --accent-foreground:      239 100% 76%;
    --destructive:            0 63% 31%;
    --destructive-foreground: 0 86% 97%;
    --border:                 217 33% 17%;   /* slate-800 */
    --input:                  217 33% 17%;
    --ring:                   239 100% 76%;  /* indigo-400 */

    /* DevNexus shadow tokens (dark) */
    --shadow-card:     0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);
    --shadow-elevated: 0 4px 6px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4);
    --shadow-ai:       0 0 15px rgba(16,185,129,0.3);
    --shadow-ai-md:    0 0 20px rgba(16,185,129,0.15);
    --shadow-ai-lg:    0 0 25px rgba(16,185,129,0.2);
    --shadow-primary:  0 0 20px rgba(99,102,241,0.4);
  }
}


/* ============================================================
   LAYER 2 — BASE ELEMENT STYLES
   ============================================================ */

@layer base {
  * { @apply border-border; }
  html { @apply scroll-smooth; }
  body {
    @apply bg-background text-foreground font-sans antialiased transition-colors duration-200;
  }
  h1, h2, h3, h4, h5, h6 {
    @apply text-foreground font-bold leading-tight tracking-tight;
  }
  a {
    @apply text-primary hover:opacity-80 transition-colors duration-150;
  }
  code, kbd, pre { @apply font-mono; }

  ::-webkit-scrollbar       { @apply w-1.5 h-1.5; }
  ::-webkit-scrollbar-track { @apply bg-transparent; }
  ::-webkit-scrollbar-thumb {
    @apply bg-slate-300 dark:bg-slate-700 rounded-full;
    @apply hover:bg-slate-400 dark:hover:bg-slate-600;
  }
  ::selection { @apply bg-primary/20; }
}


/* ============================================================
   LAYER 3 — DEVNEXUS UTILITY CLASSES
   Tất cả reference hsl(var(--...)) — không hardcode màu.
   ============================================================ */

@layer utilities {

  /* Surfaces */
  .bg-page   { background-color: hsl(var(--background)); }
  .bg-card   { background-color: hsl(var(--card)); }
  .bg-input  { background-color: hsl(var(--muted)); }
  .bg-subtle { background-color: hsl(var(--secondary)); }

  /* Borders */
  .border-default { border-color: hsl(var(--border)); }
  .border-strong  { border-color: hsl(var(--border) / 0.7); }
  .border-ai      { @apply border-emerald-500/30; }

  /* Text */
  .text-heading { color: hsl(var(--foreground)); }
  .text-body    { color: hsl(var(--foreground) / 0.85); }
  .text-muted   { color: hsl(var(--muted-foreground)); }
  .text-dimmed  { color: hsl(var(--muted-foreground) / 0.7); }
  .text-primary { color: hsl(var(--primary)); }
  .text-ai      { @apply text-emerald-600 dark:text-emerald-400; }

  /* Gradient text */
  .text-ai-gradient {
    @apply bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent;
  }
  .text-primary-gradient {
    @apply bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent;
  }

  /* Cards */
  .card {
    background-color: hsl(var(--card));
    color: hsl(var(--card-foreground));
    border-color: hsl(var(--border));
    @apply border rounded-xl transition-colors duration-150;
  }
  .card-hover {
    @apply hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md;
  }
  .card-ai {
    background-color: hsl(var(--card));
    @apply border border-emerald-500/30 rounded-xl;
    box-shadow: var(--shadow-ai-md);
  }

  /* Buttons */
  .btn {
    @apply inline-flex items-center justify-center gap-2 font-medium rounded-lg;
    @apply transition-all duration-150 cursor-pointer select-none;
    @apply disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-primary {
    @apply btn px-4 py-2 text-sm hover:opacity-90 active:scale-[0.98];
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
  }
  .btn-ghost {
    @apply btn px-4 py-2 text-sm bg-transparent hover:bg-muted active:scale-[0.98];
    border: 1px solid hsl(var(--border));
    color: hsl(var(--foreground) / 0.8);
  }
  .btn-ai {
    @apply btn px-3 py-1.5 text-xs;
    @apply bg-gradient-to-r from-emerald-400 to-cyan-500 text-white;
    @apply hover:opacity-90 hover:scale-[1.02] active:scale-[0.98];
    box-shadow: var(--shadow-ai);
  }
  .btn-ai-purple {
    @apply btn px-3 py-1.5 text-xs;
    @apply bg-gradient-to-r from-purple-500 to-indigo-500 text-white;
    @apply hover:opacity-90 hover:scale-[1.02] active:scale-[0.98];
  }
  .btn-danger {
    @apply btn px-4 py-2 text-sm hover:opacity-90 active:scale-[0.98];
    background-color: hsl(var(--destructive));
    color: hsl(var(--destructive-foreground));
  }

  /* Badges */
  .badge {
    @apply inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md border;
  }
  .badge-default {
    @apply badge font-mono;
    @apply bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300;
    @apply border-indigo-200 dark:border-indigo-500/30;
  }
  .badge-amber {
    @apply badge font-mono;
    @apply bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300;
    @apply border-amber-200 dark:border-amber-500/30;
  }
  .badge-emerald {
    @apply badge font-mono;
    @apply bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300;
    @apply border-emerald-200 dark:border-emerald-500/30;
  }
  .badge-red {
    @apply badge;
    @apply bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400;
    @apply border-red-200 dark:border-red-500/30;
  }
  .badge-purple {
    @apply badge;
    @apply bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400;
    @apply border-purple-200 dark:border-purple-500/30;
  }
  .badge-ai {
    @apply inline-flex items-center gap-1 text-xs rounded-full px-2 py-0.5;
    @apply bg-gradient-to-r from-emerald-400 to-cyan-500 text-white;
  }

  /* Input */
  .input {
    @apply w-full rounded-lg px-3 py-2 text-sm border;
    @apply placeholder:text-muted-foreground;
    @apply focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-ring;
    @apply transition-colors duration-150;
    background-color: hsl(var(--muted));
    border-color: hsl(var(--border));
    color: hsl(var(--foreground));
  }

  /* Code blocks */
  .code-block {
    background-color: hsl(var(--muted));
    border-color: hsl(var(--border));
    @apply border rounded-xl overflow-hidden;
  }
  .code-block-header {
    @apply bg-slate-200/50 dark:bg-slate-700/50 px-4 py-2;
    @apply flex items-center justify-between;
    border-bottom: 1px solid hsl(var(--border));
  }
  .code-content {
    @apply p-4 font-mono text-sm leading-relaxed overflow-x-auto;
    color: hsl(var(--foreground) / 0.85);
  }
  .syntax-keyword  { @apply text-purple-600 dark:text-purple-400; }
  .syntax-string   { @apply text-emerald-600 dark:text-emerald-400; }
  .syntax-comment  { @apply text-slate-400 dark:text-slate-500 italic; }
  .syntax-function { @apply text-indigo-600 dark:text-indigo-400; }
  .syntax-number   { @apply text-amber-600 dark:text-amber-400; }
  .syntax-linenum  { @apply text-slate-400 dark:text-slate-600 select-none; }

  /* Misc */
  .divider {
    border-color: hsl(var(--border));
    @apply border-t my-4;
  }
  .avatar    { @apply rounded-full object-cover ring-2 ring-background; }
  .skeleton  { background-color: hsl(var(--muted)); @apply rounded-lg animate-pulse; }
  .focus-ring {
    @apply focus:outline-none focus-visible:ring-2 focus-visible:ring-ring;
    @apply focus-visible:ring-offset-2 focus-visible:ring-offset-background;
  }

  /* Glow effects */
  .glow-ai      { box-shadow: var(--shadow-ai); }
  .glow-ai-lg   { box-shadow: var(--shadow-ai-lg); }
  .glow-primary { box-shadow: var(--shadow-primary); }
}


/* ============================================================
   LAYER 4 — ANIMATIONS
   ============================================================ */

@layer utilities {
  @keyframes ai-pulse {
    0%, 100% { box-shadow: 0 0 10px rgba(16,185,129,0.2); }
    50%       { box-shadow: 0 0 25px rgba(16,185,129,0.5); }
  }
  .animate-ai-pulse { animation: ai-pulse 2s ease-in-out infinite; }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  .animate-blink { animation: blink 1s step-end infinite; }

  .streaming-cursor::after {
    content: "|";
    @apply animate-blink text-emerald-400 ml-0.5;
  }

  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up { animation: fade-in-up 0.4s ease-out forwards; }

  @keyframes slide-in {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }

  .stagger > *:nth-child(1) { animation-delay: 0ms; }
  .stagger > *:nth-child(2) { animation-delay: 80ms; }
  .stagger > *:nth-child(3) { animation-delay: 160ms; }
  .stagger > *:nth-child(4) { animation-delay: 240ms; }
  .stagger > *:nth-child(5) { animation-delay: 320ms; }
}
```

---

## 5. Bước 3 — Replace tailwind.config.ts

Thay thế **toàn bộ** `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],  // next-themes dùng class strategy

  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },

      // ─────────────────────────────────────────────────────────
      // KEY: Map shadcn CSS vars vào Tailwind classes
      // Đây là lý do v0 code như bg-background, text-muted-foreground hoạt động
      // ─────────────────────────────────────────────────────────
      colors: {
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",

        // DevNexus brand extras
        brand: {
          50:  "#eef2ff",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
        ai: {
          from: "#34d399",
          to:   "#22d3ee",
          glow: "#10b981",
        },
      },

      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        xl:   "calc(var(--radius) + 2px)",
        "2xl":"calc(var(--radius) + 4px)",
        "3xl":"1.5rem",
      },

      boxShadow: {
        "card":     "var(--shadow-card)",
        "elevated": "var(--shadow-elevated)",
        "ai":       "var(--shadow-ai)",
        "ai-md":    "var(--shadow-ai-md)",
        "ai-lg":    "var(--shadow-ai-lg)",
        "primary":  "var(--shadow-primary)",
        "inner-ai": "inset 0 0 20px rgba(16,185,129,0.1)",
      },

      backgroundImage: {
        "gradient-ai":      "linear-gradient(to right, #34d399, #22d3ee)",
        "gradient-primary": "linear-gradient(to right, #818cf8, #a78bfa)",
        "gradient-hero":    "linear-gradient(135deg, #1e1b4b, #312e81, #0f172a)",
        "grid-dots":
          "radial-gradient(circle, rgba(99,102,241,0.15) 1px, transparent 1px)",
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "ai-pulse":   "ai-pulse 2s ease-in-out infinite",
        "blink":      "blink 1s step-end infinite",
        "fade-in-up": "fade-in-up 0.4s ease-out forwards",
        "slide-in":   "slide-in 0.3s ease-out forwards",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "ai-pulse": {
          "0%, 100%": { boxShadow: "0 0 10px rgba(16,185,129,0.2)" },
          "50%":      { boxShadow: "0 0 25px rgba(16,185,129,0.5)" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
      },

      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },

      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "1rem" }],
      },
    },
  },

  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("tailwindcss-animate"),
  ],
};

export default config;
```

---

## 6. Bước 4 — Kiểm tra theme-provider.tsx

File này thường **không cần thay đổi** nếu bạn đã setup từ trước. Chỉ cần đảm bảo 3 props sau đúng:

```typescript
// components/theme-provider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"         // ✅ BẮT BUỘC — Tailwind dark: dùng class trên <html>
      defaultTheme="dark"       // ✅ DevNexus mặc định dark
      enableSystem={true}       // ✅ Hỗ trợ system theme
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

> **Tại sao `attribute="class"` quan trọng?**
> Khi user toggle sang dark mode, next-themes thêm class `dark` vào thẻ `<html>`.
> Tailwind đọc class `dark` đó để kích hoạt tất cả `dark:` variants.
> Nếu dùng `attribute="data-theme"` thay vì `"class"` → toàn bộ `dark:` variants không hoạt động.

---

## 7. Bước 5 — Kiểm tra layout.tsx

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | DevNexus",
    default: "DevNexus — The Learning Network for Engineers",
  },
  description: "Share knowledge, debug together, and grow faster with AI-powered tools.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning  // ✅ BẮT BUỘC cho next-themes — tránh hydration mismatch
    >
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

> **Tại sao `suppressHydrationWarning`?**
> next-themes inject class `dark` vào `<html>` sau khi hydrate ở client.
> Server render `<html>` không có class đó → React thấy mismatch → warning.
> `suppressHydrationWarning` bảo React bỏ qua sự khác biệt này trên thẻ html.

---

## 8. Checklist kiểm tra sau setup

Tạo một test page tạm để kiểm tra trước khi build UI thật:

```typescript
// app/test-theme/page.tsx
export default function TestTheme() {
  return (
    <div className="bg-page min-h-screen p-8 space-y-6">

      {/* Test 1: Surfaces */}
      <div className="card p-6 max-w-sm space-y-2">
        <h2 className="text-heading text-lg font-bold">Card surface</h2>
        <p className="text-body text-sm">Body text</p>
        <p className="text-muted text-sm">Muted text</p>
        <p className="text-dimmed text-sm">Dimmed text</p>
      </div>

      {/* Test 2: v0 convention classes */}
      <div className="bg-background border border-border rounded-xl p-6 max-w-sm space-y-2">
        <p className="text-foreground font-semibold">bg-background (v0 style)</p>
        <p className="text-muted-foreground text-sm">text-muted-foreground (v0 style)</p>
        <p className="text-primary text-sm">text-primary (v0 style)</p>
      </div>

      {/* Test 3: Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button className="btn-primary">Primary</button>
        <button className="btn-ghost">Ghost</button>
        <button className="btn-ai">✨ AI Feature</button>
        <button className="btn-ai-purple">✨ AI Purple</button>
        <button className="btn-danger">Danger</button>
      </div>

      {/* Test 4: Badges */}
      <div className="flex gap-2 flex-wrap">
        <span className="badge-default">React</span>
        <span className="badge-amber">Bug</span>
        <span className="badge-emerald">Solved</span>
        <span className="badge-red">Admin</span>
        <span className="badge-purple">Mod</span>
        <span className="badge-ai">✨ AI</span>
      </div>

      {/* Test 5: AI card */}
      <div className="card-ai p-6 max-w-sm">
        <p className="text-ai-gradient font-semibold">AI Card với emerald glow</p>
        <p className="text-muted text-sm mt-1">border-emerald-500/30 + shadow-ai-md</p>
      </div>

    </div>
  );
}
```

Truy cập `/test-theme` và kiểm tra:

```
✅ Nền trang: gray-50 (light) / slate-950 (dark)
✅ Card: white (light) / slate-900 (dark)
✅ Text heading: slate-900 (light) / slate-50 (dark)
✅ btn-primary: màu indigo
✅ btn-ai: gradient emerald → cyan + glow
✅ badge-default: có font-mono
✅ card-ai: viền emerald mờ + glow nhẹ
✅ Nhấn toggle dark/light: tất cả chuyển màu mượt
✅ bg-background (v0 style): cùng màu với bg-page
✅ text-muted-foreground (v0 style): cùng màu với text-muted
```

---

## 9. Cách dùng với v0.dev

### Setup Custom Instructions (làm 1 lần)

Vào v0.dev → Avatar → Settings → Custom Instructions → Paste đoạn sau:

```
Project: DevNexus — AI Social Learning Network for Engineers.
Stack: Next.js App Router, Tailwind CSS, shadcn/ui, Lucide React, TypeScript.

HARD RULES — never deviate:

THEME: Dark mode default. Full light mode via dark: variants. next-themes class strategy.
LAYOUT: max-w-7xl mx-auto. Navbar h-14 sticky backdrop-blur-md. Mobile BottomNav fixed bottom-0 h-16 md:hidden.

COLORS (use these exact Tailwind classes):
- Page bg:   bg-background  (or bg-gray-50 dark:bg-slate-950)
- Card bg:   bg-card        (or bg-white dark:bg-slate-900)
- Input bg:  bg-muted       (or bg-gray-100 dark:bg-slate-800)
- Heading:   text-foreground (or text-slate-900 dark:text-slate-50)
- Body text: text-foreground/85
- Muted:     text-muted-foreground
- Primary:   text-primary   (or text-indigo-600 dark:text-indigo-400)
- Border:    border-border  (or border-gray-200 dark:border-slate-800)

BUTTONS:
- Primary: bg-primary text-primary-foreground hover:opacity-90 rounded-lg px-4 py-2 text-sm
- Ghost:   border border-border text-foreground/80 hover:bg-muted rounded-lg px-4 py-2 text-sm
- AI:      bg-gradient-to-r from-emerald-400 to-cyan-500 text-white rounded-lg px-3 py-1.5 text-xs
          shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:opacity-90
          ALWAYS include <Sparkles className="w-3.5 h-3.5" /> icon before label

CARDS:
- Standard: bg-card border border-border rounded-xl
- AI card:  bg-card border border-emerald-500/30 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)]

AI FEATURES (mandatory rules):
- EVERY AI button/panel MUST have <Sparkles> icon from lucide-react
- AI buttons: gradient from-emerald-400 to-cyan-500 + shadow-[0_0_15px_rgba(16,185,129,0.3)]
- AI panels: border-emerald-500/30 + shadow-[0_0_20px_rgba(16,185,129,0.15)]
- AI gradient text: bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent

TYPOGRAPHY RULES:
- font-mono on ALL: tech tags, @usernames, code snippets, file paths, version numbers
- Logo: <Hexagon className="text-indigo-500" /> + "DevNexus" font-bold
```

### Cách mở conversation mới với v0

Mỗi lần bắt đầu conversation mới, paste đoạn xác nhận này trước:

```
I'm working on DevNexus (AI Social Learning Network).
My Custom Instructions contain the full design system.
Before building anything, confirm you understand these 3 rules:
1. Every AI feature must have a <Sparkles> icon
2. font-mono on all tech tags and @usernames  
3. Dark mode default, full light mode via dark: variants

After confirming, I'll give you the page to build.
```

Đợi v0 confirm → paste prompt trang cụ thể.

---

## 10. Workflow scale UI — nhiều page, đồng bộ 100%

Đây là phần quan trọng nhất. Khi build nhiều page, vấn đề không phải là v0 generate sai màu (đã fix bằng Custom Instructions) — mà là **layout và component không nhất quán** giữa các page.

### Nguyên tắc 1 — Shared Layout làm anchor

Mọi page đều dùng chung một layout wrapper. Build cái này trước tiên, một lần, đúng chuẩn:

```
components/devnexus/
├── Navbar.tsx          ← Build trước, dùng ở mọi page
├── LeftSidebar.tsx     ← Build trước, dùng ở mọi page
├── RightSidebar.tsx    ← Build trước, dùng ở mọi page
├── BottomNav.tsx       ← Build trước, dùng ở mọi page
└── PageLayout.tsx      ← Wrapper ghép 4 cái trên
```

Khi yêu cầu v0 build một page mới, paste code của `PageLayout.tsx` vào đầu prompt và nói:

```
Here is our existing PageLayout component — use it exactly as-is as the outer wrapper.
Do not rebuild the navbar, sidebar, or bottom nav.
Build only the main content area for: [tên page]
```

### Nguyên tắc 2 — Component Snapshot

Khi v0 đã generate một component đúng chuẩn (ví dụ PostCard), dùng code của nó làm reference cho các component tương tự:

```
Here is our existing PostCard component that perfectly follows DevNexus design:
[PASTE CODE PostCard]

Using the exact same styling patterns (card, badge, btn, text classes),
now build a QuestionCard component with these fields: [list fields]
```

Cách này hiệu quả hơn nhiều so với mô tả lại design system từ đầu.

### Nguyên tắc 3 — Chia prompt cho trang phức tạp

Với `/feed`, `/post/[id]`, `/profile/[username]` — đây là các trang phức tạp, nên chia 2 prompt trong cùng một conversation:

**Prompt 1:** Build layout tĩnh
```
Build the /feed page layout with:
- Left sidebar (desktop), right sidebar (desktop), main feed area
- PostCard component showing: avatar, username, content, tags, reactions
- Static data only, no AI features yet
Follow the DevNexus design system from Custom Instructions.
```

**Prompt 2:** Trong cùng conversation đó, thêm AI features
```
Good. Now add these AI features to the existing layout.
Do NOT rebuild anything — only add:
1. An AI Summary panel above the feed (card-ai style, Sparkles icon, dismissible)
2. An "AI Explain" button on each PostCard
3. A right sidebar widget showing "AI Activity" with a pulsing live badge
```

Chia ra như vậy để v0 không bị overwhelmed và vô tình thay đổi các phần đã đúng.

### Nguyên tắc 4 — Thứ tự build tối ưu

Build theo thứ tự này để mỗi page có reference từ page trước:

```
Tuần 1 — Foundation
  1. Shared components (Navbar, Sidebar, BottomNav, PageLayout)
  2. /login  — đơn giản nhất, establish auth form pattern
  3. /register
  4. /forgot-password

Tuần 2 — Core app
  5. /feed  — establish PostCard, FeedLayout pattern
  6. /post/[id]  — dùng PostCard từ /feed làm reference
  7. /qa/[id]  — tương tự /post/[id] nhưng có answer thread

Tuần 3 — User
  8. /profile/[username]  — dùng PostCard từ /feed làm reference
  9. /settings

Tuần 4 — Guest + Admin
  10. /  (Homepage)  — có thể chia 3 prompt: Hero, Features, Footer
  11. /about
  12. /explore  — dùng PostCard từ /feed làm reference
  13. /pricing
  14. /admin
  15. /admin/users
```

### Nguyên tắc 5 — Cách viết prompt hiệu quả nhất

Cấu trúc prompt chuẩn cho mỗi page:

```
Build the [route] page for DevNexus.

LAYOUT:
- [Mô tả layout: 2-column, 3-column, full-width, v.v.]
- Use PageLayout wrapper (navbar + sidebars already handled)

CONTENT SECTIONS (top to bottom):
1. [Section name]: [mô tả ngắn]
2. [Section name]: [mô tả ngắn]
3. [Section name]: [mô tả ngắn]

COMPONENTS:
- [ComponentA]: [fields cần hiển thị]
- [ComponentB]: [fields cần hiển thị]

AI FEATURES:
- [Mô tả tính năng AI, nếu có]

DATA: Use realistic mock data. DevNexus is a developer community
      so usernames, post content, tech tags should be dev-themed.

Follow DevNexus design system from Custom Instructions.
```

---

## 11. Khi v0 generate sai — cách fix nhanh

### Sai dark mode (màu không đổi khi toggle)

```
Fix dark mode on all elements. Use these exact classes:
Background: bg-background (not bg-white)
Card: bg-card (not bg-white)  
Text heading: text-foreground (not text-gray-900)
Text muted: text-muted-foreground (not text-gray-500)
Border: border-border (not border-gray-200)
```

### Sai AI elements (thiếu glow, thiếu icon)

```
Fix AI features to match DevNexus:
- AI buttons: bg-gradient-to-r from-emerald-400 to-cyan-500 + <Sparkles> icon
  + shadow-[0_0_15px_rgba(16,185,129,0.3)]
- AI panels/cards: border-emerald-500/30
  + shadow-[0_0_20px_rgba(16,185,129,0.15)]
- Add <Sparkles className="w-3.5 h-3.5" /> to EVERY AI button/panel header
```

### Thiếu font-mono

```
Add font-mono class to ALL of these (no exceptions):
- Tech stack tags (React, TypeScript, Node.js, etc.)
- @usernames anywhere they appear
- Code snippets and inline code
- File paths and version numbers
```

### Layout bị vỡ responsive

```
Fix responsive layout:
- Mobile (default): single column, hide sidebars
- Tablet (md:): show left sidebar as icon-only w-16
- Desktop (lg:): show both sidebars, left w-56, right w-72
- Add pb-20 on main content for BottomNav clearance on mobile
- BottomNav: fixed bottom-0 h-16 md:hidden
```

### v0 dùng shadcn Button nhưng màu không khớp

Đây là trường hợp v0 generate `<Button variant="default">` — màu sẽ tự đúng vì `--primary` var đã được set. Nếu vẫn sai, kiểm tra `components/ui/button.tsx` xem nó có đang đọc từ `bg-primary` không.

---

## 12. Quick reference

### Class nào dùng ở đâu

| Cần làm gì | Class dùng | v0 alternative |
|---|---|---|
| Nền trang | `bg-page` | `bg-background` |
| Nền card | `bg-card` | `bg-card` |
| Nền input | `bg-input` | `bg-muted` |
| Text tiêu đề | `text-heading` | `text-foreground` |
| Text nội dung | `text-body` | `text-foreground/85` |
| Text phụ | `text-muted` | `text-muted-foreground` |
| Text AI | `text-ai` | `text-emerald-400` (dark) |
| Text AI gradient | `text-ai-gradient` | — |
| Card thường | `card` | `bg-card border-border` |
| Card hover | `card card-hover` | — |
| Card AI | `card-ai` | — |
| Border thường | `border-default` | `border-border` |
| Border AI | `border-ai` | `border-emerald-500/30` |
| Nút chính | `btn-primary` | `<Button variant="default">` |
| Nút ghost | `btn-ghost` | `<Button variant="outline">` |
| Nút AI emerald | `btn-ai` | — |
| Nút AI tím | `btn-ai-purple` | — |
| Tag tech | `badge-default` (font-mono) | — |
| Tag bug | `badge-amber` | — |
| Tag solved | `badge-emerald` | — |
| Input | `input` | `<Input>` shadcn |
| Code block | `code-block` | — |
| Glow AI | `glow-ai` | `shadow-[0_0_15px_rgba(16,185,129,0.3)]` |

### Màu palette nhanh

| Token | Light | Dark |
|---|---|---|
| Page bg | gray-50 | slate-950 |
| Card bg | white | slate-900 |
| Input bg | gray-100 | slate-800 |
| Default border | gray-200 | slate-800 |
| Strong border | gray-300 | slate-700 |
| Heading text | slate-900 | slate-50 |
| Body text | slate-700 | slate-300 |
| Muted text | slate-500 | slate-400 |
| Primary | indigo-500 | indigo-400 |
| AI color | emerald-600 | emerald-400 |
| AI border | emerald-500/30 | emerald-500/30 |

---

*Guide này được tổng hợp từ DevNexus design system và conversation setup.*
*Khi có thêm page mới, chỉ cần follow Workflow ở mục 10.*
