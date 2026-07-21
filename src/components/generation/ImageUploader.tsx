"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_SIZE = 10 * 1024 * 1024;
const MIN_RES = 240;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploaderProps {
  onUpload?: (ossUrl: string) => void;
  onRemove?: () => void;
}

async function uploadFileToOSS(file: File): Promise<string> {
  // 1. 获取直传凭证
  const credRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name }),
  });
  const credJson = await credRes.json();
  if (!credRes.ok || !credJson.success) throw new Error(credJson.error ?? "获取凭证失败");

  const { uploadUrl, formData, signedUrl } = credJson.data;

  // 2. 浏览器直接上传到 OSS
  const ossForm = new FormData();
  for (const [k, v] of Object.entries(formData)) {
    ossForm.append(k, v as string);
  }
  ossForm.append("file", file);

  const ossRes = await fetch(uploadUrl, { method: "POST", body: ossForm });
  if (ossRes.status !== 200) throw new Error(`OSS 上传失败: ${ossRes.status}`);

  return signedUrl as string;
}

export function ImageUploader({ onUpload, onRemove }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [ossUrl, setOssUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) { alert("仅支持 JPG、PNG、WebP"); return; }
      if (file.size > MAX_SIZE) { alert("文件过大，限制 10MB"); return; }

      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = async () => {
        URL.revokeObjectURL(url);
        if (img.naturalWidth < MIN_RES || img.naturalHeight < MIN_RES) {
          alert(`分辨率过低 (${img.naturalWidth}×${img.naturalHeight})，至少 ${MIN_RES}×${MIN_RES}`);
          return;
        }
        // 预览
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);

        // 上传
        setIsUploading(true);
        try {
          const signedUrl = await uploadFileToOSS(file);
          setOssUrl(signedUrl);
          onUpload?.(signedUrl);
        } catch {
          setPreview(null);
          alert("上传失败，请重试");
        } finally {
          setIsUploading(false);
        }
      };
      img.onerror = () => { URL.revokeObjectURL(url); alert("无法读取该图片"); };
      img.src = url;
    },
    [onUpload],
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
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
          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} className="sr-only" />
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
            <span className={cn("flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs", isUploading ? "text-primary" : "text-emerald-600")}>
              {isUploading ? <><Loader2 className="size-3 animate-spin" /> 上传中...</> : "✓ 已上传"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
