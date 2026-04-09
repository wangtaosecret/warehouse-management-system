import { useEffect, useState } from 'react';
import { Table, Card, Input, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

const { Search } = Input;

export default function InventoryList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(false);
    setData([
      { id: '1', product_code: 'P001', product_name: 'iPhone 15 Pro', spec: '256GB', unit: '台', warehouse_name: '主仓库', quantity: 50, locked_quantity: 5, price: 7999 },
      { id: '2', product_code: 'P002', product_name: 'MacBook Pro 14', spec: 'M3 Pro', unit: '台', warehouse_name: '主仓库', quantity: 20, locked_quantity: 0, price: 15999 },
      { id: '3', product_code: 'P003', product_name: 'AirPods Pro', spec: '二代', unit: '副', warehouse_name: '华南仓', quantity: 100, locked_quantity: 10, price: 1899 },
    ]);
  };

  const columns = [
    { title: '商品编码', dataIndex: 'product_code', key: 'product_code' },
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '规格', dataIndex: 'spec', key: 'spec' },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse_name' },
    { title: '库存数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '锁定数量', dataIndex: 'locked_quantity', key: 'locked_quantity', render: (v: number) => <Tag color="orange">{v}</Tag> },
    { title: '可用库存', key: 'available', render: (_: any, r: any) => r.quantity - r.locked_quantity },
    { title: '售价', dataIndex: 'price', key: 'price', render: (v: number) => `¥${v?.toFixed(2)}` },
    { title: '库存金额', key: 'amount', render: (_: any, r: any) => `¥${(r.quantity * r.price).toFixed(2)}` },
  ];

  return (
    <Card title="库存列表" extra={<Search placeholder="搜索商品" prefix={<SearchOutlined />} style={{ width: 200 }} />}>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
