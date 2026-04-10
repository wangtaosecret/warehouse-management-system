import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Select, Input, DatePicker, Button, message, Table, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

export default function StockIOForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      message.success('创建成功');
      navigate('/stock-io');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns = [
    { title: '商品', dataIndex: 'product_id', render: () => <Select placeholder="选择商品" style={{ width: 200 }}><Option value="1">iPhone 15 Pro</Option></Select> },
    { title: '数量', dataIndex: 'quantity', render: () => <Input type="number" placeholder="数量" style={{ width: 100 }} /> },
    { title: '单价', dataIndex: 'price', render: () => <Input type="number" placeholder="单价" style={{ width: 100 }} /> },
    { title: '操作', render: () => <Button type="link" danger>删除</Button> },
  ];

  return (
    <Card title="新建出入库单据">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="type" label="类型" rules={[{ required: true }]}>
          <Select placeholder="请选择类型">
            <Option value="in">入库</Option>
            <Option value="out">出库</Option>
          </Select>
        </Form.Item>
        <Form.Item name="category" label="业务类型" rules={[{ required: true }]}>
          <Select placeholder="请选择业务类型">
            <Option value="purchase">采购入库</Option>
            <Option value="return">退货入库</Option>
            <Option value="transfer">调拨</Option>
            <Option value="sale">销售出库</Option>
          </Select>
        </Form.Item>
        <Form.Item name="warehouse_id" label="仓库" rules={[{ required: true }]}>
          <Select placeholder="请选择仓库">
            <Option value="1">主仓库</Option>
            <Option value="2">华南仓</Option>
          </Select>
        </Form.Item>
        <Form.Item name="supplier_id" label="供应商">
          <Select placeholder="请选择供应商" allowClear>
            <Option value="1">苹果供应商</Option>
            <Option value="2">华为供应商</Option>
          </Select>
        </Form.Item>
        <Form.Item name="apply_date" label="申请日期">
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="明细">
          <Table dataSource={items} columns={itemColumns} pagination={false} size="small" footer={() => <Button icon={<PlusOutlined />}>添加商品</Button>} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>提交申请</Button>
            <Button onClick={() => navigate('/stock-io')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
