"use client";

import { cn } from "@/lib/utils";
import { Image, LayoutGrid, Grid3X3 } from "lucide-react";

const QUANTITIES = [
  { value: 1, label: "1 张", icon: Image, sub: "单张精细" },
  { value: 2, label: "2 张", icon: LayoutGrid, sub: "对比选择" },
  { value: 4, label: "4 张", icon: Grid3X3, sub: "更多灵感" },
];

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
}

export function QuantitySelector({ value, onChange }: QuantitySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-foreground">生成数量</label>

      <div className="grid grid-cols-3 gap-1.5">
        {QUANTITIES.map((item) => {
          const isActive = value === item.value;
          const Icon = item.icon;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all duration-200",
                isActive
                  ? "border-purple-500/60 bg-purple-50 dark:bg-purple-950/20 ring-1 ring-purple-500/20"
                  : "border-border/60 hover:border-purple-500/25 hover:bg-muted/40",
              )}
            >
              <Icon className={cn("size-4 transition-colors", isActive ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground")} />
              <span className={cn("text-xs font-medium transition-colors", isActive ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground")}>
                {item.label}
              </span>
              <span className="text-[10px] text-muted-foreground/50">{item.sub}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
