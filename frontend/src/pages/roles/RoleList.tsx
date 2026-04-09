import { useEffect, useState } from 'react';
import { Table, Button, Space, Card, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

export default function RoleList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(false);
    setData([
      { id: '1', name: '系统管理员', remark: '系统最高权限', permissions: ['*'], user_count: 1, is_system: 1, created_at: '2026-01-01' },
      { id: '2', name: '组织管理员', remark: '组织最高权限', permissions: ['org:*', 'user:*', 'product:*'], user_count: 2, is_system: 0, created_at: '2026-02-01' },
      { id: '3', name: '仓库管理员', remark: '仓库管理', permissions: ['warehouse:*', 'inventory:*', 'stocktake:*'], user_count: 3, is_system: 0, created_at: '2026-02-15' },
      { id: '4', name: '库管员', remark: '执行出入库', permissions: ['stock:*', 'inventory:view'], user_count: 5, is_system: 0, created_at: '2026-03-01' },
    ]);
  };

  const columns = [
    { title: '角色名称', dataIndex: 'name', key: 'name' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    { title: '关联用户', dataIndex: 'user_count', key: 'user_count', render: (v: number) => `${v}人` },
    {
      title: '类型',
      dataIndex: 'is_system',
      render: (v: number) => <Tag color={v ? 'gold' : 'blue'}>{v ? '系统内置' : '自定义'}</Tag>,
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
          {!record.is_system && <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>}
        </Space>
      ),
    },
  ];

  return (
    <Card title="角色权限" extra={<Button type="primary" icon={<PlusOutlined />}>新增角色</Button>}>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={false} />
    </Card>
  );
}
