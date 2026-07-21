"use client";

import { useState } from "react";
import { Download, ImageIcon, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageCard, type GeneratedImage } from "./ImageCard";

// -- 渲染模式 --
type GalleryMode = "empty" | "loading" | "results";

interface ResultGalleryProps {
  /** 生成结果列表 */
  images?: GeneratedImage[];
  /** 是否加载中 */
  isLoading?: boolean;
  /** 每行显示数量 */
  quantity?: number;
  /** 下载回调 */
  onDownload?: (image: GeneratedImage) => void;
  /** 批量下载 */
  onDownloadAll?: () => void;
}

export function ResultGallery({
  images = [],
  isLoading = false,
  quantity = 1,
  onDownload,
  onDownloadAll,
}: ResultGalleryProps) {
  const mode: GalleryMode = isLoading ? "loading" : images.length > 0 ? "results" : "empty";

  return (
    <div className="h-full flex flex-col">
      {/* -------- 顶部标题栏 -------- */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="size-2 rounded-full bg-emerald-500" />
          <h2 className="text-lg font-semibold text-foreground">
            生成结果
          </h2>
          {mode === "results" && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {images.length} 张
            </span>
          )}
        </div>

        {mode === "results" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDownloadAll}
            className="text-xs rounded-lg"
          >
            <Download className="size-3.5 mr-1.5" />
            全部下载
          </Button>
        )}
      </div>

      {/* -------- 内容区 -------- */}
      <div className="flex-1 overflow-auto p-6">
        {/* 加载骨架屏 */}
        {mode === "loading" && (
          <div className={`grid gap-4 ${
            quantity <= 1 ? "grid-cols-1 max-w-2xl mx-auto" :
            quantity === 2 ? "grid-cols-1 md:grid-cols-2" :
            "grid-cols-1 md:grid-cols-2"
          }`}>
            {Array.from({ length: quantity }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl w-full" />
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/3 rounded-lg" />
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {mode === "empty" && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <div className="size-24 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-900/20 flex items-center justify-center">
                <ImageIcon className="size-10 text-purple-400 dark:text-purple-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Sparkles className="size-4 text-white" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              等待生成
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              在左侧输入描述并选择参数，点击生成按钮即可生成 AI 图片
            </p>
          </div>
        )}

        {/* 结果网格 */}
        {mode === "results" && (
          <div className="space-y-6">
            {/* 网格 */}
            <div className={`grid gap-4 ${
              images.length === 1 ? "grid-cols-1 max-w-xl" :
              images.length === 2 ? "grid-cols-1 md:grid-cols-2" :
              "grid-cols-1 md:grid-cols-2"
            }`}>
              {images.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onDownload={onDownload}
                />
              ))}
            </div>

            {/* 底部提示 */}
            <p className="text-center text-xs text-muted-foreground">
              图片由 AI 生成，仅供学习交流使用
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
