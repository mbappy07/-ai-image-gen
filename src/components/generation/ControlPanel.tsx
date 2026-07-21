"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="h-full rounded-none border-0 shadow-none bg-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="size-2 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600" />
          创建参数
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <ImageUploader
          onUpload={setReferenceImage}
          onRemove={() => setReferenceImage(undefined)}
        />

        <Separator />

        <PromptInput value={prompt} onChange={setPrompt} />

        <RatioSelector value={ratio} onChange={setRatio} />

        <QuantitySelector value={quantity} onChange={setQuantity} />

        <GenerateButton
          onClick={handleGenerate}
          status={status}
          disabled={!canGenerate}
        />

        {!canGenerate && status === "idle" && (
          <p className="text-xs text-center text-muted-foreground">
            请输入图片描述后开始生成
          </p>
        )}
      </CardContent>
    </Card>
  );
}
