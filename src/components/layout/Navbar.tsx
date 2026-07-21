"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Shirt, Camera, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/generate", label: "普通生图", icon: <Sparkles className="size-4" /> },
  { href: "/try-on", label: "AI 换装", icon: <Shirt className="size-4" /> },
  { href: "/id-photo", label: "AI 证件照", icon: <Camera className="size-4" /> },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between h-12 px-3 sm:px-5">
        {/* 左侧: Logo */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="size-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="size-3.5 text-white" />
          </span>
          <span className="text-sm font-semibold text-foreground hidden sm:inline">
            AI 生图
          </span>
        </Link>

        {/* 中间: 导航项 */}
        <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 text-xs rounded-lg gap-1.5 transition-colors px-2 sm:px-2.5",
                    isActive
                      ? "bg-muted text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.icon}
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* 右侧: 历史记录 */}
        <Link href="/history">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 text-xs rounded-lg gap-1.5 px-2 sm:px-2.5",
              pathname === "/history"
                ? "bg-muted text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Clock className="size-3.5 shrink-0" />
            <span className="hidden sm:inline">历史记录</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
