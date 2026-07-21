// ====== 图片比例 ======
export const ASPECT_RATIOS = {
  "1:1": { label: "正方形 1:1", width: 1024, height: 1024 },
  "3:4": { label: "竖版 3:4", width: 768, height: 1024 },
  "4:3": { label: "横版 4:3", width: 1024, height: 768 },
  "9:16": { label: "全屏竖版 9:16", width: 576, height: 1024 },
  "16:9": { label: "宽屏 16:9", width: 1024, height: 576 },
} as const;

export type AspectRatio = keyof typeof ASPECT_RATIOS;

// ====== 生成状态 ======
export const GENERATION_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  SUCCESS: "success",
  FAILED: "failed",
} as const;

export type GenerationStatus = (typeof GENERATION_STATUS)[keyof typeof GENERATION_STATUS];
