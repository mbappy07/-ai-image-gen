# AI 图片生成工作室

基于阿里云通义万相大模型的 AI 图片生成平台，支持**文生图**、**AI 换装**、**AI 证件照**三大功能。

---

## 功能概览

| 功能 | 说明 |
|------|------|
| 🎨 **普通生图** | 输入描述词 AI 生成高质量图片，支持 5 种画幅比例和参考图融合 |
| 👔 **AI 换装** | 上传服装图和人物照片，AI 自动融合——衣服自然穿在人物身上 |
| 📸 **AI 证件照** | 上传正面近照，AI 生成蓝底/白底/红底标准证件照 |

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 框架 | Next.js 16 | App Router + Turbopack |
| 语言 | TypeScript | 严格模式 |
| 样式 | Tailwind CSS v4 + shadcn/ui | 组件库 + 自定义主题 |
| 数据库 | MySQL + Prisma ORM | 用户记录 / 生成历史 |
| AI | 通义万相 (DashScope) | wanx2.1-t2i-turbo / wan2.7-image-pro |
| 存储 | 阿里云 OSS | 参考图上传 + 签名 URL |
| 校验 | Zod v4 | API 参数 + 表单校验 |
| 部署 | Vercel | 前端托管 |

## 项目结构

```
src/
├── app/
│   ├── page.tsx                     # 首页 Landing
│   ├── layout.tsx                   # 根布局
│   ├── generate/page.tsx            # 普通生图页
│   ├── try-on/page.tsx              # AI 换装页
│   ├── id-photo/page.tsx            # AI 证件照页
│   ├── history/page.tsx             # 历史记录（分页 + 搜索 + 删除）
│   └── api/
│       ├── generate/route.ts        # POST 普通生图
│       ├── try-on/route.ts          # POST AI 换装
│       ├── id-photo/route.ts        # POST AI 证件照
│       ├── upload/route.ts          # POST 图片上传到 OSS
│       └── history/
│           ├── route.ts             # GET 历史记录列表
│           └── [id]/route.ts        # DELETE 删除记录
├── components/
│   ├── layout/Navbar.tsx            # 全局导航栏（响应式）
│   ├── generation/
│   │   ├── ControlPanel.tsx         # 普通生图控制面板
│   │   ├── PromptInput.tsx          # 描述输入框（字数限制 + 快捷标签）
│   │   ├── ImageUploader.tsx        # 参考图上传（拖拽 + OSS）
│   │   ├── RatioSelector.tsx        # 画幅比例选择器
│   │   ├── QuantitySelector.tsx     # 生成数量选择器
│   │   ├── GenerateButton.tsx       # 生成按钮（4 态：idle/loading/success/error）
│   │   ├── ResultGallery.tsx        # 结果展示（空态/骨架屏/结果网格）
│   │   ├── ImageCard.tsx            # 图片卡片（hover 遮罩 + 预览弹窗）
│   │   ├── TryOnUploader.tsx        # 换装双槽上传器（服装 + 人物）
│   │   └── IdPhotoUploader.tsx      # 证件照上传器（人物 + 底色选择）
│   ├── history/HistoryCard.tsx      # 历史卡片（缩略图 + 删除确认）
│   └── ui/                          # shadcn/ui 组件（Button, Card, Dialog...）
├── lib/
│   ├── aliyun-image.ts              # DashScope AI 生图 Service（3 个函数）
│   ├── oss.ts                       # 阿里云 OSS 客户端（上传/删除/签名 URL）
│   ├── auth.ts                      # 匿名用户会话（Cookie 持久化）
│   ├── prisma.ts                    # Prisma 客户端单例
│   └── validations.ts               # Zod Schema
├── types/
│   ├── generation.ts                # 业务类型
│   ├── api.ts                       # API 响应类型
│   └── ali-oss.d.ts                 # ali-oss SDK 类型声明
└── prisma/
    └── schema.prisma                # 数据库 Schema（User + Generation）
```

## 快速开始

### 前置条件

- Node.js 20+
- MySQL 8.0+
- 阿里云 OSS Bucket
- 阿里云百炼 API Key

### 1. 安装依赖

```bash
git clone <repo-url> && cd ai-image-gen
npm install
```

### 2. 环境变量

```bash
cp .env.example .env
```

编辑 `.env`，填入真实值：

```env
# 数据库
DATABASE_URL="mysql://root:password@localhost:3306/ai_image_gen"

# DashScope（必填）
DASHSCOPE_API_KEY="sk-xxxxxxxx"
DASHSCOPE_WORKSPACE="ws-xxxxxxxx"

# OSS（必填）
OSS_ACCESS_KEY="LTAI5t..."
OSS_SECRET_KEY="..."
OSS_BUCKET="ai-image-gen"
OSS_REGION="oss-cn-beijing"
```

### 3. 初始化数据库

```bash
npx prisma migrate dev --name init
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## AI 模型说明

| 场景 | 模型 | API 路径 |
|------|------|---------|
| 纯文生图 | `wanx2.1-t2i-turbo` | `text2image/image-synthesis` |
| 单参考图 | `wan2.7-image-pro` | `image-generation/generation` |
| 多参考图（换装） | `wan2.7-image-pro` | `image-generation/generation` |
| 证件照 | `wan2.7-image-pro` | `image-generation/generation` |

> 所有接口使用异步模式（`X-DashScope-Async: enable`），流程：创建任务 → 轮询状态 → 获取图片。

## 架构要点

- **匿名用户**：首次访问自动创建 Guest 用户，通过 `ai_img_uid` Cookie 持久化
- **异步生成**：AI 生成耗时约 10-30 秒，前端显示加载骨架屏，轮询结果
- **前后端校验**：图片上传经过前端（类型/大小/分辨率） + 服务端（Buffer 解析）双重校验
- **签名 URL**：私有 OSS Bucket，上传后生成 24h 签名 URL 传给 DashScope

## 许可证

MIT — 仅供学习交流使用。
