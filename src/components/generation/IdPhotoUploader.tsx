"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Upload, X, Loader2, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BgColor } from "@/lib/aliyun-image";

const MAX_SIZE = 10 * 1024 * 1024;
const MIN_RES = 240;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

const COLORS: { value: BgColor; label: string; hex: string; ring: string }[] = [
  { value: "blue", label: "蓝底", hex: "#438EDB", ring: "ring-blue-500" },
  { value: "white", label: "白底", hex: "#FFFFFF", ring: "ring-gray-300" },
  { value: "red", label: "红底", hex: "#CC0033", ring: "ring-red-500" },
];

interface SlotState {
  preview: string | null;
  ossUrl: string | null;
  uploading: boolean;
}

interface IdPhotoUploaderProps {
  onChange?: (data: { personImage?: string; background: BgColor }) => void;
}

export function IdPhotoUploader({ onChange }: IdPhotoUploaderProps) {
  const [state, setState] = useState<SlotState>({
    preview: null, ossUrl: null, uploading: false,
  });
  const [background, setBackground] = useState<BgColor>("blue");
  const [dragging, setDragging] = useState(false);

  // 状态变化通知父组件
  useEffect(() => {
    onChange?.({ personImage: state.ossUrl ?? undefined, background });
  }, [state.ossUrl, background, onChange]);

  const uploadOne = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setState((prev) => ({ ...prev, preview: reader.result as string, uploading: true }));
    };
    reader.readAsDataURL(file);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error ?? "上传失败");

      const ossUrl: string = json.data.url;
      setState((prev) => ({ ...prev, ossUrl, uploading: false }));
    } catch {
      setState((prev) => ({ ...prev, preview: null, ossUrl: null, uploading: false }));
      alert("上传失败，请重试");
    }
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert("仅支持 JPG、PNG、WebP 格式"); return;
      }
      if (file.size > MAX_SIZE) {
        alert(`文件过大，限制 10MB`); return;
      }
      const img = new window.Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        if (img.naturalWidth < MIN_RES || img.naturalHeight < MIN_RES) {
          alert(`分辨率过低 (${img.naturalWidth}×${img.naturalHeight})，至少 ${MIN_RES}×${MIN_RES}`);
          return;
        }
        uploadOne(file);
      };
      img.onerror = () => { URL.revokeObjectURL(url); alert("无法读取该图片"); };
      img.src = url;
    },
    [uploadOne],
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setState({ preview: null, ossUrl: null, uploading: false });
  }, []);

  return (
    <div className="space-y-4">
      {/* ---- 人物上传 ---- */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <span className="size-5 rounded-md bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
            <User className="size-3 text-white" />
          </span>
          人物照片
        </label>

        {state.preview ? (
          <div className="relative overflow-hidden rounded-xl border border-border">
            <Image src={state.preview} alt="预览" width={400} height={400} className="w-full h-44 object-cover" />
            <Button variant="destructive" size="icon-xs" onClick={handleRemove} className="absolute top-2 right-2 rounded-full shadow-lg opacity-90">
              <X className="size-3" />
            </Button>
            <div className="absolute bottom-2 left-2">
              <span className={cn("flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs", state.uploading ? "text-primary" : "text-emerald-600")}>
                {state.uploading ? <><Loader2 className="size-3 animate-spin" /> 上传中...</> : "✓ 已上传"}
              </span>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => (document.getElementById("id-photo-file") as HTMLInputElement)?.click()}
            className={cn("flex flex-col items-center justify-center h-36 rounded-xl border-2 border-dashed cursor-pointer transition-colors", dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50")}
          >
            <input
              id="id-photo-file"
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              className="sr-only"
            />
            <Upload className="size-5 mb-1 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">拖拽或<span className="text-primary">点击上传</span></p>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">建议正面免冠近照，面部清晰光线均匀</p>
          </div>
        )}
      </div>

      {/* ---- 底色选择 ---- */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">证件照底色</label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setBackground(c.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                background === c.value
                  ? `border-primary ring-2 ${c.ring} bg-primary/5 text-foreground`
                  : "border-border text-muted-foreground hover:border-primary/30 hover:bg-muted/50",
              )}
            >
              <span
                className="size-5 rounded-full border-2 border-border shadow-sm shrink-0"
                style={{ backgroundColor: c.hex }}
              />
              {c.label}
              {background === c.value && <Check className="size-3.5 text-primary" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
