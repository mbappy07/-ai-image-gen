"use client";

import { useState } from "react";
import { Download, Eye, Maximize2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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
      <div
        className="group relative overflow-hidden rounded-2xl border border-border/60 bg-muted/20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="aspect-square relative">
          <Image
            src={image.url}
            alt={image.prompt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="50vw"
          />
        </div>

        {/* Hover 遮罩 */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent transition-opacity duration-300 flex flex-col justify-end p-4 ${isHovered ? "opacity-100" : "opacity-0"}`}>
          <p className="text-white/90 text-xs line-clamp-2 leading-relaxed mb-2">{image.prompt}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              className="h-8 text-xs rounded-xl bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
            >
              <Eye className="size-3.5 mr-1.5" />预览
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload?.(image)}
              className="h-8 text-xs rounded-xl bg-white/15 text-white hover:bg-white/25 backdrop-blur-sm"
            >
              <Download className="size-3.5 mr-1.5" />下载
            </Button>
          </div>
        </div>

        {/* 放大图标 — 始终可见 */}
        <button
          onClick={() => setPreviewOpen(true)}
          className="absolute top-3 right-3 size-8 rounded-xl bg-black/30 text-white opacity-0 group-hover:opacity-100 hover:bg-black/50 backdrop-blur-sm flex items-center justify-center transition-all"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>

      {/* 预览弹窗 */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-5xl p-0 gap-0 border-0 rounded-2xl overflow-hidden bg-black/95">
          <DialogTitle className="sr-only">{image.prompt}</DialogTitle>
          <div className="relative w-full max-h-[85vh] flex items-center justify-center">
            <Image
              src={image.url}
              alt={image.prompt}
              width={image.width}
              height={image.height}
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
            <p className="px-3 py-2 rounded-xl bg-black/60 backdrop-blur-sm text-white/80 text-xs max-w-[60%] truncate">
              {image.prompt}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDownload?.(image)}
              className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 rounded-xl shrink-0"
            >
              <Download className="size-4 mr-1.5" />下载原图
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
