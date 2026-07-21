/**
 * 用户会话管理
 *
 * 匿名优先：通过 Cookie 持久化 userId，
 * 首次访问自动创建 guest 用户，无需注册/登录。
 */
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const USER_COOKIE = "ai_img_uid";
const ONE_YEAR = 60 * 60 * 24 * 365;

// ---- Cookie 读写 ----

function generateGuestEmail(): string {
  const id = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  return `guest_${id}@guest.ai-image-gen.local`;
}

async function getCookie(name: string): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(name)?.value;
}

async function setCookie(name: string, value: string): Promise<void> {
  const jar = await cookies();
  jar.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ONE_YEAR,
    path: "/",
  });
}

// ---- 公开 API ----

/**
 * 获取当前请求的用户 ID
 *
 * Cookie 命中 → 返回已有 userId
 * Cookie 未命中 → 创建匿名 User → 写 Cookie → 返回新 userId
 */
export async function getOrCreateUserId(): Promise<string> {
  // 1. 尝试从 cookie 恢复
  const cachedId = await getCookie(USER_COOKIE);
  if (cachedId) {
    const exists = await prisma.user.findUnique({
      where: { id: cachedId },
      select: { id: true },
    });
    if (exists) return cachedId;
  }

  // 2. 创建新的匿名用户
  const user = await prisma.user.create({
    data: {
      email: generateGuestEmail(),
    },
  });

  // 3. 写入 Cookie（Server Actions / API Routes 中可用）
  await setCookie(USER_COOKIE, user.id);

  return user.id;
}

/**
 * 根据邮箱查找或创建用户（后续接入 OAuth 时使用）
 */
export async function ensureUser(email: string, name?: string): Promise<string> {
  let user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { email, name },
      select: { id: true },
    });
  }

  return user.id;
}
