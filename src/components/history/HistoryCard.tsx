"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, ArrowRight, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const RATIO_LABELS: Record<string, string> = {
  "1:1": "1:1", "3:4": "3:4", "4:3": "4:3", "9:16": "9:16", "16:9": "16:9",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive"; dot: string }> = {
  pending: { label: "排队", variant: "secondary", dot: "bg-amber-400" },
  processing: { label: "生成中", variant: "secondary", dot: "bg-blue-400 animate-pulse" },
  success: { label: "完成", variant: "default", dot: "bg-emerald-400" },
  failed: { label: "失败", variant: "destructive", dot: "bg-red-400" },
};

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
  if (Array.isArray(item.imageUrls) && item.imageUrls.length > 0) return item.imageUrls[0];
  if (typeof item.imageUrls === "string") {
    try { const arr = JSON.parse(item.imageUrls); return Array.isArray(arr) && arr.length > 0 ? arr[0] : null; }
    catch { return null; }
  }
  return null;
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} 小时前`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} 天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function HistoryCard({ item, onDownload, onContinue, onDelete }: HistoryCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const thumb = getThumbnail(item);
  const cfg = STATUS_CONFIG[item.status] ?? { label: item.status, variant: "secondary" as const, dot: "bg-gray-400" };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/history/${item.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "删除失败");
      onDelete?.(item);
    } catch { /* parent handles */ }
    finally { setDeleting(false); setShowConfirm(false); }
  };

  return (
    <>
      <Card className="group overflow-hidden rounded-2xl border-border bg-card hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-0.5 transition-all duration-300">
        {/* 缩略图 */}
        <div className="aspect-square relative bg-muted/30 overflow-hidden">
          {thumb ? (
            <Image src={thumb} alt={item.prompt.slice(0, 40)} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="25vw" />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-muted/50 to-muted">
              <span className="text-3xl opacity-30">{item.status === "failed" ? "😞" : "🎨"}</span>
            </div>
          )}

          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* 状态 */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-background/80 backdrop-blur-sm text-[10px] font-medium">
            <span className={`size-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </div>

          {/* 删除 */}
          <Tooltip>
            <TooltipTrigger render={<span />}>
              <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
                className="absolute top-2.5 right-2.5 size-7 rounded-lg opacity-0 group-hover:opacity-100 bg-black/40 text-white hover:bg-red-600 transition-all">
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">删除</TooltipContent>
          </Tooltip>
        </div>

        {/* 信息 */}
        <CardContent className="p-3.5 space-y-2.5">
          <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed min-h-[2.25rem]">{item.prompt}</p>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">{RATIO_LABELS[item.ratio] ?? item.ratio}</span>
            <span className="text-[10px] text-muted-foreground">{item.quantity}张</span>
            <span className="text-[10px] text-muted-foreground/60 ml-auto">{formatRelativeTime(item.createdAt)}</span>
          </div>

          <div className="flex gap-1.5 pt-0.5">
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <Button variant="outline" size="sm" className="flex-1 h-7 text-[11px] rounded-lg" onClick={() => onDownload?.(item)} disabled={item.status !== "success"}>
                  <Download className="size-3 mr-1" />下载
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">{item.status !== "success" ? "仅成功可下载" : "下载生成图片"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <Button variant="ghost" size="sm" className="flex-1 h-7 text-[11px] rounded-lg" onClick={() => onContinue?.(item.prompt)}>
                  <ArrowRight className="size-3 mr-1" />复用
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">使用相同描述</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base">确认删除</DialogTitle>
            <DialogDescription className="text-sm">删除后不可恢复，确定要删除吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)} disabled={deleting} className="rounded-lg">取消</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting} className="rounded-lg">{deleting ? "删除中..." : "确认删除"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
