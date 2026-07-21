"use client";

import { Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GenerateStatus = "idle" | "loading" | "success" | "error";

const STATUS_CONFIG: Record<
  GenerateStatus,
  { icon: React.ReactNode; label: string; className?: string }
> = {
  idle: {
    icon: <Sparkles className="size-5" />,
    label: "开始生成",
  },
  loading: {
    icon: <Loader2 className="size-5 animate-spin" />,
    label: "生成中...",
  },
  success: {
    icon: <CheckCircle2 className="size-5" />,
    label: "生成完成",
    className:
      "from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/25",
  },
  error: {
    icon: <AlertTriangle className="size-5" />,
    label: "重试",
    className:
      "from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 shadow-red-500/25",
  },
};

interface GenerateButtonProps {
  onClick?: () => void;
  status?: GenerateStatus;
  disabled?: boolean;
}

export function GenerateButton({
  onClick,
  status = "idle",
  disabled = false,
}: GenerateButtonProps) {
  const cfg = STATUS_CONFIG[status];
  const isBusy = status === "loading";

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isBusy}
      size="lg"
      className={cn(
        "w-full h-12 text-base font-semibold rounded-xl gap-2 transition-all duration-300",
        "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600",
        "hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500",
        "shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:translate-y-px",
        cfg.className,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </Button>
  );
}
