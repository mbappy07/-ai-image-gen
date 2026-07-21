"use client";

import { Download, ImageIcon, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageCard, type GeneratedImage } from "./ImageCard";
import { cn } from "@/lib/utils";

interface ResultGalleryProps {
  images?: GeneratedImage[];
  isLoading?: boolean;
  quantity?: number;
  onDownload?: (image: GeneratedImage) => void;
  onDownloadAll?: () => void;
}

export function ResultGallery({
  images = [],
  isLoading = false,
  quantity = 1,
  onDownload,
  onDownloadAll,
}: ResultGalleryProps) {
  const mode = isLoading ? "loading" : images.length > 0 ? "results" : "empty";

  return (
    <div className="h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 sm:px-6 h-13 shrink-0 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <span className={cn(
            "size-2 rounded-full",
            mode === "results" ? "bg-emerald-500 shadow-sm shadow-emerald-500/30" :
            mode === "loading" ? "bg-amber-500 animate-pulse shadow-sm shadow-amber-500/20" :
            "bg-muted-foreground/25"
          )} />
          <h2 className="text-sm font-semibold text-foreground">生成结果</h2>
          {mode === "results" && (
            <span className="text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
              {images.length}
            </span>
          )}
          {mode === "loading" && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
              <Loader2 className="size-3 animate-spin" /> 生成中
            </span>
          )}
        </div>

        {mode === "results" && onDownloadAll && (
          <Button variant="ghost" size="sm" onClick={onDownloadAll} className="text-xs rounded-lg h-8">
            <Download className="size-3.5 mr-1.5" />全部下载
          </Button>
        )}
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-auto p-4 sm:p-6">
        {/* 加载态 */}
        {mode === "loading" && (
          <div className={cn("grid gap-4 mx-auto", quantity <= 1 ? "grid-cols-1 max-w-lg" : "grid-cols-1 md:grid-cols-2")}>
            {Array.from({ length: quantity }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 p-3 space-y-3">
                <Skeleton className="aspect-square rounded-xl w-full" />
                <Skeleton className="h-3.5 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/4 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {/* 空态 */}
        {mode === "empty" && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="relative mb-6">
              <div className="size-24 rounded-3xl bg-gradient-to-br from-muted/80 to-muted flex items-center justify-center">
                <ImageIcon className="size-10 text-muted-foreground/30" />
              </div>
              <div className="absolute -bottom-1 -right-2 size-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <Sparkles className="size-5 text-white" />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">准备开始</h3>
            <p className="text-xs text-muted-foreground/60 max-w-56 leading-relaxed">
              在左侧填写画面描述并选择参数，点击生成按钮即可创作 AI 图片
            </p>
          </div>
        )}

        {/* 结果 */}
        {mode === "results" && (
          <div className="space-y-5">
            {/* 成功提示 */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-xs text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-3.5" />
              共生成 {images.length} 张图片，点击可预览或下载
            </div>

            <div className={cn("grid gap-4", images.length === 1 ? "max-w-lg" : "grid-cols-1 md:grid-cols-2")}>
              {images.map((image) => (
                <ImageCard key={image.id} image={image} onDownload={onDownload} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
