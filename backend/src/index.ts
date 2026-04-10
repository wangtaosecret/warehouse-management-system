import { Hono } from 'hono';
import { corsMiddleware } from './middleware/cors';
import auth from './routes/auth';
import orgs from './routes/orgs';
import users from './routes/users';
import roles from './routes/roles';
import products from './routes/products';
import stockIo from './routes/stock-io';
import inventory from './routes/inventory';
import categories from './routes/categories';
import warehouses from './routes/warehouses';
import suppliers from './routes/suppliers';

const app = new Hono<{ Bindings: { DB: any } }>();

// Middleware
app.use('/*', corsMiddleware);

// Health check
app.get('/', (c) => {
  return c.json({ 
    success: true, 
    message: 'Warehouse Management API',
    version: '1.0.0'
  });
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.route('/api/auth', auth);
app.route('/api/orgs', orgs);
app.route('/api/users', users);
app.route('/api/roles', roles);
app.route('/api/products', products);
app.route('/api/categories', categories);
app.route('/api/warehouses', warehouses);
app.route('/api/suppliers', suppliers);
app.route('/api/stock-io', stockIo);
app.route('/api/inventory', inventory);

// Dashboard API (real data from DB)
app.get('/api/dashboard', async (c) => {
  const db = c.env.DB;
  
  try {
    // Get stats from database
    const orgId = 'org-001';
    
    // Total products
    const productCount = await db.prepare('SELECT COUNT(*) as count FROM product WHERE org_id = ?').bind(orgId).first();
    
    // Total inventory value
    const inventoryValue = await db.prepare(`
      SELECT COALESCE(SUM(i.quantity * p.price), 0) as total
      FROM inventory i
      JOIN product p ON i.product_id = p.id
      WHERE i.org_id = ?
    `).bind(orgId).first();
    
    // Today IO counts
    const today = new Date().toISOString().split('T')[0];
    const todayIn = await db.prepare(`
      SELECT COUNT(*) as count FROM stock_io 
      WHERE org_id = ? AND type = 'in' AND DATE(created_at) = ?
    `).bind(orgId, today).first();
    
    const todayOut = await db.prepare(`
      SELECT COUNT(*) as count FROM stock_io 
      WHERE org_id = ? AND type = 'out' AND DATE(created_at) = ?
    `).bind(orgId, today).first();
    
    // Pending approvals
    const pendingApprove = await db.prepare(`
      SELECT COUNT(*) as count FROM stock_io 
      WHERE org_id = ? AND status = 'pending'
    `).bind(orgId).first();
    
    // Low stock alerts
    const lowStockAlerts = await db.prepare(`
      SELECT COUNT(*) as count FROM inventory_alert a
      JOIN inventory i ON a.product_id = i.product_id AND a.org_id = i.org_id
      WHERE a.org_id = ? AND a.is_enabled = 1 AND i.quantity < a.min_stock
    `).bind(orgId).first();
    
    // Recent IO records
    const recentIO = await db.prepare(`
      SELECT s.id, s.code, s.type, s.category, s.status, s.created_at,
        w.name as warehouse_name,
        su.name as supplier_name
      FROM stock_io s
      LEFT JOIN warehouse w ON s.warehouse_id = w.id
      LEFT JOIN supplier su ON s.supplier_id = su.id
      WHERE s.org_id = ?
      ORDER BY s.created_at DESC
      LIMIT 10
    `).bind(orgId).all();
    
    // Alerts
    const alerts = await db.prepare(`
      SELECT a.id, p.name as product_name, p.code as product_code,
        i.quantity as current_stock, a.min_stock, a.max_stock,
        CASE 
          WHEN i.quantity < a.min_stock THEN 'low'
          WHEN i.quantity > a.max_stock THEN 'high'
          ELSE 'normal'
        END as alert_type
      FROM inventory_alert a
      JOIN product p ON a.product_id = p.id
      LEFT JOIN inventory i ON a.product_id = i.product_id AND a.org_id = i.org_id
      WHERE a.org_id = ? AND a.is_enabled = 1
      ORDER BY 
        CASE WHEN i.quantity < a.min_stock THEN 0 WHEN i.quantity > a.max_stock THEN 1 ELSE 2 END
      LIMIT 10
    `).bind(orgId).all();
    
    return c.json({
      success: true,
      data: {
        stats: {
          total_products: productCount?.count || 0,
          total_inventory_value: inventoryValue?.total || 0,
          today_in_count: todayIn?.count || 0,
          today_out_count: todayOut?.count || 0,
          pending_approve: pendingApprove?.count || 0,
          low_stock_alerts: lowStockAlerts?.count || 0,
        },
        recent_io: recentIO.results || [],
        alerts: alerts.results || [],
      }
    });
  } catch (e: any) {
    console.error('Dashboard error:', e);
    // Fallback demo data on error
    return c.json({
      success: true,
      data: {
        stats: {
          total_products: 0,
          total_inventory_value: 0,
          today_in_count: 0,
          today_out_count: 0,
          pending_approve: 0,
          low_stock_alerts: 0,
        },
        recent_io: [],
        alerts: [],
      }
    });
  }
});

// Demo routes (for testing without DB)
app.get('/api/demo/products', (c) => {
  return c.json({
    success: true,
    data: {
      list: [
        { id: '1', code: 'P001', name: 'iPhone 15 Pro', category_name: '电子产品', spec: '256GB', unit: '台', price: 7999, cost: 6000, quantity: 50, status: 'enabled' },
        { id: '2', code: 'P002', name: 'MacBook Pro 14', category_name: '电子产品', spec: 'M3 Pro', unit: '台', price: 15999, cost: 12000, quantity: 20, status: 'enabled' },
        { id: '3', code: 'P003', name: 'AirPods Pro', category_name: '电子产品', spec: '二代', unit: '副', price: 1899, cost: 1200, quantity: 100, status: 'enabled' },
      ],
      total: 3,
      page: 1,
      pageSize: 20
    }
  });
});

app.get('/api/demo/warehouses', (c) => {
  return c.json({
    success: true,
    data: {
      list: [
        { id: '1', code: 'WH001', name: '主仓库', address: '北京市朝阳区', manager: '张三', type: 'normal', status: 'enabled' },
        { id: '2', code: 'WH002', name: '华南仓', address: '深圳市宝安区', manager: '李四', type: 'normal', status: 'enabled' },
      ],
      total: 2
    }
  });
});

app.get('/api/demo/suppliers', (c) => {
  return c.json({
    success: true,
    data: {
      list: [
        { id: '1', code: 'S001', name: '苹果官方', contact: '王五', phone: '13800138000', status: 'enabled' },
        { id: '2', code: 'S002', name: '华为供应商', contact: '赵六', phone: '13900139000', status: 'enabled' },
      ],
      total: 2
    }
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ success: false, error: err.message }, 500);
});

export default app;
