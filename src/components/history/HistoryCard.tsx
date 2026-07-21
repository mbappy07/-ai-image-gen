"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, ArrowRight, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// -- 比例标签映射 --
const RATIO_LABELS: Record<string, string> = {
  "1:1": "正方形",
  "3:4": "竖版",
  "4:3": "横版",
  "9:16": "全屏",
  "16:9": "宽屏",
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pending: { label: "等待中", variant: "secondary" },
  processing: { label: "生成中", variant: "secondary" },
  success: { label: "已完成", variant: "default" },
  failed: { label: "失败", variant: "destructive" },
};

// -- 数据类型 --
export interface HistoryItem {
  id: string;
  prompt: string;
  referenceImage: string | null;
  ratio: string;
  quantity: number;
  status: string;
  imageUrls: string | string[];
  errorMessage: string | null;
  createdAt: string;
}

interface HistoryCardProps {
  item: HistoryItem;
  onDownload?: (item: HistoryItem) => void;
  onContinue?: (prompt: string) => void;
  onDelete?: (item: HistoryItem) => void;
}

function getThumbnail(item: HistoryItem): string | null {
  if (Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
    return item.imageUrls[0];
  }
  if (typeof item.imageUrls === "string") {
    try {
      const arr = JSON.parse(item.imageUrls);
      return Array.isArray(arr) && arr.length > 0 ? arr[0] : null;
    } catch {
      return null;
    }
  }
  return null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);

  const time = d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 0) return `今天 ${time}`;
  if (diffDays === 1) return `昨天 ${time}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${time}`;
}

export function HistoryCard({ item, onDownload, onContinue, onDelete }: HistoryCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const thumb = getThumbnail(item);
  const badge = STATUS_BADGE[item.status] ?? { label: item.status, variant: "secondary" as const };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/history/${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "删除失败");
      onDelete?.(item);
    } catch {
      // error handled by parent
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <Card className="group overflow-hidden border-border hover:border-primary/30 hover:shadow-sm transition-all duration-200">
        {/* 缩略图区 */}
        <div className="aspect-square relative bg-muted/30 overflow-hidden">
          {thumb ? (
            <Image
              src={thumb}
              alt={item.prompt.slice(0, 50)}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/40">
              <span className="text-4xl">🖼️</span>
              <span className="text-xs mt-1">
                {item.status === "failed" ? "生成失败" : "生成中..."}
              </span>
            </div>
          )}

          {/* 状态角标 */}
          <Badge variant={badge.variant} className="absolute top-2 left-2 text-[10px] px-1.5 py-0">
            {badge.label}
          </Badge>

          {/* 删除按钮 (hover 时显示) */}
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConfirm(true);
                }}
                className="absolute top-2 right-2 size-7 rounded-lg opacity-0 group-hover:opacity-100 bg-black/40 text-white hover:bg-red-600 hover:text-white transition-all"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">删除此记录</TooltipContent>
          </Tooltip>
        </div>

        {/* 信息区 */}
        <CardContent className="p-3 space-y-2">
          <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed min-h-[2.5rem]">
            {item.prompt}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {RATIO_LABELS[item.ratio] ?? item.ratio}
            </span>
            <span className="text-[10px] text-muted-foreground">{item.quantity} 张</span>
            <span className="text-[10px] text-muted-foreground/70 ml-auto">
              {formatDate(item.createdAt)}
            </span>
          </div>

          <div className="flex gap-1.5 pt-1">
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs rounded-lg"
                  onClick={() => onDownload?.(item)}
                  disabled={item.status !== "success"}
                >
                  <Download className="size-3 mr-1" />下载
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {item.status !== "success" ? "仅可下载已完成的图片" : "下载生成图片"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger render={<span />}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-7 text-xs rounded-lg"
                  onClick={() => onContinue?.(item.prompt)}
                >
                  <ArrowRight className="size-3 mr-1" />继续创作
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">使用相同描述再次生成</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认弹窗 */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">确认删除</DialogTitle>
            <DialogDescription className="text-sm">
              删除后不可恢复。确定要删除这条生成记录吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
              className="rounded-lg"
            >
              取消
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg"
            >
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
