# 仓库管理系统 - 技术规格说明书

> 版本：v1.0  
> 日期：2026-04-09  
> 技术栈：React + Vite / Hono.js / Cloudflare D1 + R2

---

## 一、项目架构

```
仓库管理系统
├── frontend/          # React + Vite 前端应用
│   ├── src/
│   │   ├── components/    # 通用组件
│   │   ├── pages/        # 页面
│   │   ├── hooks/        # 自定义 Hooks
│   │   ├── api/          # API 调用
│   │   ├── stores/       # 状态管理
│   │   └── styles/       # 样式
│   └── index.html
├── backend/           # Hono.js 后端（Cloudflare Workers）
│   ├── src/
│   │   ├── routes/       # 路由
│   │   ├── db/           # 数据库 Schema & D1 binding
│   │   ├── middleware/   # 中间件（认证/权限）
│   │   └── utils/        # 工具函数
│   └── wrangler.toml
└── SPEC.md
```

---

## 二、数据库设计（Cloudflare D1 / SQLite）

### 2.1 ER 概要

```
组织 (org)
  └── 账号 (user) ←──→ 角色 (role) ←──→ 权限 (permission)
  └── 仓库 (warehouse)
          └── 货位 (location)
  └── 商品分类 (category)
  └── 商品 (product)
  └── 供应商 (supplier)
  └── 出入库单据 (stock_io)
          └── 出入库明细 (stock_io_item)
  └── 库存 (inventory)
  └── 库存预警 (inventory_alert)
  └── 盘点 (stocktake)
          └── 盘点明细 (stocktake_item)
  └── 操作日志 (audit_log)
  └── 字典项 (dict_item)
```

### 2.2 核心表结构

#### org（组织表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| name | TEXT | 组织名称 |
| contact | TEXT | 联系人 |
| phone | TEXT | 联系电话 |
| address | TEXT | 地址 |
| status | TEXT | enabled/disabled |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

#### user（账号表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| username | TEXT | 账号名称（唯一） |
| password_hash | TEXT | 密码（bcrypt） |
| name | TEXT | 姓名 |
| phone | TEXT | 联系方式 |
| role_ids | TEXT | 角色ID数组（JSON） |
| status | TEXT | enabled/disabled |
| created_at | TEXT | 创建时间 |

#### role（角色表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| name | TEXT | 角色名称 |
| remark | TEXT | 备注 |
| permissions | TEXT | 权限列表（JSON） |
| is_system | INTEGER | 是否系统内置（组织管理员） |
| created_at | TEXT | 创建时间 |

#### warehouse（仓库表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| code | TEXT | 仓库编码（唯一于组织内） |
| name | TEXT | 仓库名称 |
| address | TEXT | 地址 |
| manager | TEXT | 负责人 |
| phone | TEXT | 联系方式 |
| type | TEXT | 仓库类型 |
| status | TEXT | enabled/disabled |
| created_at | TEXT | 创建时间 |

#### location（货位表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| warehouse_id | TEXT FK | 所属仓库 |
| code | TEXT | 货位编码 |
| name | TEXT | 货位名称 |
| parent_id | TEXT FK | 父货位（支持多级） |
| status | TEXT | enabled/disabled |
| created_at | TEXT | 创建时间 |

#### category（商品分类表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| name | TEXT | 分类名称 |
| parent_id | TEXT FK | 父分类（null = 一级） |
| remark | TEXT | 备注 |
| created_at | TEXT | 创建时间 |

#### product（商品表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| code | TEXT | 商品编码（组织内唯一） |
| name | TEXT | 商品名称 |
| category_id | TEXT FK | 所属分类 |
| spec | TEXT | 规格型号 |
| unit | TEXT | 单位 |
| price | REAL | 售价 |
| cost | REAL | 成本价 |
| origin | TEXT | 产地 |
| image_url | TEXT | 图片URL |
| tags | TEXT | 标签（JSON数组） |
| status | TEXT | enabled/disabled |
| created_at | TEXT | 创建时间 |

#### supplier（供应商表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| code | TEXT | 供应商编码 |
| name | TEXT | 供应商名称 |
| contact | TEXT | 联系人 |
| phone | TEXT | 电话 |
| email | TEXT | 邮箱 |
| address | TEXT | 地址 |
| bank | TEXT | 开户行 |
| account | TEXT | 账号 |
| status | TEXT | enabled/disabled/paused/terminated |
| remark | TEXT | 备注 |
| created_at | TEXT | 创建时间 |

#### stock_io（出入库单据表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| type | TEXT | io_type（in/out） |
| category | TEXT | 业务类型（purchase/return/transfer/profit/loss/sale等） |
| code | TEXT | 单据编号 |
| warehouse_id | TEXT FK | 仓库 |
| supplier_id | TEXT FK | 供应商（入库时） |
| status | TEXT | pending/approved/executing/completed/archived/rejected |
| total_amount | REAL | 总金额 |
| apply_user_id | TEXT FK | 申请人 |
| approve_user_id | TEXT FK | 审核人 |
| execute_user_id | TEXT FK | 执行人 |
| apply_date | TEXT | 申请日期 |
| approve_date | TEXT | 审核日期 |
| execute_date | TEXT | 执行日期 |
| remark | TEXT | 备注 |
| created_at | TEXT | 创建时间 |

#### stock_io_item（出入库明细表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| stock_io_id | TEXT FK | 所属单据 |
| product_id | TEXT FK | 商品 |
| location_id | TEXT FK | 货位 |
| quantity | REAL | 数量 |
| price | REAL | 单价 |
| amount | REAL | 金额 |
| actual_quantity | REAL | 实际数量（执行时） |
| remark | TEXT | 备注 |

#### inventory（库存表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| product_id | TEXT FK | 商品 |
| warehouse_id | TEXT FK | 仓库 |
| location_id | TEXT FK | 货位 |
| quantity | REAL | 库存数量 |
| locked_quantity | REAL | 锁定数量（已申请出库未执行） |
| updated_at | TEXT | 更新时间 |

#### inventory_alert（库存预警表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| product_id | TEXT FK | 商品 |
| min_stock | REAL | 最低库存 |
| max_stock | REAL | 最高库存 |
| is_enabled | INTEGER | 是否启用 |
| created_at | TEXT | 创建时间 |

#### stocktake（盘点表）
| 字段 |类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| code | TEXT | 盘点编号 |
| warehouse_id | TEXT FK | 盘点仓库 |
| status | TEXT | pending/approved/executing/completed |
| plan_date | TEXT | 计划日期 |
| actual_date | TEXT | 实际日期 |
| apply_user_id | TEXT FK | 发起人 |
| approve_user_id | TEXT FK | 审核人 |
| result | TEXT | 盘点结果摘要 |
| created_at | TEXT | 创建时间 |

#### audit_log（操作日志表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT FK | 所属组织 |
| user_id | TEXT FK | 操作人 |
| module | TEXT | 模块 |
| action | TEXT | 操作类型 |
| target_id | TEXT | 操作对象ID |
| detail | TEXT | 详情（JSON） |
| ip | TEXT | IP地址 |
| result | TEXT | success/fail |
| created_at | TEXT | 操作时间 |

#### dict_item（字典表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| org_id | TEXT | 所属组织（null = 系统级） |
| type | TEXT | 字典类型 |
| label | TEXT | 标签 |
| value | TEXT | 值 |
| sort | INTEGER | 排序 |
| created_at | TEXT | 创建时间 |

---

## 三、API 设计

### 3.1 认证相关
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 获取当前用户信息 |

### 3.2 组织管理（系统管理员）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/orgs | 组织列表 |
| POST | /api/orgs | 创建组织 |
| PUT | /api/orgs/:id | 编辑组织 |
| PUT | /api/orgs/:id/disable | 禁用组织 |
| PUT | /api/orgs/:id/enable | 启用组织 |
| DELETE | /api/orgs/:id | 删除组织 |

### 3.3 账号管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users | 账号列表 |
| POST | /api/users | 创建账号 |
| PUT | /api/users/:id | 编辑账号 |
| PUT | /api/users/:id/reset-password | 重置密码 |
| PUT | /api/users/:id/disable | 禁用账号 |
| PUT | /api/users/:id/enable | 启用账号 |

### 3.4 角色权限
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/roles | 角色列表 |
| POST | /api/roles | 创建角色 |
| PUT | /api/roles/:id | 编辑角色 |
| DELETE | /api/roles/:id | 删除角色 |

### 3.5 商品管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/products | 商品列表 |
| POST | /api/products | 新增商品 |
| PUT | /api/products/:id | 编辑商品 |
| PUT | /api/products/:id/disable | 禁用商品 |
| DELETE | /api/products/:id | 删除商品 |
| GET | /api/categories | 分类列表 |
| POST | /api/categories | 新增分类 |
| PUT | /api/categories/:id | 编辑分类 |
| DELETE | /api/categories/:id | 删除分类 |

### 3.6 供应商管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/suppliers | 供应商列表 |
| POST | /api/suppliers | 新增供应商 |
| PUT | /api/suppliers/:id | 编辑供应商 |
| PUT | /api/suppliers/:id/disable | 禁用供应商 |
| DELETE | /api/suppliers/:id | 删除供应商 |
| GET | /api/suppliers/:id/products | 供应商供货商品 |
| GET | /api/suppliers/:id/stats | 供应商供货统计 |

### 3.7 仓库货位
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/warehouses | 仓库列表 |
| POST | /api/warehouses | 新增仓库 |
| PUT | /api/warehouses/:id | 编辑仓库 |
| DELETE | /api/warehouses/:id | 删除仓库 |
| GET | /api/locations | 货位列表 |
| POST | /api/locations | 新增货位 |
| PUT | /api/locations/:id | 编辑货位 |
| DELETE | /api/locations/:id | 删除货位 |

### 3.8 出入库
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stock-io | 出入库单据列表 |
| POST | /api/stock-io | 创建单据（申请） |
| GET | /api/stock-io/:id | 单据详情 |
| PUT | /api/stock-io/:id/approve | 审核通过 |
| PUT | /api/stock-io/:id/reject | 审核驳回 |
| PUT | /api/stock-io/:id/execute | 执行出入库 |
| PUT | /api/stock-io/:id/archive | 归档 |
| GET | /api/stock-io/:id/print | 打印单据 |

### 3.9 库存
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/inventory | 库存列表 |
| GET | /api/inventory/:productId | 单商品库存明细 |
| GET | /api/inventory/alerts | 库存预警列表 |
| PUT | /api/inventory/alerts/:id | 设置预警阈值 |
| POST | /api/inventory/transfer | 库存调拨 |

### 3.10 盘点
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/stocktakes | 盘点列表 |
| POST | /api/stocktakes | 创建盘点计划 |
| GET | /api/stocktakes/:id | 盘点详情 |
| PUT | /api/stocktakes/:id/approve | 审核 |
| PUT | /api/stocktakes/:id/execute | 执行盘点 |
| PUT | /api/stocktakes/:id/complete | 完成盘点 |

### 3.11 报表
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/reports/inventory | 库存报表 |
| GET | /api/reports/stock-io | 出入库报表 |
| GET | /api/reports/supplier | 供应商报表 |
| GET | /api/reports/stocktake | 盘点报表 |

### 3.12 日志
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/audit-logs | 操作日志 |
| GET | /api/system-logs | 系统日志（系统管理员） |

### 3.13 系统配置
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/configs | 获取配置 |
| PUT | /api/configs | 更新配置 |
| GET | /api/dicts/:type | 获取字典项 |
| POST | /api/dicts | 新增字典项 |
| PUT | /api/dicts/:id | 编辑字典项 |
| DELETE | /api/dicts/:id | 删除字典项 |

---

## 四、前端页面结构

```
登录页
└── 主系统
    ├── 首页（Dashboard）
    │   ├── 今日统计卡片
    │   ├── 库存预警
    │   ├── 待审核单据
    │   └── 系统公告
    ├── 组织管理（系统管理员）
    │   └── 组织列表 / 新增 / 编辑
    ├── 账号管理
    │   └── 账号列表 / 新增 / 编辑 / 密码重置
    ├── 角色权限
    │   └── 角色列表 / 新增 / 编辑
    ├── 商品管理
    │   ├── 商品列表
    │   ├── 商品分类
    │   └── 商品标签
    ├── 供应商管理
    │   └── 供应商列表 / 新增 / 编辑 / 详情
    ├── 仓库货位
    │   ├── 仓库列表
    │   └── 货位列表
    ├── 出入库管理
    │   ├── 入库申请 / 审核 / 执行
    │   └── 出库申请 / 审核 / 执行
    ├── 库存管理
    │   ├── 实时库存
    │   ├── 库存预警
    │   ├── 库存调拨
    │   └── 库存盘点
    ├── 报表管理
    │   ├── 库存报表
    │   ├── 出入库报表
    │   ├── 供应商报表
    │   └── 盘点报表
    ├── 日志管理
    │   ├── 操作日志
    │   └── 数据日志
    └── 系统配置
        ├── 全局参数
        ├── 字典管理
        └── 打印配置
```

---

## 五、权限设计

### 5.1 权限点定义

```
org:view        # 查看组织
org:create      # 创建组织
org:edit        # 编辑组织
org:disable     # 禁用组织
user:view       # 查看账号
user:create     # 创建账号
user:edit       # 编辑账号
user:disable    # 禁用账号
role:view       # 查看角色
role:create     # 创建角色
role:edit       # 编辑角色
role:delete     # 删除角色
product:view    # 查看商品
product:create  # 新增商品
product:edit    # 编辑商品
product:delete  # 删除商品
category:view   # 查看分类
category:create # 新增分类
category:edit   # 编辑分类
category:delete # 删除分类
supplier:view   # 查看供应商
supplier:create # 新增供应商
supplier:edit   # 编辑供应商
supplier:delete # 删除供应商
warehouse:view   # 查看仓库
warehouse:create # 新增仓库
warehouse:edit  # 编辑仓库
warehouse:delete # 删除仓库
location:view   # 查看货位
location:create # 新增货位
location:edit   # 编辑货位
location:delete # 删除货位
stock_in:view   # 查看入库单
stock_in:create # 发起入库申请
stock_in:approve # 审核入库单
stock_in:execute # 执行入库
stock_out:view  # 查看出库单
stock_out:create # 发起出库申请
stock_out:approve # 审核出库单
stock_out:execute # 执行出库
inventory:view  # 查看库存
inventory:alert # 设置库存预警
inventory:transfer # 调拨库存
stocktake:view  # 查看盘点
stocktake:create # 创建盘点
stocktake:approve # 审核盘点
stocktake:execute # 执行盘点
report:inventory # 库存报表
report:stock_io # 出入库报表
report:supplier # 供应商报表
report:stocktake # 盘点报表
log:audit       # 操作日志
log:system      # 系统日志
config:system   # 系统级配置
config:org      # 组织级配置
dict:view       # 查看字典
dict:manage     # 管理字典
```

### 5.2 内置角色权限

**系统管理员**：拥有所有权限（通配）

**组织管理员**：
所有 `org_id` 为本组织的权限 + `log:system` 除外

**仓库管理员**：
- `warehouse:*`, `location:*`
- `stock_in:view, approve`, `stock_out:view, approve`
- `inventory:view, alert`
- `stocktake:view, create, approve, execute`
- `report:*`

**库管员**：
- `stock_in:view, execute`, `stock_out:view, execute`
- `inventory:view`
- `stocktake:view, execute`

**采购员**：
- `supplier:view, create, edit`
- `stock_in:view, create`
- `report:stock_io`

**统计员**：
- `product:view`, `supplier:view`
- `inventory:view`
- `report:*`

---

## 六、技术细节

### 6.1 认证方案
- JWT Token（存放在 httpOnly cookie 或 localStorage）
- Token 有效期：7天
- 每个请求带上 `Authorization: Bearer <token>`

### 6.2 多组织数据隔离
所有 SQL 查询强制带上 `WHERE org_id = ?`，org_id 从登录态 JWT 中提取，不信任客户端传入的 org_id

### 6.3 密码加密
bcrypt，salt rounds = 10

### 6.4 单据编号规则
`{类型代码}{YYYYMMDD}{序列号4位}`
例如：RK202604090001（入库）、CK202604090001（出库）

### 6.5 库存计算
- 入库执行：库存数量 += 实际入库数量
- 出库执行：库存数量 -= 实际出库数量，锁定数量 -= 申请数量
- 盘盈：库存数量 += 盘盈数量
- 盘亏：库存数量 -= 盘亏数量

---

## 七、开发计划

### Phase 1：基础框架（2-3小时）
- [ ] 项目脚手架（Vite + React + Hono）
- [ ] 数据库 Schema 初始化 SQL
- [ ] 统一 API 响应格式
- [ ] 基础页面布局（登录 + 主框架）

### Phase 2：认证与权限（3-4小时）
- [ ] 登录/登出 API
- [ ] JWT 中间件
- [ ] 权限装饰器
- [ ] 路由守卫
- [ ] 组织管理员内置角色创建

### Phase 3：核心 CRUD（4-5小时）
- [ ] 组织管理（系统管理员）
- [ ] 账号管理
- [ ] 角色权限管理
- [ ] 商品管理 + 分类
- [ ] 供应商管理
- [ ] 仓库货位管理

### Phase 4：业务核心（4-5小时）
- [ ] 入库管理（申请→审核→执行→归档）
- [ ] 出库管理（申请→审核→执行→归档）
- [ ] 实时库存查询
- [ ] 库存预警
- [ ] 库存调拨

### Phase 5：拓展功能（3-4小时）
- [ ] 库存盘点
- [ ] 报表统计
- [ ] 日志管理
- [ ] 字典管理
- [ ] 系统配置

### Phase 6：部署（1-2小时）
- [ ] GitHub 仓库
- [ ] Cloudflare Pages 前端部署
- [ ] Cloudflare Workers 后端部署
- [ ] D1 数据库初始化
- [ ] R2 配置（图片存储）
