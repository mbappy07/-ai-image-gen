"use client";

import { Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type GenerateStatus = "idle" | "loading" | "success" | "error";

const BASE_CLASS =
  "w-full h-12 text-base font-semibold rounded-xl gap-2 transition-all duration-300 active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed";

const STATUS_CONFIG: Record<
  GenerateStatus,
  { icon: React.ReactNode; label: string; className: string }
> = {
  idle: {
    icon: <Sparkles className="size-5" />,
    label: "开始生成",
    className: cn(
      "bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600",
      "hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500",
      "shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/35",
    ),
  },
  loading: {
    icon: <Loader2 className="size-5 animate-spin" />,
    label: "生成中...",
    className: cn(
      "bg-gradient-to-r from-violet-500/80 via-purple-500/80 to-indigo-500/80",
      "shadow-md shadow-purple-500/15",
    ),
  },
  success: {
    icon: <CheckCircle2 className="size-5" />,
    label: "生成完成",
    className: cn(
      "from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500",
      "shadow-lg shadow-emerald-500/25",
    ),
  },
  error: {
    icon: <AlertTriangle className="size-5" />,
    label: "重试",
    className: cn(
      "from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500",
      "shadow-lg shadow-red-500/25",
    ),
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
      className={cn(BASE_CLASS, "bg-gradient-to-r", cfg.className)}
    >
      {cfg.icon}
      {cfg.label}
    </Button>
  );
}
