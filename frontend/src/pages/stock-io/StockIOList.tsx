import { useEffect, useState } from 'react';
import { Table, Button, Space, Card, Tag, Input } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;

export default function StockIOList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(false);
    setData([
      { id: '1', code: 'RK20260409001', type: 'in', category: 'purchase', warehouse_name: '主仓库', status: 'completed', total_amount: 50000, apply_date: '2026-04-09' },
      { id: '2', code: 'CK20260409001', type: 'out', category: 'sale', warehouse_name: '主仓库', status: 'pending', total_amount: 8000, apply_date: '2026-04-09' },
      { id: '3', code: 'RK20260409002', type: 'in', category: 'return', warehouse_name: '华南仓', status: 'approved', total_amount: 3000, apply_date: '2026-04-08' },
    ]);
  };

  const columns = [
    { title: '单据编号', dataIndex: 'code', key: 'code' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={v === 'in' ? 'blue' : 'orange'}>{v === 'in' ? '入库' : '出库'}</Tag> },
    { title: '业务类型', dataIndex: 'category', key: 'category' },
    { title: '仓库', dataIndex: 'warehouse_name', key: 'warehouse_name' },
    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', render: (v: number) => `¥${v?.toFixed(2)}` },
    { title: '申请日期', dataIndex: 'apply_date', key: 'apply_date' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string) => {
        const colors: Record<string, string> = { pending: 'orange', approved: 'blue', completed: 'green', rejected: 'red' };
        const labels: Record<string, string> = { pending: '待审核', approved: '已审核', completed: '已完成', rejected: '已驳回' };
        return <Tag color={colors[v]}>{labels[v]}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/stock-io/${record.id}`)}>详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="出入库管理" extra={<Space><Search placeholder="搜索单据" style={{ width: 200 }} /><Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/stock-io/new')}>新建单据</Button></Space>}>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </Card>
  );
}
