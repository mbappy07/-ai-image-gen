"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { TryOnUploader } from "@/components/generation/TryOnUploader";
import { ResultGallery } from "@/components/generation/ResultGallery";
import { GenerateButton, type GenerateStatus } from "@/components/generation/GenerateButton";
import type { GeneratedImage } from "@/components/generation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TryOnPage() {
  const [status, setStatus] = useState<GenerateStatus>("idle");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [clothingImage, setClothingImage] = useState<string | undefined>();
  const [personImage, setPersonImage] = useState<string | undefined>();
  const [panelOpen, setPanelOpen] = useState(true);

  const canGenerate = !!clothingImage && !!personImage;

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setStatus("loading"); setImages([]);
    try {
      const res = await fetch("/api/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clothingImage, personImage, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? "请求失败");
      const generated: GeneratedImage[] = (data.images ?? []).map(
        (url: string, i: number) => ({
          id: `${data.generationId}-${i}`, url, prompt: "AI 换装效果", width: 1024, height: 1024,
        }),
      );
      setImages(generated); setStatus("success"); toast.success("换装生成完成");
    } catch (err) {
      toast.error("换装失败", { description: err instanceof Error ? err.message : "未知错误" });
      setStatus("error");
    }
  }, [canGenerate, clothingImage, personImage]);

  const handleDownload = useCallback((img: GeneratedImage) => {
    const a = document.createElement("a");
    a.href = img.url; a.download = `try-on-${img.id}.png`; a.target = "_blank"; a.click();
    toast.success("图片下载中...");
  }, []);

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
          <Card className="h-full rounded-none border-0 shadow-none bg-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="size-2 rounded-full bg-gradient-to-br from-orange-500 to-pink-600" />
                AI 换装
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <TryOnUploader
                onChange={(data) => { setClothingImage(data.clothingImage); setPersonImage(data.personImage); }}
              />
              <Separator />
              <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground space-y-1.5">
                <p>• AI 会将服装图上的衣服穿到人物身上</p>
                <p>• 保持人物面部特征、发型和体态不变</p>
                <p>• 建议使用平铺白底服装图和正面全身人物照</p>
              </div>
              <GenerateButton onClick={handleGenerate} status={status} disabled={!canGenerate} />
              {!canGenerate && status === "idle" && (
                <p className="text-xs text-center text-muted-foreground">请上传服装图和人物图</p>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* 结果展示 */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 lg:rounded-2xl lg:border lg:border-border/60 lg:shadow-sm bg-card overflow-hidden">
          <ResultGallery images={images} isLoading={status === "loading"} quantity={1} onDownload={handleDownload} />
        </main>
      </div>
    </div>
  );
}
