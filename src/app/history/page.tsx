"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { HistoryCard, type HistoryItem } from "@/components/history/HistoryCard";

interface PageData {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PAGE_SIZE = 12;

export default function HistoryPage() {
  const router = useRouter();

  // ---- 状态 ----
  const [data, setData] = useState<PageData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // ---- 获取数据 ----
  const fetchHistory = useCallback(
    async (p: number, s: string) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(p),
          pageSize: String(PAGE_SIZE),
        });
        if (s) params.set("search", s);

        const res = await fetch(`/api/history?${params}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.error ?? "加载失败");
        }

        setData(json.data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "未知错误";
        toast.error("加载历史记录失败", { description: msg });
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // 首次加载 & 翻页
  useEffect(() => {
    fetchHistory(page, search);
  }, [page, search, fetchHistory]);

  // 搜索
  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  // ---- 操作 ----
  const handleDownload = (item: HistoryItem) => {
    const urls: string[] =
      typeof item.imageUrls === "string"
        ? JSON.parse(item.imageUrls)
        : item.imageUrls;
    urls.forEach((url, i) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-gen-${item.id.slice(0, 8)}-${i + 1}.png`;
      a.target = "_blank";
      a.click();
    });
    toast.success(`正在下载 ${urls.length} 张图片...`);
  };

  const handleDelete = async (item: HistoryItem) => {
    // 先从列表移除
    if (data) {
      const newItems = data.items.filter((i) => i.id !== item.id);
      setData({ ...data, items: newItems, total: data.total - 1 });
    }
    toast.success("已删除");
  };

  const handleContinue = (prompt: string) => {
    router.push(`/generate?prompt=${encodeURIComponent(prompt)}`);
  };

  // ---- 分页 ----
  const currentPage = data?.page ?? page;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ========== 顶部导航 ========== */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon-sm" className="rounded-lg">
                <ChevronLeft className="size-4" />
              </Button>
            </Link>
            <h1 className="text-base font-semibold flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground shrink-0" />
              <span className="hidden sm:inline">历史记录</span>
            </h1>
            {data && !loading && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                {data.total} 条
              </span>
            )}
          </div>

          {/* 搜索框 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex items-center gap-2 shrink-0"
          >
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="搜索..."
                className="h-8 w-28 sm:w-48 pl-8 text-xs rounded-lg"
              />
            </div>
          </form>
        </div>
      </header>

      {/* ========== 内容区 ========== */}
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 w-full">
        {/* 加载态 */}
        {loading && <HistorySkeleton />}

        {/* 空态 */}
        {!loading && data && data.items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="size-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
              <Clock className="size-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              {search ? "没有匹配的记录" : "暂无生成记录"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              {search
                ? "尝试其他关键词，或清除搜索条件"
                : "前往工作台生成第一组 AI 图片"}
            </p>
            {!search && (
              <Link href="/generate">
                <Button size="sm" className="rounded-lg">
                  去生成图片
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* 卡片网格 */}
        {!loading && data && data.items.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {data.items.map((item) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  onDownload={handleDownload}
                  onContinue={handleContinue}
                  onDelete={handleDelete}
                />
              ))}
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        text="上一页"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        aria-disabled={currentPage <= 1}
                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {renderPageNumbers(currentPage, totalPages, setPage)}

                    <PaginationItem>
                      <PaginationNext
                        text="下一页"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        aria-disabled={currentPage >= totalPages}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ============================================================
// 分页页码渲染
// ============================================================
function renderPageNumbers(
  current: number,
  total: number,
  setPage: (p: number) => void,
) {
  const pages: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, current + 2);

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push(-1); // ellipsis
  }
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (end < total) {
    if (end < total - 1) pages.push(-2);
    pages.push(total);
  }

  return pages.map((p) => (
    <PaginationItem key={p}>
      {p < 0 ? (
        <span className="flex size-8 items-center justify-center text-muted-foreground text-sm">
          ...
        </span>
      ) : (
        <PaginationLink
          isActive={p === current}
          onClick={() => setPage(p)}
        >
          {p}
        </PaginationLink>
      )}
    </PaginationItem>
  ));
}

// ============================================================
// 加载骨架屏
// ============================================================
function HistorySkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square rounded-xl w-full" />
          <Skeleton className="h-4 w-3/4 rounded-lg mx-1" />
          <div className="flex gap-2 px-1">
            <Skeleton className="h-3 w-12 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
