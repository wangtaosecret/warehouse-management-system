import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout as AntLayout, Menu, Avatar, Dropdown, theme } from 'antd';
import {
  DashboardOutlined,
  AppstoreOutlined,
  TagsOutlined,
  TeamOutlined,
  ShopOutlined,
  InboxOutlined,
  ExportOutlined,
  DatabaseOutlined,
  AlertOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';

const { Header, Sider, Content } = AntLayout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '首页' },
  { key: '/products', icon: <AppstoreOutlined />, label: '商品管理' },
  { key: '/categories', icon: <TagsOutlined />, label: '商品分类' },
  { key: '/suppliers', icon: <ShopOutlined />, label: '供应商管理' },
  { key: '/warehouses', icon: <InboxOutlined />, label: '仓库管理' },
  { key: '/stock-io', icon: <ExportOutlined />, label: '出入库管理' },
  { key: '/inventory', icon: <DatabaseOutlined />, label: '库存管理' },
  { key: '/inventory/alerts', icon: <AlertOutlined />, label: '库存预警' },
  { key: '/users', icon: <TeamOutlined />, label: '账号管理' },
  { key: '/roles', icon: <TeamOutlined />, label: '角色权限' },
  { key: '/configs', icon: <SettingOutlined />, label: '系统配置' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { token } = theme.useToken();

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: user?.name || '用户' },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        style={{ background: token.colorBgContainer }}
      >
        <div className="h-16 flex items-center justify-center text-white text-lg font-bold">
          {collapsed ? 'WMS' : '仓库管理系统'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ background: '#001529' }}
        />
      </Sider>
      <AntLayout>
        <Header style={{ padding: '0 24px', background: token.colorBgContainer, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div className="flex items-center cursor-pointer">
              <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
              <span>{user?.name || user?.username}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '16px', padding: '24px', background: token.colorBgContainer, borderRadius: token.borderRadiusLG }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
