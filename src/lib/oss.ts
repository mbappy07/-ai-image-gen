/**
 * 阿里云 OSS 客户端封装
 *
 * 负责:
 *  - 上传参考图片到 OSS
 *  - 上传生成结果到 OSS
 *  - 生成/删除公开 URL
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
    throw new Error(
      "OSS 配置不完整，请检查 .env: OSS_REGION, OSS_BUCKET, OSS_ACCESS_KEY, OSS_SECRET_KEY",
    );
  }

  return new OSS({
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    secure: true,
  });
}

// ============================================================
// 工具
// ============================================================

/** 生成 OSS 对象 key */
export function generateOssKey(type: "reference" | "generated", userId: string, filename: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
  const ext = filename.split(".").pop() ?? "png";
  const uuid = crypto.randomUUID();
  return `${type}/${date}/${userId.slice(0, 8)}/${uuid}.${ext}`;
}

/** 构建 OSS 公开访问 URL */
export function getOssPublicUrl(key: string): string {
  const region = process.env.OSS_REGION ?? "oss-cn-hangzhou";
  const bucket = process.env.OSS_BUCKET ?? "";
  return `https://${bucket}.${region}.aliyuncs.com/${key}`;
}

/**
 * 生成 OSS 签名 URL（私有 Bucket 用）
 * 默认 24 小时有效
 */
export async function getSignedUrl(key: string, expiresSec = 86400): Promise<string> {
  const client = getClient();
  return client.signatureUrl(key, { expires: expiresSec });
}

// ============================================================
// 上传 / 删除
// ============================================================

/** 允许的图片类型 */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/** 最大文件大小: 10MB */
const MAX_SIZE = 10 * 1024 * 1024;

export interface UploadOptions {
  /** 文件名 (用于推断扩展名) */
  filename: string;
  /** 用户标识 */
  userId: string;
  /** 分类: reference | generated */
  type: "reference" | "generated";
}

export interface UploadResult {
  ossKey: string;
  url: string;
  size: number;
}

/**
 * 上传文件到 OSS
 *
 * @param file  Buffer（服务端）或 File（浏览器端通过 FormData 传入）
 * @param opts  上传选项
 * @returns     { ossKey, url, size }
 */
export async function uploadImage(
  file: Buffer | File,
  opts: UploadOptions,
): Promise<UploadResult> {
  // ---- 类型校验 ----
  const ext = opts.filename.toLowerCase().split(".").pop() ?? "";
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  const mime = mimeMap[ext];

  if (!mime || !ALLOWED_TYPES.includes(mime)) {
    throw new Error(
      `不支持的文件类型 (.${ext})，仅允许: ${ALLOWED_EXTENSIONS.join(", ")}`,
    );
  }

  // ---- 大小校验 ----
  const buf = file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
  if (buf.byteLength > MAX_SIZE) {
    const mb = (buf.byteLength / 1024 / 1024).toFixed(1);
    throw new Error(`文件过大 (${mb}MB)，限制 10MB`);
  }

  // ---- 上传 ----
  const ossKey = generateOssKey(opts.type, opts.userId, opts.filename);
  const client = getClient();

  const result = await client.put(ossKey, buf, {
    mime,
    headers: {
      "Cache-Control": "public, max-age=31536000",
    },
  });

  if (result.res.status !== 200) {
    throw new Error(`OSS 上传失败: HTTP ${result.res.status}`);
  }

  const signedUrl = await getSignedUrl(ossKey);

  return { ossKey, url: signedUrl, size: buf.byteLength };
}

/**
 * 删除 OSS 文件（如果存在）
 */
export async function deleteImage(ossKey: string): Promise<void> {
  try {
    const client = getClient();
    await client.delete(ossKey);
  } catch {
    // 文件不存在也忽略
  }
}
