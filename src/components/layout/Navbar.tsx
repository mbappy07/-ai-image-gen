"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Shirt, Camera, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/generate", label: "普通生图", icon: <Sparkles className="size-5" /> },
  { href: "/try-on", label: "AI 换装", icon: <Shirt className="size-5" /> },
  { href: "/id-photo", label: "AI 证件照", icon: <Camera className="size-5" /> },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 glass">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 group">
          <span className="size-7 rounded-lg bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-sm shadow-purple-500/20 transition-transform group-hover:scale-110">
            <Sparkles className="size-4 text-white" />
          </span>
          <span className="text-sm font-bold text-foreground hidden sm:inline tracking-tight">
            AI 生图
          </span>
        </Link>

        {/* 导航 */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="default"
                  className={cn(
                    "h-9 text-sm rounded-lg gap-2 transition-all duration-200 px-3 sm:px-3.5",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* 历史记录 */}
        <Link href="/history">
          <Button
            variant="ghost"
            size="default"
            className={cn(
              "h-9 text-sm rounded-lg gap-2 px-3 sm:px-3.5 transition-all duration-200",
              pathname === "/history"
                ? "bg-primary/10 text-primary font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            )}
          >
            <Clock className="size-5 shrink-0" />
            <span className="hidden sm:inline">历史记录</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
