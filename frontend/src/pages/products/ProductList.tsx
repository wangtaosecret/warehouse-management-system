import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Modal, message, Card, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const { Search } = Input;

interface Product {
  id: string;
  code: string;
  name: string;
  category_name: string;
  spec: string;
  unit: string;
  price: number;
  cost: number;
  status: string;
  quantity?: number;
}

export default function ProductList() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [keyword]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/demo/products');
      if (res.success) {
        setData(res.data.list);
      }
    } catch (error) {
      setData([
        { id: '1', code: 'P001', name: 'iPhone 15 Pro', category_name: '电子产品', spec: '256GB', unit: '台', price: 7999, cost: 6000, quantity: 50, status: 'enabled' },
        { id: '2', code: 'P002', name: 'MacBook Pro 14', category_name: '电子产品', spec: 'M3 Pro', unit: '台', price: 15999, cost: 12000, quantity: 20, status: 'enabled' },
        { id: '3', code: 'P003', name: 'AirPods Pro', category_name: '电子产品', spec: '二代', unit: '副', price: 1899, cost: 1200, quantity: 100, status: 'enabled' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个商品吗？',
      onOk: async () => {
        message.success('删除成功');
        loadData();
      },
    });
  };

  const columns = [
    { title: '商品编码', dataIndex: 'code', key: 'code', width: 100 },
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category_name', key: 'category_name' },
    { title: '规格', dataIndex: 'spec', key: 'spec' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '售价', dataIndex: 'price', key: 'price', width: 100, render: (v: number) => `¥${v?.toFixed(2)}` },
    { title: '成本', dataIndex: 'cost', key: 'cost', width: 100, render: (v: number) => `¥${v?.toFixed(2)}` },
    { title: '库存', dataIndex: 'quantity', key: 'quantity', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (v: string) => (
        <Tag color={v === 'enabled' ? 'green' : 'red'}>
          {v === 'enabled' ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Product) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/${record.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="商品管理"
      extra={
        <Space>
          <Search
            placeholder="搜索商品"
            onSearch={setKeyword}
            style={{ width: 200 }}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/products/new')}
          >
            新增商品
          </Button>
        </Space>
      }
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
}
