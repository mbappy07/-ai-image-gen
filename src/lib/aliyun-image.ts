/**
 * 阿里云 DashScope 通义万相 — 图片生成 Service
 *
 * 双模型策略:
 *  - 纯文生图: wanx2.1-t2i-turbo → /api/v1/services/aigc/text2image/image-synthesis
 *  - 参考图生图: wan2.7-image-pro  → /api/v1/services/aigc/image-generation/generation
 *
 * 异步流程:
 *  1. POST 创建任务 → 获取 task_id
 *  2. GET 轮询任务状态 → 等待 SUCCEEDED/FAILED
 *  3. 返回图片 URL 列表
 */

// ============================================================
// 配置
// ============================================================

/** 支持的图片比例 → 像素尺寸映射 */
const SIZE_MAP: Record<string, string> = {
  "1:1": "1024*1024",
  "3:4": "768*1024",
  "4:3": "1024*768",
  "9:16": "576*1024",
  "16:9": "1024*576",
};

/** 文生图模型（无参考图） */
const MODEL_T2I = "wanx2.1-t2i-turbo";

/** 图生图模型（有参考图） */
const MODEL_I2I = "wan2.7-image-pro";

const WORKSPACE_ID = process.env.DASHSCOPE_WORKSPACE ?? "";
const BASE_URL = WORKSPACE_ID
  ? `https://${WORKSPACE_ID}.cn-beijing.maas.aliyuncs.com`
  : "https://dashscope.aliyuncs.com";

function getApiKey(): string {
  const key = process.env.DASHSCOPE_API_KEY;
  if (!key || key === "your_dashscope_api_key") {
    throw new Error("DASHSCOPE_API_KEY 未配置");
  }
  return key;
}

// ============================================================
// 输入 / 输出类型
// ============================================================

export interface GenerateImageParams {
  prompt: string;
  ratio: string;
  quantity: number;
  referenceImage?: string;
  negativePrompt?: string;
  seed?: number;
  timeout?: number;
  pollInterval?: number;
}

export interface GenerateImageResult {
  images: string[];
  taskId: string;
  elapsed: number;
}

// ---- API 契约 ----

interface TaskResponse {
  output?: {
    task_id: string;
    task_status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "UNKNOWN";
    task_metrics?: { TOTAL: number; SUCCEEDED: number; FAILED: number };
    results?: Array<{ url: string; code?: string; message?: string }>;
    code?: string;
    message?: string;
  };
  code?: string;
  message?: string;
  request_id?: string;
}

// ============================================================
// 日志
// ============================================================

function log(method: string, taskId: string | null, msg: string) {
  const ts = new Date().toISOString().slice(11, 23);
  const prefix = taskId
    ? `[${ts}] [DashScope|${method}|${taskId.slice(0, 8)}]`
    : `[${ts}] [DashScope|${method}]`;
  console.log(`${prefix} ${msg}`);
}

// ============================================================
// HTTP
// ============================================================

async function dashscopePost(
  path: string,
  body: Record<string, unknown>,
): Promise<TaskResponse> {
  const url = `${BASE_URL}${path}`;
  const apiKey = getApiKey();

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify(body),
  });

  const data: TaskResponse = await res.json();

  if (!res.ok || data.code) {
    const errMsg = data.message ?? data.code ?? `HTTP ${res.status}`;
    throw new Error(`DashScope POST ${path}: ${errMsg}`);
  }

  return data;
}

async function dashscopeGet(path: string): Promise<TaskResponse> {
  const url = `${BASE_URL}${path}`;
  const apiKey = getApiKey();

  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const data: TaskResponse = await res.json();

  if (!res.ok || data.code) {
    const errMsg = data.message ?? data.code ?? `HTTP ${res.status}`;
    throw new Error(`DashScope GET ${path}: ${errMsg}`);
  }

  return data;
}

// ============================================================
// 创建任务
// ============================================================

/** 文生图: 创建任务 */
async function createT2ITask(params: GenerateImageParams): Promise<string> {
  log("CREATE", null, `[T2I] prompt="${params.prompt.slice(0, 60)}..." ratio=${params.ratio} n=${params.quantity}`);

  const size = SIZE_MAP[params.ratio] ?? "1024*1024";

  const body = {
    model: MODEL_T2I,
    input: {
      prompt: params.prompt,
      ...(params.negativePrompt ? { negative_prompt: params.negativePrompt } : {}),
    },
    parameters: {
      n: params.quantity,
      size,
      watermark: false,
      prompt_extend: true,
      ...(params.seed !== undefined ? { seed: params.seed } : {}),
    },
  };

  const data = await dashscopePost(
    "/api/v1/services/aigc/text2image/image-synthesis",
    body,
  );

  const taskId = data.output?.task_id;
  if (!taskId) throw new Error("创建文生图任务失败: 未返回 task_id");

  log("CREATE", taskId, `状态=${data.output?.task_status}`);
  return taskId;
}

/** 图生图（参考图模式）: 创建任务 */
async function createI2ITask(params: GenerateImageParams): Promise<string> {
  log("CREATE", null, `[I2I] prompt="${params.prompt.slice(0, 60)}..." ref=${params.referenceImage?.slice(0, 60)}...`);

  const size = SIZE_MAP[params.ratio] ?? "1024*1024";

  const body = {
    model: MODEL_I2I,
    input: {
      messages: [
        {
          role: "user",
          content: [
            { image: params.referenceImage },
            { text: params.prompt },
          ],
        },
      ],
    },
    parameters: {
      n: params.quantity,
      size,
      watermark: false,
      ...(params.seed !== undefined ? { seed: params.seed } : {}),
    },
  };

  const data = await dashscopePost(
    "/api/v1/services/aigc/image-generation/generation",
    body,
  );

  const taskId = data.output?.task_id;
  if (!taskId) throw new Error("创建图生图任务失败: 未返回 task_id");

  log("CREATE", taskId, `状态=${data.output?.task_status}`);
  return taskId;
}

/** 查询任务状态 */
async function queryTask(taskId: string): Promise<TaskResponse> {
  return dashscopeGet(`/api/v1/tasks/${taskId}`);
}

/** 从响应中提取图片 URL — 兼容新旧两种 API 格式 */
function extractImageUrls(output: TaskResponse["output"]): string[] {
  if (!output) return [];
  // 新版 API (multimodal): output.choices[].message.content[].image
  const choices = (output as Record<string, unknown>)["choices"] as Array<{
    message?: { content?: Array<{ image?: string; type?: string }> };
  }> | undefined;

  if (choices) {
    const urls: string[] = [];
    for (const choice of choices) {
      const contents = choice.message?.content ?? [];
      for (const item of contents) {
        if (item.type === "image" && item.image) {
          urls.push(item.image);
        }
      }
    }
    if (urls.length > 0) return urls;
  }

  // 旧版 API (text2image): output.results[].url
  const results = output.results as Array<{ url?: string; code?: string }> | undefined;
  if (results) {
    return results
      .filter((r) => r.url && !r.code)
      .map((r) => r.url!);
  }

  return [];
}

// ============================================================
// 轮询等待
// ============================================================

async function waitForTask(
  taskId: string,
  pollInterval: number,
  deadline: number,
): Promise<{ state: "SUCCEEDED" | "FAILED" | "TIMEOUT"; results: string[]; errorMessage?: string }> {
  let attempt = 0;

  while (Date.now() < deadline) {
    attempt++;
    await sleep(attempt === 1 ? 1000 : pollInterval);

    const data = await queryTask(taskId);
    const status = data.output?.task_status;

    log("POLL", taskId, `#${attempt} status=${status}`);

    switch (status) {
      case "SUCCEEDED": {
        const urls = extractImageUrls(data.output);
        if (urls.length === 0) {
          return { state: "FAILED", results: [], errorMessage: "任务成功但无图片结果" };
        }
        log("DONE", taskId, `成功 ${urls.length} 张`);
        return { state: "SUCCEEDED", results: urls };
      }

      case "FAILED": {
        const msg = data.output?.message ?? "未知错误";
        log("FAIL", taskId, msg);
        return { state: "FAILED", results: [], errorMessage: msg };
      }
    }
  }

  log("TIMEOUT", taskId, `超时 (${attempt} 次轮询)`);
  return { state: "TIMEOUT", results: [], errorMessage: "任务超时" };
}

// ============================================================
// AI 换装 — 双参考图融合
// ============================================================

export interface TryOnParams {
  /** 服装图 OSS URL */
  clothingImage: string;
  /** 人物图 OSS URL */
  personImage: string;
  /** 生成数量 */
  quantity?: number;
  /** 最长等待 ms */
  timeout?: number;
  /** 轮询间隔 ms */
  pollInterval?: number;
}

/**
 * AI 换装：上传服装图 + 人物图，AI 将服装穿在人物身上
 * 使用 wan2.7-image-pro 多参考图模式
 */
export async function generateTryOn(
  params: TryOnParams,
): Promise<GenerateImageResult> {
  const t0 = Date.now();
  const pollInterval = params.pollInterval ?? 2000;
  const timeout = params.timeout ?? 180_000;
  const deadline = t0 + timeout;
  const qty = params.quantity ?? 1;

  // 校验
  if (!params.clothingImage) throw new Error("clothingImage 不能为空");
  if (!params.personImage) throw new Error("personImage 不能为空");

  log("CREATE", null, `[TRY-ON] clothing=${params.clothingImage.slice(0, 60)}... person=${params.personImage.slice(0, 60)}...`);

  const body = {
    model: MODEL_I2I,
    input: {
      messages: [
        {
          role: "user",
          content: [
            { image: params.clothingImage },
            { image: params.personImage },
            { text: "让图中的人物穿上这件衣服，保持人物的面部特征、发型和体态不变，衣服自然贴合在人物身上，真实自然的光影效果，专业摄影棚质感" },
          ],
        },
      ],
    },
    parameters: {
      n: qty,
      size: "1024*1024",
      watermark: false,
    },
  };

  const data = await dashscopePost(
    "/api/v1/services/aigc/image-generation/generation",
    body,
  );

  const taskId = data.output?.task_id;
  if (!taskId) throw new Error("创建换装任务失败: 未返回 task_id");

  log("CREATE", taskId, `状态=${data.output?.task_status}`);

  const { state, results, errorMessage } = await waitForTask(taskId, pollInterval, deadline);
  const elapsed = Date.now() - t0;

  log("SUMMARY", taskId, `${state} | ${results.length} 张 | ${elapsed}ms`);

  if (state === "SUCCEEDED") {
    return { images: results, taskId, elapsed };
  }

  throw new Error(`换装生成失败: ${errorMessage ?? "未知错误"} (taskId=${taskId})`);
}

// ============================================================
// AI 证件照
// ============================================================

const BG_COLORS: Record<string, string> = {
  blue: "蓝色",
  white: "白色",
  red: "红色",
};

export type BgColor = keyof typeof BG_COLORS;

export const BG_COLOR_OPTIONS: { value: BgColor; label: string; hex: string }[] = [
  { value: "blue", label: "蓝底", hex: "#438EDB" },
  { value: "white", label: "白底", hex: "#FFFFFF" },
  { value: "red", label: "红底", hex: "#CC0033" },
];

export interface IdPhotoParams {
  /** 人物照片 OSS URL */
  personImage: string;
  /** 底色 */
  background: BgColor;
  /** 最长等待 ms */
  timeout?: number;
  /** 轮询间隔 ms */
  pollInterval?: number;
}

/**
 * AI 证件照：上传人物照片 → AI 生成标准证件照
 * 使用 wan2.7-image-pro 图生图模式
 */
export async function generateIdPhoto(
  params: IdPhotoParams,
): Promise<GenerateImageResult> {
  const t0 = Date.now();
  const pollInterval = params.pollInterval ?? 2000;
  const timeout = params.timeout ?? 180_000;
  const deadline = t0 + timeout;
  const bgLabel = BG_COLORS[params.background] ?? params.background;

  if (!params.personImage) throw new Error("personImage 不能为空");
  if (!BG_COLORS[params.background]) throw new Error(`不支持的底色: ${params.background}`);

  log("CREATE", null, `[ID-PHOTO] person=${params.personImage.slice(0, 60)}... bg=${params.background}`);

  const prompt = `生成一张专业标准证件照。要求：保持人物的面部特征、五官和发丝细节完全不变，${bgLabel}纯色背景，正面免冠，光线均匀柔和，面部清晰无阴影，双眼自然睁开平视前方，表情自然端庄，着装得体，上半身构图符合证件照规范，照片边缘自然过渡，高质量证件照质感`;

  const body = {
    model: MODEL_I2I,
    input: {
      messages: [
        {
          role: "user",
          content: [
            { image: params.personImage },
            { text: prompt },
          ],
        },
      ],
    },
    parameters: {
      n: 1,
      size: "1024*1024",
      watermark: false,
    },
  };

  const data = await dashscopePost(
    "/api/v1/services/aigc/image-generation/generation",
    body,
  );

  const taskId = data.output?.task_id;
  if (!taskId) throw new Error("创建证件照任务失败: 未返回 task_id");

  log("CREATE", taskId, `状态=${data.output?.task_status}`);

  const { state, results, errorMessage } = await waitForTask(taskId, pollInterval, deadline);
  const elapsed = Date.now() - t0;

  log("SUMMARY", taskId, `${state} | ${results.length} 张 | ${elapsed}ms`);

  if (state === "SUCCEEDED") {
    return { images: results, taskId, elapsed };
  }

  throw new Error(`证件照生成失败: ${errorMessage ?? "未知错误"} (taskId=${taskId})`);
}

// ============================================================
// 公开 API
// ============================================================

export async function generateImage(
  params: GenerateImageParams,
): Promise<GenerateImageResult> {
  const t0 = Date.now();
  const pollInterval = params.pollInterval ?? 2000;
  const timeout = params.timeout ?? 180_000;
  const deadline = t0 + timeout;

  // 1. 校验
  if (!params.prompt || params.prompt.trim().length === 0) {
    throw new Error("prompt 不能为空");
  }
  if (params.quantity < 1 || params.quantity > 4) {
    throw new Error("quantity 需在 1-4 之间");
  }
  if (!SIZE_MAP[params.ratio]) {
    throw new Error(`不支持的 ratio: ${params.ratio}`);
  }

  // 2. 创建任务 (根据是否有参考图选不同模型+接口)
  const hasRef = !!params.referenceImage;
  const taskId = hasRef
    ? await createI2ITask(params)
    : await createT2ITask(params);

  // 3. 轮询等待
  const { state, results, errorMessage } = await waitForTask(taskId, pollInterval, deadline);

  const elapsed = Date.now() - t0;
  log("SUMMARY", taskId, `${state} | ${results.length} 张 | ${elapsed}ms`);

  if (state === "SUCCEEDED") {
    return { images: results, taskId, elapsed };
  }

  throw new Error(`图片生成失败: ${errorMessage ?? "未知错误"} (taskId=${taskId})`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
