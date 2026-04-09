import { useEffect, useState } from 'react';
import { Table, Button, Space, Card, Tag, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Search } = Input;

export default function UserList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(false);
    setData([
      { id: '1', username: 'admin', name: '系统管理员', phone: '13800138000', role_ids: ['admin'], status: 'enabled', created_at: '2026-01-01' },
      { id: '2', username: 'zhangsan', name: '张三', phone: '13800138001', role_ids: ['warehouse_admin'], status: 'enabled', created_at: '2026-02-01' },
      { id: '3', username: 'lisi', name: '李四', phone: '13800138002', role_ids: ['clerk'], status: 'enabled', created_at: '2026-03-01' },
    ]);
  };

  const columns = [
    { title: '账号', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '角色', dataIndex: 'role_ids', key: 'role_ids', render: () => <Tag color="blue">管理员</Tag> },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => <Tag color={v === 'enabled' ? 'green' : 'red'}>{v === 'enabled' ? '启用' : '禁用'}</Tag>,
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at' },
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
    <Card title="账号管理" extra={<Space><Search placeholder="搜索账号" style={{ width: 200 }} /><Button type="primary" icon={<PlusOutlined />}>新增账号</Button></Space>}>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
