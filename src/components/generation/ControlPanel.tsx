"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ImageUploader } from "./ImageUploader";
import { PromptInput } from "./PromptInput";
import { RatioSelector } from "./RatioSelector";
import { QuantitySelector } from "./QuantitySelector";
import { GenerateButton, type GenerateStatus } from "./GenerateButton";
import type { AspectRatio } from "@/types";

export interface GenerateParams {
  prompt: string;
  ratio: AspectRatio;
  quantity: number;
  referenceImage?: string;
}

interface ControlPanelProps {
  onGenerate: (params: GenerateParams) => void;
  status?: GenerateStatus;
  initialPrompt?: string;
}

export function ControlPanel({
  onGenerate,
  status = "idle",
  initialPrompt = "",
}: ControlPanelProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [ratio, setRatio] = useState<AspectRatio>("1:1");
  const [quantity, setQuantity] = useState(1);
  const [referenceImage, setReferenceImage] = useState<string | undefined>();

  const canGenerate = prompt.trim().length > 0;

  const handleGenerate = () => {
    if (!canGenerate) return;
    onGenerate({ prompt: prompt.trim(), ratio, quantity, referenceImage });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 标题区 */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="size-2.5 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm shadow-purple-500/30" />
          <h2 className="text-base font-semibold text-foreground">创建图片</h2>
        </div>
        <p className="text-xs text-muted-foreground/70">填写参数后点击生成，AI 将为您创作图片</p>
      </div>

      <Separator />

      {/* 内容区 */}
      <div className="flex-1 overflow-auto">
        <div className="p-5 space-y-6">

          {/* 图片描述 */}
          <PromptInput value={prompt} onChange={setPrompt} />

          {/* 参考图 */}
          <ImageUploader
            onUpload={setReferenceImage}
            onRemove={() => setReferenceImage(undefined)}
          />

          {/* 比例 & 数量 */}
          <div className="grid grid-cols-1 gap-5">
            <RatioSelector value={ratio} onChange={setRatio} />
            <QuantitySelector value={quantity} onChange={setQuantity} />
          </div>

          {/* 生成按钮 */}
          <div className="pt-1">
            <GenerateButton
              onClick={handleGenerate}
              status={status}
              disabled={!canGenerate}
            />
            {!canGenerate && status === "idle" && (
              <p className="mt-2.5 text-[11px] text-center text-muted-foreground/60">
                输入描述后即可开始生成
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
