-- 仓库管理系统数据库 Schema (Cloudflare D1 / SQLite)

-- 组织表
CREATE TABLE IF NOT EXISTS org (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT,
    address TEXT,
    status TEXT DEFAULT 'enabled' CHECK(status IN ('enabled', 'disabled')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 账号表
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role_ids TEXT DEFAULT '[]',  -- JSON array of role IDs
    status TEXT DEFAULT 'enabled' CHECK(status IN ('enabled', 'disabled')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id)
);
CREATE INDEX IF NOT EXISTS idx_user_org ON user(org_id);
CREATE INDEX IF NOT EXISTS idx_user_username ON user(username);

-- 角色表
CREATE TABLE IF NOT EXISTS role (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    name TEXT NOT NULL,
    remark TEXT,
    permissions TEXT DEFAULT '[]',  -- JSON array of permission strings
    is_system INTEGER DEFAULT 0,  -- 1 = system built-in role
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id)
);
CREATE INDEX IF NOT EXISTS idx_role_org ON role(org_id);

-- 仓库表
CREATE TABLE IF NOT EXISTS warehouse (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    manager TEXT,
    phone TEXT,
    type TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'enabled' CHECK(status IN ('enabled', 'disabled')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id),
    UNIQUE(org_id, code)
);
CREATE INDEX IF NOT EXISTS idx_warehouse_org ON warehouse(org_id);

-- 货位表
CREATE TABLE IF NOT EXISTS location (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    warehouse_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_id TEXT,
    status TEXT DEFAULT 'enabled' CHECK(status IN ('enabled', 'disabled')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (parent_id) REFERENCES location(id),
    UNIQUE(org_id, warehouse_id, code)
);
CREATE INDEX IF NOT EXISTS idx_location_org ON location(org_id);
CREATE INDEX IF NOT EXISTS idx_location_warehouse ON location(warehouse_id);

-- 商品分类表
CREATE TABLE IF NOT EXISTS category (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_id TEXT,
    remark TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (parent_id) REFERENCES category(id)
);
CREATE INDEX IF NOT EXISTS idx_category_org ON category(org_id);

-- 商品表
CREATE TABLE IF NOT EXISTS product (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    category_id TEXT,
    spec TEXT,
    unit TEXT DEFAULT '个',
    price REAL DEFAULT 0,
    cost REAL DEFAULT 0,
    origin TEXT,
    image_url TEXT,
    tags TEXT DEFAULT '[]',  -- JSON array
    status TEXT DEFAULT 'enabled' CHECK(status IN ('enabled', 'disabled')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (category_id) REFERENCES category(id),
    UNIQUE(org_id, code)
);
CREATE INDEX IF NOT EXISTS idx_product_org ON product(org_id);
CREATE INDEX IF NOT EXISTS idx_product_category ON product(category_id);

-- 供应商表
CREATE TABLE IF NOT EXISTS supplier (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    contact TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    bank TEXT,
    account TEXT,
    status TEXT DEFAULT 'enabled' CHECK(status IN ('enabled', 'disabled', 'paused', 'terminated')),
    remark TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id),
    UNIQUE(org_id, code)
);
CREATE INDEX IF NOT EXISTS idx_supplier_org ON supplier(org_id);

-- 供应商商品关联表
CREATE TABLE IF NOT EXISTS supplier_product (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    supplier_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    price REAL DEFAULT 0,  -- 供应商供货价
    lead_time_days INTEGER DEFAULT 7,  -- 供货周期
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (supplier_id) REFERENCES supplier(id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    UNIQUE(org_id, supplier_id, product_id)
);

-- 出入库单据表
CREATE TABLE IF NOT EXISTS stock_io (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('in', 'out')),
    category TEXT NOT NULL,  -- purchase, return, transfer, profit, loss, sale
    code TEXT NOT NULL,
    warehouse_id TEXT NOT NULL,
    supplier_id TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'executing', 'completed', 'archived', 'rejected')),
    total_amount REAL DEFAULT 0,
    apply_user_id TEXT,
    approve_user_id TEXT,
    execute_user_id TEXT,
    apply_date TEXT,
    approve_date TEXT,
    execute_date TEXT,
    remark TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (supplier_id) REFERENCES supplier(id),
    UNIQUE(org_id, code)
);
CREATE INDEX IF NOT EXISTS idx_stock_io_org ON stock_io(org_id);
CREATE INDEX IF NOT EXISTS idx_stock_io_status ON stock_io(status);
CREATE INDEX IF NOT EXISTS idx_stock_io_type ON stock_io(type);

-- 出入库明细表
CREATE TABLE IF NOT EXISTS stock_io_item (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    stock_io_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    location_id TEXT,
    quantity REAL NOT NULL,
    price REAL DEFAULT 0,
    amount REAL DEFAULT 0,
    actual_quantity REAL,
    remark TEXT,
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (stock_io_id) REFERENCES stock_io(id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (location_id) REFERENCES location(id)
);
CREATE INDEX IF NOT EXISTS idx_stock_io_item_io ON stock_io_item(stock_io_id);
CREATE INDEX IF NOT EXISTS idx_stock_io_item_product ON stock_io_item(product_id);

-- 库存表
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    warehouse_id TEXT NOT NULL,
    location_id TEXT,
    quantity REAL DEFAULT 0,
    locked_quantity REAL DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    FOREIGN KEY (location_id) REFERENCES location(id),
    UNIQUE(org_id, product_id, warehouse_id, location_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_org ON inventory(org_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);

-- 库存预警表
CREATE TABLE IF NOT EXISTS inventory_alert (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    min_stock REAL DEFAULT 0,
    max_stock REAL DEFAULT 0,
    is_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (product_id) REFERENCES product(id),
    UNIQUE(org_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_alert_org ON inventory_alert(org_id);

-- 盘点表
CREATE TABLE IF NOT EXISTS stocktake (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    code TEXT NOT NULL,
    warehouse_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'executing', 'completed')),
    plan_date TEXT,
    actual_date TEXT,
    apply_user_id TEXT,
    approve_user_id TEXT,
    result TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (warehouse_id) REFERENCES warehouse(id),
    UNIQUE(org_id, code)
);
CREATE INDEX IF NOT EXISTS idx_stocktake_org ON stocktake(org_id);

-- 盘点明细表
CREATE TABLE IF NOT EXISTS stocktake_item (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    stocktake_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    location_id TEXT,
    system_quantity REAL NOT NULL,  -- 系统库存
    actual_quantity REAL,  -- 实际盘点数量
    diff_quantity REAL,  -- 差异数量
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processed')),
    remark TEXT,
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (stocktake_id) REFERENCES stocktake(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);
CREATE INDEX IF NOT EXISTS idx_stocktake_item_stocktake ON stocktake_item(stocktake_id);

-- 操作日志表
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    org_id TEXT NOT NULL,
    user_id TEXT,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    target_id TEXT,
    detail TEXT,  -- JSON
    ip TEXT,
    result TEXT DEFAULT 'success',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (org_id) REFERENCES org(id)
);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- 字典表
CREATE TABLE IF NOT EXISTS dict_item (
    id TEXT PRIMARY KEY,
    org_id TEXT,  -- null = system级
    type TEXT NOT NULL,
    label TEXT NOT NULL,
    value TEXT NOT NULL,
    sort INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_dict_item_type ON dict_item(type);
CREATE INDEX IF NOT EXISTS idx_dict_item_org ON dict_item(org_id);

-- 系统配置表
CREATE TABLE IF NOT EXISTS config (
    id TEXT PRIMARY KEY,
    org_id TEXT,  -- null = 系统级配置
    key TEXT NOT NULL,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(org_id, key)
);
CREATE INDEX IF NOT EXISTS idx_config_org ON config(org_id);

-- 初始化系统管理员账号 (密码: admin123)
-- 这个需要在应用启动时创建
