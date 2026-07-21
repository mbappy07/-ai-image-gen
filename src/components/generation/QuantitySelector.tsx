"use client";

import { cn } from "@/lib/utils";
import { Grid3X3, LayoutGrid, Images } from "lucide-react";

interface QuantityOption {
  value: number;
  label: string;
  icon: React.ReactNode;
}

const QUANTITIES: QuantityOption[] = [
  { value: 1, label: "1 张", icon: <Images className="size-4" /> },
  { value: 2, label: "2 张", icon: <LayoutGrid className="size-4" /> },
  { value: 4, label: "4 张", icon: <Grid3X3 className="size-4" /> },
];

interface QuantitySelectorProps {
  value: number;
  onChange: (quantity: number) => void;
}

export function QuantitySelector({ value, onChange }: QuantitySelectorProps) {
  return (
    <div className="space-y-2.5">
      <label className="text-sm font-medium text-foreground">
        生成数量
      </label>

      <div className="flex gap-2">
        {QUANTITIES.map((item) => {
          const isActive = value === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onChange(item.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition-all",
                isActive
                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                  : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-muted/50",
              )}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
