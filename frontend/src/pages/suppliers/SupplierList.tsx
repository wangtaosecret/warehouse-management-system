import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Card, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const { Search } = Input;

export default function SupplierList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [keyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/demo/suppliers');
      if (res.success) {
        setData(res.data.list);
      }
    } catch (error) {
      setData([
        { id: '1', code: 'S001', name: '苹果官方供应商', contact: '王五', phone: '13800138000', email: 'apple@supplier.com', status: 'enabled' },
        { id: '2', code: 'S002', name: '华为供应商', contact: '赵六', phone: '13900139000', email: 'huawei@supplier.com', status: 'enabled' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setData(data.filter((item) => item.id !== id));
  };

  const columns = [
    { title: '供应商编码', dataIndex: 'code', key: 'code' },
    { title: '供应商名称', dataIndex: 'name', key: 'name' },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => (
        <Tag color={v === 'enabled' ? 'green' : 'red'}>
          {v === 'enabled' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/suppliers/${record.id}`)}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="供应商管理"
      extra={
        <Space>
          <Search placeholder="搜索供应商" onSearch={setKeyword} style={{ width: 200 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/suppliers/new')}>新增供应商</Button>
        </Space>
      }
    >
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
