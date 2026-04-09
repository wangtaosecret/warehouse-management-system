import { Hono } from 'hono';
import { cors } from './middleware/cors';
import auth from './routes/auth';
import orgs from './routes/orgs';
import users from './routes/users';
import products from './routes/products';
import stockIo from './routes/stock-io';
import inventory from './routes/inventory';
import categories from './routes/categories';
import warehouses from './routes/warehouses';
import suppliers from './routes/suppliers';

const app = new Hono<{ Bindings: { DB: any } }>();

// Middleware
app.use('/*', cors);

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
app.route('/api/products', products);
app.route('/api/categories', categories);
app.route('/api/warehouses', warehouses);
app.route('/api/suppliers', suppliers);
app.route('/api/stock-io', stockIo);
app.route('/api/inventory', inventory);

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

app.get('/api/demo/dashboard', (c) => {
  return c.json({
    success: true,
    data: {
      stats: {
        total_products: 156,
        total_inventory_value: 2568888,
        today_in_count: 12,
        today_out_count: 8,
        pending_approve: 3,
        low_stock_alerts: 5
      },
      recent_io: [
        { id: '1', code: 'RK20260409001', type: 'in', category: 'purchase', status: 'completed', created_at: '2026-04-09 10:30:00' },
        { id: '2', code: 'CK20260409001', type: 'out', category: 'sale', status: 'pending', created_at: '2026-04-09 11:00:00' },
      ],
      alerts: [
        { id: '1', product_name: 'iPhone 15 Pro', current_stock: 5, min_stock: 10, alert_type: 'low' }
      ]
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
