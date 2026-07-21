import { z } from "zod/v4";

export const VALID_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const;

// ====== 图片比例 ======
export const ratioSchema = z.enum(VALID_RATIOS);

// ====== 生成请求 ======
export const generateRequestSchema = z.object({
  prompt: z
    .string()
    .min(1, "请输入图片描述")
    .max(1000, "描述不能超过 1000 个字符"),
  ratio: ratioSchema.default("1:1"),
  quantity: z
    .number()
    .int()
    .min(1, "至少生成 1 张")
    .max(4, "最多生成 4 张")
    .default(1),
  referenceImage: z.string().url("参考图需为有效 URL").optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

// ====== AI 换装请求 ======
export const tryOnRequestSchema = z.object({
  clothingImage: z.string().url("服装图需为有效 URL"),
  personImage: z.string().url("人物图需为有效 URL"),
  quantity: z
    .number()
    .int()
    .min(1, "至少生成 1 张")
    .max(2, "最多生成 2 张")
    .default(1),
});

export type TryOnRequest = z.infer<typeof tryOnRequestSchema>;

// ====== AI 证件照请求 ======
export const idPhotoRequestSchema = z.object({
  personImage: z.string().url("人物图需为有效 URL"),
  background: z.enum(["blue", "white", "red"]),
});

export type IdPhotoRequest = z.infer<typeof idPhotoRequestSchema>;

// ====== 历史查询 ======
export const historyQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().optional(),
});

export type HistoryQuery = z.infer<typeof historyQuerySchema>;
