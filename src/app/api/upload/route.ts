import { NextResponse } from "next/server";
import { getOrCreateUserId } from "@/lib/auth";
import { createUploadToken } from "@/lib/oss";

// ============================================================
// POST /api/upload — 返回 OSS 直传凭证，浏览器直接上传
// ============================================================
export async function POST(request: Request) {
  let userId: string;
  try {
    userId = await getOrCreateUserId();
  } catch {
    return NextResponse.json(
      { success: false, error: "用户身份初始化失败" },
      { status: 500 },
    );
  }

  let body: { filename?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "请求体必须是有效 JSON" },
      { status: 400 },
    );
  }

  const filename = body.filename || "image.png";

  try {
    const cred = await createUploadToken({
      filename,
      userId,
      type: "reference",
    });

    return NextResponse.json({
      success: true,
      data: cred,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "生成凭证失败";
    console.error("[API|upload]", msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 400 },
    );
  }
}
