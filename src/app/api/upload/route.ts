import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/lib/auth";
import { uploadImage } from "@/lib/oss";

// ============================================================
// POST /api/upload
// ============================================================
export async function POST(request: Request) {
  // ----------------------------------------------------------
  // 1. 获取用户
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
  // 2. 解析 FormData
  // ----------------------------------------------------------
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "请求体必须是 multipart/form-data" },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "请上传一个图片文件 (字段名: file)" },
      { status: 400 },
    );
  }

  // ----------------------------------------------------------
  // 3. 上传到 OSS
  // ----------------------------------------------------------
  try {
    const result = await uploadImage(file, {
      filename: file.name || "image.png",
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
    return NextResponse.json(
      { success: false, error: msg },
      { status: 400 },
    );
  }
}
