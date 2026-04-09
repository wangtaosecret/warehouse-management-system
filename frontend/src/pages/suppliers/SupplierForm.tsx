import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Input, Select, Button, message } from 'antd';
import api from '../api/axios';

const { Option } = Select;

export default function SupplierForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      message.success(isEdit ? '更新成功' : '创建成功');
      navigate('/suppliers');
    } catch (error) {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={isEdit ? '编辑供应商' : '新增供应商'}>
      <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ status: 'enabled' }}>
        <Form.Item name="code" label="供应商编码" rules={[{ required: true }]}>
          <Input placeholder="请输入供应商编码" />
        </Form.Item>
        <Form.Item name="name" label="供应商名称" rules={[{ required: true }]}>
          <Input placeholder="请输入供应商名称" />
        </Form.Item>
        <Form.Item name="contact" label="联系人">
          <Input placeholder="请输入联系人" />
        </Form.Item>
        <Form.Item name="phone" label="电话">
          <Input placeholder="请输入电话" />
        </Form.Item>
        <Form.Item name="email" label="邮箱">
          <Input placeholder="请输入邮箱" />
        </Form.Item>
        <Form.Item name="address" label="地址">
          <Input placeholder="请输入地址" />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select>
            <Option value="enabled">正常</Option>
            <Option value="paused">暂停</Option>
            <Option value="terminated">终止</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>{isEdit ? '更新' : '创建'}</Button>
            <Button onClick={() => navigate('/suppliers')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
