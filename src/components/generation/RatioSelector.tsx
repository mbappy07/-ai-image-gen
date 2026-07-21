"use client";

import { cn } from "@/lib/utils";
import { type AspectRatio } from "@/types";

interface RatioOption {
  value: AspectRatio;
  label: string;
  ratio: string; // 用于展示的几何比例
}

const RATIOS: RatioOption[] = [
  { value: "1:1", label: "1:1", ratio: "1:1" },
  { value: "4:3", label: "4:3", ratio: "4:3" },
  { value: "3:4", label: "3:4", ratio: "3:4" },
  { value: "16:9", label: "16:9", ratio: "16:9" },
  { value: "9:16", label: "9:16", ratio: "9:16" },
];

interface RatioSelectorProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

export function RatioSelector({ value, onChange }: RatioSelectorProps) {
  return (
    <div className="space-y-2.5">
      <label className="text-sm font-medium text-foreground">
        图片比例
      </label>

      <div className="grid grid-cols-5 gap-2">
        {RATIOS.map((item) => {
          const isActive = value === item.value;
          // 根据比例计算预览图形状
          const [w, h] = item.ratio.split(":").map(Number);
          const ratioValue = w / h;
          const previewW = ratioValue >= 1 ? 32 : 32 * ratioValue;
          const previewH = ratioValue >= 1 ? 32 / ratioValue : 32;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all",
                isActive
                  ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                  : "border-border hover:border-primary/30 hover:bg-muted/50",
              )}
            >
              {/* 比例预览框 */}
              <div
                className="border-2 border-current rounded-sm transition-colors"
                style={{
                  width: `${(previewW / 32) * 100}%`,
                  aspectRatio: `${w}/${h}`,
                  maxWidth: 32,
                  maxHeight: 32,
                }}
              />
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
