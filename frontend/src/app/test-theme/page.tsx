"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Sparkles } from "lucide-react";

export default function TestTheme() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="bg-background min-h-screen p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-bold">DevNexus — Theme Test</h1>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="btn-ghost flex items-center gap-2"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          Toggle {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Test 1: Surfaces */}
        <div className="card p-6 space-y-2">
          <h2 className="text-heading text-lg font-bold">Surfaces</h2>
          <p className="text-body text-sm">Body text (foreground/85)</p>
          <p className="text-muted-foreground text-sm">Muted text (muted-foreground)</p>
          <p className="text-dimmed text-sm">Dimmed text (muted-foreground/70)</p>
        </div>

        {/* Test 2: v0 convention classes */}
        <div className="bg-background border border-border rounded-xl p-6 space-y-2">
          <p className="text-foreground font-semibold">bg-background (v0 style)</p>
          <p className="text-muted-foreground text-sm">text-muted-foreground (v0 style)</p>
          <p className="text-primary text-sm font-medium">text-primary (v0 style)</p>
        </div>

        {/* Test 3: AI Card */}
        <div className="card-ai p-6">
          <p className="text-ai-gradient font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            AI Card — emerald glow
          </p>
          <p className="text-muted-foreground text-sm mt-1">border-emerald-500/30 + shadow-ai-md</p>
        </div>

        {/* Test 4: Buttons */}
        <div className="card p-6 space-y-3">
          <h2 className="text-heading text-sm font-bold">Buttons</h2>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary">Primary</button>
            <button className="btn-ghost">Ghost</button>
            <button className="btn-ai">
              <Sparkles className="w-3.5 h-3.5" />
              AI Feature
            </button>
            <button className="btn-ai-purple">
              <Sparkles className="w-3.5 h-3.5" />
              AI Purple
            </button>
            <button className="btn-danger">Danger</button>
          </div>
        </div>

        {/* Test 5: Badges */}
        <div className="card p-6 space-y-3">
          <h2 className="text-heading text-sm font-bold">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <span className="badge-default">React</span>
            <span className="badge-amber">Bug</span>
            <span className="badge-emerald">Solved</span>
            <span className="badge-red">Admin</span>
            <span className="badge-purple">Mod</span>
            <span className="badge-ai">
              <Sparkles className="w-3 h-3" /> AI
            </span>
          </div>
        </div>

        {/* Test 6: Input */}
        <div className="card p-6 space-y-3">
          <h2 className="text-heading text-sm font-bold">Input & Code</h2>
          <input className="input" placeholder="Type something..." />
          <div className="code-block">
            <div className="code-block-header">
              <span className="text-muted-foreground text-xs font-mono">example.ts</span>
            </div>
            <div className="code-content">
              <span className="syntax-keyword">const</span>
              {" "}
              <span className="syntax-function">hello</span>
              {" = "}
              <span className="syntax-string">&quot;DevNexus&quot;</span>
            </div>
          </div>
        </div>

        {/* Test 7: Animations */}
        <div className="card p-6 space-y-3">
          <h2 className="text-heading text-sm font-bold">Animations</h2>
          <div className="flex flex-wrap gap-3">
            <div className="card-ai p-3 animate-ai-pulse rounded-lg">
              <p className="text-ai text-xs font-mono">animate-ai-pulse</p>
            </div>
            <p className="text-muted-foreground text-sm">
              Streaming cursor: <span className="streaming-cursor text-sm font-mono">hello</span>
            </p>
          </div>
        </div>

        {/* Test 8: Glow effects */}
        <div className="card p-6 space-y-3">
          <h2 className="text-heading text-sm font-bold">Glow Effects</h2>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-lg p-3 bg-card border border-border glow-ai">
              <p className="text-ai text-xs">glow-ai</p>
            </div>
            <div className="rounded-lg p-3 bg-card border border-border glow-primary">
              <p className="text-primary text-xs">glow-primary</p>
            </div>
          </div>
        </div>

        {/* Test 9: Gradient text */}
        <div className="card p-6 space-y-3">
          <h2 className="text-heading text-sm font-bold">Gradient Text</h2>
          <p className="text-ai-gradient text-xl font-bold">AI Gradient Text</p>
          <p className="text-primary-gradient text-xl font-bold">Primary Gradient</p>
        </div>

      </div>

      {/* Checklist */}
      <div className="card p-6 max-w-lg">
        <h2 className="text-heading font-bold mb-3">Checklist</h2>
        <ul className="space-y-1 text-sm">
          {[
            "Nền trang: gray-50 (light) / slate-950 (dark)",
            "Card bg khác nền trang",
            "Text heading rõ nét",
            "btn-primary màu indigo",
            "btn-ai gradient emerald → cyan + glow",
            "badge-default có font-mono",
            "card-ai viền emerald mờ + glow",
            "Toggle dark/light mượt",
            "bg-background (v0 style) = bg-page",
            "text-muted-foreground (v0 style) = text-muted",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-body">
              <span className="text-emerald-500">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
