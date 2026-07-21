"use client";

import { cn } from "@/lib/utils";
import { type AspectRatio } from "@/types";

const RATIOS: { value: AspectRatio; label: string; w: number; h: number }[] = [
  { value: "1:1", label: "1:1", w: 1, h: 1 },
  { value: "4:3", label: "4:3", w: 4, h: 3 },
  { value: "3:4", label: "3:4", w: 3, h: 4 },
  { value: "16:9", label: "16:9", w: 16, h: 9 },
  { value: "9:16", label: "9:16", w: 9, h: 16 },
];

interface RatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

export function RatioSelector({ value, onChange }: RatioSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-foreground">画幅比例</label>

      <div className="grid grid-cols-5 gap-1.5">
        {RATIOS.map((item) => {
          const isActive = value === item.value;
          const r = item.w / item.h;
          const pw = r >= 1 ? 28 : Math.round(28 * r);
          const ph = r >= 1 ? Math.round(28 / r) : 28;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={cn(
                "flex flex-col items-center gap-2 py-3 rounded-xl border transition-all duration-200",
                isActive
                  ? "border-purple-500/60 bg-purple-50 dark:bg-purple-950/20 ring-1 ring-purple-500/20"
                  : "border-border/60 hover:border-purple-500/25 hover:bg-muted/40",
              )}
            >
              <div
                className="rounded border-2 transition-all duration-200"
                style={{
                  width: pw,
                  height: ph,
                  borderColor: isActive ? "var(--color-primary, oklch(0.65 0.2 280))" : "currentColor",
                }}
              />
              <span className={cn("text-[11px] font-medium transition-colors", isActive ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
