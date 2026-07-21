"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_RES = 240;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploaderProps {
  onUpload?: (ossUrl: string) => void;
  onRemove?: () => void;
}

export function ImageUploader({ onUpload, onRemove }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [ossUrl, setOssUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadToServer = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error ?? "上传失败");

        const url: string = json.data.url;
        setOssUrl(url);
        onUpload?.(url);
      } catch {
        setPreview(null);
        setOssUrl(null);
        if (inputRef.current) inputRef.current.value = "";
        alert("上传失败，请重试");
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload],
  );

  const processFile = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert("仅支持 JPG、PNG、WebP 格式的图片"); return;
      }
      if (file.size > MAX_SIZE) {
        alert(`文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，限制 10MB`); return;
      }
      // 校验分辨率
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.naturalWidth < MIN_RES || img.naturalHeight < MIN_RES) {
          alert(`图片分辨率过低 (${img.naturalWidth}×${img.naturalHeight})，至少需要 ${MIN_RES}×${MIN_RES} 像素`);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
        uploadToServer(file);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        alert("无法读取该图片文件");
      };
      img.src = objectUrl;
    },
    [uploadToServer],
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleRemove = useCallback(() => {
    setPreview(null); setOssUrl(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove?.();
  }, [onRemove]);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        参考图片 <span className="text-muted-foreground font-normal">（可选）</span>
      </label>

      {!preview ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative flex flex-col items-center justify-center h-40 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
            isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
          )}
        >
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handleChange} className="sr-only" />
          {isUploading ? (
            <>
              <Loader2 className="size-6 mb-2 text-primary animate-spin" />
              <p className="text-sm text-primary">上传中...</p>
            </>
          ) : (
            <>
              <Upload className="size-6 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">拖拽图片到此处，或<span className="text-primary">点击上传</span></p>
              <p className="text-xs text-muted-foreground/70 mt-1">支持 JPG、PNG、WebP，最大 10MB</p>
            </>
          )}
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-border">
          <Image src={preview} alt="参考图片预览" width={400} height={300} className="w-full h-40 object-cover" />
          <Button variant="destructive" size="icon-xs" onClick={handleRemove} className="absolute top-2 right-2 rounded-full shadow-lg opacity-90 hover:opacity-100">
            <X className="size-3" />
          </Button>
          <div className="absolute bottom-2 left-2">
            <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs", isUploading ? "text-primary" : ossUrl ? "text-emerald-600" : "text-foreground/80")}>
              {isUploading ? <Loader2 className="size-3 animate-spin" /> : <ImageIcon className="size-3" />}
              {isUploading ? "上传中..." : ossUrl ? "已上传至云端" : "参考图已选择"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
