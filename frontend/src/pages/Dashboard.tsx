import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Typography } from 'antd';
import {
  AppstoreOutlined,
  DollarOutlined,
  InboxOutlined,
  ExportOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import api from '../api/axios';

const { Title } = Typography;

interface DashboardData {
  stats: {
    total_products: number;
    total_inventory_value: number;
    today_in_count: number;
    today_out_count: number;
    pending_approve: number;
    low_stock_alerts: number;
  };
  recent_io: any[];
  alerts: any[];
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get('/api/dashboard');
      if (res.success) {
        setData(res.data);
      } else {
        // Use demo data if API returns error
        setData(getDemoData());
      }
    } catch (error) {
      // Use demo data on network error
      setData(getDemoData());
    } finally {
      setLoading(false);
    }
  };

  const getDemoData = (): DashboardData => ({
    stats: {
      total_products: 156,
      total_inventory_value: 2568888,
      today_in_count: 12,
      today_out_count: 8,
      pending_approve: 3,
      low_stock_alerts: 5,
    },
    recent_io: [
      { id: '1', code: 'RK20260409001', type: 'in', category: 'purchase', status: 'completed', created_at: '2026-04-09 10:30:00' },
      { id: '2', code: 'CK20260409001', type: 'out', category: 'sale', status: 'pending', created_at: '2026-04-09 11:00:00' },
      { id: '3', code: 'RK20260409002', type: 'in', category: 'return', status: 'approved', created_at: '2026-04-09 14:00:00' },
    ],
    alerts: [
      { id: '1', product_name: 'iPhone 15 Pro', current_stock: 5, min_stock: 10, alert_type: 'low' },
      { id: '2', product_name: 'MacBook Pro', current_stock: 3, min_stock: 8, alert_type: 'low' },
    ],
  });

  if (loading) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>仪表盘</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="商品总数"
              value={data?.stats.total_products || 0}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="库存总值"
              value={data?.stats.total_inventory_value || 0}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日入库"
              value={data?.stats.today_in_count || 0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日出库"
              value={data?.stats.today_out_count || 0}
              prefix={<ExportOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title="待审核单据"
            extra={<Tag color="orange">{data?.stats.pending_approve || 0} 待处理</Tag>}
          >
            <List
              dataSource={data?.recent_io.filter((io: any) => io.status === 'pending') || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.code}
                    description={`${item.type === 'in' ? '入库' : '出库'} - ${item.category}`}
                  />
                  <Tag color="orange">待审核</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="库存预警"
            extra={<Tag color="red">{data?.stats.low_stock_alerts || 0} 条预警</Tag>}
          >
            <List
              dataSource={data?.alerts || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.product_name}
                    description={`当前库存: ${item.current_stock} / 最低: ${item.min_stock}`}
                  />
                  <Tag icon={<WarningOutlined />} color="error">库存不足</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
