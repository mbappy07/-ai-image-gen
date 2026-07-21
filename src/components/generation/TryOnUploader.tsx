"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Shirt, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_SIZE = 10 * 1024 * 1024;
const MIN_RES = 240; // DashScope 最低要求 240x240
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

type SlotType = "clothing" | "person";

interface SlotState {
  preview: string | null;
  ossUrl: string | null;
  uploading: boolean;
}

interface TryOnUploaderProps {
  onChange?: (data: { clothingImage?: string; personImage?: string }) => void;
}

export function TryOnUploader({ onChange }: TryOnUploaderProps) {
  const [slots, setSlots] = useState<Record<SlotType, SlotState>>({
    clothing: { preview: null, ossUrl: null, uploading: false },
    person: { preview: null, ossUrl: null, uploading: false },
  });
  const [draggingSlot, setDraggingSlot] = useState<SlotType | null>(null);

  // 状态变化时通知父组件（副作用，不在 setState updater 内调用）
  useEffect(() => {
    onChange?.({
      clothingImage: slots.clothing.ossUrl ?? undefined,
      personImage: slots.person.ossUrl ?? undefined,
    });
  }, [slots.clothing.ossUrl, slots.person.ossUrl, onChange]);

  const uploadOne = useCallback(
    async (file: File, slot: SlotType) => {
      // 预览
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlots((prev) => ({
          ...prev,
          [slot]: { ...prev[slot], preview: reader.result as string, uploading: true },
        }));
      };
      reader.readAsDataURL(file);

      // 上传 OSS
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error ?? "上传失败");

        const ossUrl: string = json.data.url;
        setSlots((prev) => ({
          ...prev,
          [slot]: { ...prev[slot], ossUrl, uploading: false },
        }));
      } catch {
        setSlots((prev) => ({
          ...prev,
          [slot]: { ...prev[slot], preview: null, ossUrl: null, uploading: false },
        }));
        alert("上传失败，请重试");
      }
    },
    [],
  );

  const handleFile = useCallback(
    (file: File, slot: SlotType) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert("仅支持 JPG、PNG、WebP 格式"); return;
      }
      if (file.size > MAX_SIZE) {
        alert(`文件过大 (${(file.size / 1024 / 1024).toFixed(1)}MB)，限制 10MB`); return;
      }
      // 校验图片分辨率
      const img = new window.Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        if (img.naturalWidth < MIN_RES || img.naturalHeight < MIN_RES) {
          alert(`图片分辨率过低 (${img.naturalWidth}×${img.naturalHeight})，至少需要 ${MIN_RES}×${MIN_RES} 像素`);
          return;
        }
        uploadOne(file, slot);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        alert("无法读取该图片文件，请确认文件未损坏");
      };
      img.src = objectUrl;
    },
    [uploadOne],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, slot: SlotType) => {
      e.preventDefault();
      setDraggingSlot(null);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file, slot);
    },
    [handleFile],
  );

  const handleRemove = useCallback((slot: SlotType) => {
    setSlots((prev) => ({
      ...prev,
      [slot]: { preview: null, ossUrl: null, uploading: false },
    }));
  }, []);

  return (
    <div className="space-y-3">
      {([
        ["clothing", "服装图片", "上传衣服/单品图，建议使用平铺白底图效果最佳", Shirt, "from-orange-500 to-pink-600"] as const,
        ["person", "人物图片", "上传人物照片，建议正面全身照效果最佳", User, "from-blue-500 to-cyan-600"] as const,
      ]).map(([slot, label, hint, Icon, gradient]) => (
        <div key={slot} className="space-y-1.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <span className={`size-5 rounded-md bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <Icon className="size-3 text-white" />
            </span>
            {label}
          </label>

          <SlotUploader
            state={slots[slot as SlotType]}
            hint={hint}
            dragging={draggingSlot === slot}
            onDragOver={(e) => { e.preventDefault(); setDraggingSlot(slot as SlotType); }}
            onDragLeave={() => setDraggingSlot(null)}
            onDrop={(e) => handleDrop(e, slot as SlotType)}
            onFileSelected={(file) => handleFile(file, slot as SlotType)}
            onRemove={() => handleRemove(slot as SlotType)}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================
function SlotUploader({
  state,
  hint,
  dragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelected,
  onRemove,
}: {
  state: SlotState;
  hint: string;
  dragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (state.preview) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-border">
        <Image
          src={state.preview}
          alt="预览"
          width={400}
          height={400}
          className="w-full h-40 object-cover"
        />
        <Button
          variant="destructive"
          size="icon-xs"
          onClick={onRemove}
          className="absolute top-2 right-2 rounded-full shadow-lg opacity-90"
        >
          <X className="size-3" />
        </Button>
        <div className="absolute bottom-2 left-2">
          <span
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs",
              state.uploading ? "text-primary" : "text-emerald-600",
            )}
          >
            {state.uploading ? (
              <>
                <Loader2 className="size-3 animate-spin" /> 上传中...
              </>
            ) : (
              "✓ 已上传"
            )}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
        dragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
        }}
        className="sr-only"
      />
      <Upload className="size-5 mb-1 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">
        拖拽或<span className="text-primary">点击上传</span>
      </p>
      <p className="text-[10px] text-muted-foreground/50 mt-0.5 px-2 text-center">
        {hint}
      </p>
    </div>
  );
}
