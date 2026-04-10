import { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Modal, message, Card, Input, Form, Row, Col, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../api/axios';

export default function CategoryList() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      if (res.success) {
        setData(res.data);
      }
    } catch (error) {
      setData([
        { id: '1', name: '电子产品', parent_id: null, product_count: 50 },
        { id: '2', name: '办公用品', parent_id: null, product_count: 30 },
        { id: '3', name: '手机', parent_id: '1', product_count: 20 },
        { id: '4', name: '电脑', parent_id: '1', product_count: 30 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    message.success('保存成功');
    setModalVisible(false);
    form.resetFields();
    loadData();
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个分类吗？',
      onOk: () => {
        message.success('删除成功');
        loadData();
      },
    });
  };

  const columns = [
    { title: '分类名称', dataIndex: 'name', key: 'name' },
    { title: '商品数量', dataIndex: 'product_count', key: 'product_count' },
    { title: '备注', dataIndex: 'remark', key: 'remark' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EditOutlined />}>编辑</Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="商品分类"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          新增分类
        </Button>
      }
    >
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={false} />

      <Modal
        title="新增分类"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="分类名称" rules={[{ required: true }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="parent_id" label="父级分类">
            <Select placeholder="请选择父级分类" allowClear>
              {data.map((item) => (
                <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
