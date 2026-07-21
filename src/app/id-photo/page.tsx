"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { IdPhotoUploader } from "@/components/generation/IdPhotoUploader";
import { ResultGallery } from "@/components/generation/ResultGallery";
import { GenerateButton, type GenerateStatus } from "@/components/generation/GenerateButton";
import type { GeneratedImage } from "@/components/generation";
import type { BgColor } from "@/lib/aliyun-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function IdPhotoPage() {
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [personImage, setPersonImage] = useState<string | undefined>();
  const [background, setBackground] = useState<BgColor>("blue");
  const [panelOpen, setPanelOpen] = useState(true);

  const canGenerate = !!personImage;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setStatus("loading"); setImages([]);
    try {
      const res = await fetch("/api/id-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personImage, background }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "请求失败");
      const generated: GeneratedImage[] = (data.images ?? []).map(
        (url: string, i: number) => ({
          id: `${data.generationId}-${i}`, url, prompt: `AI 证件照 (${background} 底)`, width: 1024, height: 1024,
        }),
      );
      setImages(generated); setStatus("success"); toast.success("证件照生成完成");
    } catch (err) {
      toast.error("生成失败", { description: err instanceof Error ? err.message : "未知错误" });
      setStatus("error");
    }
  }, [canGenerate, personImage, background]);

  const handleDownload = useCallback((img: GeneratedImage) => {
    const a = document.createElement("a");
    a.href = img.url; a.download = `id-photo-${background}.png`; a.target = "_blank"; a.click();
    toast.success("图片下载中...");
  }, [background]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      <Navbar />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 移动端折叠按钮 */}
        <button
          type="button"
          onClick={() => setPanelOpen(!panelOpen)}
          className="lg:hidden flex items-center justify-center gap-1.5 h-10 shrink-0 border-b border-border bg-card/50 text-xs text-muted-foreground"
        >
          {panelOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          {panelOpen ? "收起参数面板" : "展开参数面板"}
        </button>

        {/* 控制面板 */}
        <aside
          className={cn(
            "shrink-0 border-border bg-card/50 overflow-auto",
            "lg:w-[420px] lg:border-r lg:block",
            panelOpen ? "block" : "hidden",
          )}
        >
          <Card className="h-full rounded-none border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="size-2 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600" />
                AI 证件照
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <IdPhotoUploader
                onChange={(data) => { setPersonImage(data.personImage); setBackground(data.background); }}
              />
              <Separator />
              <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground space-y-1.5">
                <p>• 上传正面免冠近照，AI 保持人脸不变</p>
                <p>• 自动替换为纯色背景，智能美化</p>
              </div>
              <GenerateButton onClick={handleGenerate} status={status} disabled={!canGenerate} />
              {!canGenerate && status === "idle" && (
                <p className="text-xs text-center text-muted-foreground">请上传人物照片</p>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* 结果展示 */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-background">
          <ResultGallery images={images} isLoading={status === "loading"} quantity={1} onDownload={handleDownload} />
        </main>
      </div>
    </div>
  );
}
