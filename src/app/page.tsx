import Link from "next/link";
import { Sparkles, Shirt, Camera, ArrowRight, Image, Zap, Clock } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";

const FEATURES = [
  {
    icon: <Sparkles className="size-7" />,
    title: "普通生图",
    desc: "输入描述 AI 生成高质量图片，支持 5 种画幅和参考图融合",
    href: "/generate",
    color: "from-violet-500 to-indigo-600",
    bgLight: "from-violet-50 to-indigo-50",
    bgDark: "from-violet-500/5 to-indigo-500/5",
  },
  {
    icon: <Shirt className="size-7" />,
    title: "AI 换装",
    desc: "上传服装和人物照片，AI 自动融合衣服自然贴合",
    href: "/try-on",
    color: "from-orange-500 to-pink-600",
    bgLight: "from-orange-50 to-pink-50",
    bgDark: "from-orange-500/5 to-pink-500/5",
  },
  {
    icon: <Camera className="size-7" />,
    title: "AI 证件照",
    desc: "上传个人照片，AI 生成蓝底 / 白底 / 红底标准证件照",
    href: "/id-photo",
    color: "from-blue-500 to-cyan-600",
    bgLight: "from-blue-50 to-cyan-50",
    bgDark: "from-blue-500/5 to-cyan-500/5",
  },
];

const HIGHLIGHTS = [
  { icon: <Image className="size-4" />, text: "通义万相大模型" },
  { icon: <Zap className="size-4" />, text: "秒级极速出图" },
  { icon: <Clock className="size-4" />, text: "历史自动保存" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* ========== Hero ========== */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-20 text-center overflow-hidden">
        {/* 背景光晕 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 size-72 sm:size-96 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 size-72 sm:size-96 rounded-full bg-indigo-500/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          {/* Logo */}
          <div className="inline-flex size-16 sm:size-20 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 items-center justify-center shadow-2xl shadow-purple-500/30 mb-6 sm:mb-8 animate-glow-pulse">
            <Sparkles className="size-8 sm:size-10 text-white" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/50 text-xs text-purple-600 dark:text-purple-400 mb-4">
            <span className="size-1.5 rounded-full bg-purple-500" />
            通义万相驱动
          </div>

          <h1 className="text-3xl sm:text-6xl font-bold tracking-tight text-foreground mb-3 sm:mb-4 max-w-xl mx-auto">
            AI 图片生成工作室
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8 sm:mb-10 px-4">
            输入描述词，上传参考图，一键生成高质量 AI 图片。支持文生图、AI 换装、证件照等多种模式
          </p>

          {/* 亮点 */}
          <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-10 sm:mb-14">
            {HIGHLIGHTS.map((h) => (
              <div key={h.text} className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground group">
                <span className="flex items-center justify-center size-7 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                  {h.icon}
                </span>
                {h.text}
              </div>
            ))}
          </div>

          {/* 功能卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
            {FEATURES.map((f) => (
              <Link key={f.href} href={f.href} className="group">
                <div className="h-full p-5 sm:p-6 rounded-2xl border border-border bg-card hover:border-transparent hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-1 transition-all duration-300 text-center">
                  <div className={`size-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/15 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white">{f.icon}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-foreground mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    {f.desc}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-primary font-medium group-hover:gap-2 transition-all">
                    开始使用
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== Footer ========== */}
      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border/50">
        AI 图片生成工具 · 仅供学习交流使用
      </footer>
    </div>
  );
}
