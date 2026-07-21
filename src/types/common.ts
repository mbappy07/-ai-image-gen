// ====== 通用工具类型 ======

/** 去除 null/undefined */
export type NonNullable<T> = T extends null | undefined ? never : T;

/** 可空类型 */
export type Nullable<T> = T | null;

/** 深度 Partial */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
