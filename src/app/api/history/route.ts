import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { historyQuerySchema } from "@/lib/validations";

// ============================================================
// GET /api/history
// ============================================================
export async function GET(request: NextRequest) {
  // ----------------------------------------------------------
  // 1. 解析分页参数
  // ----------------------------------------------------------
  const { searchParams } = request.nextUrl;

  const parsed = historyQuerySchema.safeParse({
    page: searchParams.get("page") ?? "1",
    pageSize: searchParams.get("pageSize") ?? "12",
    search: searchParams.get("search") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const { page, pageSize, search } = parsed.data;

  // ----------------------------------------------------------
  // 2. 获取用户
  // ----------------------------------------------------------
  let userId: string;
  try {
    userId = await getOrCreateUserId();
  } catch {
    return NextResponse.json(
      { success: false, error: "用户身份初始化失败" },
      { status: 500 },
    );
  }

  // ----------------------------------------------------------
  // 3. 查询数据库
  // ----------------------------------------------------------
  const where: Record<string, unknown> = { userId };

  // 模糊搜索 prompt
  if (search) {
    where.prompt = { contains: search };
  }

  const [items, total] = await Promise.all([
    prisma.generation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        prompt: true,
        referenceImage: true,
        ratio: true,
        quantity: true,
        status: true,
        imageUrls: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
    prisma.generation.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // ----------------------------------------------------------
  // 4. 返回
  // ----------------------------------------------------------
  return NextResponse.json({
    success: true,
    data: {
      items,
      total,
      page,
      pageSize,
      totalPages,
    },
  });
}
