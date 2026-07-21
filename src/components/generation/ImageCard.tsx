"use client";

import { useState } from "react";
import { Download, Eye } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// -- 模拟数据类型 --
export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  width: number;
  height: number;
}

interface ImageCardProps {
  image: GeneratedImage;
  onDownload?: (image: GeneratedImage) => void;
}

export function ImageCard({ image, onDownload }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      {/* -------- 卡片 -------- */}
      <div
        className="group relative overflow-hidden rounded-xl border border-border bg-muted/30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 图片 */}
        <div className="aspect-square relative">
          <Image
            src={image.url}
            alt={image.prompt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </div>

        {/* Hover 遮罩层 */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition-opacity">
            {/* 底部信息 */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-white/90 text-xs line-clamp-2 leading-relaxed">
                {image.prompt}
              </p>
              <p className="text-white/50 text-[10px] mt-1">
                {image.width} × {image.height}
              </p>
            </div>

            {/* 顶部操作按钮 */}
            <div className="absolute top-3 right-3 flex gap-1.5">
              <Tooltip>
                <TooltipTrigger render={<span />}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setPreviewOpen(true)}
                    className="size-8 rounded-lg bg-black/40 text-white hover:bg-black/60 hover:text-white"
                  >
                    <Eye className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">预览大图</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger render={<span />}>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onDownload?.(image)}
                    className="size-8 rounded-lg bg-black/40 text-white hover:bg-black/60 hover:text-white"
                  >
                    <Download className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">下载图片</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* -------- 预览弹窗 -------- */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl p-1 gap-0 border-0 bg-black/95">
          <DialogTitle className="sr-only">{image.prompt}</DialogTitle>
          <div className="relative w-full max-h-[80vh] flex items-center justify-center">
            <Image
              src={image.url}
              alt={image.prompt}
              width={image.width}
              height={image.height}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm text-white/80 text-xs max-w-[70%] truncate">
              {image.prompt}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload?.(image)}
              className="bg-black/60 backdrop-blur-sm text-white hover:bg-black/80 hover:text-white rounded-lg"
            >
              <Download className="size-4 mr-1.5" />
              下载
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
