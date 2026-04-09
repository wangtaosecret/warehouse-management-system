import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, InputNumber, Select, Button, message } from 'antd';
import api from '../api/axios';

const { Option } = Select;

export default function ProductForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const isEdit = !!id;

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (isEdit) {
        message.success('更新成功');
      } else {
        message.success('创建成功');
      }
      navigate('/products');
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={isEdit ? '编辑商品' : '新增商品'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          unit: '个',
          price: 0,
          cost: 0,
          status: 'enabled',
        }}
      >
        <Form.Item
          name="code"
          label="商品编码"
          rules={[{ required: true, message: '请输入商品编码' }]}
        >
          <Input placeholder="请输入商品编码" />
        </Form.Item>

        <Form.Item
          name="name"
          label="商品名称"
          rules={[{ required: true, message: '请输入商品名称' }]}
        >
          <Input placeholder="请输入商品名称" />
        </Form.Item>

        <Form.Item name="category_id" label="商品分类">
          <Select placeholder="请选择分类">
            <Option value="1">电子产品</Option>
            <Option value="2">办公用品</Option>
            <Option value="3">手机</Option>
          </Select>
        </Form.Item>

        <Form.Item name="spec" label="规格型号">
          <Input placeholder="请输入规格型号" />
        </Form.Item>

        <Form.Item name="unit" label="单位">
          <Select>
            <Option value="个">个</Option>
            <Option value="台">台</Option>
            <Option value="件">件</Option>
            <Option value="箱">箱</Option>
          </Select>
        </Form.Item>

        <Form.Item name="price" label="售价">
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="cost" label="成本价">
          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="status" label="状态">
          <Select>
            <Option value="enabled">启用</Option>
            <Option value="disabled">禁用</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? '更新' : '创建'}
            </Button>
            <Button onClick={() => navigate('/products')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
