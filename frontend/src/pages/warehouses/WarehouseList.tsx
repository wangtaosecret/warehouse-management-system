import { useEffect, useState } from 'react';
import { Table, Button, Space, Card, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';

export default function WarehouseList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/demo/warehouses');
      if (res.success) {
        setData(res.data.list);
      }
    } catch (error) {
      setData([
        { id: '1', code: 'WH001', name: '主仓库', address: '北京市朝阳区', manager: '张三', phone: '13800138000', type: 'normal', status: 'enabled', sku_count: 100 },
        { id: '2', code: 'WH002', name: '华南仓', address: '深圳市宝安区', manager: '李四', phone: '13900139000', type: 'normal', status: 'enabled', sku_count: 80 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: '仓库编码', dataIndex: 'code', key: 'code' },
    { title: '仓库名称', dataIndex: 'name', key: 'name' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '负责人', dataIndex: 'manager', key: 'manager' },
    { title: '联系电话', dataIndex: 'phone', key: 'phone' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => v === 'normal' ? '普通' : '冷藏' },
    { title: 'SKU数', dataIndex: 'sku_count', key: 'sku_count' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => <Tag color={v === 'enabled' ? 'green' : 'red'}>{v === 'enabled' ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="仓库管理" extra={<Button type="primary" icon={<PlusOutlined />}>新增仓库</Button>}>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
