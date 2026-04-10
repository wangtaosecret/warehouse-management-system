-- 初始化数据 (仅当记录不存在时插入)

-- 插入默认组织
INSERT OR IGNORE INTO org (id, name, status) VALUES ('org-001', '默认组织', 'enabled');

-- 插入系统角色 (管理员)
INSERT OR IGNORE INTO role (id, org_id, name, permissions, is_system, created_at) 
VALUES ('role-admin', 'org-001', '管理员', '["*"]', 1, datetime('now'));

-- 插入系统角色 (操作员)
INSERT OR IGNORE INTO role (id, org_id, name, permissions, is_system, created_at) 
VALUES ('role-user', 'org-001', '操作员', '["read", "write"]', 1, datetime('now'));

-- 插入管理员账号 (密码: admin123)
INSERT OR IGNORE INTO user (id, org_id, username, password_hash, name, role_ids, status, created_at) 
VALUES ('user-001', 'org-001', 'admin', '$2a$10$kLMzVPNfa9I8DX9oEdnW/uiNdteSt8YWDN7JGOwAHvZ89xWRALp36', '系统管理员', '["role-admin"]', 'enabled', datetime('now'));
