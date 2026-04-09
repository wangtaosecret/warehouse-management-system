import { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function InventoryAlerts() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(false);
    setData([
      { id: '1', product_code: 'P001', product_name: 'iPhone 15 Pro', spec: '256GB', current_stock: 5, min_stock: 10, max_stock: 100, alert_type: 'low' },
      { id: '2', product_code: 'P002', product_name: 'MacBook Pro 14', spec: 'M3 Pro', current_stock: 3, min_stock: 8, max_stock: 50, alert_type: 'low' },
      { id: '3', product_code: 'P004', product_name: 'iPad Pro', spec: '12.9寸', current_stock: 150, min_stock: 10, max_stock: 100, alert_type: 'high' },
    ]);
  };

  const columns = [
    { title: '商品编码', dataIndex: 'product_code', key: 'product_code' },
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '规格', dataIndex: 'spec', key: 'spec' },
    { title: '当前库存', dataIndex: 'current_stock', key: 'current_stock' },
    { title: '最低库存', dataIndex: 'min_stock', key: 'min_stock' },
    { title: '最高库存', dataIndex: 'max_stock', key: 'max_stock' },
    {
      title: '预警类型',
      dataIndex: 'alert_type',
      render: (v: string) => (
        <Tag color={v === 'low' ? 'error' : 'warning'}>
          {v === 'low' ? '库存不足' : '库存过剩'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link">入库</Button>
          <Button type="link">调整阈值</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="库存预警" extra={<Button icon={<PlusOutlined />}>设置预警</Button>}>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
