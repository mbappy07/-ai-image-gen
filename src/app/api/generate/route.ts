import { NextResponse } from "next/server";
import { generateRequestSchema } from "@/lib/validations";
import { getOrCreateUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateImage } from "@/lib/aliyun-image";

// ============================================================
// POST /api/generate
// ============================================================
export async function POST(request: Request) {
  // ----------------------------------------------------------
  // 1. 解析 & 校验参数
  // ----------------------------------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "请求体必须是有效 JSON" },
      { status: 400 },
    );
  }

  const parsed = generateRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        success: false,
        error: firstIssue?.message ?? "参数校验失败",
        issues: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const { prompt, ratio, quantity, referenceImage } = parsed.data;

  // ----------------------------------------------------------
  // 2. 获取用户身份（匿名 Cookie 模式）
  // ----------------------------------------------------------
  let userId: string;
  try {
    userId = await getOrCreateUserId();
  } catch (error) {
    console.error("[API|generate] 获取用户失败", error);
    return NextResponse.json(
      { success: false, error: "用户身份初始化失败" },
      { status: 500 },
    );
  }

  // ----------------------------------------------------------
  // 3. 创建 Generation 记录  (status = processing)
  // ----------------------------------------------------------
  let generationId: string;
  try {
    const record = await prisma.generation.create({
      data: {
        userId,
        prompt,
        ratio,
        quantity,
        referenceImage: referenceImage ? referenceImage.split("?")[0] : null,
        status: "processing",
      },
    });
    generationId = record.id;
  } catch (error) {
    console.error("[API|generate] 创建记录失败", error);
    return NextResponse.json(
      { success: false, error: "数据库写入失败" },
      { status: 500 },
    );
  }

  console.log(`[API|generate] 任务已创建 id=${generationId} prompt="${prompt.slice(0, 50)}..." ratio=${ratio} n=${quantity}`);

  // ----------------------------------------------------------
  // 4. 调用 DashScope 生成图片
  // ----------------------------------------------------------
  let images: string[];
  try {
    const result = await generateImage({
      prompt,
      ratio,
      quantity,
      referenceImage,
    });
    images = result.images;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "未知 AI 错误";
    console.error(`[API|generate] AI 调用失败 id=${generationId}`, errMsg);

    // 更新为失败状态
    try {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: "failed",
          errorMessage: errMsg.slice(0, 500),
        },
      });
    } catch (dbError) {
      console.error("[API|generate] 更新失败状态时数据库错误", dbError);
    }

    return NextResponse.json(
      { success: false, error: errMsg, generationId },
      { status: 502 },
    );
  }

  // ----------------------------------------------------------
  // 5. 成功 — 更新数据库
  // ----------------------------------------------------------
  try {
    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: "success",
        imageUrls: images, // Prisma 自动序列化数组为 JSON
      },
    });
  } catch (error) {
    // 图片已生成但数据库写入失败 — 仍然返回图片，但记录错误
    console.error("[API|generate] 更新成功状态时数据库错误 id=" + generationId, error);
  }

  console.log(`[API|generate] 完成 id=${generationId} images=${images.length}`);

  // ----------------------------------------------------------
  // 6. 返回结果
  // ----------------------------------------------------------
  return NextResponse.json({
    success: true,
    generationId,
    images,
  });
}
