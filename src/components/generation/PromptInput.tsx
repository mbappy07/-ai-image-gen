"use client";

import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_LENGTH = 600;
const TAGS = ["4K高清", "赛博朋克", "吉卜力", "极简风", "油画质感", "电影感", "水墨风", "像素风"];

export function PromptInput({ value, onChange }: PromptInputProps) {
  const charCount = value.length;

  const addTag = (tag: string) => {
    const newVal = value ? `${value}，${tag}` : tag;
    if (newVal.length <= MAX_LENGTH) onChange(newVal);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-purple-500" />
          画面描述
        </label>
        <span className={`text-[11px] tabular-nums transition-colors ${charCount > MAX_LENGTH * 0.9 ? "text-destructive" : "text-muted-foreground/60"}`}>
          {charCount}<span className="text-muted-foreground/40">/{MAX_LENGTH}</span>
        </span>
      </div>

      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => { if (e.target.value.length <= MAX_LENGTH) onChange(e.target.value); }}
          placeholder=""
          rows={5}
          className="min-h-[124px] resize-none rounded-2xl text-sm leading-relaxed border-border/80 focus-visible:border-purple-500/50 focus-visible:ring-purple-500/10"
        />
        {!value && (
          <div className="absolute top-3.5 left-3.5 pointer-events-none text-[13px] text-muted-foreground/35 leading-relaxed max-w-[calc(100%-28px)]">
            描述越详细，出图效果越好<br />
            试试描述：主体、场景、风格、光线、色彩...
          </div>
        )}
      </div>

      {/* 快捷标签 */}
      <div className="flex flex-wrap gap-1.5">
        {TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => addTag(tag)}
            className="px-2.5 py-1 text-[11px] rounded-full border border-border/60 bg-muted/30 text-muted-foreground hover:border-purple-500/30 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
