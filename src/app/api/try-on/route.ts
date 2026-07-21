import { NextResponse } from "next/server";
import { tryOnRequestSchema } from "@/lib/validations";
import { getOrCreateUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTryOn } from "@/lib/aliyun-image";

// ============================================================
// POST /api/try-on
// ============================================================
export async function POST(request: Request) {
  // ---- 1. 解析 & 校验 ----
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "请求体必须是有效 JSON" },
      { status: 400 },
    );
  }

  const parsed = tryOnRequestSchema.safeParse(body);
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

  const { clothingImage, personImage, quantity } = parsed.data;

  // ---- 2. 获取用户 ----
  let userId: string;
  try {
    userId = await getOrCreateUserId();
  } catch (error) {
    console.error("[API|try-on] 获取用户失败", error);
    return NextResponse.json(
      { success: false, error: "用户身份初始化失败" },
      { status: 500 },
    );
  }

  // ---- 3. 创建记录 ----
  let generationId: string;
  try {
    const record = await prisma.generation.create({
      data: {
        userId,
        prompt: `AI 换装: 将服装穿在人物身上`,
        ratio: "1:1",
        quantity,
        referenceImage: JSON.stringify({ clothing: clothingImage.split("?")[0], person: personImage.split("?")[0] }),
        status: "processing",
      },
    });
    generationId = record.id;
  } catch (error) {
    console.error("[API|try-on] 创建记录失败", error);
    return NextResponse.json(
      { success: false, error: "数据库写入失败" },
      { status: 500 },
    );
  }

  console.log(`[API|try-on] 任务已创建 id=${generationId}`);

  // ---- 4. 调用 AI ----
  let images: string[];
  try {
    const result = await generateTryOn({
      clothingImage,
      personImage,
      quantity,
    });
    images = result.images;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "未知 AI 错误";
    console.error(`[API|try-on] AI 调用失败 id=${generationId}`, errMsg);

    try {
      await prisma.generation.update({
        where: { id: generationId },
        data: { status: "failed", errorMessage: errMsg.slice(0, 500) },
      });
    } catch (dbError) {
      console.error("[API|try-on] 更新失败状态时数据库错误", dbError);
    }

    return NextResponse.json(
      { success: false, error: errMsg, generationId },
      { status: 502 },
    );
  }

  // ---- 5. 成功 ----
  try {
    await prisma.generation.update({
      where: { id: generationId },
      data: { status: "success", imageUrls: images },
    });
  } catch (error) {
    console.error("[API|try-on] 更新成功状态时数据库错误 id=" + generationId, error);
  }

  console.log(`[API|try-on] 完成 id=${generationId} images=${images.length}`);

  return NextResponse.json({
    success: true,
    generationId,
    images,
  });
}
