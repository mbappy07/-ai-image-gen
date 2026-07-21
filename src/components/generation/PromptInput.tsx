"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_LENGTH = 500;

export function PromptInput({ value, onChange }: PromptInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const charCount = value.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          图片描述 <span className="text-destructive">*</span>
        </label>
        <span
          className={`text-xs transition-colors ${
            charCount > MAX_LENGTH * 0.9
              ? "text-destructive"
              : "text-muted-foreground"
          }`}
        >
          {charCount}/{MAX_LENGTH}
        </span>
      </div>

      <Textarea
        value={value}
        onChange={(e) => {
          if (e.target.value.length <= MAX_LENGTH) {
            onChange(e.target.value);
          }
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="描述越详细，生成效果越好。试试描述：主体、场景、风格、光线、色彩..."
        rows={5}
        className="min-h-28 resize-none rounded-xl"
      />

      {/* 快捷提示词条 */}
      <div className="flex flex-wrap gap-2">
        {["4K高清", "赛博朋克风格", "吉卜力风格", "极简风格", "油画质感"].map(
          (tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                const newValue = value ? `${value}，${tag}` : tag;
                if (newValue.length <= MAX_LENGTH) onChange(newValue);
              }}
              className="px-2.5 py-1 text-xs rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/30 transition-colors"
            >
              {tag}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
