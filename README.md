# 仓库管理系统

基于 React + Hono.js + Cloudflare 的全栈仓库管理系统。

## 技术栈

- **前端**: React 18 + Vite + TypeScript + Ant Design + TailwindCSS
- **后端**: Hono.js (Cloudflare Workers)
- **数据库**: Cloudflare D1 (SQLite)
- **部署**: GitHub Actions → Cloudflare Pages/Workers

## 项目结构

```
仓库管理系统/
├── frontend/           # 前端应用
│   ├── src/
│   │   ├── api/        # API 调用
│   │   ├── components/ # 通用组件
│   │   ├── pages/      # 页面组件
│   │   ├── stores/      # 状态管理
│   │   └── main.tsx    # 入口文件
│   └── package.json
├── backend/            # 后端 API
│   ├── src/
│   │   ├── db/         # 数据库
│   │   ├── middleware/ # 中间件
│   │   ├── routes/     # 路由
│   │   ├── utils/      # 工具函数
│   │   └── index.ts    # 入口文件
│   └── wrangler.toml
├── SPEC.md             # 技术规格说明书
└── README.md
```

## 快速开始

### 前置要求

- Node.js 18+
- Cloudflare 账号
- GitHub 账号

### 本地开发

1. **克隆项目**

```bash
cd 仓库管理系统
```

2. **安装前端依赖**

```bash
cd frontend
npm install
npm run dev
```

3. **安装后端依赖（可选本地开发）**

```bash
cd backend
npm install
npm run dev
```

### 部署

#### 方式一：GitHub Actions（推荐）

1. Fork 此仓库
2. 在 Cloudflare Dashboard 创建:
   - D1 数据库 `warehouse-db`
   - R2 Bucket `warehouse-assets`（可选）
3. 在 GitHub 仓库 Settings → Secrets 中添加:
   - `CLOUDFLARE_API_TOKEN`: 你的 API Token
   - `CLOUDFLARE_ACCOUNT_ID`: 你的 Account ID
4. 推送代码到 main 分支，自动触发部署

#### 方式二：手动部署

**后端部署:**

```bash
cd backend
wrangler d1 create warehouse-db  # 创建 D1 数据库
wrangler d1 execute warehouse-db --local --file=src/db/schema.sql  # 初始化数据库
wrangler deploy  # 部署到 Cloudflare Workers
```

**前端部署:**

```bash
cd frontend
npm run build
wrangler pages deploy dist
```

## 环境变量

### 后端 (wrangler.toml)

```toml
[[d1_databases]]
binding = "DB"
database_name = "warehouse-db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "ASSETS"
bucket_name = "warehouse-assets"
```

## 功能模块

- [x] 多组织管理
- [x] 账号与权限管理
- [x] 商品管理（含分类、标签）
- [x] 供应商管理
- [x] 仓库与货位管理
- [x] 出入库管理（申请→审核→执行→归档）
- [x] 实时库存查询
- [x] 库存预警
- [x] 库存调拨
- [x] 库存盘点
- [x] 报表统计
- [x] 操作日志

## 默认账号

- 用户名: `admin`
- 密码: `admin123`

## 许可证

MIT
