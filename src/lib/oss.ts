/**
 * 阿里云 OSS 客户端封装
 *
 * 两种上传模式:
 * 1. 浏览器直传 (推荐) — createUploadToken() 返回签名凭证
 *    浏览器直接 POST 到 OSS，速度快，不占 Vercel 函数时间
 *
 * 2. 服务端上传 — uploadBuffer()
 *    文件先传到 Vercel → 再转存 OSS（仅适合极小文件）
 */

import "server-only";
import OSS from "ali-oss";

// ============================================================
// 配置
// ============================================================
function getClient(): OSS {
  const region = process.env.OSS_REGION;
  const bucket = process.env.OSS_BUCKET;
  const accessKeyId = process.env.OSS_ACCESS_KEY;
  const accessKeySecret = process.env.OSS_SECRET_KEY;

  if (!region || !bucket || !accessKeyId || !accessKeySecret) {
    throw new Error("OSS 配置不完整");
  }

  return new OSS({
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    secure: true,
    timeout: 30000,
  });
}

// ============================================================
// 工具
// ============================================================

export function generateOssKey(type: "reference" | "generated", userId: string, filename: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
  const ext = filename.split(".").pop() ?? "png";
  const uuid = crypto.randomUUID();
  return `${type}/${date}/${userId.slice(0, 8)}/${uuid}.${ext}`;
}

export function getOssPublicUrl(key: string): string {
  const region = process.env.OSS_REGION ?? "oss-cn-hangzhou";
  const bucket = process.env.OSS_BUCKET ?? "";
  return `https://${bucket}.${region}.aliyuncs.com/${key}`;
}

export async function getSignedUrl(key: string, expiresSec = 86400): Promise<string> {
  const client = getClient();
  return client.signatureUrl(key, { expires: expiresSec });
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// ============================================================
// 浏览器直传凭证
// ============================================================

export interface UploadTokenParams {
  filename: string;
  userId: string;
  type: "reference" | "generated";
}

export interface UploadToken {
  /** 上传目标 URL */
  uploadUrl: string;
  /** OSS object key */
  ossKey: string;
  /** 最终访问 URL（签名） */
  signedUrl: string;
  /** 表单字段 */
  formData: Record<string, string>;
}

/**
 * 生成 OSS 浏览器直传凭证
 * 调用例：POST /api/upload → { uploadUrl, ossKey, signedUrl, formData }
 */
export async function createUploadToken(opts: UploadTokenParams): Promise<UploadToken> {
  const ext = opts.filename.toLowerCase().split(".").pop() ?? "";
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];

  if (!allowed.includes("." + ext)) {
    throw new Error(`不支持的文件类型 (.${ext})，仅允许: ${ALLOWED_EXTENSIONS.join(", ")}`);
  }

  const ossKey = generateOssKey(opts.type, opts.userId, opts.filename);
  const client = getClient();
  const bucket = process.env.OSS_BUCKET ?? "";
  const region = process.env.OSS_REGION ?? "";
  const uploadUrl = `https://${bucket}.${region}.aliyuncs.com`;

  // 生成 PostObject 签名
  const policy = {
    expiration: new Date(Date.now() + 300 * 1000).toISOString(), // 5 分钟有效
    conditions: [
      ["content-length-range", 0, 10 * 1024 * 1024], // 10MB
    ],
  };

  const policyBase64 = Buffer.from(JSON.stringify(policy)).toString("base64");
  const accessKeyId = process.env.OSS_ACCESS_KEY ?? "";
  const accessKeySecret = process.env.OSS_SECRET_KEY ?? "";

  // HMAC-SHA1 签名
  const cryptoLib = await import("node:crypto");
  const hmac = cryptoLib.createHmac("sha1", accessKeySecret);
  hmac.update(policyBase64);
  const signature = hmac.digest("base64");

  const signedUrl = await getSignedUrl(ossKey);

  return {
    uploadUrl,
    ossKey,
    signedUrl,
    formData: {
      key: ossKey,
      policy: policyBase64,
      OSSAccessKeyId: accessKeyId,
      signature,
      success_action_status: "200",
    },
  };
}

// ============================================================
// 服务端直传 (传统方案，Vercel 超时风险)
// ============================================================

export interface UploadOptions {
  filename: string;
  userId: string;
  type: "reference" | "generated";
}

export interface UploadResult {
  ossKey: string;
  url: string;
  size: number;
}

export async function uploadBuffer(
  buf: Buffer,
  opts: UploadOptions,
): Promise<UploadResult> {
  const ext = opts.filename.toLowerCase().split(".").pop() ?? "";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  };
  const mime = mimeMap[ext];
  if (!mime) throw new Error(`不支持的文件类型 (.${ext})`);

  if (buf.byteLength > 10 * 1024 * 1024) {
    throw new Error("文件过大，限制 10MB");
  }

  const ossKey = generateOssKey(opts.type, opts.userId, opts.filename);
  const client = getClient();

  const result = await client.put(ossKey, buf, {
    mime,
    headers: { "Cache-Control": "public, max-age=31536000" },
  });

  if (result.res.status !== 200) {
    throw new Error(`OSS 上传失败: HTTP ${result.res.status}`);
  }

  const signedUrl = await getSignedUrl(ossKey);
  return { ossKey, url: signedUrl, size: buf.byteLength };
}

export async function deleteImage(ossKey: string): Promise<void> {
  try {
    const client = getClient();
    await client.delete(ossKey);
  } catch { /* ignore */ }
}
