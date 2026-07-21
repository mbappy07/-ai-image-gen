"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { ControlPanel, type GenerateParams } from "@/components/generation/ControlPanel";
import { ResultGallery } from "@/components/generation/ResultGallery";
import type { GenerateStatus } from "@/components/generation/GenerateButton";
import type { GeneratedImage } from "@/components/generation";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function GeneratePage() {
  return (
    <Suspense fallback={<GenerateSkeleton />}>
      <GenerateContent />
    </Suspense>
  );
}

function GenerateContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") ?? "";
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [panelOpen, setPanelOpen] = useState(true);

  const beginGeneration = useCallback((qty: number) => {
    setStatus("loading");
    setQuantity(qty);
    setImages([]);
  }, []);

  const handleGenerate = useCallback(
    async (params: GenerateParams) => {
      beginGeneration(params.quantity);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: params.prompt,
            ratio: params.ratio,
            quantity: params.quantity,
            referenceImage: params.referenceImage,
          }),
        });
        const data: {
          success: boolean;
          generationId?: string;
          images?: string[];
          error?: string;
        } = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error ?? `请求失败`);
        const generated: GeneratedImage[] = (data.images ?? []).map(
          (url, i) => ({ id: `${data.generationId}-${i}`, url, prompt: params.prompt, width: 1024, height: 1024 }),
        );
        setImages(generated);
        setStatus("success");
        toast.success(`${generated.length} 张图片生成完成`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "未知错误";
        toast.error("生成失败", { description: msg });
        setStatus("error");
      }
    },
    [beginGeneration],
  );

  const handleDownload = useCallback((image: GeneratedImage) => {
    const a = document.createElement("a");
    a.href = image.url; a.download = `ai-gen-${image.id}.png`; a.target = "_blank"; a.click();
    toast.success("图片下载中...");
  }, []);

  const handleDownloadAll = useCallback(() => {
    images.forEach((img) => {
      const a = document.createElement("a");
      a.href = img.url; a.download = `ai-gen-${img.id}.png`; a.target = "_blank"; a.click();
    });
    toast.success(`正在下载 ${images.length} 张图片...`);
  }, [images]);

  const isBusy = status === "loading";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/40">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-screen-2xl mx-auto w-full lg:gap-4 lg:p-4">
        {/* 移动端折叠按钮 */}
        <button
          type="button"
          onClick={() => setPanelOpen(!panelOpen)}
          className="lg:hidden flex items-center justify-center gap-2 h-11 shrink-0 border-b border-border/50 bg-card text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <span className={`transition-transform duration-300 ${panelOpen ? "rotate-180" : ""}`}>
            <ChevronUp className="size-3.5" />
          </span>
          {panelOpen ? "收起参数面板" : "展开参数面板"}
        </button>

        {/* 控制面板 */}
        <aside
          className={cn(
            "shrink-0 overflow-auto transition-all duration-300",
            "lg:w-[440px] lg:rounded-2xl lg:border lg:border-border/60 lg:shadow-sm lg:bg-card lg:max-h-none",
            panelOpen ? "max-h-none" : "max-h-0 lg:max-h-none",
          )}
        >
          <ControlPanel onGenerate={handleGenerate} status={status} initialPrompt={initialPrompt} />
        </aside>

        {/* 结果展示 */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 lg:rounded-2xl lg:border lg:border-border/60 lg:shadow-sm bg-card overflow-hidden">
          <ResultGallery
            images={images}
            isLoading={isBusy}
            quantity={images.length > 0 ? images.length : quantity}
            onDownload={handleDownload}
            onDownloadAll={handleDownloadAll}
          />
        </main>
      </div>
    </div>
  );
}

function GenerateSkeleton() {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-muted/40">
      <div className="h-12 shrink-0 border-b border-border/50" />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-screen-2xl mx-auto lg:gap-4 lg:p-4 w-full">
        <aside className="lg:w-[440px] w-full shrink-0 lg:rounded-2xl lg:border lg:border-border/60 lg:shadow-sm bg-card border-b lg:border-b-0 border-border p-4 space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
        </aside>
        <main className="flex-1 lg:rounded-2xl lg:border lg:border-border/60 lg:shadow-sm bg-card p-4">
          <Skeleton className="h-full w-full rounded-xl" />
        </main>
      </div>
    </div>
  );
}
