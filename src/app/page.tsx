import Link from "next/link";
import { Sparkles, Shirt, Camera, ArrowRight, Image, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";

const FEATURES = [
  {
    icon: <Sparkles className="size-6" />,
    title: "普通生图",
    desc: "输入描述，AI 生成高质量图片。支持 5 种比例、参考图融合。",
    href: "/generate",
    color: "from-violet-500 to-indigo-600",
  },
  {
    icon: <Shirt className="size-6" />,
    title: "AI 换装",
    desc: "上传服装和人物照片，AI 自动融合，衣服自然贴合。",
    href: "/try-on",
    color: "from-orange-500 to-pink-600",
  },
  {
    icon: <Camera className="size-6" />,
    title: "AI 证件照",
    desc: "上传个人照片，AI 生成蓝底/白底/红底标准证件照。",
    href: "/id-photo",
    color: "from-blue-500 to-cyan-600",
  },
];

const HIGHLIGHTS = [
  { icon: <Image className="size-5" />, text: "基于通义万相大模型" },
  { icon: <Zap className="size-5" />, text: "秒级生成，极速出图" },
  { icon: <Clock className="size-5" />, text: "历史记录自动保存" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ========== Hero ========== */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-16 text-center">
        <div className="size-14 sm:size-16 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-purple-500/25 mb-4 sm:mb-6">
          <Sparkles className="size-7 sm:size-8 text-white" />
        </div>

        <h1 className="text-2xl sm:text-5xl font-bold tracking-tight text-foreground mb-2 sm:mb-3">
          AI 图片生成工作室
        </h1>
        <p className="text-sm sm:text-lg text-muted-foreground max-w-lg leading-relaxed mb-6 sm:mb-8 px-2">
          基于阿里云通义万相大模型，提供文生图、AI 换装、证件照等多种 AI 图片生成能力
        </p>

        {/* 亮点 */}
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-8 sm:mb-12">
          {HIGHLIGHTS.map((h) => (
            <div key={h.text} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
              <span className="text-purple-500">{h.icon}</span>
              {h.text}
            </div>
          ))}
        </div>

        {/* 功能卡片 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} className="group">
              <div className="h-full p-6 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all duration-200 text-center">
                <div
                  className={`size-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mx-auto mb-3 shadow-md`}
                >
                  <span className="text-white">{f.icon}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1.5">
                  {f.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {f.desc}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-1.5 transition-all">
                  开始使用
                  <ArrowRight className="size-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========== Footer ========== */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        AI 图片生成工具 — 仅供学习交流使用
      </footer>
    </div>
  );
}
