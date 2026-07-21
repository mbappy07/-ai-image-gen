// ====== API 通用响应 ======
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ====== 分页参数 ======
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// ====== 分页响应 ======
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ====== 上传响应 ======
export interface UploadResponse {
  ossKey: string;
  ossUrl: string;
  fileName: string;
  fileSize: number;
}
