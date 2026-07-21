import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/lib/auth";
import { uploadBuffer } from "@/lib/oss";

// ============================================================
// POST /api/upload
// ============================================================
export async function POST(request: Request) {
  // 1. 获取用户
  let userId: string;
  try {
    userId = await getOrCreateUserId();
  } catch {
    return NextResponse.json(
      { success: false, error: "用户身份初始化失败" },
      { status: 500 },
    );
  }

  // 2. 解析 FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "请求体必须是 multipart/form-data" },
      { status: 400 },
    );
  }

  const fileEntry = formData.get("file");
  if (!fileEntry) {
    return NextResponse.json(
      { success: false, error: "请上传一个图片文件" },
      { status: 400 },
    );
  }

  // 3. 转为 Buffer（Vercel serverless 兼容写法）
  let buffer: Buffer;
  let filename = "image.png";
  try {
    const blob = fileEntry as Blob;
    buffer = Buffer.from(await blob.arrayBuffer());
    // 尝试读取文件名
    if ("name" in blob && typeof (blob as Record<string, unknown>).name === "string") {
      filename = (blob as Record<string, string>).name;
    }
  } catch (err) {
    console.error("[API|upload] 读取文件失败", err);
    return NextResponse.json(
      { success: false, error: "文件读取失败" },
      { status: 400 },
    );
  }

  // 4. 上传到 OSS
  try {
    const result = await uploadBuffer(buffer, {
      filename,
      userId,
      type: "reference",
    });

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
        ossKey: result.ossKey,
        size: result.size,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "上传失败";
    console.error("[API|upload]", msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 400 },
    );
  }
}
